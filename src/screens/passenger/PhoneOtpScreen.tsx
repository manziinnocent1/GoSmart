import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Button } from "../../components/Button";
import { OtpInput } from "../../components/OtpInput";
import { useCountdown } from "../../hooks/useCountdown";
import { colors, radius, spacing, typography } from "../../theme";

const OTP_LENGTH = 4;
const RESEND_SECONDS = 42;
const TOTAL_STEPS = 3;

interface Props {
  onBack: () => void;
  onVerified: (phone: string) => void;
}

export default function PhoneOtpScreen({ onBack, onVerified }: Props) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const { remaining, isDone, restart } = useCountdown(RESEND_SECONDS);

  const digits = phone.replace(/\s/g, "");
  const canVerify = code.length === OTP_LENGTH && digits.length >= 9;
  const timer = `00:${String(remaining).padStart(2, "0")}`;

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Go back"
            onPress={onBack}
            style={styles.back}
          >
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <View style={styles.progress}>
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <View
                key={i}
                style={[styles.segment, i === 0 && styles.segmentActive]}
              />
            ))}
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>What&apos;s your number?</Text>
          <Text style={styles.subtitle}>
            We&apos;ll text you a 4-digit code. Use the number linked to your
            MoMo or Airtel Money.
          </Text>

          <View style={styles.phoneBox}>
            <View style={styles.country}>
              <View style={styles.flag}>
                <View style={[styles.band, styles.bandBlue]} />
                <View
                  style={[styles.band, { backgroundColor: colors.white }]}
                />
                <View style={[styles.band, { backgroundColor: colors.ink }]} />
              </View>
              <Text style={styles.dialCode}>+250</Text>
            </View>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="788 123 456"
              placeholderTextColor={colors.muted}
              style={styles.phoneInput}
            />
          </View>

          <Text style={styles.fieldLabel}>Verification code</Text>
          <OtpInput value={code} length={OTP_LENGTH} onChange={setCode} />

          <View style={styles.resendRow}>
            <Text style={styles.resendHint}>
              {isDone ? "Didn't get it?" : `Resend code in ${timer}`}
            </Text>
            <Pressable disabled={!isDone} onPress={restart}>
              <Text style={[styles.resend, !isDone && styles.dim]}>
                Resend code
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.footer}>
          <Button
            label="Verify and continue"
            disabled={!canVerify}
            onPress={() => onVerified(`+250${digits}`)}
          />
          <Text style={styles.legal}>Standard SMS rates may apply.</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  back: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.blueMist,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: { fontSize: 30, lineHeight: 34, color: colors.ink, marginTop: -2 },
  progress: { flex: 1, flexDirection: "row", gap: 6, marginLeft: spacing.lg },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line,
  },
  segmentActive: { backgroundColor: colors.blue },
  body: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.xxl },
  title: { ...typography.title, color: colors.ink },
  subtitle: {
    ...typography.body,
    color: colors.muted,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  phoneBox: {
    flexDirection: "row",
    alignItems: "center",
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.blueMist,
    paddingHorizontal: spacing.lg,
  },
  country: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: spacing.md,
    marginRight: spacing.md,
    borderRightWidth: 1,
    borderRightColor: colors.line,
  },
  flag: {
    width: 26,
    height: 18,
    borderRadius: 4,
    overflow: "hidden",
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.line,
  },
  band: { flex: 1 },
  bandBlue: { backgroundColor: colors.blue, flex: 2 },
  dialCode: { fontSize: 17, fontWeight: "700", color: colors.ink },
  phoneInput: {
    flex: 1,
    fontSize: 19,
    fontWeight: "600",
    color: colors.ink,
    letterSpacing: 0.4,
  },
  fieldLabel: {
    ...typography.label,
    color: colors.ink,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  resendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.lg,
  },
  resendHint: { ...typography.body, fontSize: 14, color: colors.muted },
  resend: { ...typography.label, color: colors.blue },
  dim: { opacity: 0.35 },
  footer: { padding: spacing.xl },
  legal: {
    ...typography.caption,
    color: colors.muted,
    textAlign: "center",
    marginTop: spacing.md,
  },
});
