import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  ArrowLeft,
  Check,
  LogOut,
  Moon,
  Smartphone,
  Sun,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { normalizePhone, useAppSettings } from "../../context/AppSettings";
import type { Language, Palette, ThemeMode } from "../../context/AppSettings";

interface Props {
  /** Leave out when the screen is a tab root: the back button is hidden. */
  onBack?: () => void;
  onLogout: () => void;
}

const PAD = 20;

const LANGUAGES: { id: Language; label: string }[] = [
  { id: "rw", label: "Kinyarwanda" },
  { id: "en", label: "English" },
  { id: "fr", label: "Français" },
];

export default function SettingsScreen({ onBack, onLogout }: Props) {
  const insets = useSafeAreaInsets();
  const {
    palette: c,
    isDark,
    t,
    themeMode,
    setThemeMode,
    language,
    setLanguage,
    profile,
    setProfile,
  } = useAppSettings();
  const s = useMemo(() => makeStyles(c), [c]);

  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [email, setEmail] = useState(profile.email);
  const [errors, setErrors] = useState<{
    name?: string;
    phone?: string;
    email?: string;
  }>({});
  const [justSaved, setJustSaved] = useState(false);
  const [rideAlerts, setRideAlerts] = useState(true);
  const [promos, setPromos] = useState(false);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const dirty =
    name !== profile.name || phone !== profile.phone || email !== profile.email;

  const saveProfile = () => {
    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = t("err_name");
    const normalized = normalizePhone(phone);
    if (!normalized) next.phone = t("invalid_phone");
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      next.email = t("err_email");
    }
    setErrors(next);
    if (Object.keys(next).length > 0 || !normalized) return;

    const formatted = `+250 ${normalized.slice(1, 4)} ${normalized.slice(4, 7)} ${normalized.slice(7)}`;
    setProfile({ name: name.trim(), phone: formatted, email: email.trim() });
    setName(name.trim());
    setPhone(formatted);
    setEmail(email.trim());
    setJustSaved(true);
    timer.current = setTimeout(() => setJustSaved(false), 2000);
  };

  const confirmLogout = () =>
    Alert.alert(t("log_out_q"), undefined, [
      { text: t("cancel"), style: "cancel" },
      { text: t("log_out"), style: "destructive", onPress: onLogout },
    ]);

  const themes: { id: ThemeMode; label: string; Icon: LucideIcon }[] = [
    { id: "light", label: t("light"), Icon: Sun },
    { id: "dark", label: t("dark"), Icon: Moon },
    { id: "system", label: t("system"), Icon: Smartphone },
  ];

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style={isDark ? "light" : "dark"} />

      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        {onBack && (
          <Pressable
            onPress={onBack}
            style={s.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
          >
            <ArrowLeft size={20} strokeWidth={2.25} color={c.ink} />
          </Pressable>
        )}
      </View>

      <ScrollView
        style={s.flex}
        contentContainerStyle={[
          s.content,
          { paddingBottom: Math.max(insets.bottom, 16) + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.title}>{t("settings")}</Text>

        {/* Theme */}
        <View style={s.card}>
          <Text style={s.cardTitle}>{t("theme_mode")}</Text>
          <Text style={s.cardSub}>{t("theme_sub")}</Text>
          <View style={s.segment} accessibilityRole="radiogroup">
            {themes.map(({ id, label, Icon }) => {
              const active = themeMode === id;
              return (
                <Pressable
                  key={id}
                  onPress={() => setThemeMode(id)}
                  style={[s.segmentItem, active && s.segmentItemActive]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                >
                  <Icon
                    size={16}
                    strokeWidth={2.25}
                    color={active ? c.ink : c.muted}
                  />
                  <Text style={[s.segmentText, active && s.segmentTextActive]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Language */}
        <View style={s.card}>
          <Text style={[s.cardTitle, s.cardTitleSpaced]}>{t("language")}</Text>
          {LANGUAGES.map((lang, i) => {
            const active = language === lang.id;
            return (
              <Pressable
                key={lang.id}
                onPress={() => setLanguage(lang.id)}
                style={[s.langRow, i < LANGUAGES.length - 1 && s.line]}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
              >
                <Text style={[s.langText, active && s.langTextActive]}>
                  {lang.label}
                </Text>
                {active && <Check size={20} strokeWidth={3} color={c.green} />}
              </Pressable>
            );
          })}
        </View>

        {/* Profile */}
        <View style={s.card}>
          <Text style={[s.cardTitle, s.cardTitleSpaced]}>
            {t("profile_info")}
          </Text>

          <Text style={s.label}>{t("full_name")}</Text>
          <TextInput
            value={name}
            onChangeText={(v) => {
              setName(v);
              setErrors((e) => ({ ...e, name: undefined }));
            }}
            style={[s.input, !!errors.name && s.inputError]}
            placeholderTextColor={c.muted}
            autoCapitalize="words"
            autoComplete="name"
          />
          {!!errors.name && <Text style={s.error}>{errors.name}</Text>}

          <Text style={[s.label, s.labelSpaced]}>{t("phone")}</Text>
          <TextInput
            value={phone}
            onChangeText={(v) => {
              setPhone(v);
              setErrors((e) => ({ ...e, phone: undefined }));
            }}
            style={[s.input, !!errors.phone && s.inputError]}
            placeholderTextColor={c.muted}
            keyboardType="phone-pad"
            autoComplete="tel"
          />
          {!!errors.phone && <Text style={s.error}>{errors.phone}</Text>}

          <Text style={[s.label, s.labelSpaced]}>{t("email")}</Text>
          <TextInput
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              setErrors((e) => ({ ...e, email: undefined }));
            }}
            style={[s.input, !!errors.email && s.inputError]}
            placeholderTextColor={c.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          {!!errors.email && <Text style={s.error}>{errors.email}</Text>}

          <Pressable
            onPress={saveProfile}
            disabled={!dirty}
            style={({ pressed }) => [
              s.saveBtn,
              !dirty && !justSaved && s.saveBtnOff,
              pressed && s.pressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ disabled: !dirty }}
          >
            {justSaved ? (
              <View style={s.savedRow}>
                <Check size={18} strokeWidth={3} color="#FFFFFF" />
                <Text style={s.saveText}>{t("saved")}</Text>
              </View>
            ) : (
              <Text style={s.saveText}>{t("save_changes")}</Text>
            )}
          </Pressable>
        </View>

        {/* Notifications */}
        <View style={s.card}>
          <Text style={[s.cardTitle, s.cardTitleSpaced]}>
            {t("notifications")}
          </Text>
          <View style={[s.switchRow, s.line]}>
            <View style={s.flex}>
              <Text style={s.langText}>{t("ride_updates")}</Text>
              <Text style={s.cardSub}>{t("ride_updates_sub")}</Text>
            </View>
            <Switch
              value={rideAlerts}
              onValueChange={setRideAlerts}
              trackColor={{ false: c.border, true: c.green }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={c.border}
            />
          </View>
          <View style={s.switchRow}>
            <View style={s.flex}>
              <Text style={s.langText}>{t("promotions")}</Text>
              <Text style={s.cardSub}>{t("promotions_sub")}</Text>
            </View>
            <Switch
              value={promos}
              onValueChange={setPromos}
              trackColor={{ false: c.border, true: c.green }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={c.border}
            />
          </View>
        </View>

        <Pressable
          onPress={confirmLogout}
          style={({ pressed }) => [s.logout, pressed && s.pressed]}
          accessibilityRole="button"
        >
          <LogOut size={18} strokeWidth={2.25} color={c.red} />
          <Text style={s.logoutText}>{t("log_out")}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    flex: { flex: 1 },
    pressed: { opacity: 0.8 },
    line: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },

    header: { paddingHorizontal: PAD, paddingBottom: 4 },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: "center",
      justifyContent: "center",
    },

    content: { paddingHorizontal: PAD, paddingTop: 12, gap: 14 },
    title: { fontSize: 32, fontWeight: "800", color: c.ink, marginBottom: 6 },

    card: {
      backgroundColor: c.card,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: c.border,
      padding: 20,
    },
    cardTitle: { fontSize: 17, fontWeight: "800", color: c.ink },
    cardTitleSpaced: { marginBottom: 12 },
    cardSub: { fontSize: 13, color: c.muted, marginTop: 3 },

    // Theme segmented control
    segment: {
      flexDirection: "row",
      backgroundColor: c.soft,
      borderRadius: 20,
      padding: 4,
      marginTop: 16,
    },
    segmentItem: {
      flex: 1,
      height: 44,
      borderRadius: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    segmentItemActive: {
      backgroundColor: c.card,
      shadowColor: "#0B1530",
      shadowOpacity: 0.12,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    segmentText: { fontSize: 14, fontWeight: "700", color: c.muted },
    segmentTextActive: { color: c.ink, fontWeight: "800" },

    // Language
    langRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 15,
    },
    langText: { fontSize: 16, fontWeight: "700", color: c.ink },
    langTextActive: { fontWeight: "800" },

    // Profile form
    label: { fontSize: 13, fontWeight: "700", color: c.muted, marginBottom: 7 },
    labelSpaced: { marginTop: 14 },
    input: {
      height: 52,
      borderRadius: 18,
      backgroundColor: c.inputBg,
      borderWidth: 1.5,
      borderColor: c.border,
      paddingHorizontal: 16,
      fontSize: 16,
      fontWeight: "600",
      color: c.ink,
    },
    inputError: { borderColor: c.red },
    error: { color: c.red, fontSize: 13, marginTop: 6 },
    saveBtn: {
      height: 54,
      borderRadius: 27,
      backgroundColor: c.green,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 20,
    },
    saveBtnOff: { opacity: 0.4 },
    saveText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
    savedRow: { flexDirection: "row", alignItems: "center", gap: 8 },

    // Notifications
    switchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 14,
    },

    logout: {
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
