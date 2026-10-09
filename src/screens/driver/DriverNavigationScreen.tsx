import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  ArrowUp,
  CornerUpLeft,
  CornerUpRight,
  MapPin,
  MessageCircle,
  Phone,
  ShieldAlert,
  Star,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import RouteMap from "../../components/RouteMap";
import { formatRwf } from "../../utils/format";
import {
  ARRIVE_AT,
  FREE_WAIT_SECONDS,
  PICKUP_ROUTE,
  PICKUP_STEPS,
  PIN_ATTEMPTS,
  SIM_SPEED,
  TRIP_ROUTE,
  TRIP_STEPS,
  firstNameOf,
} from "./driverData";
import type { RideRequest, TurnKind, TurnStep } from "./driverData";

interface Props {
  request: RideRequest;
  /** The trip is finished and the passenger has been dropped off. */
  onComplete: () => void;
  onCancel: () => void;
}

type Phase = "toPickup" | "waiting" | "toDropoff";

// This screen is always dark, like a car navigation display.
const BG = "#060E22";
const SURFACE = "#101A36";
const BORDER = "#1E2B4F";
const GREEN = "#4FB27E";
const AMBER = "#F5A03C";
const MUTED = "#8F9BB8";
const WHITE = "#FFFFFF";
const RED = "#FF6B6B";

const PAD = 16;

const TURN_ICON: Record<TurnKind, LucideIcon> = {
  right: CornerUpRight,
  left: CornerUpLeft,
  straight: ArrowUp,
  arrive: MapPin,
};

const mmss = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

const fmtMeters = (m: number) =>
  m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`;

function currentStep(steps: TurnStep[], progress: number, legMeters: number) {
  const n = steps.length;
  const idx = Math.min(n - 1, Math.floor(progress * n));
  const local = progress * n - idx;
  const segMeters = legMeters / n;
  const meters = Math.max(0, Math.round((segMeters * (1 - local)) / 10) * 10);
  return { step: steps[idx], meters };
}

/* ---------- PIN entry ---------- */

function PinEntry({
  value,
  onChange,
  error,
  locked,
  shakeX,
}: {
  value: string;
  onChange: (v: string) => void;
  error: string | null;
  locked: boolean;
  shakeX: Animated.Value;
}) {
  const inputRef = useRef<TextInput>(null);
  return (
    <View>
      <Animated.View style={{ transform: [{ translateX: shakeX }] }}>
        <Pressable
          onPress={() => inputRef.current?.focus()}
          style={styles.pinRow}
          accessibilityLabel="Passenger trip PIN, 4 digits"
        >
          {[0, 1, 2, 3].map((i) => {
            const focused = i === value.length && !locked;
            return (
              <View
                key={i}
                style={[
                  styles.pinBox,
                  focused && styles.pinBoxFocus,
                  !!error && value.length === 0 && styles.pinBoxError,
                ]}
              >
                <Text style={styles.pinDigit}>{i < value.length ? value[i] : ""}</Text>
              </View>
            );
          })}
        </Pressable>
      </Animated.View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(v) => onChange(v.replace(/\D/g, "").slice(0, 4))}
        keyboardType="number-pad"
        maxLength={4}
        editable={!locked}
        autoFocus
        caretHidden
        style={styles.hiddenInput}
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

/* ---------- Screen ---------- */

export default function DriverNavigationScreen({
  request,
  onComplete,
  onCancel,
}: Props) {
  const insets = useSafeAreaInsets();
  const p = request.passenger;
  const first = firstNameOf(p.name);

  const [phase, setPhase] = useState<Phase>("toPickup");
  const [progress, setProgress] = useState(0);
  const [waited, setWaited] = useState(0);
  const [pin, setPin] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [pinError, setPinError] = useState<string | null>(null);
  const shakeX = useRef(new Animated.Value(0)).current;
  const startRef = useRef(Date.now());

  const legMin = phase === "toDropoff" ? request.tripMin : request.pickupMin;
  const legKm = phase === "toDropoff" ? request.tripKm : request.pickupKm;
  const legSeconds = legMin * 60;

  // Demo driving: the map moves along the route in fast forward.
  // In production this comes from the phone's GPS.
  useEffect(() => {
    if (phase === "waiting") return;
    startRef.current = Date.now();
    setProgress(0);
    const id = setInterval(() => {
      const simulated = ((Date.now() - startRef.current) / 1000) * SIM_SPEED;
      setProgress(Math.min(1, simulated / legSeconds));
    }, 400);
    return () => clearInterval(id);
  }, [phase, legSeconds]);

  // Free waiting timer
  useEffect(() => {
    if (phase !== "waiting") return;
    setWaited(0);
    const id = setInterval(() => setWaited((w) => w + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  const skipAhead = () => {
    startRef.current = Date.now() - (legSeconds * 1000) / SIM_SPEED;
    setProgress(1);
  };

  const shake = () =>
    Animated.sequence(
      [10, -10, 8, -8, 0].map((v) =>
        Animated.timing(shakeX, { toValue: v, duration: 60, useNativeDriver: true }),
      ),
    ).start();

  const locked = attempts >= PIN_ATTEMPTS;
  const waitLeft = Math.max(0, FREE_WAIT_SECONDS - waited);
  const nearEnd = progress >= ARRIVE_AT;

  const startTrip = () => {
    if (pin.length !== 4 || locked) return;
    if (pin !== request.pin) {
      const used = attempts + 1;
      const left = PIN_ATTEMPTS - used;
      setAttempts(used);
      setPin("");
      shake();
      setPinError(
        left > 0
          ? `Wrong PIN. ${left} ${left === 1 ? "try" : "tries"} left.`
          : `Too many wrong tries. Call ${first} or cancel the trip.`,
      );
      return;
    }
    Keyboard.dismiss();
    setPinError(null);
    setPhase("toDropoff");
  };

  const call = () => Linking.openURL(`tel:${p.phone}`).catch(() => {});
  const message = () => Linking.openURL(`sms:${p.phone}`).catch(() => {});

  const sos = () =>
    Alert.alert("Emergency", "Call the emergency number 112?", [
      { text: "Not now", style: "cancel" },
      {
        text: "Call 112",
        style: "destructive",
        onPress: () => Linking.openURL("tel:112").catch(() => {}),
      },
    ]);

  const confirmCancel = () =>
    Alert.alert(
      "Cancel this trip?",
      phase === "waiting" && waitLeft === 0
        ? `The free waiting time is over. You can cancel if ${first} has not shown up.`
        : "Cancelling often lowers your acceptance rate and can limit your requests.",
      [
        { text: "Keep trip", style: "cancel" },
        { text: "Cancel trip", style: "destructive", onPress: onCancel },
      ],
    );

  /* ----- Derived display values ----- */

  const steps = phase === "toDropoff" ? TRIP_STEPS : PICKUP_STEPS;
  const { step, meters } = currentStep(steps, progress, legKm * 1000);
  const TurnIcon = TURN_ICON[step.kind];
  const kmLeft = (legKm * (1 - progress)).toFixed(1);
  const minLeft = Math.max(0, Math.ceil(legMin * (1 - progress)));
  const arriveRoad =
    phase === "toDropoff" ? request.dropoff : request.pickup;
  const road = step.kind === "arrive" ? arriveRoad : step.road;
  const turnTitle =
    step.kind === "arrive" && meters <= 30
      ? step.text
      : `${step.text} • ${fmtMeters(meters)}`;
  const payNote =
    request.payment === "cash"
      ? `Collect ${formatRwf(request.fareRwf)} in cash`
      : "Paid in the app with MoMo";

  const bottomPad = Math.max(insets.bottom, 16);
  const mapBottom = phase === "waiting" ? 400 : 290;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <RouteMap
        variant="dark"
        route={phase === "toDropoff" ? TRIP_ROUTE : PICKUP_ROUTE}
        progress={phase === "waiting" ? 1 : progress}
        endKind={phase === "toDropoff" ? "dropoff" : "pickup"}
        inset={{ top: insets.top + 190, bottom: mapBottom }}
        style={StyleSheet.absoluteFill}
      />

      {/* Top: instruction and context */}
      <View
        pointerEvents="box-none"
        style={[styles.top, { top: insets.top + 8 }]}
      >
        <View style={styles.turnCard}>
          <View style={styles.turnIcon}>
            <TurnIcon size={26} strokeWidth={2.75} color={WHITE} />
          </View>
          <View style={styles.flex}>
            {phase === "waiting" ? (
              <>
                <Text style={styles.turnTitle}>Arrived at pickup</Text>
                <Text style={styles.turnRoad} numberOfLines={1}>
                  {request.pickup}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.turnTitle} numberOfLines={1}>
                  {turnTitle}
                </Text>
                <Text style={styles.turnRoad} numberOfLines={2}>
                  {road}
                </Text>
              </>
            )}
          </View>
          {phase !== "waiting" && (
            <View style={styles.remaining}>
              <Text style={styles.remainingKm}>{kmLeft} km</Text>
              <Text style={styles.remainingMin}>{minLeft} min</Text>
            </View>
          )}
        </View>

        <View style={styles.chipRow}>
          <View style={styles.contextChip}>
            {phase === "toDropoff" ? (
              <Text style={styles.contextText} numberOfLines={1}>
                Dropoff: {request.dropoff}
              </Text>
            ) : (
              <>
                <Text style={styles.contextText} numberOfLines={1}>
                  Pickup: {first} •
                </Text>
                <Star size={12} strokeWidth={0} fill={BG} color={BG} />
                <Text style={styles.contextText}>{p.rating.toFixed(1)}</Text>
              </>
            )}
          </View>
          <Pressable
            onPress={sos}
            style={styles.sosBtn}
            accessibilityRole="button"
            accessibilityLabel="Emergency SOS"
          >
            <ShieldAlert size={16} strokeWidth={2.5} color={RED} />
            <Text style={styles.sosText}>SOS</Text>
          </Pressable>
        </View>
      </View>

      {/* Bottom card */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.bottomWrap}
        pointerEvents="box-none"
      >
        <View style={[styles.card, { paddingBottom: bottomPad }]}>
          {phase === "toPickup" && (
            <>
              <View style={styles.cardTop}>
                <View style={styles.flex}>
                  <Text style={styles.cardTitle}>
                    {nearEnd ? "Almost there" : `Arriving in ${minLeft} min`}
                  </Text>
                  <Text style={styles.cardSub} numberOfLines={2}>
                    {payNote}
                  </Text>
                </View>
                <Pressable
                  onPress={call}
                  style={[styles.roundBtn, styles.callBtn]}
                  accessibilityRole="button"
                  accessibilityLabel={`Call ${first}`}
                >
                  <Phone size={20} strokeWidth={2.25} color={WHITE} />
                </Pressable>
                <Pressable
                  onPress={message}
                  style={[styles.roundBtn, styles.msgBtn]}
                  accessibilityRole="button"
                  accessibilityLabel={`Message ${first}`}
                >
                  <MessageCircle size={20} strokeWidth={2.25} color={WHITE} />
                </Pressable>
              </View>

              <Pressable
                onPress={() => setPhase("waiting")}
                disabled={!nearEnd}
                style={({ pressed }) => [
                  styles.primary,
                  !nearEnd && styles.primaryOff,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityState={{ disabled: !nearEnd }}
              >
                <Text style={styles.primaryText}>I've arrived</Text>
              </Pressable>
              {!nearEnd && (
                <Text style={styles.hint}>
                  This unlocks when you reach the pickup point.
                </Text>
              )}

              <View style={styles.linksRow}>
                <Pressable onPress={confirmCancel} hitSlop={8}>
                  <Text style={styles.cancelText}>Cancel trip</Text>
                </Pressable>
                {__DEV__ && !nearEnd && (
                  <Pressable onPress={skipAhead} hitSlop={8}>
                    <Text style={styles.devText}>Demo: skip to pickup</Text>
                  </Pressable>
                )}
              </View>
            </>
          )}

          {phase === "waiting" && (
            <>
              <View style={styles.cardTop}>
                <View style={styles.flex}>
                  <Text style={styles.cardTitle}>Waiting for {first}</Text>
                  <Text
                    style={[styles.cardSub, waitLeft === 0 && styles.cardSubWarn]}
                  >
                    {waitLeft > 0
                      ? `Free waiting: ${mmss(waitLeft)} left`
                      : "Free waiting time is over"}
                  </Text>
                </View>
                <Pressable
                  onPress={call}
                  style={[styles.roundBtn, styles.callBtn]}
                  accessibilityRole="button"
                  accessibilityLabel={`Call ${first}`}
                >
                  <Phone size={20} strokeWidth={2.25} color={WHITE} />
                </Pressable>
                <Pressable
                  onPress={message}
                  style={[styles.roundBtn, styles.msgBtn]}
                  accessibilityRole="button"
                  accessibilityLabel={`Message ${first}`}
                >
                  <MessageCircle size={20} strokeWidth={2.25} color={WHITE} />
                </Pressable>
              </View>

              <Text style={styles.pinLabel}>
                Ask {first} for the 4-digit trip PIN to start the trip
              </Text>
              <PinEntry
                value={pin}
                onChange={(v) => {
                  setPin(v);
                  if (pinError && !locked) setPinError(null);
                }}
                error={pinError}
                locked={locked}
                shakeX={shakeX}
              />
              {__DEV__ && <Text style={styles.devPin}>Demo PIN: {request.pin}</Text>}

              <Pressable
                onPress={startTrip}
                disabled={pin.length !== 4 || locked}
                style={({ pressed }) => [
                  styles.primary,
                  (pin.length !== 4 || locked) && styles.primaryOff,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
              >
                <Text style={styles.primaryText}>Start trip</Text>
              </Pressable>

              <View style={styles.linksRow}>
                <Pressable onPress={confirmCancel} hitSlop={8}>
                  <Text style={styles.cancelText}>
                    {waitLeft === 0 ? `Cancel: ${first} didn't show up` : "Cancel trip"}
                  </Text>
                </Pressable>
              </View>
            </>
          )}

          {phase === "toDropoff" && (
            <>
              <View style={styles.cardTop}>
                <View style={styles.flex}>
                  <Text style={styles.cardTitle}>
                    {nearEnd ? "Almost there" : `Dropoff in ${minLeft} min`}
                  </Text>
                  <Text style={styles.cardSub} numberOfLines={2}>
                    {request.dropoff} • {kmLeft} km left
                  </Text>
                </View>
                <View style={styles.farePill}>
                  <Text style={styles.fareText}>{formatRwf(request.fareRwf)}</Text>
                </View>
              </View>

              <Pressable
                onPress={onComplete}
                disabled={!nearEnd}
                style={({ pressed }) => [
                  styles.primary,
                  !nearEnd && styles.primaryOff,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityState={{ disabled: !nearEnd }}
              >
                <Text style={styles.primaryText}>Complete trip</Text>
              </Pressable>
              {!nearEnd && (
                <Text style={styles.hint}>
                  This unlocks when you reach the dropoff point.
                </Text>
              )}

              {__DEV__ && !nearEnd && (
                <View style={styles.linksRow}>
                  <Pressable onPress={skipAhead} hitSlop={8}>
                    <Text style={styles.devText}>Demo: skip to dropoff</Text>
                  </Pressable>
                </View>
              )}
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  flex: { flex: 1 },
  pressed: { opacity: 0.85 },

  top: { position: "absolute", left: PAD, right: PAD, gap: 10 },
  turnCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: SURFACE,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
  },
  turnIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  turnTitle: { color: WHITE, fontSize: 20, fontWeight: "800" },
  turnRoad: { color: MUTED, fontSize: 13, marginTop: 3 },
  remaining: { alignItems: "flex-end" },
  remainingKm: { color: GREEN, fontSize: 17, fontWeight: "800" },
  remainingMin: { color: MUTED, fontSize: 13, marginTop: 2 },

  chipRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  contextChip: {
    flexShrink: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: AMBER,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  contextText: { color: BG, fontSize: 13, fontWeight: "800", flexShrink: 1 },
  sosBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: RED,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  sosText: { color: RED, fontSize: 13, fontWeight: "800" },

  bottomWrap: { position: "absolute", left: 0, right: 0, bottom: 0 },
  card: {
    backgroundColor: SURFACE,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: BORDER,
    paddingTop: 20,
    paddingHorizontal: 20,
    gap: 14,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardTitle: { color: WHITE, fontSize: 20, fontWeight: "800" },
  cardSub: { color: MUTED, fontSize: 13, marginTop: 3 },
  cardSubWarn: { color: AMBER, fontWeight: "700" },
  roundBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  callBtn: { backgroundColor: GREEN },
  msgBtn: { backgroundColor: BG, borderWidth: 1, borderColor: BORDER },
  farePill: {
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  fareText: { color: GREEN, fontSize: 15, fontWeight: "800" },

  primary: {
    height: 60,
    borderRadius: 30,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryOff: { opacity: 0.35 },
  primaryText: { color: WHITE, fontSize: 18, fontWeight: "800" },
  hint: { color: MUTED, fontSize: 12, textAlign: "center", marginTop: -6 },
  linksRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cancelText: { color: RED, fontSize: 14, fontWeight: "800" },
  devText: { color: MUTED, fontSize: 12, textDecorationLine: "underline" },
  devPin: { color: MUTED, fontSize: 12, textAlign: "center" },

  pinLabel: { color: WHITE, fontSize: 14, fontWeight: "700" },
  pinRow: { flexDirection: "row", justifyContent: "center", gap: 12 },
  pinBox: {
    width: 56,
    height: 62,
    borderRadius: 16,
    backgroundColor: BG,
    borderWidth: 1.5,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  pinBoxFocus: { borderColor: GREEN },
  pinBoxError: { borderColor: RED },
  pinDigit: { color: WHITE, fontSize: 28, fontWeight: "800" },
  hiddenInput: { position: "absolute", width: 1, height: 1, opacity: 0 },
  error: {
    color: RED,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 10,
  },
});
