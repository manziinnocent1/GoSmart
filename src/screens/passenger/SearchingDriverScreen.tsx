import React, { useEffect, useRef, useState } from "react";
import type { RideTierId } from "../../constants/rideTiers";
import { formatRwf } from "../../utils/format";
import {
  Alert,
  Animated,
  Easing,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import { StatusBar } from "expo-status-bar";
import {
  Bike,
  Car,
  Clock,
  MessageCircle,
  Phone,
  Share2,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

export interface Driver {
  name: string;
  rating: number;
  trips: number;
  vehicle: string;
  color: string;
  plate: string;
  phone: string;
  etaMinutes: number;
  /** 4-digit PIN the passenger tells the driver to start the trip. */
  pin: string;
}

interface Props {
  tier: RideTierId;
  price: number;
  pickupLabel?: string;
  destinationLabel?: string;
  /** Area name shown while searching. */
  area?: string;
  nearbyCount?: number;
  /** Pass a real driver from your backend. When set, the screen shows driver details. */
  driver?: Driver | null;
  /** Demo only: seconds until a mock driver is "found". Pass null to disable. */
  matchAfterSeconds?: number | null;
  /** Seconds before showing the "no drivers available" state. */
  timeoutSeconds?: number;
  onCancel: () => void;
  /** Called when the passenger taps Confirm on the driver-found screen. */
  onConfirm?: () => void;
  /** True once the ride is paid or confirmed. */
  paid?: boolean;
  /** Called when a driver is found, so the parent can keep it between screens. */
  onDriverFound?: (driver: Driver) => void;
}

// Palette
const BG = "#060E22";
const SURFACE = "#101A36";
const BORDER = "#1E2B4F";
const GREEN = "#4FB27E";
const GREEN_SOFT = "#E1F3E9";
const AMBER = "#F5A03C";
const MUTED = "#8F9BB8";
const WHITE = "#FFFFFF";
const RED = "#FF6B6B";

const PAD = 20;
const RING = 224;
const STROKE = 8;
const RADIUS = (RING - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface TierMeta {
  label: string;
  noun: string;
  Icon: LucideIcon;
}

const TIER_META: Record<string, TierMeta> = {
  moto: { label: "Moto", noun: "moto", Icon: Bike },
  car: { label: "Car Comfort", noun: "car", Icon: Car },
  xl: { label: "XL Van", noun: "van", Icon: Users },
};

// Demo drivers, used only when no real driver is passed in.
const MOCK_DRIVERS: Record<string, Driver> = {
  moto: {
    name: "Jean Claude M.",
    rating: 4.9,
    trips: 1284,
    vehicle: "TVS Apache",
    color: "Red",
    plate: "RAE 123 B",
    phone: "+250780000001",
    etaMinutes: 3,
    pin: "4827",
  },
  car: {
    name: "Eric N.",
    rating: 4.8,
    trips: 932,
    vehicle: "Toyota Vitz",
    color: "White",
    plate: "RAD 456 C",
    phone: "+250780000002",
    etaMinutes: 6,
    pin: "1593",
  },
  xl: {
    name: "Patrick U.",
    rating: 4.9,
    trips: 2105,
    vehicle: "Toyota Hiace",
    color: "Silver",
    plate: "RAF 789 D",
    phone: "+250780000003",
    etaMinutes: 9,
    pin: "7314",
  },
};

const mmss = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/* ---------- Animated pieces ---------- */

function PulseRing({ delay }: { delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.sequence([
      Animated.delay(delay),
      Animated.loop(
        Animated.timing(anim, {
          toValue: 1,
          duration: 2400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ),
    ]);
    loop.start();
    return () => loop.stop();
  }, [anim, delay]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.pulse,
        {
          opacity: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.35, 0],
          }),
          transform: [
            {
              scale: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1.5],
              }),
            },
          ],
        },
      ]}
    />
  );
}

function Radar({ letter, nearby }: { letter: string; nearby: number }) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 2600,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.radar}>
      <PulseRing delay={0} />
      <PulseRing delay={1200} />

      <Animated.View style={[styles.arc, { transform: [{ rotate }] }]}>
        <Svg width={RING} height={RING}>
          <Circle
            cx={RING / 2}
            cy={RING / 2}
            r={RADIUS}
            stroke={BORDER}
            strokeWidth={STROKE}
            fill="none"
          />
          <Circle
            cx={RING / 2}
            cy={RING / 2}
            r={RADIUS}
            stroke={GREEN}
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${CIRCUMFERENCE * 0.25} ${CIRCUMFERENCE}`}
            transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
          />
        </Svg>
      </Animated.View>

      <View style={styles.innerRing} />
      <View style={styles.avatarBig}>
        <Text style={styles.avatarBigText}>{letter}</Text>
      </View>

      <View style={styles.nearbyBadge}>
        <Text style={styles.nearbyText}>{nearby} nearby</Text>
      </View>
    </View>
  );
}

/* ---------- Trip summary card ---------- */

function TripCard({
  Icon,
  title,
  route,
  status,
  action,
}: {
  Icon: LucideIcon;
  title: string;
  route: string;
  status: string;
  /** When set, a button replaces the status text. */
  action?: { label: string; onPress: () => void };
}) {
  return (
    <View style={styles.tripCard}>
      <View style={styles.tripIcon}>
        <Icon size={22} strokeWidth={2} color={BG} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.tripTitle}>{title}</Text>
        <Text style={styles.tripRoute} numberOfLines={1}>
          {route}
        </Text>
      </View>
      {action ? (
        <Pressable
          onPress={action.onPress}
          style={({ pressed }) => [
            styles.confirmBtn,
            pressed && { opacity: 0.85 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={action.label}
        >
          <Text style={styles.confirmBtnText}>{action.label}</Text>
        </Pressable>
      ) : (
        <View style={styles.statusRow}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>{status}</Text>
        </View>
      )}
    </View>
  );
}

/* ---------- Screen ---------- */

export default function SearchingDriverScreen({
  tier,
  price,
  pickupLabel = "Kimironko",
  destinationLabel = "Kigali Heights",
  area = "Remera",
  nearbyCount = 3,
  driver: driverProp = null,
  matchAfterSeconds = 7,
  timeoutSeconds = 90,
  onCancel,
  onConfirm,
  paid = false,
  onDriverFound,
}: Props) {
  const insets = useSafeAreaInsets();
  const meta = TIER_META[tier] ?? TIER_META.moto;

  const [elapsed, setElapsed] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [simulated, setSimulated] = useState<Driver | null>(null);
  const foundRef = useRef(onDriverFound);
  foundRef.current = onDriverFound;

  const driver = driverProp ?? simulated;
  const searching = !driver && elapsed < timeoutSeconds;
  const timedOut = !driver && !searching;

  // Search timer
  useEffect(() => {
    if (!searching) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [searching]);

  // Demo: pretend a driver accepts after a few seconds
  useEffect(() => {
    if (driverProp || matchAfterSeconds == null) return;
    const id = setTimeout(() => {
      const found = MOCK_DRIVERS[tier] ?? MOCK_DRIVERS.moto;
      setSimulated(found);
      foundRef.current?.(found);
    }, matchAfterSeconds * 1000);
    return () => clearTimeout(id);
  }, [attempt, driverProp, matchAfterSeconds, tier]);

  // Fade the driver details in
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (driver) {
      Animated.timing(fade, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();
    }
  }, [driver, fade]);

  const retry = () => {
    setElapsed(0);
    setAttempt((a) => a + 1);
  };

  const confirmCancel = () =>
    Alert.alert(
      driver ? "Cancel this ride?" : "Cancel request?",
      driver
        ? "Your driver will be notified."
        : "We'll stop looking for a driver.",
      [
        { text: driver ? "Keep ride" : "Keep searching", style: "cancel" },
        { text: "Yes, cancel", style: "destructive", onPress: onCancel },
      ],
    );

  const shareTrip = () => {
    if (!driver) return;
    Share.share({
      message: `I'm on a ${meta.label} ride with ${driver.name} (${driver.color} ${driver.vehicle}, plate ${driver.plate}). From ${pickupLabel} to ${destinationLabel}.`,
    }).catch(() => {});
  };

  const call = () => {
    if (driver) Linking.openURL(`tel:${driver.phone}`).catch(() => {});
  };
  const message = () => {
    if (driver) Linking.openURL(`sms:${driver.phone}`).catch(() => {});
  };

  const tripTitle = `${meta.label} • ${formatRwf(price)}`;
  const route = `${pickupLabel} → ${destinationLabel}`;
  const bottomPad = Math.max(insets.bottom, 16);

  /* ----- Driver found ----- */
  if (driver) {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <Animated.View style={[styles.flex, { opacity: fade }]}>
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[
              styles.foundContent,
              { paddingTop: insets.top + 24, paddingBottom: bottomPad + 8 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.foundPill}>
              <View style={styles.statusDot} />
              <Text style={styles.foundPillText}>
                {paid ? "Ride confirmed" : "Driver found"}
              </Text>
            </View>
            <Text style={styles.foundTitle}>
              Arriving in {driver.etaMinutes} min
            </Text>
            <Text style={styles.foundSub}>
              Meet your driver at {pickupLabel}
            </Text>

            {/* Driver card */}
            <View style={styles.driverCard}>
              <View style={styles.driverTop}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials(driver.name)}</Text>
                </View>
                <View style={styles.flex}>
                  <View style={styles.nameRow}>
                    <Text style={styles.driverName} numberOfLines={1}>
                      {driver.name}
                    </Text>
                    <ShieldCheck size={16} strokeWidth={2.25} color={GREEN} />
                  </View>
                  <View style={styles.ratingRow}>
                    <Star
                      size={14}
                      strokeWidth={0}
                      fill={AMBER}
                      color={AMBER}
                    />
                    <Text style={styles.ratingText}>
                      {driver.rating.toFixed(1)} •{" "}
                      {driver.trips.toLocaleString()} trips
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.vehicleRow}>
                <View style={styles.flex}>
                  <Text style={styles.vehicleName}>
                    {driver.color} {driver.vehicle}
                  </Text>
                  <Text style={styles.vehicleSub}>{meta.label}</Text>
                </View>
                <View style={styles.plate}>
                  <Text style={styles.plateText}>{driver.plate}</Text>
                </View>
              </View>

              <View style={styles.contactRow}>
                <Pressable
                  onPress={call}
                  style={[styles.contactBtn, styles.callBtn]}
                  accessibilityRole="button"
                  accessibilityLabel={`Call ${driver.name}`}
                >
                  <Phone size={18} strokeWidth={2.25} color={BG} />
                  <Text style={styles.callText}>Call</Text>
                </Pressable>
                <Pressable
                  onPress={message}
                  style={[styles.contactBtn, styles.msgBtn]}
                  accessibilityRole="button"
                  accessibilityLabel={`Message ${driver.name}`}
                >
                  <MessageCircle size={18} strokeWidth={2.25} color={WHITE} />
                  <Text style={styles.msgText}>Message</Text>
                </Pressable>
              </View>
            </View>

            {/* PIN */}
            <View style={styles.pinCard}>
              <View style={styles.flex}>
                <Text style={styles.pinTitle}>Your trip PIN</Text>
                <Text style={styles.pinSub}>
                  You'll need this PIN to confirm payment and to start the trip
                </Text>
              </View>
              <View style={styles.pinBoxes}>
                {driver.pin.split("").map((d, i) => (
                  <View key={i} style={styles.pinBox}>
                    <Text style={styles.pinDigit}>{d}</Text>
                  </View>
                ))}
              </View>
            </View>

            <TripCard
              Icon={meta.Icon}
              title={tripTitle}
              route={route}
              status={paid ? "Paid" : "Pending"}
              action={
                paid || !onConfirm
                  ? undefined
                  : { label: "Confirm", onPress: onConfirm }
              }
            />
            {!paid && !!onConfirm && (
              <Text style={styles.confirmHint}>
                Confirm your ride and pay to lock in your driver.
              </Text>
            )}

            <Pressable
              onPress={shareTrip}
              style={styles.outlineBtn}
              accessibilityRole="button"
            >
              <Share2 size={18} strokeWidth={2.25} color={WHITE} />
              <Text style={styles.outlineText}>Share trip details</Text>
            </Pressable>

            <Pressable
              onPress={confirmCancel}
              style={styles.cancelLink}
              accessibilityRole="button"
            >
              <Text style={styles.cancelLinkText}>Cancel ride</Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </View>
    );
  }

  /* ----- No drivers available ----- */
  if (timedOut) {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <View style={styles.center}>
          <View style={styles.timeoutIcon}>
            <Clock size={34} strokeWidth={2} color={AMBER} />
          </View>
          <Text style={styles.title}>No drivers available</Text>
          <Text style={styles.subtitle}>
            All nearby drivers are busy right now. Try again, or go back and
            pick a different ride.
          </Text>
        </View>
        <View style={[styles.bottom, { paddingBottom: bottomPad }]}>
          <Pressable
            onPress={retry}
            style={styles.primaryBtn}
            accessibilityRole="button"
          >
            <Text style={styles.primaryText}>Try again</Text>
          </Pressable>
          <Pressable
            onPress={onCancel}
            style={styles.outlineBtn}
            accessibilityRole="button"
          >
            <Text style={styles.outlineText}>Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  /* ----- Searching ----- */
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.center}>
        <Radar letter={meta.label[0]} nearby={nearbyCount} />
        <Text style={styles.title}>Finding your {meta.noun}...</Text>
        <Text style={styles.subtitle}>
          Matching with verified drivers near {area} • {mmss(elapsed)}
        </Text>
      </View>

      <View style={[styles.bottom, { paddingBottom: bottomPad }]}>
        <TripCard
          Icon={meta.Icon}
          title={tripTitle}
          route={route}
          status="Live"
        />
        <Pressable
          onPress={confirmCancel}
          style={styles.outlineBtn}
          accessibilityRole="button"
          accessibilityLabel="Cancel request"
        >
          <Text style={styles.outlineText}>Cancel Request</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  flex: { flex: 1 },

  // Searching / timeout layout
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: PAD + 8,
  },
  bottom: { paddingHorizontal: PAD, gap: 12 },

  radar: {
    width: RING + 40,
    height: RING + 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 36,
  },
  pulse: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 2,
    borderColor: GREEN,
  },
  arc: { position: "absolute", width: RING, height: RING },
  innerRing: {
    position: "absolute",
    width: 184,
    height: 184,
    borderRadius: 92,
    borderWidth: 1,
    borderColor: BORDER,
  },
  avatarBig: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarBigText: { color: WHITE, fontSize: 40, fontWeight: "800" },
  nearbyBadge: {
    position: "absolute",
    top: 52,
    right: 8,
    backgroundColor: AMBER,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  nearbyText: { color: BG, fontSize: 12, fontWeight: "800" },

  title: { color: WHITE, fontSize: 22, fontWeight: "800", textAlign: "center" },
  subtitle: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 10,
  },
  timeoutIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },

  // Trip card
  tripCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SURFACE,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  tripIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: GREEN_SOFT,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  tripTitle: { color: WHITE, fontSize: 16, fontWeight: "800" },
  tripRoute: { color: MUTED, fontSize: 13, marginTop: 3 },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 8,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: GREEN },
  statusText: { color: GREEN, fontSize: 14, fontWeight: "800" },
  confirmBtn: {
    backgroundColor: GREEN,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginLeft: 8,
  },
  confirmBtnText: { color: WHITE, fontSize: 14, fontWeight: "800" },
  confirmHint: {
    color: MUTED,
    fontSize: 13,
    textAlign: "center",
    marginTop: -2,
  },

  // Buttons
  primaryBtn: {
    height: 58,
    borderRadius: 29,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { color: WHITE, fontSize: 17, fontWeight: "800" },
  outlineBtn: {
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  outlineText: { color: WHITE, fontSize: 16, fontWeight: "800" },
  cancelLink: { alignItems: "center", paddingVertical: 14 },
  cancelLinkText: { color: RED, fontSize: 15, fontWeight: "800" },

  // Driver found
  foundContent: { paddingHorizontal: PAD, gap: 14 },
  foundPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(79,178,126,0.16)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  foundPillText: { color: GREEN, fontSize: 13, fontWeight: "800" },
  foundTitle: { color: WHITE, fontSize: 30, fontWeight: "800" },
  foundSub: { color: MUTED, fontSize: 15, marginTop: -6, marginBottom: 4 },

  driverCard: {
    backgroundColor: SURFACE,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 18,
  },
  driverTop: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  avatarText: { color: WHITE, fontSize: 20, fontWeight: "800" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  driverName: { color: WHITE, fontSize: 18, fontWeight: "800", flexShrink: 1 },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
  },
  ratingText: { color: MUTED, fontSize: 13 },
  divider: { height: 1, backgroundColor: BORDER, marginVertical: 16 },
  vehicleRow: { flexDirection: "row", alignItems: "center" },
  vehicleName: { color: WHITE, fontSize: 16, fontWeight: "700" },
  vehicleSub: { color: MUTED, fontSize: 13, marginTop: 3 },
  plate: {
    backgroundColor: WHITE,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 2,
    borderColor: "#C9CFDC",
  },
  plateText: { color: BG, fontSize: 15, fontWeight: "800", letterSpacing: 1 },
  contactRow: { flexDirection: "row", gap: 10, marginTop: 18 },
  contactBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  callBtn: { backgroundColor: GREEN },
  callText: { color: BG, fontSize: 15, fontWeight: "800" },
  msgBtn: { borderWidth: 1, borderColor: BORDER },
  msgText: { color: WHITE, fontSize: 15, fontWeight: "800" },

  pinCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SURFACE,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 18,
    gap: 12,
  },
  pinTitle: { color: WHITE, fontSize: 16, fontWeight: "800" },
  pinSub: { color: MUTED, fontSize: 13, lineHeight: 18, marginTop: 3 },
  pinBoxes: { flexDirection: "row", gap: 6 },
  pinBox: {
    width: 36,
    height: 46,
    borderRadius: 10,
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  pinDigit: { color: WHITE, fontSize: 20, fontWeight: "800" },
});
