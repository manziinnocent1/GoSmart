import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import { StatusBar } from "expo-status-bar";
import { Banknote, Smartphone, Star, Zap } from "lucide-react-native";
import RouteMap from "../../components/RouteMap";
import { useAppSettings } from "../../context/AppSettings";
import type { Palette } from "../../context/AppSettings";
import { formatRwf } from "../../utils/format";
import {
  COMMISSION_RATE,
  KIND_LABEL,
  REQUEST_SECONDS,
  TRIP_ROUTE,
  netOf,
} from "./driverData";
import type { RideRequest } from "./driverData";

interface Props {
  request: RideRequest;
  seconds?: number;
  onAccept: () => void;
  onDecline: () => void;
  /** Called when the countdown reaches zero. */
  onExpire: () => void;
}

const PAD = 20;
const RING = 44;
const STROKE = 4;

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

function CountdownRing({
  left,
  total,
  track,
  color,
  textColor,
}: {
  left: number;
  total: number;
  track: string;
  color: string;
  textColor: string;
}) {
  const r = (RING - STROKE) / 2;
  const circ = 2 * Math.PI * r;
  const frac = Math.max(0, Math.min(1, left / total));
  return (
    <View style={{ width: RING, height: RING }}>
      <Svg width={RING} height={RING}>
        <Circle
          cx={RING / 2}
          cy={RING / 2}
          r={r}
          stroke={track}
          strokeWidth={STROKE}
          fill="none"
        />
        <Circle
          cx={RING / 2}
          cy={RING / 2}
          r={r}
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={circ * (1 - frac)}
          transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
        />
      </Svg>
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.ringCenter}>
          <Text style={{ color: textColor, fontSize: 15, fontWeight: "800" }}>
            {left}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function IncomingRequestScreen({
  request,
  seconds = REQUEST_SECONDS,
  onAccept,
  onDecline,
  onExpire,
}: Props) {
  const { palette: c, isDark } = useAppSettings();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const s = useMemo(() => makeStyles(c), [c]);

  const endAt = useRef(0);
  const settled = useRef(false);
  const expireRef = useRef(onExpire);
  useEffect(() => {
    expireRef.current = onExpire;
  }, [onExpire]);
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    endAt.current = Date.now() + seconds * 1000;
    const id = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.ceil((endAt.current - Date.now()) / 1000),
      );
      setLeft(remaining);
      if (remaining === 0 && !settled.current) {
        settled.current = true;
        expireRef.current();
      }
    }, 250);
    return () => clearInterval(id);
  }, [ seconds ]);

  const accept = () => {
    if (settled.current) return;
    settled.current = true;
    onAccept();
  };
  const decline = () => {
    if (settled.current) return;
    settled.current = true;
    onDecline();
  };

  const mapHeight = Math.round(height * 0.42);
  const kind = KIND_LABEL[request.tier];
  const p = request.passenger;
  const net = netOf(request.fareRwf);
  const isMomo = request.payment === "momo";
  const PayIcon = isMomo ? Smartphone : Banknote;

  return (
    <View style={s.root}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <View style={{ height: mapHeight }}>
        <RouteMap
          variant={isDark ? "dark" : "light"}
          route={TRIP_ROUTE}
          startKind="origin"
          endKind="dropoff"
          driverAt={{ x: 0.12, y: 0.8 }}
          inset={{ top: insets.top + 70, bottom: 56 }}
          style={StyleSheet.absoluteFill}
        />

        <View
          style={[s.topChip, { top: insets.top + 10 }]}
          accessibilityLiveRegion="polite"
        >
          <CountdownRing
            left={left}
            total={seconds}
            track={c.soft}
            color={left <= 5 ? c.red : c.green}
            textColor={c.ink}
          />
          <Text style={s.topChipText}>New {kind} request</Text>
        </View>
      </View>

      <View style={s.sheet}>
        <ScrollView
          style={s.flex}
          contentContainerStyle={s.sheetContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Passenger and fare */}
          <View style={s.passengerRow}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{initials(p.name)}</Text>
            </View>
            <View style={s.flex}>
              <View style={s.nameRow}>
                <Text style={s.name} numberOfLines={1}>
                  {p.name}
                </Text>
                <Star size={14} strokeWidth={0} fill={c.amber} color={c.amber} />
                <Text style={s.rating}>{p.rating.toFixed(1)}</Text>
              </View>
              <Text style={s.muted}>{p.trips} trips</Text>
            </View>
            <View style={s.fareCol}>
              <Text style={s.fare}>{formatRwf(request.fareRwf)}</Text>
              {!!request.surge && (
                <View style={s.surgePill}>
                  <Zap size={11} strokeWidth={2.5} color={c.amber} fill={c.amber} />
                  <Text style={s.surgeText}>x{request.surge} surge</Text>
                </View>
              )}
            </View>
          </View>

          {/* Distance, time, payment */}
          <View style={s.tiles}>
            <View style={s.tile}>
              <Text style={s.tileLabel}>To pickup</Text>
              <Text style={s.tileValue}>{request.pickupKm} km</Text>
              <Text style={s.tileSub}>{request.pickupMin} min</Text>
            </View>
            <View style={s.tile}>
              <Text style={s.tileLabel}>Trip</Text>
              <Text style={s.tileValue}>{request.tripKm} km</Text>
              <Text style={s.tileSub}>{request.tripMin} min</Text>
            </View>
            <View style={s.tile}>
              <Text style={s.tileLabel}>Payment</Text>
              <View style={s.payRow}>
                <PayIcon size={16} strokeWidth={2.25} color={c.ink} />
                <Text style={s.tileValue}>{isMomo ? "MoMo" : "Cash"}</Text>
              </View>
              <Text style={s.tileSub}>{isMomo ? "Paid in app" : "Collect"}</Text>
            </View>
          </View>

          {/* Route */}
          <View style={s.route}>
            <View style={s.timeline}>
              <View style={s.dotPickup} />
              <View style={s.line} />
              <View style={s.dotDropoff} />
            </View>
            <View style={s.flex}>
              <View style={s.stop}>
                <Text style={s.stopLabel}>Pickup</Text>
                <Text style={s.stopText} numberOfLines={1}>
                  {request.pickup}
                </Text>
              </View>
              <View style={s.stop}>
                <Text style={s.stopLabel}>Dropoff</Text>
                <Text style={s.stopText} numberOfLines={1}>
                  {request.dropoff}
                </Text>
              </View>
            </View>
          </View>

          {/* Earnings */}
          <View style={s.earnRow}>
            <Text style={s.earnLabel}>
              Your earnings after {Math.round(COMMISSION_RATE * 100)}% commission
            </Text>
            <Text style={s.earnValue}>{formatRwf(net)}</Text>
          </View>
        </ScrollView>

        <View
          style={[s.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}
        >
          <Pressable
            onPress={decline}
            style={({ pressed }) => [s.declineBtn, pressed && s.pressed]}
            accessibilityRole="button"
          >
            <Text style={s.declineText}>Decline</Text>
          </Pressable>
          <Pressable
            onPress={accept}
            style={({ pressed }) => [s.acceptBtn, pressed && s.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`Accept request, ${left} seconds left`}
          >
            <Text style={s.acceptText}>Accept • {left}s</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ringCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
});

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    flex: { flex: 1 },
    pressed: { opacity: 0.85 },
    muted: { fontSize: 13, color: c.muted, marginTop: 2 },

    topChip: {
      position: "absolute",
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: c.card,
      borderRadius: 30,
      paddingVertical: 6,
      paddingLeft: 6,
      paddingRight: 20,
      shadowColor: "#0B1530",
      shadowOpacity: 0.18,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
    topChipText: { fontSize: 16, fontWeight: "800", color: c.ink },

    sheet: {
      flex: 1,
      marginTop: -28,
      backgroundColor: c.card,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      overflow: "hidden",
    },
    sheetContent: { paddingHorizontal: PAD, paddingTop: 22, paddingBottom: 12, gap: 14 },

    passengerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    avatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: c.green,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: { color: "#FFFFFF", fontSize: 18, fontWeight: "800" },
    nameRow: { flexDirection: "row", alignItems: "center", gap: 5 },
    name: { fontSize: 18, fontWeight: "800", color: c.ink, flexShrink: 1 },
    rating: { fontSize: 15, fontWeight: "800", color: c.ink },
    fareCol: { alignItems: "flex-end", gap: 6 },
    fare: { fontSize: 24, fontWeight: "800", color: c.greenInk },
    surgePill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: c.soft,
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    surgeText: { fontSize: 11, fontWeight: "800", color: c.ink },

    tiles: { flexDirection: "row", gap: 10 },
    tile: {
      flex: 1,
      backgroundColor: c.soft,
      borderRadius: 18,
      paddingVertical: 12,
      paddingHorizontal: 12,
    },
    tileLabel: { fontSize: 12, color: c.muted, fontWeight: "600" },
    tileValue: { fontSize: 16, fontWeight: "800", color: c.ink, marginTop: 3 },
    tileSub: { fontSize: 12, color: c.muted, marginTop: 1 },
    payRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 },

    route: {
      flexDirection: "row",
      backgroundColor: c.soft,
      borderRadius: 22,
      paddingVertical: 14,
      paddingHorizontal: 16,
      gap: 14,
    },
    timeline: { alignItems: "center", paddingVertical: 8 },
    dotPickup: { width: 12, height: 12, borderRadius: 6, backgroundColor: c.green },
    line: { flex: 1, width: 2, backgroundColor: c.border, marginVertical: 4 },
    dotDropoff: { width: 12, height: 12, borderRadius: 3, backgroundColor: c.ink },
    stop: { paddingVertical: 6 },
    stopLabel: { fontSize: 12, color: c.muted, fontWeight: "600" },
    stopText: { fontSize: 15, fontWeight: "800", color: c.ink, marginTop: 2 },

    earnRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    earnLabel: { flex: 1, fontSize: 13, color: c.muted },
    earnValue: { fontSize: 16, fontWeight: "800", color: c.ink },

    footer: {
      flexDirection: "row",
      gap: 12,
      paddingHorizontal: PAD,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
      backgroundColor: c.card,
    },
    declineBtn: {
      flex: 1,
      height: 60,
      borderRadius: 30,
      backgroundColor: c.soft,
      alignItems: "center",
      justifyContent: "center",
    },
    declineText: { fontSize: 17, fontWeight: "800", color: c.ink },
    acceptBtn: {
      flex: 1.4,
      height: 60,
      borderRadius: 30,
      backgroundColor: c.green,
      alignItems: "center",
      justifyContent: "center",
    },
    acceptText: { fontSize: 17, fontWeight: "800", color: "#FFFFFF" },
  });
