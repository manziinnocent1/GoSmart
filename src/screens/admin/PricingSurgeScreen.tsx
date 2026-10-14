import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { Check, MapPin, Zap } from "lucide-react-native";

const COLORS = {
  navy: "#0B1D3A",
  navySoft: "#172D50",
  green: "#05B887",
  background: "#EEF1F6",
  white: "#FFFFFF",
  text: "#10213F",
  muted: "#71809A",
  border: "#DDE4EF",
  orange: "#F59B19",
  red: "#F04F63",
};

type Tier = { name: string; perKm: string; base: string; enabled: boolean };

export default function PricingSurgeScreen() {
  const { width } = useWindowDimensions();
  const isCompact = width < 900;
  const [tiers, setTiers] = useState<Tier[]>([
    { name: "Moto", perKm: "400", base: "500", enabled: true },
    { name: "Car", perKm: "800", base: "1,200", enabled: true },
    { name: "XL", perKm: "1,200", base: "2,000", enabled: true },
  ]);
  const [multiplier, setMultiplier] = useState("1.2x");
  const [published, setPublished] = useState(false);

  const updateTier = (index: number, key: "perKm" | "base", value: string) => {
    setTiers((current) =>
      current.map((tier, tierIndex) =>
        tierIndex === index ? { ...tier, [key]: value } : tier,
      ),
    );
  };

  const publish = () => {
    setPublished(true);
    Alert.alert(
      "Preview updated",
      "The fare changes are saved in this local admin preview only.",
    );
  };

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.pageContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Fare & surge</Text>
          <Text style={styles.subtitle}>Base fares per km in RWF · Preview-only controls</Text>
        </View>
        {published && (
          <View style={styles.publishedBadge}>
            <Check size={13} color="#07845F" />
            <Text style={styles.publishedText}>Saved in preview</Text>
          </View>
        )}
      </View>

      <View style={[styles.layout, isCompact && styles.layoutCompact]}>
        <View style={[styles.fareColumn, isCompact && styles.fullWidth]}>
          {tiers.map((tier, index) => (
            <View
              key={tier.name}
              style={[styles.tierCard, index === 0 && styles.featuredTier]}
            >
              <View style={styles.tierHeader}>
                <View>
                  <Text style={[styles.tierName, index === 0 && styles.lightText]}>
                    {tier.name}
                  </Text>
                  <Text style={[styles.tierType, index === 0 && styles.lightMuted]}>
                    {tier.name === "Moto" ? "Two-wheeler" : tier.name === "Car" ? "Standard car" : "Premium vehicle"}
                  </Text>
                </View>
                <Switch
                  value={tier.enabled}
                  onValueChange={(enabled) =>
                    setTiers((current) =>
                      current.map((item, i) => (i === index ? { ...item, enabled } : item)),
                    )
                  }
                  trackColor={{ false: "#D8DFE9", true: COLORS.green }}
                  thumbColor={COLORS.white}
                  accessibilityLabel={`${tier.name} fares enabled`}
                />
              </View>
              <View style={styles.inputRow}>
                <FareInput
                  label="Rate per km"
                  value={tier.perKm}
                  onChangeText={(value) => updateTier(index, "perKm", value)}
                  dark={index === 0}
                />
                <FareInput
                  label="Base fare"
                  value={tier.base}
                  onChangeText={(value) => updateTier(index, "base", value)}
                  dark={index === 0}
                />
              </View>
            </View>
          ))}

          <View style={styles.multiplierCard}>
            <Text style={styles.multiplierTitle}>Surge multiplier</Text>
            <Text style={styles.multiplierHint}>Select the active default for newly created zones.</Text>
            <View style={styles.multiplierOptions}>
              {["1.0x", "1.2x", "1.5x", "2.0x"].map((option) => (
                <Pressable
                  key={option}
                  onPress={() => setMultiplier(option)}
                  style={[
                    styles.multiplierOption,
                    multiplier === option && styles.multiplierSelected,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: multiplier === option }}
                >
                  <Text
                    style={[
                      styles.multiplierText,
                      multiplier === option && styles.multiplierTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              onPress={publish}
              style={styles.publishButton}
              accessibilityRole="button"
            >
              <Text style={styles.publishText}>Publish fares</Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.zonesPanel, isCompact && styles.fullWidth]}>
          <View style={styles.zonesHeader}>
            <View>
              <Text style={styles.zonesTitle}>Surge zones — Kigali</Text>
              <Text style={styles.zonesSubtitle}>Active demand multipliers</Text>
            </View>
            <View style={styles.activePill}>
              <Zap size={12} color={COLORS.white} fill={COLORS.white} />
              <Text style={styles.activeText}>2 active</Text>
            </View>
          </View>
          <View style={styles.map}>
            <View style={styles.mapRoadVertical} />
            <View style={styles.mapRoadHorizontal} />
            <View style={[styles.zone, styles.zoneRemera]}>
              <View style={[styles.zoneTag, styles.zoneTagRed]}>
                <MapPin size={11} color={COLORS.white} />
                <Text style={styles.zoneTagText}>Remera · 1.5x</Text>
              </View>
            </View>
            <View style={[styles.zone, styles.zoneDowntown]}>
              <View style={[styles.zoneTag, styles.zoneTagOrange]}>
                <MapPin size={11} color={COLORS.white} />
                <Text style={styles.zoneTagText}>Downtown · 1.2x</Text>
              </View>
            </View>
            <View style={styles.zoneBase}>
              <MapPin size={11} color={COLORS.navy} />
              <Text style={styles.zoneBaseText}>Kacyiru · 1.0x</Text>
            </View>
          </View>
        </View>
      </View>
      <Text style={styles.disclaimer}>
        Sample pricing only. Connect the publish action to your pricing service before using in production.
      </Text>
    </ScrollView>
  );
}

function FareInput({
  label,
  value,
  onChangeText,
  dark,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  dark: boolean;
}) {
  return (
    <View style={[styles.fareInputWrap, dark && styles.fareInputDark]}>
      <Text style={[styles.fareInputLabel, dark && styles.lightMuted]}>{label}</Text>
      <View style={styles.fareInputValue}>
        <Text style={[styles.currency, dark && styles.lightText]}>RWF</Text>
        <TextInput
          value={value}
          onChangeText={(text) => onChangeText(text.replace(/[^\d,]/g, ""))}
          keyboardType="numeric"
          style={[styles.fareInput, dark && styles.lightText]}
          accessibilityLabel={label}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  pageContent: { paddingHorizontal: 26, paddingTop: 27, paddingBottom: 34, width: "100%", maxWidth: 1500, alignSelf: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 20 },
  title: { color: COLORS.text, fontSize: 27, fontWeight: "800", letterSpacing: -0.6 },
  subtitle: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
  publishedBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#DDF5EA", paddingHorizontal: 10, paddingVertical: 7, borderRadius: 16 },
  publishedText: { color: "#07845F", fontSize: 9, fontWeight: "800" },
  layout: { flexDirection: "row", alignItems: "stretch", gap: 16 },
  layoutCompact: { flexDirection: "column" },
  fareColumn: { flex: 1, gap: 11 },
  fullWidth: { width: "100%", flex: undefined },
  tierCard: { borderRadius: 15, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white, padding: 15 },
  featuredTier: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  tierHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 11 },
  tierName: { color: COLORS.text, fontSize: 13, fontWeight: "800" },
  tierType: { color: COLORS.muted, fontSize: 9, marginTop: 3 },
  lightText: { color: COLORS.white },
  lightMuted: { color: "#9BAAC1" },
  inputRow: { flexDirection: "row", gap: 9 },
  fareInputWrap: { flex: 1, minWidth: 0, backgroundColor: "#F0F3F8", borderRadius: 10, paddingHorizontal: 11, paddingVertical: 7, borderWidth: 1, borderColor: "#E2E8F0" },
  fareInputDark: { backgroundColor: "#203656", borderColor: "#203656" },
  fareInputLabel: { color: COLORS.muted, fontSize: 8, fontWeight: "700" },
  fareInputValue: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  currency: { color: COLORS.text, fontSize: 9, fontWeight: "700" },
  fareInput: { flex: 1, minWidth: 20, padding: 0, color: COLORS.text, fontSize: 11, fontWeight: "700", outlineStyle: "none" } as any,
  multiplierCard: { borderRadius: 15, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white, padding: 15, marginTop: 2 },
  multiplierTitle: { color: COLORS.text, fontSize: 12, fontWeight: "800" },
  multiplierHint: { color: COLORS.muted, fontSize: 9, marginTop: 4 },
  multiplierOptions: { flexDirection: "row", gap: 7, marginTop: 13 },
  multiplierOption: { flex: 1, alignItems: "center", borderRadius: 18, paddingVertical: 9, backgroundColor: "#E7ECF4" },
  multiplierSelected: { backgroundColor: COLORS.orange },
  multiplierText: { color: COLORS.text, fontSize: 10, fontWeight: "800" },
  multiplierTextSelected: { color: COLORS.white },
  publishButton: { alignItems: "center", borderRadius: 22, paddingVertical: 11, backgroundColor: COLORS.green, marginTop: 12 },
  publishText: { color: COLORS.white, fontSize: 11, fontWeight: "800" },
  zonesPanel: { flex: 1.05, minWidth: 280, backgroundColor: COLORS.navy, borderRadius: 16, padding: 14 },
  zonesHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 13 },
  zonesTitle: { color: COLORS.white, fontSize: 13, fontWeight: "800" },
  zonesSubtitle: { color: "#A2B0C6", fontSize: 9, marginTop: 4 },
  activePill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: COLORS.green, borderRadius: 15, paddingHorizontal: 8, paddingVertical: 6 },
  activeText: { color: COLORS.white, fontSize: 9, fontWeight: "800" },
  map: { flex: 1, minHeight: 390, overflow: "hidden", borderRadius: 12, backgroundColor: "#172E51", position: "relative" },
  mapRoadVertical: { position: "absolute", top: 0, bottom: 0, left: "50%", width: 1, backgroundColor: "rgba(255,255,255,0.06)" },
  mapRoadHorizontal: { position: "absolute", left: "8%", right: "8%", top: "50%", height: 1, backgroundColor: "rgba(255,255,255,0.06)" },
  zone: { position: "absolute", width: 112, height: 112, borderRadius: 60, alignItems: "center", justifyContent: "center" },
  zoneRemera: { left: "18%", top: "31%", backgroundColor: "rgba(240,79,99,0.34)", borderWidth: 1.5, borderColor: COLORS.red },
  zoneDowntown: { right: "16%", bottom: "16%", width: 94, height: 94, backgroundColor: "rgba(245,155,25,0.32)", borderWidth: 1.5, borderColor: COLORS.orange },
  zoneTag: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 7, paddingVertical: 5, borderRadius: 14 },
  zoneTagRed: { backgroundColor: "#A92F48" },
  zoneTagOrange: { backgroundColor: "#99600D" },
  zoneTagText: { color: COLORS.white, fontSize: 8, fontWeight: "800" },
  zoneBase: { position: "absolute", top: "16%", right: "35%", backgroundColor: COLORS.white, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 14 },
  zoneBaseText: { color: COLORS.navy, fontSize: 8, fontWeight: "800" },
  disclaimer: { color: COLORS.muted, fontSize: 10, lineHeight: 15, marginTop: 14 },
});
