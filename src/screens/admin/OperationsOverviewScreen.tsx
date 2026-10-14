import React from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  Activity,
  ArrowDownToLine,
  CarFront,
  Clock3,
  Wallet,
} from "lucide-react-native";

const COLORS = {
  navy: "#0B1D3A",
  green: "#05B887",
  greenInk: "#07845F",
  background: "#EEF1F6",
  white: "#FFFFFF",
  text: "#10213F",
  muted: "#71809A",
  border: "#DDE4EF",
};

const METRICS = [
  { label: "Active rides", value: "1,284", change: "+12%", icon: Activity },
  { label: "Online vehicles", value: "342", change: "+8%", icon: CarFront },
  { label: "Average ETA", value: "4.2 min", change: "-0.6 min", icon: Clock3 },
  { label: "Revenue today", value: "RWF 8.4M", change: "+18%", icon: Wallet },
];

const REVENUE = [
  { day: "M", height: 52 },
  { day: "T", height: 68 },
  { day: "W", height: 58 },
  { day: "T", height: 83 },
  { day: "F", height: 96 },
  { day: "S", height: 77 },
  { day: "S", height: 108 },
];

export default function OperationsOverviewScreen() {
  const { width } = useWindowDimensions();
  const isCompact = width < 760;

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.pageContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, isCompact && styles.headerCompact]}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Operations overview</Text>
          <Text style={styles.subtitle}>Kigali · Tuesday 14:32 CAT · All systems live</Text>
        </View>
        <Pressable
          onPress={() => Alert.alert("Report ready", "A report export can be connected to your analytics API.")}
          style={styles.exportButton}
          accessibilityRole="button"
        >
          <ArrowDownToLine size={15} color={COLORS.white} />
          <Text style={styles.exportText}>Export report</Text>
        </Pressable>
      </View>

      <View style={styles.metrics}>
        {METRICS.map(({ label, value, change, icon: Icon }) => (
          <View key={label} style={styles.metricCard}>
            <View style={styles.metricHead}>
              <Text style={styles.metricLabel}>{label}</Text>
              <View style={styles.metricIcon}>
                <Icon size={17} color={COLORS.navy} />
              </View>
            </View>
            <Text style={styles.metricValue}>{value}</Text>
            <Text style={styles.metricChange}>{change} <Text style={styles.changeContext}>vs yesterday</Text></Text>
          </View>
        ))}
      </View>

      <View style={[styles.panels, isCompact && styles.panelsCompact]}>
        <View style={[styles.chartCard, isCompact && styles.fullWidth]}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Weekly revenue</Text>
              <Text style={styles.cardSubtitle}>Gross bookings · RWF</Text>
            </View>
            <Text style={styles.periodBadge}>This week</Text>
          </View>
          <View style={styles.chart}>
            {REVENUE.map(({ day, height }, index) => (
              <View key={`${day}-${index}`} style={styles.barColumn}>
                <View
                  style={[
                    styles.bar,
                    { height },
                    index === REVENUE.length - 1 && styles.barToday,
                  ]}
                />
                <Text style={styles.barLabel}>{day}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.demandCard, isCompact && styles.fullWidth]}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.demandTitle}>Demand snapshot</Text>
              <Text style={styles.demandSubtitle}>Peak activity · Kigali</Text>
            </View>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live</Text>
            </View>
          </View>
          <DemandBar label="Moto demand" value={78} />
          <DemandBar label="Car demand" value={54} />
          <View style={styles.demandNote}>
            <Text style={styles.demandNoteText}>Remera is currently the busiest zone.</Text>
          </View>
        </View>
      </View>

      <View style={styles.footerNote}>
        <Text style={styles.footerText}>Metrics shown are sample admin preview data.</Text>
      </View>
    </ScrollView>
  );
}

function DemandBar({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.demandBarGroup}>
      <View style={styles.demandLabels}>
        <Text style={styles.demandLabel}>{label}</Text>
        <Text style={styles.demandPercent}>{value}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${value}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  pageContent: {
    paddingHorizontal: 26,
    paddingTop: 27,
    paddingBottom: 34,
    width: "100%",
    maxWidth: 1500,
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 15,
    marginBottom: 22,
  },
  headerCompact: { alignItems: "flex-start", flexDirection: "column" },
  headerCopy: { flex: 1 },
  title: { fontSize: 27, fontWeight: "800", letterSpacing: -0.6, color: COLORS.text },
  subtitle: { fontSize: 12, color: COLORS.muted, marginTop: 4 },
  exportButton: {
    borderRadius: 22,
    backgroundColor: COLORS.navy,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  exportText: { color: COLORS.white, fontSize: 11, fontWeight: "800" },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: 13 },
  metricCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 15,
    padding: 17,
  },
  metricHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  metricLabel: { color: COLORS.muted, fontSize: 11, fontWeight: "600" },
  metricIcon: {
    width: 31,
    height: 31,
    borderRadius: 10,
    backgroundColor: "#F1F4F8",
    alignItems: "center",
    justifyContent: "center",
  },
  metricValue: { color: COLORS.text, fontSize: 23, fontWeight: "800", marginTop: 12 },
  metricChange: { color: COLORS.greenInk, fontSize: 10, fontWeight: "800", marginTop: 4 },
  changeContext: { color: COLORS.muted, fontWeight: "500" },
  panels: { flexDirection: "row", alignItems: "stretch", gap: 14, marginTop: 14 },
  panelsCompact: { flexDirection: "column" },
  chartCard: {
    flex: 1.9,
    minWidth: 0,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 19,
  },
  fullWidth: { width: "100%", flex: undefined },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  cardTitle: { color: COLORS.text, fontSize: 14, fontWeight: "800" },
  cardSubtitle: { color: COLORS.muted, fontSize: 10, marginTop: 4 },
  periodBadge: {
    color: COLORS.muted,
    backgroundColor: "#F0F3F8",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 14,
    fontSize: 9,
    fontWeight: "700",
  },
  chart: {
    minHeight: 190,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
    paddingTop: 24,
    paddingHorizontal: 2,
  },
  barColumn: { flex: 1, alignItems: "center", justifyContent: "flex-end", gap: 7 },
  bar: { width: "100%", maxWidth: 68, borderRadius: 13, backgroundColor: COLORS.navy },
  barToday: { backgroundColor: COLORS.green },
  barLabel: { color: COLORS.muted, fontSize: 9, fontWeight: "600" },
  demandCard: {
    flex: 1,
    minWidth: 230,
    borderRadius: 16,
    backgroundColor: COLORS.navy,
    padding: 19,
  },
  demandTitle: { color: COLORS.white, fontSize: 14, fontWeight: "800" },
  demandSubtitle: { color: "#A9B7CC", fontSize: 10, marginTop: 4 },
  liveBadge: {
    backgroundColor: "#103C3A",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 13,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.green },
  liveText: { color: "#8AE3C5", fontSize: 9, fontWeight: "800" },
  demandBarGroup: { marginTop: 23 },
  demandLabels: { flexDirection: "row", justifyContent: "space-between", marginBottom: 7 },
  demandLabel: { color: "#E1E7EF", fontSize: 10 },
  demandPercent: { color: COLORS.white, fontSize: 10, fontWeight: "700" },
  track: { height: 7, backgroundColor: "#253B5D", borderRadius: 5, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: COLORS.green, borderRadius: 5 },
  demandNote: { borderTopWidth: 1, borderTopColor: "#263B5B", marginTop: 24, paddingTop: 12 },
  demandNoteText: { color: "#A9B7CC", fontSize: 10 },
  footerNote: { paddingTop: 17 },
  footerText: { color: COLORS.muted, fontSize: 10 },
});
