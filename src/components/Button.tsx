import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../theme";

type Variant = "primary" | "ghost";

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  trailing?: string;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled,
  trailing,
}: ButtonProps) {
  const isPrimary = variant === "primary";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.ghost,
        disabled && styles.disabled,
        pressed && { opacity: 0.85 },
      ]}
    >
      <View style={styles.row}>
        <Text style={[styles.label, !isPrimary && styles.ghostLabel]}>
          {label}
        </Text>
        {trailing ? <Text style={styles.trailing}>{trailing}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 56,
    borderRadius: radius.pill,
    justifyContent: "center",
    paddingHorizontal: 26,
  },
  primary: { backgroundColor: colors.blue },
  ghost: { backgroundColor: "transparent", height: 48 },
  disabled: { backgroundColor: colors.line },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  label: { color: colors.white, fontSize: 17, fontWeight: "700" },
  ghostLabel: { color: colors.ink, fontSize: 15 },
  trailing: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
    opacity: 0.85,
  },
});
