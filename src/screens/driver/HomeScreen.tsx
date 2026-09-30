import React from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { Button } from "../../components/Button";
import { colors, radius, spacing, typography } from "../../theme";

interface Props {
  onLogout: () => void;
}

export default function DriverHomeScreen({ onLogout }: Props) {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>Driver mode</Text>
        <Text style={styles.title}>You’re ready to drive</Text>
        <Text style={styles.subtitle}>
          Stay online, accept nearby rides, and make every trip smoother.
        </Text>

        <View style={styles.statusRow}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Online and available</Text>
        </View>

        <Button label="Go online" onPress={() => undefined} />
        <View style={styles.logoutWrap}>
          <Button label="Log out" variant="ghost" onPress={onLogout} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.blueSoft,
    justifyContent: "center",
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.xl,
    shadowColor: "#0B1B4D",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  eyebrow: {
    ...typography.label,
    color: colors.blue,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
  },
  title: { ...typography.title, color: colors.ink },
  subtitle: {
    ...typography.body,
    color: colors.muted,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.blueMist,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.xl,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2FC777",
    marginRight: spacing.sm,
  },
  statusText: { ...typography.label, color: colors.ink },
  logoutWrap: { marginTop: spacing.md },
});
