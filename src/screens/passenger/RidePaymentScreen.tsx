import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft, Check, Lock, ShieldCheck } from "lucide-react-native";
import type { RideTierId } from "../../constants/rideTiers";
import { formatRwf } from "../../utils/format";
import type { Driver } from "./SearchingDriverScreen";

interface MethodInfo {
  badge: string;
  badgeColor: string;
  title: string;
  /** e.g. "•••• 456" */
  subtitle?: string;
  isCash: boolean;
}

interface Props {
  tier: RideTierId;
  /** Final fare in RWF (surge included). */
  price: number;
  pickupLabel?: string;
  destinationLabel?: string;
  driver: Driver;
  method: MethodInfo;
  /** Wrong PIN tries allowed before the screen locks. */
  maxAttempts?: number;
  onBack: () => void;
  onChangePayment: () => void;
  /** Called when the passenger taps Done after a successful payment. */
  onPaid: () => void;
  /**
   * Connect your real payment here (for example a MoMo request-to-pay through
   * your backend). Resolve when the payment succeeds, throw when it fails.
   * The default only waits a moment, so the flow can be tested.
   */
  processPayment?: () => Promise<void>;
}

// Same dark palette as the driver screens
const BG = "#060E22";
const SURFACE = "#101A36";
const BORDER = "#1E2B4F";
const GREEN = "#4FB27E";
const MUTED = "#8F9BB8";
const WHITE = "#FFFFFF";
const RED = "#FF6B6B";

const PAD = 20;

const TIER_LABEL: Record<string, string> = {
  moto: "Moto",
  car: "Car Comfort",
  xl: "XL Van",
};

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const defaultProcess = () =>
  new Promise<void>((resolve) => setTimeout(resolve, 2800));

export default function RidePaymentScreen({
  tier,
  price,
  pickupLabel = "Kimironko",
  destinationLabel = "Kigali Heights",
  driver,
  method,
  maxAttempts = 3,
  onBack,
  onChangePayment,
  onPaid,
  processPayment = defaultProcess,
}: Props) {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  const [pin, setPin] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "processing" | "success">(
    "idle",
  );

  const shakeX = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;

  const locked = attempts >= maxAttempts;
  const busy = status !== "idle";
  const canPay = pin.length === 4 && !locked && !busy;
  const tierLabel = TIER_LABEL[tier] ?? "Ride";
  const amount = formatRwf(price);
  const bottomPad = Math.max(insets.bottom, 16);

  useEffect(() => {
    if (status === "processing") Keyboard.dismiss();
    if (status === "success") {
      Keyboard.dismiss();
      Animated.spring(pop, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }).start();
    }
  }, [status, pop]);

  const shake = () =>
    Animated.sequence(
      [10, -10, 8, -8, 0].map((v) =>
        Animated.timing(shakeX, {
          toValue: v,
          duration: 60,
          useNativeDriver: true,
        }),
      ),
    ).start();

  const submit = async () => {
    if (!canPay) return;

    if (pin !== driver.pin) {
      const used = attempts + 1;
      const left = maxAttempts - used;
      setAttempts(used);
      setPin("");
      shake();
      setError(
        left > 0
          ? `Incorrect PIN. ${left} ${left === 1 ? "attempt" : "attempts"} left.`
          : "Too many incorrect attempts. Go back and contact your driver.",
      );
      return;
    }

    setError(null);
    setStatus("processing");
    try {
      await processPayment();
      setStatus("success");
    } catch {
      setStatus("idle");
      setPin("");
      setError("Payment failed. Check your balance and try again.");
    }
  };

  /* ----- Processing ----- */
  if (status === "processing") {
    return (
      <View style={[styles.root, styles.centered]}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={GREEN} />
        <Text style={styles.stateTitle}>
          {method.isCash ? "Confirming your ride…" : "Approve on your phone"}
        </Text>
        <Text style={styles.stateText}>
          {method.isCash
            ? "Just a moment."
            : `Enter your ${method.title} PIN when prompted to pay ${amount}. Don't close the app.`}
        </Text>
      </View>
    );
  }

  /* ----- Success ----- */
  if (status === "success") {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <View style={styles.centered}>
          <Animated.View
            style={[
              styles.successCircle,
              { opacity: pop, transform: [{ scale: pop }] },
            ]}
          >
            <Check size={48} strokeWidth={3.5} color={WHITE} />
          </Animated.View>
          <Text style={styles.stateTitle}>
            {method.isCash ? "Ride confirmed" : "Payment successful"}
          </Text>
          <Text style={styles.successAmount}>{amount}</Text>
          <Text style={styles.stateText}>
            {method.isCash
              ? `${driver.name} is on the way. Pay ${amount} in cash at the end of the trip.`
              : `Paid with ${method.title} ${method.subtitle ?? ""}. ${driver.name} is on the way.`}
          </Text>
        </View>
        <View style={[styles.footer, { paddingBottom: bottomPad }]}>
          <Pressable
            onPress={onPaid}
            style={styles.cta}
            accessibilityRole="button"
          >
            <Text style={styles.ctaText}>View my ride</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  /* ----- Confirm and pay ----- */
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={onBack}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
        >
          <ArrowLeft size={20} strokeWidth={2.25} color={WHITE} />
        </Pressable>
        <Text style={styles.headerTitle}>Confirm &amp; pay</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Amount */}
        <View style={styles.card}>
          <Text style={styles.amountLabel}>Amount to pay</Text>
          <Text style={styles.amount}>{amount}</Text>
          <Text style={styles.amountRoute} numberOfLines={1}>
            {tierLabel} • {pickupLabel} → {destinationLabel}
          </Text>
        </View>

        {/* Driver */}
        <View style={[styles.card, styles.row]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(driver.name)}</Text>
          </View>
          <View style={styles.flex}>
            <View style={styles.nameRow}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {driver.name}
              </Text>
              <ShieldCheck size={15} strokeWidth={2.25} color={GREEN} />
            </View>
            <Text style={styles.rowSub} numberOfLines={1}>
              {driver.color} {driver.vehicle}
            </Text>
          </View>
          <View style={styles.plate}>
            <Text style={styles.plateText}>{driver.plate}</Text>
          </View>
        </View>

        {/* Payment method */}
        <Pressable
          onPress={onChangePayment}
          style={[styles.card, styles.row]}
          accessibilityRole="button"
          accessibilityLabel="Change payment method"
        >
          <View style={[styles.badge, { backgroundColor: method.badgeColor }]}>
            <Text style={styles.badgeText}>{method.badge}</Text>
          </View>
          <View style={styles.flex}>
            <Text style={styles.rowTitle}>{method.title}</Text>
            <Text style={styles.rowSub}>
              {method.isCash
                ? "Pay the driver at the end of the trip"
                : (method.subtitle ?? "")}
            </Text>
          </View>
          <Text style={styles.change}>Change</Text>
        </Pressable>

        {/* PIN */}
        <View style={styles.card}>
          <Text style={styles.pinTitle}>Enter your trip PIN</Text>
          <Text style={styles.pinSub}>
            Type the 4-digit PIN from your ride screen. It confirms that this is
            you.
          </Text>

          <Animated.View style={{ transform: [{ translateX: shakeX }] }}>
            <Pressable
              onPress={() => inputRef.current?.focus()}
              style={styles.pinRow}
              accessibilityLabel="Trip PIN, 4 digits"
            >
              {[0, 1, 2, 3].map((i) => {
                const focused = i === pin.length && !locked;
                return (
                  <View
                    key={i}
                    style={[
                      styles.pinBox,
                      focused && styles.pinBoxFocus,
                      !!error && pin.length === 0 && styles.pinBoxError,
                    ]}
                  >
                    <Text style={styles.pinDigit}>
                      {i < pin.length ? "•" : ""}
                    </Text>
                  </View>
                );
              })}
            </Pressable>
          </Animated.View>

          <TextInput
            ref={inputRef}
            value={pin}
            onChangeText={(v) => {
              setPin(v.replace(/\D/g, "").slice(0, 4));
              if (error && !locked) setError(null);
            }}
            keyboardType="number-pad"
            maxLength={4}
            editable={!locked}
            autoFocus
            caretHidden
            style={styles.hiddenInput}
          />

          {!!error && <Text style={styles.error}>{error}</Text>}
        </View>

        <View style={styles.secureRow}>
          <Lock size={14} strokeWidth={2.25} color={MUTED} />
          <Text style={styles.secureText}>
            Secure payment • Your PIN is never shared
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomPad }]}>
        <Pressable
          onPress={submit}
          disabled={!canPay}
          style={({ pressed }) => [
            styles.cta,
            !canPay && styles.ctaOff,
            pressed && styles.ctaPressed,
          ]}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canPay }}
        >
          <Text style={styles.ctaText}>
            {method.isCash ? `Confirm ride • ${amount} cash` : `Pay ${amount}`}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  flex: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: PAD + 8,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: PAD,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: WHITE, fontSize: 18, fontWeight: "800" },
  headerSpacer: { width: 40 },

  content: { paddingHorizontal: PAD, paddingBottom: 24, gap: 12 },
  card: {
    backgroundColor: SURFACE,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 18,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 14 },

  amountLabel: { color: MUTED, fontSize: 14, fontWeight: "600" },
  amount: { color: WHITE, fontSize: 40, fontWeight: "800", marginTop: 4 },
  amountRoute: { color: MUTED, fontSize: 13, marginTop: 6 },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: WHITE, fontSize: 17, fontWeight: "800" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  rowTitle: { color: WHITE, fontSize: 16, fontWeight: "800", flexShrink: 1 },
  rowSub: { color: MUTED, fontSize: 13, marginTop: 3 },
  plate: {
    backgroundColor: WHITE,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: "#C9CFDC",
  },
  plateText: { color: BG, fontSize: 13, fontWeight: "800", letterSpacing: 1 },

  badge: {
    minWidth: 52,
    height: 34,
    borderRadius: 10,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: WHITE, fontSize: 12, fontWeight: "800" },
  change: { color: GREEN, fontSize: 14, fontWeight: "800" },

  pinTitle: { color: WHITE, fontSize: 17, fontWeight: "800" },
  pinSub: { color: MUTED, fontSize: 13, lineHeight: 19, marginTop: 4 },
  pinRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: 18,
  },
  pinBox: {
    width: 58,
    height: 66,
    borderRadius: 16,
    backgroundColor: BG,
    borderWidth: 1.5,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  pinBoxFocus: { borderColor: GREEN },
  pinBoxError: { borderColor: RED },
  pinDigit: { color: WHITE, fontSize: 30, fontWeight: "800" },
  hiddenInput: { position: "absolute", width: 1, height: 1, opacity: 0 },
  error: {
    color: RED,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 14,
  },

  secureRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 4,
  },
  secureText: { color: MUTED, fontSize: 12 },

  footer: { paddingHorizontal: PAD, paddingTop: 10, backgroundColor: BG },
  cta: {
    height: 62,
    borderRadius: 31,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaOff: { opacity: 0.4 },
  ctaPressed: { opacity: 0.85 },
  ctaText: { color: WHITE, fontSize: 18, fontWeight: "800" },

  // Processing and success
  stateTitle: {
    color: WHITE,
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 24,
  },
  stateText: {
    color: MUTED,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 10,
  },
  successCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  successAmount: {
    color: GREEN,
    fontSize: 32,
    fontWeight: "800",
    marginTop: 8,
  },
});
