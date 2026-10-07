import React, { useMemo } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  ArrowLeft,
  Bike,
  Car,
  ChevronRight,
  LogOut,
  Settings,
  Star,
  Users,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { formatRwf } from "../../utils/format";
import { describeMethod, useAppSettings } from "../../context/AppSettings";
import type { Palette } from "../../context/AppSettings";

export interface RideRecord {
  id: string;
  from: string;
  to: string;
  when: string;
  tier: "moto" | "car" | "xl";
  priceRwf: number;
  rating: number;
}

interface Props {
  /** Leave out when the screen is a tab root: the back button is hidden. */
  onBack?: () => void;
  onSettings: () => void;
  onPayment: () => void;
  onLogout: () => void;
  /** Replace with rides from your backend. */
  rides?: RideRecord[];
  savedPlacesCount?: number;
  onRidePress?: (ride: RideRecord) => void;
  onSavedPlaces?: () => void;
  onSafety?: () => void;
}

const PAD = 20;

const DEFAULT_RIDES: RideRecord[] = [
  {
    id: "r1",
    from: "Kimironko",
    to: "Heights",
    when: "Today",
    tier: "moto",
    priceRwf: 1200,
    rating: 4.9,
  },
  {
    id: "r2",
    from: "Remera",
    to: "Airport",
    when: "Yesterday",
    tier: "car",
    priceRwf: 5500,
    rating: 5.0,
  },
  {
    id: "r3",
    from: "Kacyiru",
    to: "Downtown",
    when: "Mon",
    tier: "moto",
    priceRwf: 900,
    rating: 4.8,
  },
];

const TIER: Record<RideRecord["tier"], { label: string; Icon: LucideIcon }> = {
  moto: { label: "Moto", Icon: Bike },
  car: { label: "Car", Icon: Car },
  xl: { label: "XL", Icon: Users },
};

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export default function ProfileScreen({
  onBack,
  onSettings,
  onPayment,
  onLogout,
  rides = DEFAULT_RIDES,
  savedPlacesCount = 3,
  onRidePress,
  onSavedPlaces,
  onSafety,
}: Props) {
  const insets = useSafeAreaInsets();
  const { palette: c, t, profile, selectedMethod } = useAppSettings();
  const s = useMemo(() => makeStyles(c), [c]);

  const method = describeMethod(selectedMethod, t("cash"));
  const methodValue =
    selectedMethod.kind === "cash"
      ? method.title.split(" •")[0]
      : `${method.badge} ${method.masked ?? ""}`.trim();

  const comingSoon = () => Alert.alert(t("coming_soon"), t("coming_soon_msg"));

  const confirmLogout = () =>
    Alert.alert(t("log_out_q"), undefined, [
      { text: t("cancel"), style: "cancel" },
      { text: t("log_out"), style: "destructive", onPress: onLogout },
    ]);

  const menu: { label: string; value: string; onPress: () => void }[] = [
    {
      label: t("saved_places"),
      value: String(savedPlacesCount),
      onPress: onSavedPlaces ?? comingSoon,
    },
    { label: t("payment_methods"), value: methodValue, onPress: onPayment },
    {
      label: t("safety_center"),
      value: t("sos_on"),
      onPress: onSafety ?? comingSoon,
    },
  ];

  return (
    <View style={s.root}>
      {/* The header is always dark, so the status bar is always light */}
      <StatusBar style="light" />

      <ScrollView
        style={s.flex}
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 16) + 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={[s.hero, { paddingTop: insets.top + 8 }]}>
          <View style={s.heroBar}>
            {onBack ? (
              <Pressable
                onPress={onBack}
                style={s.heroBtn}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                hitSlop={8}
              >
                <ArrowLeft size={20} strokeWidth={2.25} color={c.onHero} />
              </Pressable>
            ) : (
              <View style={{ width: 40, height: 40 }} />
            )}
            <Text style={s.heroTitle}>{t("profile")}</Text>
            <Pressable
              onPress={onSettings}
              style={s.heroBtn}
              accessibilityRole="button"
              accessibilityLabel={t("settings")}
              hitSlop={8}
            >
              <Settings size={20} strokeWidth={2.25} color={c.onHero} />
            </Pressable>
          </View>

          <View style={s.identity}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{initials(profile.name)}</Text>
            </View>
            <View style={s.flex}>
              <Text style={s.name} numberOfLines={1}>
                {profile.name}
              </Text>
              <Text style={s.contact} numberOfLines={1}>
                {profile.phone}
              </Text>
              {!!profile.email && (
                <Text style={s.contact} numberOfLines={1}>
                  {profile.email}
                </Text>
              )}
              <View style={s.ratingPill}>
                <Star
                  size={12}
                  strokeWidth={0}
                  fill="#FFFFFF"
                  color="#FFFFFF"
                />
                <Text style={s.ratingText}>4.9 {t("passenger")}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Ride history */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>{t("ride_history")}</Text>
            <Text style={s.sectionCount}>
              {rides.length} {t("trips")}
            </Text>
          </View>

          {rides.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyText}>{t("no_rides")}</Text>
            </View>
          ) : (
            <View style={s.rides}>
              {rides.map((ride) => {
                const { label, Icon } = TIER[ride.tier];
                return (
                  <Pressable
                    key={ride.id}
                    onPress={() => onRidePress?.(ride)}
                    style={({ pressed }) => [s.ride, pressed && s.pressed]}
                    accessibilityRole="button"
                  >
                    <View style={s.rideIcon}>
                      <Icon size={22} strokeWidth={2} color={c.ink} />
                    </View>
                    <View style={s.flex}>
                      <Text style={s.rideRoute} numberOfLines={1}>
                        {ride.from} → {ride.to}
                      </Text>
                      <Text style={s.rideMeta} numberOfLines={1}>
                        {ride.when} • {label} • {formatRwf(ride.priceRwf)}
                      </Text>
                    </View>
                    <View style={s.rideRating}>
                      <Star
                        size={12}
                        strokeWidth={0}
                        fill={c.greenInk}
                        color={c.greenInk}
                      />
                      <Text style={s.rideRatingText}>
                        {ride.rating.toFixed(1)}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Menu */}
        <View style={s.menu}>
          {menu.map((item, i) => (
            <Pressable
              key={item.label}
              onPress={item.onPress}
              style={({ pressed }) => [
                s.menuRow,
                i < menu.length - 1 && s.menuLine,
                pressed && s.pressed,
              ]}
              accessibilityRole="button"
            >
              <Text style={s.menuLabel}>{item.label}</Text>
              <Text style={s.menuValue} numberOfLines={1}>
                {item.value}
              </Text>
              <ChevronRight size={18} strokeWidth={2.5} color={c.muted} />
            </Pressable>
          ))}
        </View>

        {/* <Pressable
          onPress={confirmLogout}
          style={({ pressed }) => [s.logout, pressed && s.pressed]}
          accessibilityRole="button"
        >
          <LogOut size={18} strokeWidth={2.25} color={c.red} />
          <Text style={s.logoutText}>{t("log_out")}</Text>
        </Pressable> */}
      </ScrollView>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    flex: { flex: 1 },
    pressed: { opacity: 0.75 },

    // Hero
    hero: {
      backgroundColor: c.hero,
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
      paddingHorizontal: PAD,
      paddingBottom: 26,
    },
    heroBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 20,
    },
    heroBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "rgba(255,255,255,0.12)",
      alignItems: "center",
      justifyContent: "center",
    },
    heroTitle: { color: c.onHero, fontSize: 18, fontWeight: "800" },
    identity: { flexDirection: "row", alignItems: "center", gap: 16 },
    avatar: {
      width: 78,
      height: 78,
      borderRadius: 39,
      backgroundColor: c.green,
      borderWidth: 3,
      borderColor: "rgba(255,255,255,0.25)",
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: { color: "#FFFFFF", fontSize: 28, fontWeight: "800" },
    name: { color: c.onHero, fontSize: 22, fontWeight: "800" },
    contact: { color: c.mutedOnHero, fontSize: 13, marginTop: 3 },
    ratingPill: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: c.green,
      borderRadius: 14,
      paddingHorizontal: 10,
      paddingVertical: 4,
      marginTop: 10,
    },
    ratingText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },

    // Ride history
    section: { paddingHorizontal: PAD, marginTop: 24 },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    sectionTitle: { fontSize: 18, fontWeight: "800", color: c.ink },
    sectionCount: { fontSize: 13, color: c.muted, fontWeight: "600" },
    rides: { gap: 10 },
    ride: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.card,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: c.border,
      paddingVertical: 14,
      paddingHorizontal: 14,
    },
    rideIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: c.soft,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 14,
    },
    rideRoute: { fontSize: 16, fontWeight: "800", color: c.ink },
    rideMeta: { fontSize: 13, color: c.muted, marginTop: 3 },
    rideRating: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: c.greenSoft,
      borderRadius: 14,
      paddingHorizontal: 10,
      paddingVertical: 5,
      marginLeft: 8,
    },
    rideRatingText: { color: c.greenInk, fontSize: 13, fontWeight: "800" },
    empty: {
      backgroundColor: c.card,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: c.border,
      padding: 24,
      alignItems: "center",
    },
    emptyText: { color: c.muted, fontSize: 14, textAlign: "center" },

    // Menu
    menu: {
      marginHorizontal: PAD,
      marginTop: 18,
      backgroundColor: c.card,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: c.border,
      overflow: "hidden",
    },
    menuRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 18,
      paddingHorizontal: 18,
      gap: 8,
    },
    menuLine: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    menuLabel: { flex: 1, fontSize: 16, fontWeight: "800", color: c.ink },
    menuValue: {
      fontSize: 14,
      fontWeight: "700",
      color: c.muted,
      maxWidth: 160,
    },

    logout: {
      marginHorizontal: PAD,
      marginTop: 18,
      height: 56,
      borderRadius: 28,
      borderWidth: 1.5,
      borderColor: c.border,
      backgroundColor: c.card,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    logoutText: { color: c.red, fontSize: 16, fontWeight: "800" },
  });
