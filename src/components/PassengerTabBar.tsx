import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Car, Home, Navigation, Settings, User } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { useAppSettings } from "../context/AppSettings";
import type { Palette } from "../context/AppSettings";

export type TabId = "home" | "ride" | "trip" | "profile" | "settings";

interface Props {
  active: TabId;
  onChange: (id: TabId) => void;
  /** Shows a small dot on the My ride tab while a ride is booked. */
  tripBadge?: boolean;
}

const TABS: {
  id: TabId;
  label: "tab_home" | "tab_ride" | "tab_trip" | "tab_profile" | "tab_settings";
  Icon: LucideIcon;
}[] = [
  { id: "home", label: "tab_home", Icon: Home },
  { id: "ride", label: "tab_ride", Icon: Navigation },
  { id: "trip", label: "tab_trip", Icon: Car },
  { id: "profile", label: "tab_profile", Icon: User },
  { id: "settings", label: "tab_settings", Icon: Settings },
];

export default function PassengerTabBar({
  active,
  onChange,
  tripBadge,
}: Props) {
  const insets = useSafeAreaInsets();
  const { palette: c, t } = useAppSettings();
  const s = useMemo(() => makeStyles(c), [c]);

  return (
    <View
      style={[s.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}
      accessibilityRole="tablist"
    >
      {TABS.map(({ id, label, Icon }) => {
        const on = id === active;
        return (
          <Pressable
            key={id}
            onPress={() => !on && onChange(id)}
            style={s.item}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={t(label)}
          >
            <View style={[s.pill, on && s.pillOn]}>
              <Icon
                size={22}
                strokeWidth={on ? 2.5 : 2}
                color={on ? c.greenInk : c.muted}
              />
              {id === "trip" && !!tripBadge && <View style={s.badgeDot} />}
            </View>
            <Text
              style={[s.label, on && s.labelOn]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {t(label)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    bar: {
      flexDirection: "row",
      backgroundColor: c.card,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
      paddingTop: 8,
      paddingHorizontal: 8,
      shadowColor: "#0B1530",
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: -4 },
      elevation: 12,
    },
    item: { flex: 1, alignItems: "center", gap: 4 },
    pill: {
      width: 60,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    pillOn: { backgroundColor: c.greenSoft },
    badgeDot: {
      position: "absolute",
      top: 3,
      right: 15,
      width: 11,
      height: 11,
      borderRadius: 6,
      backgroundColor: c.amber,
      borderWidth: 2,
      borderColor: c.card,
    },
    label: { fontSize: 11, fontWeight: "700", color: c.muted },
    labelOn: { color: c.greenInk, fontWeight: "800" },
  });
