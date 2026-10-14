import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LockKeyhole } from "lucide-react-native";
import { Button } from "../../components/Button";
import { colors, radius, spacing, typography } from "../../theme";

interface Props {
  onBack: () => void;
  onAuthenticated: () => void;
}

export default function AdminLoginScreen({ onBack, onAuthenticated }: Props) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const canSubmit =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && password.length > 0;

  const signIn = () => {
    const adminEmail = process.env.EXPO_PUBLIC_ADMIN_EMAIL?.trim().toLowerCase();
    const adminPassword = process.env.EXPO_PUBLIC_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      Alert.alert(
        "Admin sign-in unavailable",
        "Configure the local demo credentials and restart the app.",
      );
      return;
    }

    const matches =
      email.trim().toLowerCase() === adminEmail && password === adminPassword;

    if (!matches) {
      Alert.alert("Sign-in failed", "The email or password is incorrect.");
      return;
    }

    onAuthenticated();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xl },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            style={styles.backButton}
          >
            <Text style={styles.backLabel}>‹ Back</Text>
          </Pressable>

          <View style={styles.brand}>
            <View style={styles.brandMark}>
              <Text style={styles.brandLetter}>G</Text>
            </View>
            <Text style={styles.brandName}>GoSmart</Text>
          </View>

          <View style={styles.lockIcon}>
            <LockKeyhole size={22} color={colors.blue} />
          </View>
          <Text style={styles.title}>Admin sign in</Text>
          <Text style={styles.subtitle}>
            Use your authorized GoSmart admin credentials to access operations.
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="off"
              textContentType="none"
              autoCorrect={false}
              placeholder="you@example.com"
              placeholderTextColor={colors.muted}
              style={styles.input}
              returnKeyType="next"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              autoComplete="off"
              textContentType="none"
              placeholder="Enter your password"
              placeholderTextColor={colors.muted}
              secureTextEntry
              style={styles.input}
              onSubmitEditing={signIn}
            />
          </View>

          <Button
            label="Sign in"
            disabled={!canSubmit}
            onPress={signIn}
          />

          <Text style={styles.notice}>
            Demo sign-in only. Production access must be verified by the backend.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    paddingHorizontal: spacing.xl,
    justifyContent: "center",
  },
  backButton: { alignSelf: "flex-start", paddingVertical: spacing.sm, marginBottom: spacing.xl },
  backLabel: { ...typography.label, color: colors.muted },
  brand: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.xxl },
  brandMark: {
    width: 37,
    height: 37,
    borderRadius: 13,
    backgroundColor: colors.blue,
    alignItems: "center",
    justifyContent: "center",
  },
  brandLetter: { color: colors.white, fontSize: 20, fontWeight: "900" },
  brandName: { color: colors.ink, fontSize: 20, fontWeight: "800" },
  lockIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.blueSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  title: { ...typography.title, color: colors.ink },
  subtitle: { ...typography.body, color: colors.muted, marginTop: spacing.sm, marginBottom: spacing.xl },
  fieldGroup: { marginBottom: spacing.lg },
  label: { ...typography.label, color: colors.ink, marginBottom: spacing.sm },
  input: {
    height: 56,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.blueMist,
    paddingHorizontal: spacing.lg,
    fontSize: 16,
    color: colors.ink,
  },
  notice: {
    ...typography.caption,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 18,
    marginTop: spacing.lg,
  },
});
