import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Home, User, Wallet } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { useAppSettings } from "../../context/AppSettings";
import type { Palette } from "../../context/AppSettings";

export type DriverTab = "home" | "earnings" | "account";

interface Props {
  active: DriverTab;
  onChange: (tab: DriverTab) => void;
  /** Shows a green dot on Home while the driver is online. */
  online: boolean;
}

const TABS: { id: DriverTab; label: string; Icon: LucideIcon }[] = [
  { id: "home", label: "Home", Icon: Home },
  { id: "earnings", label: "Earnings", Icon: Wallet },
  { id: "account", label: "Account", Icon: User },
];

export default function DriverTabBar({ active, onChange, online }: Props) {
  const insets = useSafeAreaInsets();
  const { palette: c } = useAppSettings();
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
            accessibilityLabel={label}
          >
            <View style={[s.pill, on && s.pillOn]}>
              <Icon
                size={22}
                strokeWidth={on ? 2.5 : 2}
                color={on ? c.greenInk : c.muted}
              />
              {id === "home" && online && <View style={s.onlineDot} />}
            </View>
            <Text style={[s.label, on && s.labelOn]} numberOfLines={1}>
              {label}
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
    onlineDot: {
      position: "absolute",
      top: 3,
      right: 15,
      width: 11,
      height: 11,
      borderRadius: 6,
      backgroundColor: c.green,
      borderWidth: 2,
      borderColor: c.card,
    },
    label: { fontSize: 11, fontWeight: "700", color: c.muted },
    labelOn: { color: c.greenInk, fontWeight: "800" },
  });
