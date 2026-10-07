import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { StatusBar } from "expo-status-bar";
import {
  Bike,
  Car,
  Check,
  MessageCircle,
  MessageSquare,
  Phone,
  Share2,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import type { RideTierId } from "../../constants/rideTiers";
import { formatRwf } from "../../utils/format";
import { useAppSettings } from "../../context/AppSettings";
import type { Palette } from "../../context/AppSettings";
import type { Driver } from "./SearchingDriverScreen";

/** A ride that has been confirmed (and paid, unless the passenger pays cash). */
export interface Booking {
  ref: string;
  tier: RideTierId;
  /** Final fare in RWF. */
  price: number;
  driver: Driver;
  method: { title: string; masked?: string; isCash: boolean };
  pickup: string;
  destination: string;
  /** Date.now() when the booking was confirmed. */
  bookedAt: number;
}

interface Props {
  /** The active booking, or null when the passenger has no ride. */
  booking: Booking | null;
  onFindRide: () => void;
  onCancel: () => void;
  /** Dev only: jumps the countdown to the driver's arrival. */
  onSimulateArrival?: () => void;
}

const PAD = 20;
const DOT = 40;

const TIER: Record<string, { label: string; Icon: LucideIcon; kmh: number }> = {
  moto: { label: "Moto", Icon: Bike, kmh: 25 },
  car: { label: "Car Comfort", Icon: Car, kmh: 22 },
  xl: { label: "XL Van", Icon: Users, kmh: 20 },
};

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const mmss = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

const clock = (ts: number) => {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export default function MyRideScreen(props: Props) {
  const { palette: c, isDark } = useAppSettings();
  const insets = useSafeAreaInsets();
  const s = useMemo(() => makeStyles(c), [c]);

  if (!props.booking) {
    return (
      <View style={s.root}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <View style={[s.empty, { paddingTop: insets.top }]}>
          <View style={s.emptyIcon}>
            <Car size={40} strokeWidth={1.75} color={c.muted} />
          </View>
          <Text style={s.emptyTitle}>No active ride</Text>
          <Text style={s.emptyText}>
            Book a ride and your driver, arrival time and booking confirmation
            will show up here.
          </Text>
          <Pressable
            onPress={props.onFindRide}
            style={({ pressed }) => [s.primaryBtn, pressed && s.pressed]}
            accessibilityRole="button"
          >
            <Text style={s.primaryText}>Find a ride</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return <ActiveRide {...props} booking={props.booking} />;
}

function ActiveRide({
  booking,
  onCancel,
  onSimulateArrival,
}: Props & { booking: Booking }) {
  const { palette: c, isDark, profile } = useAppSettings();
  const insets = useSafeAreaInsets();
  const s = useMemo(() => makeStyles(c), [c]);

  const { driver } = booking;
  const meta = TIER[booking.tier] ?? TIER.moto;
  const TierIcon = meta.Icon;

  // Countdown, based on when the ride was booked, so it keeps running
  // while the passenger visits other tabs.
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const total = Math.max(driver.etaMinutes * 60, 1);
  const elapsed = Math.max(0, Math.floor((now - booking.bookedAt) / 1000));
  const remaining = Math.max(0, total - elapsed);
  const arrived = remaining === 0;
  const progress = 1 - remaining / total;
  const arrivalTs = booking.bookedAt + total * 1000;
  const kmAway = ((remaining / 3600) * meta.kmh).toFixed(1);

  // Moving driver marker
  const prog = useRef(new Animated.Value(progress)).current;
  const [trackW, setTrackW] = useState(0);
  useEffect(() => {
    Animated.timing(prog, {
      toValue: progress,
      duration: 900,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [progress, prog]);

  const fillWidth = prog.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.max(trackW - DOT / 2, 0)],
  });
  const dotLeft = prog.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.max(trackW - DOT, 0)],
  });

  const amount = formatRwf(booking.price);
  const payLine = booking.method.isCash
    ? `Pay ${amount} in cash to your driver.`
    : `${amount} paid with ${booking.method.title}.`;
  const sms =
    `GoSmart: Booking ${booking.ref} confirmed. ` +
    `${driver.name} (${driver.color} ${driver.vehicle}, ${driver.plate}) arrives in ${driver.etaMinutes} min. ` +
    `Trip PIN: ${driver.pin}. ${payLine} Thank you for riding with GoSmart.`;

  const call = () => Linking.openURL(`tel:${driver.phone}`).catch(() => {});
  const message = () => Linking.openURL(`sms:${driver.phone}`).catch(() => {});

  const shareTrip = () =>
    Share.share({
      message: `I'm on a ${meta.label} ride with ${driver.name} (${driver.color} ${driver.vehicle}, plate ${driver.plate}). From ${booking.pickup} to ${booking.destination}. Booking ${booking.ref}.`,
    }).catch(() => {});

  const confirmCancel = () =>
    Alert.alert(
      "Cancel this ride?",
      booking.method.isCash
        ? "Your driver will be notified."
        : "Your driver will be notified. If you've paid, your refund follows our cancellation policy.",
      [
        { text: "Keep ride", style: "cancel" },
        { text: "Yes, cancel", style: "destructive", onPress: onCancel },
      ],
    );

  const steps: { label: string; state: "done" | "active" | "todo" }[] = [
    { label: "Booked", state: "done" },
    { label: "On the way", state: arrived ? "done" : "active" },
    { label: "Arrived", state: arrived ? "done" : "todo" },
  ];

  const details: { label: string; value: string }[] = [
    { label: "Pickup", value: booking.pickup },
    { label: "Destination", value: booking.destination },
    { label: "Ride type", value: meta.label },
    { label: "Fare", value: amount },
    {
      label: "Payment",
      value: booking.method.isCash
        ? "Cash, pay the driver"
        : `Paid • ${booking.method.title} ${booking.method.masked ?? ""}`.trim(),
    },
  ];

  return (
    <View style={s.root}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <ScrollView
        style={s.flex}
        contentContainerStyle={[s.content, { paddingTop: insets.top + 12 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={s.titleRow}>
          <Text style={s.title}>My ride</Text>
          <View style={[s.statusPill, arrived && s.statusPillArrived]}>
            <View style={s.statusDot} />
            <Text style={s.statusPillText}>
              {arrived ? "Arrived" : "On the way"}
            </Text>
          </View>
        </View>

        {/* Booking confirmed */}
        <View style={s.confirmCard}>
          <View style={s.confirmCheck}>
            <Check size={22} strokeWidth={3.5} color="#FFFFFF" />
          </View>
          <View style={s.flex}>
            <Text style={s.confirmTitle}>Booking confirmed</Text>
            <Text style={s.confirmSub} numberOfLines={2}>
              Ref {booking.ref} • Confirmation sent to {profile.phone}
            </Text>
          </View>
        </View>

        {/* Arrival */}
        <View style={s.etaCard}>
          <Text style={s.etaLabel}>
            {arrived ? "Your driver has arrived" : "Driver arriving in"}
          </Text>
          <Text style={s.etaBig} numberOfLines={1}>
            {arrived ? `Meet at ${booking.pickup}` : mmss(remaining)}
          </Text>
          <Text style={s.etaSub}>
            {arrived
              ? "Share your trip PIN with the driver to start the trip"
              : `Arrives around ${clock(arrivalTs)} • ${kmAway} km away`}
          </Text>

          <View
            style={s.track}
            onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
          >
            <View style={s.trackLine} />
            <Animated.View style={[s.trackFill, { width: fillWidth }]} />
            <View style={s.pickupMark} />
            <Animated.View style={[s.driverDot, { left: dotLeft }]}>
              <TierIcon size={18} strokeWidth={2.25} color="#FFFFFF" />
            </Animated.View>
          </View>
          <View style={s.trackLabels}>
            <Text style={s.trackLabel}>Driver</Text>
            <Text style={s.trackLabel}>You</Text>
          </View>

          <View style={s.steps}>
            {steps.map((st) => (
              <View key={st.label} style={s.step}>
                <View
                  style={[
                    s.stepDot,
                    st.state === "done" && s.stepDotDone,
                    st.state === "active" && s.stepDotActive,
                  ]}
                >
                  {st.state === "done" && (
                    <Check size={11} strokeWidth={4} color="#FFFFFF" />
                  )}
                </View>
                <Text
                  style={[s.stepLabel, st.state !== "todo" && s.stepLabelOn]}
                  numberOfLines={1}
                >
                  {st.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Driver */}
        <View style={s.card}>
          <View style={s.driverTop}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{initials(driver.name)}</Text>
            </View>
            <View style={s.flex}>
              <View style={s.nameRow}>
                <Text style={s.driverName} numberOfLines={1}>
                  {driver.name}
                </Text>
                <ShieldCheck size={16} strokeWidth={2.25} color={c.green} />
              </View>
              <View style={s.ratingRow}>
                <Star
                  size={14}
                  strokeWidth={0}
                  fill={c.amber}
                  color={c.amber}
                />
                <Text style={s.muted}>
                  {driver.rating.toFixed(1)} • {driver.trips.toLocaleString()}{" "}
                  trips
                </Text>
              </View>
            </View>
          </View>

          <View style={s.divider} />

          <View style={s.vehicleRow}>
            <View style={s.flex}>
              <Text style={s.vehicleName}>
                {driver.color} {driver.vehicle}
              </Text>
              <Text style={s.muted}>{meta.label}</Text>
            </View>
            <View style={s.plate}>
              <Text style={s.plateText}>{driver.plate}</Text>
            </View>
          </View>

          <View style={s.contactRow}>
            <Pressable
              onPress={call}
              style={[s.contactBtn, s.callBtn]}
              accessibilityRole="button"
              accessibilityLabel={`Call ${driver.name}`}
            >
              <Phone size={18} strokeWidth={2.25} color="#FFFFFF" />
              <Text style={s.callText}>Call</Text>
            </Pressable>
            <Pressable
              onPress={message}
              style={[s.contactBtn, s.msgBtn]}
              accessibilityRole="button"
              accessibilityLabel={`Message ${driver.name}`}
            >
              <MessageCircle size={18} strokeWidth={2.25} color={c.ink} />
              <Text style={s.msgText}>Message</Text>
            </Pressable>
          </View>
        </View>

        {/* PIN */}
        <View style={[s.card, s.pinCard]}>
          <View style={s.flex}>
            <Text style={s.cardTitle}>Your trip PIN</Text>
            <Text style={s.muted}>
              Give it to your driver to start the trip
            </Text>
          </View>
          <View style={s.pinBoxes}>
            {driver.pin.split("").map((d, i) => (
              <View key={i} style={s.pinBox}>
                <Text style={s.pinDigit}>{d}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Confirmation message */}
        <View style={s.card}>
          <View style={s.smsHeader}>
            <MessageSquare size={16} strokeWidth={2.25} color={c.muted} />
            <Text style={s.smsHeaderText}>Confirmation message</Text>
            <Text style={s.smsTime}>{clock(booking.bookedAt)}</Text>
          </View>
          <View style={s.bubble}>
            <Text style={s.bubbleText}>{sms}</Text>
          </View>
        </View>

        {/* Trip details */}
        <View style={s.card}>
          <Text style={[s.cardTitle, { marginBottom: 6 }]}>Trip details</Text>
          {details.map((d, i) => (
            <View
              key={d.label}
              style={[s.detailRow, i < details.length - 1 && s.detailLine]}
            >
              <Text style={s.detailLabel}>{d.label}</Text>
              <Text style={s.detailValue} numberOfLines={1}>
                {d.value}
              </Text>
            </View>
          ))}
        </View>

        <Pressable
          onPress={shareTrip}
          style={({ pressed }) => [s.outlineBtn, pressed && s.pressed]}
          accessibilityRole="button"
        >
          <Share2 size={18} strokeWidth={2.25} color={c.ink} />
          <Text style={s.outlineText}>Share trip details</Text>
        </Pressable>

        <Pressable
          onPress={confirmCancel}
          style={s.cancelLink}
          accessibilityRole="button"
        >
          <Text style={s.cancelText}>Cancel ride</Text>
        </Pressable>

        {onSimulateArrival && !arrived && (
          <Pressable onPress={onSimulateArrival} style={s.devLink}>
            <Text style={s.devText}>Demo: simulate driver arrival</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    flex: { flex: 1 },
    pressed: { opacity: 0.8 },
    muted: { fontSize: 13, color: c.muted, marginTop: 2 },

    content: { paddingHorizontal: PAD, paddingBottom: 28, gap: 12 },

    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 2,
    },
    title: { fontSize: 32, fontWeight: "800", color: c.ink },
    statusPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: c.greenSoft,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    statusPillArrived: { backgroundColor: c.green },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: c.green,
    },
    statusPillText: { color: c.greenInk, fontSize: 13, fontWeight: "800" },

    card: {
      backgroundColor: c.card,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: c.border,
      padding: 18,
    },
    cardTitle: { fontSize: 16, fontWeight: "800", color: c.ink },

    // Booking confirmed
    confirmCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: c.greenSoft,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: c.green,
      padding: 16,
    },
    confirmCheck: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.green,
      alignItems: "center",
      justifyContent: "center",
    },
    confirmTitle: { fontSize: 16, fontWeight: "800", color: c.ink },
    confirmSub: { fontSize: 13, color: c.muted, marginTop: 2 },

    // Arrival
    etaCard: {
      backgroundColor: c.hero,
      borderRadius: 28,
      padding: 20,
    },
    etaLabel: { color: c.mutedOnHero, fontSize: 14, fontWeight: "600" },
    etaBig: { color: c.onHero, fontSize: 44, fontWeight: "800", marginTop: 4 },
    etaSub: { color: c.mutedOnHero, fontSize: 13, marginTop: 4 },
    track: { height: DOT, marginTop: 22, justifyContent: "center" },
    trackLine: {
      position: "absolute",
      left: 0,
      right: 0,
      top: DOT / 2 - 2,
      height: 4,
      borderRadius: 2,
      backgroundColor: "rgba(255,255,255,0.18)",
    },
    trackFill: {
      position: "absolute",
      left: 0,
      top: DOT / 2 - 2,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.green,
    },
    pickupMark: {
      position: "absolute",
      right: 0,
      top: DOT / 2 - 8,
      width: 16,
      height: 16,
      borderRadius: 4,
      backgroundColor: "#FFFFFF",
    },
    driverDot: {
      position: "absolute",
      top: 0,
      width: DOT,
      height: DOT,
      borderRadius: DOT / 2,
      backgroundColor: c.green,
      borderWidth: 3,
      borderColor: c.hero,
      alignItems: "center",
      justifyContent: "center",
    },
    trackLabels: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 6,
    },
    trackLabel: { color: c.mutedOnHero, fontSize: 12, fontWeight: "700" },
    steps: {
      flexDirection: "row",
      marginTop: 18,
      paddingTop: 16,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: "rgba(255,255,255,0.16)",
    },
    step: { flex: 1, alignItems: "center", gap: 6 },
    stepDot: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: "rgba(255,255,255,0.3)",
      alignItems: "center",
      justifyContent: "center",
    },
    stepDotDone: { backgroundColor: c.green, borderColor: c.green },
    stepDotActive: { borderColor: c.green },
    stepLabel: { color: c.mutedOnHero, fontSize: 12, fontWeight: "700" },
    stepLabelOn: { color: c.onHero },

    // Driver
    driverTop: { flexDirection: "row", alignItems: "center", gap: 14 },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: c.green,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: { color: "#FFFFFF", fontSize: 19, fontWeight: "800" },
    nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    driverName: {
      fontSize: 18,
      fontWeight: "800",
      color: c.ink,
      flexShrink: 1,
    },
    ratingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      marginTop: 4,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.border,
      marginVertical: 16,
    },
    vehicleRow: { flexDirection: "row", alignItems: "center" },
    vehicleName: { fontSize: 16, fontWeight: "700", color: c.ink },
    plate: {
      backgroundColor: "#FFFFFF",
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderWidth: 2,
      borderColor: "#C9CFDC",
    },
    plateText: {
      color: "#060E22",
      fontSize: 15,
      fontWeight: "800",
      letterSpacing: 1,
    },
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
    callBtn: { backgroundColor: c.green },
    callText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
    msgBtn: { borderWidth: 1.5, borderColor: c.border },
    msgText: { color: c.ink, fontSize: 15, fontWeight: "800" },

    // PIN
    pinCard: { flexDirection: "row", alignItems: "center", gap: 12 },
    pinBoxes: { flexDirection: "row", gap: 6 },
    pinBox: {
      width: 36,
      height: 46,
      borderRadius: 10,
      backgroundColor: c.soft,
      alignItems: "center",
      justifyContent: "center",
    },
    pinDigit: { color: c.ink, fontSize: 20, fontWeight: "800" },

    // Confirmation message
    smsHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 12,
    },
    smsHeaderText: { flex: 1, fontSize: 14, fontWeight: "800", color: c.ink },
    smsTime: { fontSize: 12, color: c.muted },
    bubble: {
      backgroundColor: c.soft,
      borderRadius: 18,
      borderTopLeftRadius: 6,
      padding: 14,
    },
    bubbleText: { fontSize: 14, lineHeight: 21, color: c.ink },

    // Details
    detailRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      gap: 16,
    },
    detailLine: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    detailLabel: { fontSize: 14, color: c.muted },
    detailValue: {
      flexShrink: 1,
      fontSize: 14,
      fontWeight: "700",
      color: c.ink,
      textAlign: "right",
    },

    outlineBtn: {
      height: 56,
      borderRadius: 28,
      borderWidth: 1.5,
      borderColor: c.border,
      backgroundColor: c.card,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    outlineText: { color: c.ink, fontSize: 16, fontWeight: "800" },
    cancelLink: { alignItems: "center", paddingVertical: 12 },
    cancelText: { color: c.red, fontSize: 15, fontWeight: "800" },
    devLink: { alignItems: "center", paddingVertical: 6 },
    devText: { color: c.muted, fontSize: 12, textDecorationLine: "underline" },

    // Empty state
    empty: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: PAD + 12,
    },
    emptyIcon: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: c.soft,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 22,
    },
    emptyTitle: { fontSize: 22, fontWeight: "800", color: c.ink },
    emptyText: {
      fontSize: 15,
      lineHeight: 22,
      color: c.muted,
      textAlign: "center",
      marginTop: 8,
    },
    primaryBtn: {
      alignSelf: "stretch",
      height: 56,
      borderRadius: 28,
      backgroundColor: c.green,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 26,
    },
    primaryText: { color: "#FFFFFF", fontSize: 17, fontWeight: "800" },
  });
