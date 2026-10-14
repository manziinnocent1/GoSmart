import React, { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { Check, Eye, Search, ShieldCheck } from "lucide-react-native";

const COLORS = {
  navy: "#0B1D3A",
  green: "#05B887",
  greenInk: "#07845F",
  background: "#EEF1F6",
  white: "#FFFFFF",
  text: "#10213F",
  muted: "#71809A",
  border: "#DDE4EF",
  amber: "#E98A19",
  red: "#E64D61",
};

type DocumentState = "Verified" | "Pending" | "Expiring";
type Driver = {
  id: string;
  name: string;
  initials: string;
  vehicle: string;
  plate: string;
  license: DocumentState;
  nationalId: DocumentState;
  insurance: DocumentState;
  approved: boolean;
};

const STARTING_DRIVERS: Driver[] = [
  { id: "d1", name: "Jean-Paul N.", initials: "J", vehicle: "Moto", plate: "RAE 452 B", license: "Verified", nationalId: "Verified", insurance: "Expiring", approved: false },
  { id: "d2", name: "Eric H.", initials: "E", vehicle: "Car", plate: "RAD 881 A", license: "Verified", nationalId: "Pending", insurance: "Verified", approved: false },
  { id: "d3", name: "Claude M.", initials: "C", vehicle: "XL", plate: "RAF 203 C", license: "Pending", nationalId: "Verified", insurance: "Verified", approved: false },
  { id: "d4", name: "Diane K.", initials: "D", vehicle: "Moto", plate: "RAE 901 D", license: "Verified", nationalId: "Verified", insurance: "Verified", approved: false },
  { id: "d5", name: "Emmanuel R.", initials: "E", vehicle: "Car", plate: "RAC 329 F", license: "Verified", nationalId: "Verified", insurance: "Verified", approved: true },
];

type Filter = "Pending" | "Approved" | "All";

export default function DriverOnboardingScreen() {
  const { width } = useWindowDimensions();
  const isCompact = width < 760;
  const [drivers, setDrivers] = useState(STARTING_DRIVERS);
  const [filter, setFilter] = useState<Filter>("Pending");
  const [search, setSearch] = useState("");

  const visibleDrivers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return drivers.filter((driver) => {
      const matchesFilter =
        filter === "All" ||
        (filter === "Approved" ? driver.approved : !driver.approved);
      const matchesSearch =
        !query ||
        `${driver.name} ${driver.plate} ${driver.vehicle}`.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [drivers, filter, search]);

  const pendingCount = drivers.filter((driver) => !driver.approved).length;
  const allVerified = (driver: Driver) =>
    driver.license === "Verified" &&
    driver.nationalId === "Verified" &&
    driver.insurance === "Verified";

  const approveDriver = (id: string) => {
    setDrivers((current) =>
      current.map((driver) =>
        driver.id === id && allVerified(driver)
          ? { ...driver, approved: true }
          : driver,
      ),
    );
  };

  const approveAllVerified = () => {
    setDrivers((current) =>
      current.map((driver) =>
        allVerified(driver) ? { ...driver, approved: true } : driver,
      ),
    );
  };

  const showDriverDetails = (driver: Driver) =>
    Alert.alert(
      driver.name,
      `${driver.vehicle} · ${driver.plate}\nLicense: ${driver.license}\nNational ID: ${driver.nationalId}\nInsurance: ${driver.insurance}`,
    );

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.pageContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, isCompact && styles.headerCompact]}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Driver onboarding</Text>
          <Text style={styles.subtitle}>
            {pendingCount} pending · Licenses, national IDs, insurance
          </Text>
        </View>
        <Pressable
          onPress={approveAllVerified}
          style={styles.approveAll}
          accessibilityRole="button"
        >
          <Check size={15} color={COLORS.white} />
          <Text style={styles.approveAllText}>Approve verified</Text>
        </Pressable>
      </View>

      <View style={[styles.toolbar, isCompact && styles.toolbarCompact]}>
        <View style={styles.filters}>
          {(["Pending", "Approved", "All"] as Filter[]).map((item) => (
            <Pressable
              key={item}
              onPress={() => setFilter(item)}
              style={[styles.filterButton, filter === item && styles.filterActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: filter === item }}
            >
              <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>
                {item}
              </Text>
              {item === "Pending" && <Text style={[styles.filterCount, filter === item && styles.filterCountActive]}>{pendingCount}</Text>}
            </Pressable>
          ))}
        </View>
        <View style={styles.searchBox}>
          <Search size={15} color={COLORS.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search drivers or plates"
            placeholderTextColor="#8C99AD"
            style={styles.searchInput}
          />
        </View>
      </View>

      {isCompact ? (
        <View style={styles.driverCards}>
          {visibleDrivers.map((driver) => (
            <View key={driver.id} style={styles.driverCard}>
              <DriverIdentity driver={driver} />
              <View style={styles.mobileDocuments}>
                <DocumentBadge label="License" value={driver.license} />
                <DocumentBadge label="National ID" value={driver.nationalId} />
                <DocumentBadge label="Insurance" value={driver.insurance} />
              </View>
              <DriverActions
                driver={driver}
                onApprove={() => approveDriver(driver.id)}
                onView={() => showDriverDetails(driver)}
              />
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.columnHeading, styles.driverColumn]}>DRIVER</Text>
            <Text style={styles.columnHeading}>LICENSE</Text>
            <Text style={styles.columnHeading}>NATIONAL ID</Text>
            <Text style={styles.columnHeading}>INSURANCE</Text>
            <Text style={[styles.columnHeading, styles.actionColumn]}>ACTION</Text>
          </View>
          {visibleDrivers.map((driver) => (
            <View key={driver.id} style={styles.tableRow}>
              <View style={styles.driverColumn}>
                <DriverIdentity driver={driver} />
              </View>
              <View style={styles.documentColumn}><DocumentBadge value={driver.license} /></View>
              <View style={styles.documentColumn}><DocumentBadge value={driver.nationalId} /></View>
              <View style={styles.documentColumn}><DocumentBadge value={driver.insurance} /></View>
              <View style={[styles.actionColumn, styles.rowActions]}>
                <DriverActions
                  driver={driver}
                  onApprove={() => approveDriver(driver.id)}
                  onView={() => showDriverDetails(driver)}
                />
              </View>
            </View>
          ))}
          {!visibleDrivers.length && <EmptyState />}
        </View>
      )}
      {isCompact && !visibleDrivers.length && <EmptyState />}

      <View style={styles.securityNote}>
        <ShieldCheck size={16} color={COLORS.greenInk} />
        <Text style={styles.securityNoteText}>
          Driver approvals are demo-only. Verify originals before enabling a live account.
        </Text>
      </View>
    </ScrollView>
  );
}

function DriverIdentity({ driver }: { driver: Driver }) {
  return (
    <View style={styles.identity}>
      <View style={styles.avatar}><Text style={styles.avatarText}>{driver.initials}</Text></View>
      <View style={styles.identityCopy}>
        <Text style={styles.driverName}>{driver.name}</Text>
        <Text style={styles.driverMeta}>{driver.vehicle} · {driver.plate}</Text>
      </View>
    </View>
  );
}

function DocumentBadge({ label, value }: { label?: string; value: DocumentState }) {
  const stateStyle =
    value === "Verified"
      ? styles.verifiedBadge
      : value === "Expiring"
        ? styles.expiringBadge
        : styles.pendingBadge;
  const textStyle =
    value === "Verified"
      ? styles.verifiedText
      : value === "Expiring"
        ? styles.expiringText
        : styles.pendingText;
  return (
    <View style={styles.documentCell}>
      {label && <Text style={styles.documentLabel}>{label}</Text>}
      <View style={[styles.documentBadge, stateStyle]}>
        <Text style={[styles.documentBadgeText, textStyle]}>{value}</Text>
      </View>
    </View>
  );
}

function DriverActions({
  driver,
  onApprove,
  onView,
}: {
  driver: Driver;
  onApprove: () => void;
  onView: () => void;
}) {
  const canApprove =
    driver.license === "Verified" &&
    driver.nationalId === "Verified" &&
    driver.insurance === "Verified";

  return (
    <View style={styles.actions}>
      <Pressable
        onPress={canApprove ? onApprove : onView}
        disabled={driver.approved}
        accessibilityRole="button"
        accessibilityLabel={
          driver.approved
            ? `${driver.name} approved`
            : `${canApprove ? "Approve" : "Review"} ${driver.name}`
        }
        style={[
          styles.actionButton,
          driver.approved && styles.approvedButton,
          !driver.approved && !canApprove && styles.reviewButton,
        ]}
      >
        <Text
          style={[
            styles.actionButtonText,
            (driver.approved || !canApprove) && styles.secondaryActionText,
          ]}
        >
          {driver.approved ? "Approved" : canApprove ? "Approve" : "Review"}
        </Text>
      </Pressable>
      <Pressable
        onPress={onView}
        style={styles.viewButton}
        accessibilityRole="button"
        accessibilityLabel={`View ${driver.name}'s documents`}
      >
        <Eye size={16} color={COLORS.navy} />
      </Pressable>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No drivers found</Text>
      <Text style={styles.emptySubtitle}>Try another search or filter.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  pageContent: { paddingHorizontal: 26, paddingTop: 27, paddingBottom: 34, width: "100%", maxWidth: 1500, alignSelf: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 21 },
  headerCompact: { alignItems: "flex-start", flexDirection: "column" },
  headerCopy: { flex: 1 },
  title: { color: COLORS.text, fontSize: 27, fontWeight: "800", letterSpacing: -0.6 },
  subtitle: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
  approveAll: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 22, backgroundColor: COLORS.green },
  approveAllText: { color: COLORS.white, fontSize: 11, fontWeight: "800" },
  toolbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 13 },
  toolbarCompact: { flexDirection: "column", alignItems: "stretch" },
  filters: { flexDirection: "row", gap: 5, backgroundColor: "#E4EAF2", borderRadius: 11, padding: 4 },
  filterButton: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 8, paddingHorizontal: 11, paddingVertical: 8 },
  filterActive: { backgroundColor: COLORS.white },
  filterText: { color: COLORS.muted, fontSize: 10, fontWeight: "700" },
  filterTextActive: { color: COLORS.text },
  filterCount: { color: COLORS.muted, fontSize: 9, fontWeight: "700" },
  filterCountActive: { color: COLORS.greenInk },
  searchBox: { height: 39, minWidth: 220, flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 11, paddingHorizontal: 11, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border },
  searchInput: { flex: 1, minWidth: 0, color: COLORS.text, fontSize: 11, paddingVertical: 6, outlineStyle: "none" } as any,
  table: { overflow: "hidden", backgroundColor: COLORS.white, borderRadius: 15, borderWidth: 1, borderColor: COLORS.border },
  tableHeader: { minHeight: 41, flexDirection: "row", alignItems: "center", backgroundColor: "#E5EAF2", paddingHorizontal: 17 },
  columnHeading: { flex: 1, color: "#7486A2", fontSize: 9, fontWeight: "800", letterSpacing: 0.3 },
  driverColumn: { flex: 1.25 },
  actionColumn: { flex: 0.9, alignItems: "flex-end" },
  tableRow: { minHeight: 69, flexDirection: "row", alignItems: "center", paddingHorizontal: 17, borderTopWidth: 1, borderTopColor: "#E9EDF3" },
  identity: { flexDirection: "row", alignItems: "center", gap: 9, flex: 1, minWidth: 0 },
  avatar: { width: 31, height: 31, borderRadius: 16, backgroundColor: COLORS.navy, alignItems: "center", justifyContent: "center" },
  avatarText: { color: COLORS.white, fontSize: 10, fontWeight: "800" },
  identityCopy: { flex: 1, minWidth: 0 },
  driverName: { color: COLORS.text, fontSize: 11, fontWeight: "800" },
  driverMeta: { color: COLORS.muted, fontSize: 9, marginTop: 4 },
  documentColumn: { flex: 1 },
  documentCell: { alignItems: "flex-start", gap: 5 },
  documentLabel: { color: COLORS.muted, fontSize: 9, fontWeight: "700" },
  documentBadge: { borderRadius: 12, paddingHorizontal: 9, paddingVertical: 5 },
  documentBadgeText: { fontSize: 9, fontWeight: "800" },
  verifiedBadge: { backgroundColor: "#DDF5EA" },
  verifiedText: { color: COLORS.greenInk },
  pendingBadge: { backgroundColor: "#FFF0D9" },
  pendingText: { color: COLORS.amber },
  expiringBadge: { backgroundColor: "#FFE7EB" },
  expiringText: { color: COLORS.red },
  rowActions: { flexDirection: "row", justifyContent: "flex-end" },
  actions: { flexDirection: "row", alignItems: "center", gap: 7 },
  actionButton: { minWidth: 76, alignItems: "center", justifyContent: "center", paddingHorizontal: 11, paddingVertical: 9, borderRadius: 20, backgroundColor: COLORS.navy },
  actionButtonText: { color: COLORS.white, fontSize: 10, fontWeight: "800" },
  reviewButton: { backgroundColor: "#E6EBF3" },
  approvedButton: { backgroundColor: "#DDF5EA" },
  secondaryActionText: { color: COLORS.text },
  viewButton: { width: 31, height: 31, alignItems: "center", justifyContent: "center" },
  driverCards: { gap: 10 },
  driverCard: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 14, gap: 13 },
  mobileDocuments: { flexDirection: "row", flexWrap: "wrap", gap: 15 },
  emptyState: { alignItems: "center", padding: 28 },
  emptyTitle: { color: COLORS.text, fontSize: 13, fontWeight: "800" },
  emptySubtitle: { color: COLORS.muted, fontSize: 10, marginTop: 4 },
  securityNote: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 15, padding: 12, borderRadius: 11, backgroundColor: "#E4F5EC" },
  securityNoteText: { flex: 1, color: COLORS.greenInk, fontSize: 10, lineHeight: 15 },
});
