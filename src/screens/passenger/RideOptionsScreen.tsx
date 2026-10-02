import React, { useState } from "react";
import { RIDE_TIERS, RideTierId } from "../../constants/rideTiers";
import { formatRwf } from "../../utils/format";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  ArrowUpDown,
  Bike,
  Car,
  ChevronRight,
  Clock,
  Tag,
  Users,
  Zap,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

interface Place {
  title: string;
  subtitle: string;
}

interface Surge {
  multiplier: number;
  area: string;
}

interface Props {
  initialTier?: RideTierId;
  pickup?: Place;
  destination?: Place;
  distanceKm?: number;
  durationMin?: number;
  /** Pass null to hide surge pricing. */
  surge?: Surge | null;
  onBack?: () => void;
  onConfirm: (tier: RideTierId) => void | Promise<void>;
  onChangePayment?: () => void;
  onPromoPress?: () => void;
}

// Palette
const NAVY = "#111F3F";
const GREEN = "#4FAF7D";
const GREEN_SOFT = "#E1F3E9";
const BG = "#EEF0F4";
const BORDER = "#DDE1EA";
const MUTED = "#6B7488";
const AMBER_BG = "#FDF0DA";
const AMBER_BORDER = "#F0A93B";
const BLUE = "#2447FF";

const PAD = 16;

const DEFAULT_PICKUP: Place = {
  title: "Kimironko, KN 5 Rd",
  subtitle: "Pickup • Now",
};
const DEFAULT_DESTINATION: Place = {
  title: "Kigali Heights, KG 7 Ave",
  subtitle: "",
};
const DEFAULT_SURGE: Surge = { multiplier: 1.2, area: "Remera" };

interface TierMeta {
  label: string;
  tagline: string;
  Icon: LucideIcon;
}

const TIER_META: Record<string, TierMeta> = {
  moto: { label: "Moto", tagline: "Fastest through traffic", Icon: Bike },
  car: { label: "Car Comfort", tagline: "AC • 4 seats", Icon: Car },
  xl: { label: "XL Van", tagline: "6 seats • Luggage", Icon: Users },
};

const roundTo50 = (n: number) => Math.round(n / 50) * 50;

export default function RideOptionsScreen({
  initialTier = "moto",
  pickup: pickupProp = DEFAULT_PICKUP,
  destination: destinationProp = DEFAULT_DESTINATION,
  distanceKm = 4.8,
  durationMin = 14,
  surge = DEFAULT_SURGE,
  onBack,
  onConfirm,
  onChangePayment,
  onPromoPress,
}: Props) {
  const insets = useSafeAreaInsets();
  const [tierId, setTierId] = useState<RideTierId>(initialTier);
  const [swapped, setSwapped] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const from = swapped ? destinationProp : pickupProp;
  const to = swapped ? pickupProp : destinationProp;

  // Surge applies to every ride except Moto
  const priceOf = (id: string, base: number) =>
    id === "moto" || !surge ? base : roundTo50(base * surge.multiplier);

  const options = RIDE_TIERS.map((tier) => ({
    tier,
    meta: TIER_META[tier.id] ?? {
      label: tier.name,
      tagline: tier.note,
      Icon: Car,
    },
    price: priceOf(tier.id, tier.priceRwf),
  }));

  const cheapest = options.reduce((a, b) => (b.price < a.price ? b : a));
  const selected = options.find((o) => o.tier.id === tierId) ?? options[0];
  const moto = options.find((o) => o.tier.id === "moto");

  const savings = moto ? selected.price - moto.price : 0;
  const showSurge = !!surge && selected.tier.id !== "moto" && savings > 0;

  const handleConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onConfirm(selected.tier.id);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={onBack}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
        >
          <ArrowLeft size={20} strokeWidth={2.25} color={NAVY} />
        </Pressable>
        <Text style={styles.headerTitle}>Choose a ride</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Route */}
        <View style={styles.card}>
          <View style={styles.routeRow}>
            <View style={styles.timeline}>
              <View style={styles.dotFrom} />
              <View style={styles.timelineLine} />
              <View style={styles.dotTo} />
            </View>

            <View style={styles.flex}>
              <View style={styles.stop}>
                <Text style={styles.stopTitle} numberOfLines={1}>
                  {from.title}
                </Text>
                <Text style={styles.stopSub}>
                  {swapped ? "Pickup • Now" : from.subtitle}
                </Text>
              </View>
              <View style={styles.routeDivider} />
              <View style={styles.stop}>
                <Text style={styles.stopTitle} numberOfLines={1}>
                  {to.title}
                </Text>
                <Text style={styles.stopSub}>
                  {distanceKm} km • {durationMin} min
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => setSwapped((s) => !s)}
              style={styles.swapBtn}
              accessibilityRole="button"
              accessibilityLabel="Swap pickup and destination"
              hitSlop={8}
            >
              <ArrowUpDown size={18} strokeWidth={2.25} color={NAVY} />
            </Pressable>
          </View>
        </View>

        {/* Ride options */}
        <View style={styles.options}>
          {options.map(({ tier, meta, price }) => {
            const active = tier.id === tierId;
            const best = tier.id === cheapest.tier.id;
            const Icon = meta.Icon;
            return (
              <Pressable
                key={tier.id}
                onPress={() => setTierId(tier.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                style={[styles.option, active && styles.optionActive]}
              >
                <View
                  style={[styles.optionIcon, active && styles.optionIconActive]}
                >
                  <Icon
                    size={22}
                    strokeWidth={2}
                    color={active ? "#FFFFFF" : NAVY}
                  />
                </View>

                <View style={styles.flex}>
                  <Text style={[styles.optionName, active && styles.onDark]}>
                    {meta.label}
                  </Text>
                  <Text style={[styles.optionSub, active && styles.subOnDark]}>
                    {meta.tagline} • {tier.etaMinutes} min away
                  </Text>
                </View>

                <View style={styles.priceCol}>
                  <Text style={[styles.price, active && styles.priceOnDark]}>
                    {formatRwf(price)}
                  </Text>
                  {best && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>BEST</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Surge banner */}
        {showSurge && surge && moto && (
          <Pressable
            onPress={() => setTierId("moto")}
            style={styles.surge}
            accessibilityRole="button"
            accessibilityLabel="Switch to Moto"
          >
            <Zap size={18} strokeWidth={2.25} color={NAVY} />
            <Text style={styles.surgeText}>
              Surge x{surge.multiplier} in {surge.area} — save{" "}
              {formatRwf(savings)} with Moto
            </Text>
          </Pressable>
        )}

        {/* Payment + promo */}
        <View style={[styles.card, styles.detailsCard]}>
          <Pressable
            style={styles.detailRow}
            onPress={onChangePayment}
            accessibilityRole="button"
            accessibilityLabel="Change payment method"
          >
            <View style={styles.momo}>
              <Text style={styles.momoText}>MoMo</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.detailTitle}>MTN MoMo</Text>
              <Text style={styles.detailSub}>078 ••• 456</Text>
            </View>
            <Text style={styles.change}>Change</Text>
          </Pressable>

          <View style={styles.rowDivider} />

          <Pressable
            style={styles.detailRow}
            onPress={onPromoPress}
            accessibilityRole="button"
            accessibilityLabel="Add promo code"
          >
            <View style={styles.detailIcon}>
              <Tag size={18} strokeWidth={2} color={NAVY} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.detailTitle}>Promo code</Text>
              <Text style={styles.detailSub}>
                Add a code to save on this trip
              </Text>
            </View>
            <ChevronRight size={20} strokeWidth={2.5} color={NAVY} />
          </Pressable>
        </View>
      </ScrollView>

      {/* Sticky footer */}
      <View
        style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}
      >
        <View style={styles.footerNote}>
          <Clock size={14} strokeWidth={2} color={MUTED} />
          <Text style={styles.footerNoteText}>
            Estimated fare. Final price may change with traffic or route.
          </Text>
        </View>

        <Pressable
          onPress={handleConfirm}
          disabled={submitting}
          accessibilityRole="button"
          accessibilityState={{ disabled: submitting, busy: submitting }}
          style={({ pressed }) => [
            styles.cta,
            (pressed || submitting) && styles.ctaPressed,
          ]}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.ctaText}>
              Confirm {selected.meta.label} • {formatRwf(selected.price)}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const shadow = {
  shadowColor: "#0B1530",
  shadowOpacity: 0.06,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
} as const;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  flex: { flex: 1 },
  onDark: { color: "#FFFFFF" },
  subOnDark: { color: "#B9C3DC" },
  priceOnDark: { color: "#6FD39C" },

  // Header
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
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    ...shadow,
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: NAVY },
  headerSpacer: { width: 40 },

  content: { paddingHorizontal: PAD, paddingBottom: 24, gap: 12 },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDER,
    ...shadow,
  },

  // Route
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  timeline: {
    alignItems: "center",
    marginRight: 14,
    alignSelf: "stretch",
    paddingVertical: 8,
  },
  dotFrom: { width: 14, height: 14, borderRadius: 7, backgroundColor: GREEN },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: BORDER,
    marginVertical: 4,
  },
  dotTo: { width: 14, height: 14, borderRadius: 3, backgroundColor: NAVY },
  stop: { paddingVertical: 8 },
  stopTitle: { fontSize: 16, fontWeight: "800", color: NAVY },
  stopSub: { fontSize: 13, color: MUTED, marginTop: 2 },
  routeDivider: { height: StyleSheet.hairlineWidth, backgroundColor: BORDER },
  swapBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: BG,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },

  // Options
  options: { gap: 12 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: BORDER,
    paddingVertical: 16,
    paddingHorizontal: 16,
    ...shadow,
  },
  optionActive: { backgroundColor: NAVY, borderColor: NAVY },
  optionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: GREEN_SOFT,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  optionIconActive: { backgroundColor: "rgba(255,255,255,0.14)" },
  optionName: { fontSize: 17, fontWeight: "800", color: NAVY },
  optionSub: { fontSize: 13, color: MUTED, marginTop: 3, paddingRight: 8 },
  priceCol: { alignItems: "flex-end", gap: 6 },
  price: { fontSize: 16, fontWeight: "800", color: GREEN },
  badge: {
    backgroundColor: GREEN,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  // Surge
  surge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: AMBER_BG,
    borderColor: AMBER_BORDER,
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  surgeText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: NAVY,
    lineHeight: 20,
  },

  // Details
  detailsCard: { paddingHorizontal: 16 },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  rowDivider: { height: StyleSheet.hairlineWidth, backgroundColor: BORDER },
  momo: {
    backgroundColor: BLUE,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginRight: 14,
    minWidth: 44,
    alignItems: "center",
  },
  momoText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
  detailIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BG,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    marginLeft: -2,
  },
  detailTitle: { fontSize: 15, fontWeight: "700", color: NAVY },
  detailSub: { fontSize: 13, color: MUTED, marginTop: 2 },
  change: { fontSize: 14, fontWeight: "800", color: BLUE },

  // Footer
  footer: {
    backgroundColor: BG,
    paddingHorizontal: PAD,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },
  footerNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 10,
  },
  footerNoteText: { fontSize: 12, color: MUTED },
  cta: {
    height: 62,
    borderRadius: 31,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaPressed: { opacity: 0.85 },
  ctaText: { color: "#FFFFFF", fontSize: 18, fontWeight: "800" },
});
