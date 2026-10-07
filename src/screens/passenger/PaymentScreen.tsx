import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft, Banknote, Check, Trash2 } from "lucide-react-native";
import {
  describeMethod,
  normalizePhone,
  useAppSettings,
} from "../../context/AppSettings";
import type { Palette, PaymentMethod } from "../../context/AppSettings";

interface Props {
  onBack: () => void;
}

const PAD = 20;

// Badge colours for each wallet (the same in light and dark mode)
const BADGE: Record<string, { bg: string; fg: string; text: string }> = {
  mtn: { bg: "#FCD34D", fg: "#111F3F", text: "Mo" },
  airtel: { bg: "#FDE4E6", fg: "#D92D3A", text: "Ai" },
};

export default function PaymentScreen({ onBack }: Props) {
  const insets = useSafeAreaInsets();
  const {
    palette: c,
    isDark,
    t,
    methods,
    selectedMethodId,
    setSelectedMethodId,
    addMethod,
    removeMethod,
  } = useAppSettings();
  const s = useMemo(() => makeStyles(c), [c]);

  const [draftId, setDraftId] = useState(selectedMethodId);
  const [adding, setAdding] = useState(false);
  const [provider, setProvider] = useState<"mtn" | "airtel">("mtn");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  const closeSheet = () => {
    setAdding(false);
    setPhone("");
    setError(null);
  };

  const submitNumber = () => {
    const number = normalizePhone(phone);
    if (!number) return setError(t("invalid_phone"));
    const prefixes = provider === "mtn" ? ["078", "079"] : ["072", "073"];
    if (!prefixes.includes(number.slice(0, 3))) {
      return setError(
        provider === "mtn" ? t("wrong_prefix_mtn") : t("wrong_prefix_airtel"),
      );
    }
    if (methods.some((m) => m.number === number)) return setError(t("exists"));
    const id = addMethod(provider, number);
    setDraftId(id);
    closeSheet();
  };

  const confirmRemove = (m: PaymentMethod) =>
    Alert.alert(t("remove_q"), describeMethod(m, t("cash")).title, [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("remove"),
        style: "destructive",
        onPress: () => {
          removeMethod(m.id);
          if (draftId === m.id) setDraftId("cash");
        },
      },
    ]);

  const save = () => {
    setSelectedMethodId(draftId);
    onBack();
  };

  const bottomPad = Math.max(insets.bottom, 16);

  return (
    <View style={s.root}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={onBack}
          style={s.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
        >
          <ArrowLeft size={20} strokeWidth={2.25} color={c.ink} />
        </Pressable>
      </View>

      <ScrollView
        style={s.flex}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.title}>{t("payment")}</Text>
        <Text style={s.subtitle}>{t("payment_sub")}</Text>

        <View style={s.list}>
          {methods.map((m) => {
            const info = describeMethod(m, t("cash"));
            const active = m.id === draftId;
            const isDefault = m.id === selectedMethodId;
            const badge = BADGE[m.kind];
            const sub =
              m.kind === "cash"
                ? t("pay_driver")
                : `${isDefault ? `${t("default")} • ` : ""}${
                    m.kind === "mtn" ? t("instant_debit") : t("mobile_money")
                  }`;

            return (
              <Pressable
                key={m.id}
                onPress={() => setDraftId(m.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                style={[s.method, active && s.methodActive]}
              >
                <View
                  style={[
                    s.badge,
                    { backgroundColor: badge ? badge.bg : c.greenSoft },
                  ]}
                >
                  {badge ? (
                    <Text style={[s.badgeText, { color: badge.fg }]}>
                      {badge.text}
                    </Text>
                  ) : (
                    <Banknote size={24} strokeWidth={2} color={c.greenInk} />
                  )}
                </View>

                <View style={s.flex}>
                  <Text
                    style={[s.methodTitle, active && s.onHero]}
                    numberOfLines={1}
                  >
                    {info.title}
                    {info.masked ? ` ${info.masked}` : ""}
                  </Text>
                  <Text
                    style={[s.methodSub, active && s.subOnHero]}
                    numberOfLines={1}
                  >
                    {sub}
                  </Text>
                </View>

                {m.custom && (
                  <Pressable
                    onPress={() => confirmRemove(m)}
                    hitSlop={10}
                    style={s.trash}
                    accessibilityRole="button"
                    accessibilityLabel={`${t("remove")} ${info.title}`}
                  >
                    <Trash2
                      size={18}
                      strokeWidth={2}
                      color={active ? c.mutedOnHero : c.muted}
                    />
                  </Pressable>
                )}

                <View style={[s.radio, active && s.radioActive]}>
                  {active && (
                    <Check size={14} strokeWidth={3.5} color="#FFFFFF" />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={() => setAdding(true)}
          style={s.addBtn}
          accessibilityRole="button"
        >
          <Text style={s.addText}>{t("add_momo")}</Text>
        </Pressable>
      </ScrollView>

      <View style={[s.footer, { paddingBottom: bottomPad }]}>
        <Pressable
          onPress={save}
          style={({ pressed }) => [s.cta, pressed && s.ctaPressed]}
          accessibilityRole="button"
        >
          <Text style={s.ctaText}>{t("save_payment")}</Text>
        </Pressable>
      </View>

      {/* Add number sheet */}
      <Modal
        visible={adding}
        transparent
        animationType="slide"
        onRequestClose={closeSheet}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={s.modalWrap}
        >
          <Pressable style={s.scrim} onPress={closeSheet} />
          <View style={[s.sheet, { paddingBottom: bottomPad }]}>
            <View style={s.handle} />
            <Text style={s.sheetTitle}>{t("new_number")}</Text>

            <Text style={s.label}>{t("provider")}</Text>
            <View style={s.providers}>
              {(["mtn", "airtel"] as const).map((p) => {
                const on = provider === p;
                return (
                  <Pressable
                    key={p}
                    onPress={() => {
                      setProvider(p);
                      setError(null);
                    }}
                    style={[s.providerChip, on && s.providerChipOn]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on }}
                  >
                    <Text style={[s.providerText, on && s.onHero]}>
                      {p === "mtn" ? "MTN MoMo" : "Airtel Money"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={s.label}>{t("phone_number")}</Text>
            <TextInput
              value={phone}
              onChangeText={(v) => {
                setPhone(v);
                setError(null);
              }}
              placeholder="078 123 4567"
              placeholderTextColor={c.muted}
              keyboardType="phone-pad"
              maxLength={16}
              style={[s.input, !!error && s.inputError]}
              autoFocus
            />
            {!!error && <Text style={s.error}>{error}</Text>}

            <View style={s.sheetButtons}>
              <Pressable
                onPress={closeSheet}
                style={[s.sheetBtn, s.sheetBtnGhost]}
                accessibilityRole="button"
              >
                <Text style={s.sheetBtnGhostText}>{t("cancel")}</Text>
              </Pressable>
              <Pressable
                onPress={submitNumber}
                style={[s.sheetBtn, s.sheetBtnPrimary]}
                accessibilityRole="button"
              >
                <Text style={s.sheetBtnPrimaryText}>{t("add_number")}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    flex: { flex: 1 },
    onHero: { color: c.onHero },
    subOnHero: { color: c.mutedOnHero },

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

    content: { paddingHorizontal: PAD, paddingTop: 12, paddingBottom: 24 },
    title: { fontSize: 32, fontWeight: "800", color: c.ink },
    subtitle: { fontSize: 15, color: c.muted, marginTop: 6, marginBottom: 22 },

    list: { gap: 12 },
    method: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.card,
      borderRadius: 28,
      borderWidth: 1.5,
      borderColor: c.border,
      paddingVertical: 18,
      paddingHorizontal: 18,
    },
    methodActive: { backgroundColor: c.hero, borderColor: c.hero },
    badge: {
      width: 54,
      height: 54,
      borderRadius: 27,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 16,
    },
    badgeText: { fontSize: 18, fontWeight: "800" },
    methodTitle: { fontSize: 17, fontWeight: "800", color: c.ink },
    methodSub: { fontSize: 13, color: c.muted, marginTop: 3 },
    trash: { padding: 6, marginRight: 6 },
    radio: {
      width: 26,
      height: 26,
      borderRadius: 13,
      borderWidth: 2,
      borderColor: c.border,
      alignItems: "center",
      justifyContent: "center",
    },
    radioActive: { backgroundColor: c.green, borderColor: c.green },

    addBtn: {
      marginTop: 14,
      height: 58,
      borderRadius: 29,
      borderWidth: 1.5,
      borderStyle: "dashed",
      borderColor: c.border,
      backgroundColor: c.card,
      alignItems: "center",
      justifyContent: "center",
    },
    addText: { fontSize: 16, fontWeight: "800", color: c.ink },

    footer: {
      paddingHorizontal: PAD,
      paddingTop: 10,
      backgroundColor: c.bg,
    },
    cta: {
      height: 62,
      borderRadius: 31,
      backgroundColor: c.green,
      alignItems: "center",
      justifyContent: "center",
    },
    ctaPressed: { opacity: 0.85 },
    ctaText: { color: "#FFFFFF", fontSize: 18, fontWeight: "800" },

    // Add-number sheet
    modalWrap: { flex: 1, justifyContent: "flex-end" },
    scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: c.scrim },
    sheet: {
      backgroundColor: c.card,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      paddingHorizontal: PAD,
      paddingTop: 10,
    },
    handle: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.border,
      marginBottom: 18,
    },
    sheetTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: c.ink,
      marginBottom: 18,
    },
    label: { fontSize: 13, fontWeight: "700", color: c.muted, marginBottom: 8 },
    providers: { flexDirection: "row", gap: 10, marginBottom: 18 },
    providerChip: {
      flex: 1,
      height: 48,
      borderRadius: 24,
      backgroundColor: c.soft,
      alignItems: "center",
      justifyContent: "center",
    },
    providerChipOn: { backgroundColor: c.hero },
    providerText: { fontSize: 14, fontWeight: "800", color: c.ink },
    input: {
      height: 54,
      borderRadius: 18,
      backgroundColor: c.inputBg,
      borderWidth: 1.5,
      borderColor: c.border,
      paddingHorizontal: 16,
      fontSize: 17,
      fontWeight: "600",
      color: c.ink,
    },
    inputError: { borderColor: c.red },
    error: { color: c.red, fontSize: 13, marginTop: 8 },
    sheetButtons: { flexDirection: "row", gap: 10, marginTop: 22 },
    sheetBtn: {
      flex: 1,
      height: 54,
      borderRadius: 27,
      alignItems: "center",
      justifyContent: "center",
    },
    sheetBtnGhost: { borderWidth: 1.5, borderColor: c.border },
    sheetBtnGhostText: { color: c.ink, fontSize: 16, fontWeight: "800" },
    sheetBtnPrimary: { backgroundColor: c.green },
    sheetBtnPrimaryText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  });
