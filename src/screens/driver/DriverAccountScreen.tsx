import React, { useMemo } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LifeBuoy, LogOut, Moon, Smartphone, Star, Sun } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { useAppSettings } from "../../context/AppSettings";
import type { Palette, ThemeMode } from "../../context/AppSettings";
import { KIND_LABEL } from "./driverData";
import type { DriverProfile } from "./driverData";

interface Props {
  driver: DriverProfile;
  acceptCash: boolean;
  onAcceptCash: (next: boolean) => void;
  onLogout: () => void;
}

const PAD = 20;

const DOCUMENTS: { label: string; status: string; ok: boolean }[] = [
  { label: "Driving licence", status: "Verified", ok: true },
  { label: "Vehicle inspection", status: "Verified", ok: true },
  { label: "Insurance", status: "Expires in 14 days", ok: false },
];

export default function DriverAccountScreen({
  driver,
  acceptCash,
  onAcceptCash,
  onLogout,
}: Props) {
  const { palette: c, isDark, themeMode, setThemeMode } = useAppSettings();
  const insets = useSafeAreaInsets();
  const s = useMemo(() => makeStyles(c), [c]);

  const themes: { id: ThemeMode; label: string; Icon: LucideIcon }[] = [
    { id: "light", label: "Light", Icon: Sun },
    { id: "dark", label: "Dark", Icon: Moon },
    { id: "system", label: "System", Icon: Smartphone },
  ];

  const confirmLogout = () =>
    Alert.alert("Log out of GoSmart?", "You will go offline.", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: onLogout },
    ]);

  const support = () =>
    Alert.alert(
      "Help and support",
      "Call GoSmart driver support on +250 788 000 000, every day from 06:00 to 22:00.",
    );

  return (
    <View style={s.root}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <ScrollView
        style={s.flex}
        contentContainerStyle={[s.content, { paddingTop: insets.top + 12 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.title}>Account</Text>

        {/* Profile */}
        <View style={s.profile}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{driver.initials}</Text>
          </View>
          <View style={s.flex}>
            <Text style={s.name} numberOfLines={1}>
              {driver.name}
            </Text>
            <View style={s.ratingRow}>
              <Star size={14} strokeWidth={0} fill="#FFFFFF" color="#FFFFFF" />
              <Text style={s.meta}>
                {driver.rating.toFixed(2)} • {driver.trips.toLocaleString()} trips
              </Text>
            </View>
            <Text style={s.meta}>Driving since {driver.since}</Text>
          </View>
        </View>

        {/* Vehicle */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Vehicle</Text>
          <View style={s.vehicleRow}>
            <View style={s.flex}>
              <Text style={s.vehicleName}>{driver.vehicle}</Text>
              <Text style={s.muted}>{KIND_LABEL[driver.kind]}</Text>
            </View>
            <View style={s.plate}>
              <Text style={s.plateText}>{driver.plate}</Text>
            </View>
          </View>
        </View>

        {/* Documents */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Documents</Text>
          {DOCUMENTS.map((d, i) => (
            <View
              key={d.label}
              style={[s.docRow, i < DOCUMENTS.length - 1 && s.docLine]}
            >
              <Text style={s.docLabel}>{d.label}</Text>
              <View style={[s.chip, d.ok ? s.chipOk : s.chipWarn]}>
                <Text style={[s.chipText, d.ok ? s.chipTextOk : s.chipTextWarn]}>
                  {d.status}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Preferences */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Preferences</Text>
          <View style={s.switchRow}>
            <View style={s.flex}>
              <Text style={s.docLabel}>Accept cash rides</Text>
              <Text style={s.muted}>Turn off to only get MoMo trips</Text>
            </View>
            <Switch
              value={acceptCash}
              onValueChange={onAcceptCash}
              trackColor={{ false: c.border, true: c.green }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={c.border}
              accessibilityLabel="Accept cash rides"
            />
          </View>

          <Text style={[s.docLabel, s.themeLabel]}>Appearance</Text>
          <View style={s.segment} accessibilityRole="radiogroup">
            {themes.map(({ id, label, Icon }) => {
              const on = themeMode === id;
              return (
                <Pressable
                  key={id}
                  onPress={() => setThemeMode(id)}
                  style={[s.segmentItem, on && s.segmentItemOn]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                >
                  <Icon size={16} strokeWidth={2.25} color={on ? c.ink : c.muted} />
                  <Text style={[s.segmentText, on && s.segmentTextOn]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Pressable
          onPress={support}
          style={({ pressed }) => [s.outlineBtn, pressed && s.pressed]}
          accessibilityRole="button"
        >
          <LifeBuoy size={18} strokeWidth={2.25} color={c.ink} />
          <Text style={s.outlineText}>Help and support</Text>
        </Pressable>

        <Pressable
          onPress={confirmLogout}
          style={({ pressed }) => [s.outlineBtn, pressed && s.pressed]}
          accessibilityRole="button"
        >
          <LogOut size={18} strokeWidth={2.25} color={c.red} />
          <Text style={[s.outlineText, { color: c.red }]}>Log out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    flex: { flex: 1 },
    pressed: { opacity: 0.8 },
    muted: { fontSize: 13, color: c.muted, marginTop: 2 },

    content: { paddingHorizontal: PAD, paddingBottom: 28, gap: 14 },
    title: { fontSize: 32, fontWeight: "800", color: c.ink },

    profile: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      backgroundColor: c.hero,
      borderRadius: 28,
      padding: 20,
    },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: c.green,
      borderWidth: 3,
      borderColor: "rgba(255,255,255,0.25)",
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: { color: "#FFFFFF", fontSize: 26, fontWeight: "800" },
    name: { color: c.onHero, fontSize: 20, fontWeight: "800" },
    ratingRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
    meta: { color: c.mutedOnHero, fontSize: 13, marginTop: 2 },

    card: {
      backgroundColor: c.card,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: c.border,
      padding: 18,
    },
    cardTitle: { fontSize: 17, fontWeight: "800", color: c.ink, marginBottom: 8 },

    vehicleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    vehicleName: { fontSize: 16, fontWeight: "800", color: c.ink },
    plate: {
      backgroundColor: "#FFFFFF",
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderWidth: 2,
      borderColor: "#C9CFDC",
    },
    plateText: { color: "#060E22", fontSize: 15, fontWeight: "800", letterSpacing: 1 },

    docRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      gap: 12,
    },
    docLine: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
    docLabel: { fontSize: 15, fontWeight: "700", color: c.ink },
    chip: { borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5 },
    chipOk: { backgroundColor: c.greenSoft },
    chipWarn: { backgroundColor: c.soft, borderWidth: 1, borderColor: c.amber },
    chipText: { fontSize: 12, fontWeight: "800" },
    chipTextOk: { color: c.greenInk },
    chipTextWarn: { color: c.ink },

    switchRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
    themeLabel: { marginTop: 14, marginBottom: 10 },
    segment: {
      flexDirection: "row",
      backgroundColor: c.soft,
      borderRadius: 20,
      padding: 4,
    },
    segmentItem: {
      flex: 1,
      height: 42,
      borderRadius: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    segmentItemOn: { backgroundColor: c.card },
    segmentText: { fontSize: 13, fontWeight: "700", color: c.muted },
    segmentTextOn: { color: c.ink, fontWeight: "800" },

    outlineBtn: {
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
    outlineText: { fontSize: 16, fontWeight: "800", color: c.ink },
  });
