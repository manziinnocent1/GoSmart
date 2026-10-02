import React, { useState } from "react";
import { MapPreview } from "../../components/MapPreview";
import { RIDE_TIERS, RideTierId } from "../../constants/rideTiers";
import { colors, elevation, radius, typography } from "../../theme";
import { formatRwf } from "../../utils/format";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Bike,
  Briefcase,
  Car,
  ChevronRight,
  Home,
  Navigation,
  Star,
  Users,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

interface Props {
  onFindRide: (tier: RideTierId) => void;
  onSearchPress?: () => void;
  onSosPress?: () => void;
}

// Layout + palette
const PAD = 20;
const NAVY = "#111F3F";
const GREEN = "#4ADE80";
const BORDER = "#D9DEEA";
const ICON_BG = "#E8ECF4";
const SOS_RED = "#E5484D";

// Icon for each ride type (falls back to Car for unknown ids)
const TIER_ICONS: Record<string, LucideIcon> = {
  moto: Bike,
  car: Car,
  xl: Users,
};

// Saved places shown as a list
const PLACES: { title: string; subtitle: string; Icon: LucideIcon }[] = [
  { title: "Home — Kimironko", subtitle: "KN 5 Rd, Kigali", Icon: Home },
  { title: "Work — Kigali Heights", subtitle: "KG 7 Ave", Icon: Briefcase },
  { title: "BK Arena", subtitle: "Amahoro Stadium", Icon: Star },
];

export default function HomeScreen({
  onFindRide,
  onSearchPress,
  onSosPress,
}: Props) {
  const insets = useSafeAreaInsets();
  const [tierId, setTierId] = useState<RideTierId>("moto");
  const selected = RIDE_TIERS.find((t) => t.id === tierId) ?? RIDE_TIERS[0];

  return (
    <View style={styles.root}>
      <MapPreview tripLabel="12 min trip" />

      {/* Top bar */}
      <View
        pointerEvents="box-none"
        style={[styles.topBar, { paddingTop: insets.top + 8 }]}
      >
        <Pressable
          style={styles.search}
          onPress={onSearchPress}
          accessibilityRole="search"
        >
          <View style={styles.searchDot} />
          <View style={styles.flex}>
            <Text style={styles.searchTitle} numberOfLines={1}>
              Where to? · Aho ujya?
            </Text>
            <Text style={styles.searchSub} numberOfLines={1}>
              Pickup: KN 3 Rd, Kigali
            </Text>
          </View>
          <View style={styles.mic}>
            <View style={styles.micDot} />
          </View>
        </Pressable>

        <Pressable
          style={styles.sos}
          onPress={onSosPress}
          accessibilityRole="button"
          accessibilityLabel="Emergency SOS"
        >
          <Text style={styles.sosText}>SOS</Text>
        </Pressable>
      </View>

      {/* Bottom sheet */}
      <View
        style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}
      >
        <View style={styles.handle} />

        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Choose your ride</Text>
          <View style={styles.nearbyPill}>
            <View style={styles.liveDot} />
            <Text style={styles.nearby}>
              {RIDE_TIERS.length * 4} drivers nearby
            </Text>
          </View>
        </View>

        {/* Ride tiers */}
        <View style={styles.tiers}>
          {RIDE_TIERS.map((tier) => {
            const active = tier.id === tierId;
            const Icon = TIER_ICONS[tier.id] ?? Car;
            return (
              <Pressable
                key={tier.id}
                onPress={() => setTierId(tier.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                style={[styles.tier, active && styles.tierActive]}
              >
                <Icon
                  size={24}
                  strokeWidth={2}
                  color={active ? colors.white : NAVY}
                />
                <Text style={[styles.tierName, active && styles.onDark]}>
                  {tier.name}
                </Text>
                <Text style={[styles.tierPrice, active && styles.priceOnDark]}>
                  {formatRwf(tier.priceRwf)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.note}>
          {selected.etaMinutes} min away · {selected.note}
        </Text>

        {/* Saved places */}
        <View style={styles.places}>
          {PLACES.map(({ title, subtitle, Icon }, i) => (
            <Pressable
              key={title}
              onPress={onSearchPress}
              style={[styles.place, i < PLACES.length - 1 && styles.placeLine]}
            >
              <View style={styles.placeIcon}>
                <Icon size={20} strokeWidth={2} color={NAVY} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.placeTitle} numberOfLines={1}>
                  {title}
                </Text>
                <Text style={styles.placeSub} numberOfLines={1}>
                  {subtitle}
                </Text>
              </View>
              <ChevronRight size={20} strokeWidth={2.5} color={NAVY} />
            </Pressable>
          ))}
        </View>

        {/* Payment */}
        <Pressable style={styles.payment} accessibilityRole="button">
          <View style={styles.momo}>
            <Text style={styles.momoText}>MoMo</Text>
          </View>
          <Text style={[styles.payText, styles.flex]} numberOfLines={1}>
            MTN MoMo · 078 ••• 456
          </Text>
          <Text style={styles.change}>Change</Text>
        </Pressable>

        {/* CTA */}
        <Pressable
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          onPress={() => onFindRide(tierId)}
          accessibilityRole="button"
          accessibilityLabel={`Find ${selected.name}`}
        >
          <Navigation size={20} strokeWidth={2.25} color={colors.white} />
          <Text style={styles.ctaText}>Find Ride</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.blueSoft },
  flex: { flex: 1 },
  onDark: { color: colors.white },
  priceOnDark: { color: GREEN },

  // Top bar
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: PAD,
  },
  search: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingLeft: 18,
    paddingRight: 8,
    ...elevation,
  },
  searchDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.blue,
    marginRight: 12,
  },
  searchTitle: { ...typography.label, fontSize: 16, color: NAVY },
  searchSub: { ...typography.caption, color: colors.muted, marginTop: 1 },
  mic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ICON_BG,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  micDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.blue,
  },
  sos: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: SOS_RED,
    alignItems: "center",
    justifyContent: "center",
    ...elevation,
  },
  sosText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  // Sheet
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: PAD,
    ...elevation,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: BORDER,
    marginTop: 10,
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sheetTitle: { ...typography.heading, color: NAVY },
  nearbyPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: ICON_BG,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22C55E",
    marginRight: 6,
  },
  nearby: { ...typography.caption, fontWeight: "700", color: NAVY },

  // Ride tiers
  tiers: { flexDirection: "row", gap: 10 },
  tier: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: BORDER,
    backgroundColor: colors.white,
  },
  tierActive: { backgroundColor: NAVY, borderColor: NAVY },
  tierName: {
    fontSize: 15,
    fontWeight: "800",
    color: NAVY,
    marginTop: 8,
  },
  tierPrice: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.muted,
    marginTop: 4,
  },
  note: { ...typography.caption, color: colors.muted, marginTop: 10 },

  // Saved places
  places: { marginTop: 8 },
  place: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  placeLine: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  placeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ICON_BG,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  placeTitle: { fontSize: 16, fontWeight: "800", color: NAVY },
  placeSub: { fontSize: 13, color: colors.muted, marginTop: 2 },

  // Payment
  payment: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },
  momo: {
    backgroundColor: colors.blue,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 12,
  },
  momoText: { color: colors.white, fontSize: 11, fontWeight: "800" },
  payText: { fontSize: 14, fontWeight: "600", color: NAVY },
  change: { ...typography.label, color: colors.blue },

  // CTA
  cta: {
    height: 62,
    marginTop: 8,
    borderRadius: radius.pill,
    backgroundColor: NAVY,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  ctaPressed: { opacity: 0.9 },
  ctaText: { color: colors.white, fontSize: 18, fontWeight: "800" },
});
