import React, { useState } from "react";
import { Button } from "../../components/Button";
import { MapPreview } from "../../components/MapPreview";
import {
  RIDE_TIERS,
  RideTierId,
  SAVED_PLACES,
} from "../../constants/rideTiers";
import { colors, elevation, radius, spacing, typography } from "../../theme";
import { formatRwf } from "../../utils/format";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Props {
  onFindRide: (tier: RideTierId) => void;
  onSearchPress?: () => void;
  onSosPress?: () => void;
}

export default function HomeScreen({
  onFindRide,
  onSearchPress,
  onSosPress,
}: Props) {
  const [tierId, setTierId] = useState<RideTierId>("moto");
  const selected = RIDE_TIERS.find((t) => t.id === tierId) ?? RIDE_TIERS[0];

  return (
    <View style={styles.root}>
      <MapPreview tripLabel="12 min trip" />

      <SafeAreaView pointerEvents="box-none">
        <View style={styles.topBar}>
          <Pressable
            style={styles.search}
            onPress={onSearchPress}
            accessibilityRole="search"
          >
            <View style={styles.searchDot} />
            <View style={styles.flex}>
              <Text style={styles.searchTitle}>Where to? · Aho ujya?</Text>
              <Text style={styles.searchSub}>Pickup: KN 3 Rd, Kigali</Text>
            </View>
            <View style={styles.mic}>
              <Text style={styles.micDot}>●</Text>
            </View>
          </Pressable>
          <Pressable
            style={styles.sos}
            onPress={onSosPress}
            accessibilityLabel="Emergency SOS"
          >
            <Text style={styles.sosText}>SOS</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <SafeAreaView style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Choose your ride</Text>
          <Text style={styles.nearby}>
            {RIDE_TIERS.length * 4} drivers nearby
          </Text>
        </View>

        <View style={styles.tiers}>
          {RIDE_TIERS.map((tier) => {
            const active = tier.id === tierId;
            return (
              <Pressable
                key={tier.id}
                onPress={() => setTierId(tier.id)}
                accessibilityState={{ selected: active }}
                style={[styles.tier, active && styles.tierActive]}
              >
                <Text style={[styles.tierName, active && styles.onDark]}>
                  {tier.name}
                </Text>
                <Text style={[styles.tierEta, active && styles.etaOnDark]}>
                  {tier.etaMinutes} min away
                </Text>
                <Text style={[styles.tierPrice, active && styles.onDark]}>
                  {formatRwf(tier.priceRwf)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.note}>{selected.note}</Text>

        <View style={styles.chips}>
          {SAVED_PLACES.map((place) => (
            <Pressable key={place} style={styles.chip}>
              <Text style={styles.chipText}>{place}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.payment}>
          <View style={styles.momo}>
            <Text style={styles.momoText}>MoMo</Text>
          </View>
          <Text style={[styles.payText, styles.flex]}>
            MTN MoMo · 078 ••• 456
          </Text>
          <Text style={styles.change}>Change</Text>
        </View>

        <Button
          label={`Find ${selected.name}`}
          trailing={formatRwf(selected.priceRwf)}
          onPress={() => onFindRide(tierId)}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.blueSoft },
  flex: { flex: 1 },
  onDark: { color: colors.white },
  etaOnDark: { color: "#9FB6FF" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  search: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    padding: spacing.sm,
    paddingLeft: spacing.lg,
    ...elevation,
  },
  searchDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.blue,
    marginRight: spacing.md,
  },
  searchTitle: { ...typography.label, fontSize: 16, color: colors.ink },
  searchSub: { ...typography.caption, color: colors.muted },
  mic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  micDot: { color: colors.white, fontSize: 14 },
  sos: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
    ...elevation,
  },
  sosText: { color: colors.white, fontSize: 12, fontWeight: "800" },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    ...elevation,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line,
    marginVertical: spacing.md,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: spacing.md,
  },
  sheetTitle: { ...typography.heading, color: colors.ink },
  nearby: { ...typography.caption, fontWeight: "700", color: colors.blue },
  tiers: { flexDirection: "row", gap: 10 },
  tier: {
    flex: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.blueMist,
  },
  tierActive: { backgroundColor: colors.ink },
  tierName: { fontSize: 18, fontWeight: "800", color: colors.ink },
  tierEta: { ...typography.caption, color: colors.muted, marginTop: 2 },
  tierPrice: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.blue,
    marginTop: spacing.md,
  },
  note: { ...typography.caption, color: colors.muted, marginTop: spacing.sm },
  chips: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  chip: {
    paddingHorizontal: 14,
    height: 36,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: { fontSize: 13, fontWeight: "700", color: colors.ink },
  payment: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  momo: {
    backgroundColor: colors.blue,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: spacing.md,
  },
  momoText: { color: colors.white, fontSize: 11, fontWeight: "800" },
  payText: { fontSize: 14, fontWeight: "600", color: colors.ink },
  change: { ...typography.label, color: colors.blue },
});
