import React, { useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Button } from "../../components/Button";
import { colors, radius, spacing, typography } from "../../theme";

type Role = "passenger" | "driver";

interface Props {
  onBack: () => void;
  onLogin: (role: Role) => void;
  onCreateAccount: () => void;
}

export default function LoginScreen({
  onBack,
  onLogin,
  onCreateAccount,
}: Props) {
  const [role, setRole] = useState<Role>("passenger");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const canSubmit =
    phone.replace(/\s/g, "").length >= 9 && password.length >= 6;

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Pressable
            onPress={onBack}
            style={styles.back}
            accessibilityLabel="Go back"
          >
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <Text style={styles.title}>Welcome back</Text>
        </View>

        <Text style={styles.subtitle}>
          Sign in to continue your ride or drive.
        </Text>

        <View style={styles.roleRow}>
          <Pressable
            onPress={() => setRole("passenger")}
            style={[
              styles.roleButton,
              role === "passenger" && styles.roleButtonActive,
            ]}
          >
            <Text
              style={[
                styles.roleText,
                role === "passenger" && styles.roleTextActive,
              ]}
            >
              Passenger
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setRole("driver")}
            style={[
              styles.roleButton,
              role === "driver" && styles.roleButtonActive,
            ]}
          >
            <Text
              style={[
                styles.roleText,
                role === "driver" && styles.roleTextActive,
              ]}
            >
              Driver
            </Text>
          </Pressable>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Phone number</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="788 123 456"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor={colors.muted}
            secureTextEntry
            style={styles.input}
          />
        </View>

        <Button
          label="Log in"
          disabled={!canSubmit}
          onPress={() => onLogin(role)}
        />

        <Text style={styles.footerText}>
          Don’t have an account?{" "}
          <Text style={styles.linkText} onPress={onCreateAccount}>
            Create one
          </Text>
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  content: { flexGrow: 1, padding: spacing.xl },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  back: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.blueMist,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.lg,
  },
  backIcon: { fontSize: 30, lineHeight: 34, color: colors.ink, marginTop: -2 },
  title: { ...typography.title, color: colors.ink },
  subtitle: {
    ...typography.body,
    color: colors.muted,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  roleRow: {
    flexDirection: "row",
    backgroundColor: colors.blueMist,
    borderRadius: radius.pill,
    padding: 6,
    marginBottom: spacing.xl,
  },
  roleButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 46,
    borderRadius: radius.pill,
  },
  roleButtonActive: { backgroundColor: colors.blue },
  roleText: {
    ...typography.label,
    color: colors.ink,
  },
  roleTextActive: { color: colors.white },
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
  footerText: {
    ...typography.body,
    color: colors.muted,
    textAlign: "center",
    marginTop: spacing.xl,
  },
  linkText: {
    color: colors.blue,
    fontWeight: "700",
  },
});
