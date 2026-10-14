import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Activity,
  BarChart3,
  CarFront,
  ChevronDown,
  Check,
  LayoutDashboard,
  Map,
  MessageCircle,
  Menu,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react-native";
import RouteMap from "../../components/RouteMap";
import DriverOnboardingScreen from "./DriverOnboardingScreen";
import OperationsOverviewScreen from "./OperationsOverviewScreen";
import PricingSurgeScreen from "./PricingSurgeScreen";
import SupportInboxScreen from "./SupportInboxScreen";

const COLORS = {
  navy: "#0B1D3A",
  navySoft: "#152B4D",
  green: "#05B887",
  greenInk: "#07845F",
  background: "#EEF1F6",
  white: "#FFFFFF",
  text: "#10213F",
  muted: "#71809A",
  border: "#DDE4EF",
};

type Page = "Overview" | "Live Map" | "Drivers" | "Pricing & Surge" | "Support" | "Settings";

const NAV_ITEMS = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Live Map", icon: Map },
  { label: "Drivers", icon: CarFront },
  { label: "Pricing & Surge", icon: SlidersHorizontal },
  { label: "Support", icon: MessageCircle },
  { label: "Settings", icon: Settings },
] as const;

interface Props {
  onExit?: () => void;
}

export default function AdminConsoleScreen({ onExit }: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isWide = width >= 860;
  const isSmallPhone = width < 400;
  const [page, setPage] = useState<Page>("Overview");
  const [menuOpen, setMenuOpen] = useState(false);

  const content = () => {
    switch (page) {
      case "Overview":
        return <OperationsOverviewScreen />;
      case "Drivers":
        return <DriverOnboardingScreen />;
      case "Pricing & Surge":
        return <PricingSurgeScreen />;
      case "Support":
        return <SupportInboxScreen embedded />;
      case "Live Map":
        return <LiveMapScreen />;
      case "Settings":
        return <SettingsScreen />;
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" backgroundColor={COLORS.navy} />
      <View
        style={[
          styles.topbar,
          {
            height: 62 + insets.top,
            paddingTop: insets.top,
          },
        ]}
      >
        <View style={styles.brand}>
          <View style={styles.brandMark}>
            <Text style={styles.brandLetter}>G</Text>
          </View>
          <View>
            <Text style={styles.brandName}>GoSmart</Text>
            {!isSmallPhone && (
              <Text style={styles.brandMeta}>ADMIN CONSOLE</Text>
            )}
          </View>
        </View>

        <View style={styles.topbarActions}>
          {isWide && (
            <View style={styles.adminIdentity}>
              <View style={styles.adminAvatar}>
                <Text style={styles.adminAvatarText}>AD</Text>
              </View>
              <Text style={styles.adminName}>Administrator</Text>
            </View>
          )}
          <Pressable
            onPress={() => setMenuOpen((open) => !open)}
            accessibilityRole="button"
            accessibilityLabel="Open admin navigation menu"
            accessibilityState={{ expanded: menuOpen }}
            style={styles.menuButton}
          >
            {menuOpen ? (
              <X size={17} color={COLORS.navy} />
            ) : (
              <Menu size={17} color={COLORS.navy} />
            )}
            <Text style={styles.menuButtonText}>
              {isWide ? page : "Menu"}
            </Text>
            <ChevronDown size={15} color={COLORS.muted} />
          </Pressable>
          {onExit && (
            <Pressable
              onPress={onExit}
              accessibilityRole="button"
              style={styles.signOutButton}
            >
              <Text style={styles.signOutText}>Sign out</Text>
            </Pressable>
          )}
        </View>

        {menuOpen && (
          <View style={[styles.menuDropdown, { top: insets.top + 58 }]}>
            <Text style={styles.menuHeading}>ADMINISTRATION</Text>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = page === item.label;
              return (
                <Pressable
                  key={item.label}
                  onPress={() => {
                    setPage(item.label);
                    setMenuOpen(false);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[styles.menuItem, active && styles.menuItemActive]}
                >
                  <Icon size={17} color={active ? COLORS.green : COLORS.muted} />
                  <Text style={[styles.menuItemLabel, active && styles.menuItemLabelActive]}>
                    {item.label}
                  </Text>
                  {active && <Check size={15} color={COLORS.green} />}
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
      <View style={styles.main}>{content()}</View>
    </View>
  );
}

function LiveMapScreen() {
  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.pageContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.pageHeading}>
        <View>
          <Text style={styles.pageTitle}>Live fleet map</Text>
          <Text style={styles.pageSubtitle}>
            Driver activity and demand areas across Kigali.
          </Text>
        </View>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveBadgeText}>Live preview</Text>
        </View>
      </View>
      <View style={styles.mapCard}>
        <RouteMap
          variant="dark"
          driverAt={{ x: 0.36, y: 0.44 }}
          zones={[
            { x: 0.66, y: 0.28, r: 0.12 },
            { x: 0.48, y: 0.68, r: 0.1 },
          ]}
          style={styles.map}
        />
        <View style={styles.mapStats}>
          <MapStat label="Online drivers" value="342" icon={CarFront} />
          <MapStat label="Active trips" value="1,284" icon={Activity} />
          <MapStat label="Demand zones" value="2 active" icon={BarChart3} />
        </View>
      </View>
    </ScrollView>
  );
}

function MapStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof CarFront;
}) {
  return (
    <View style={styles.mapStat}>
      <Icon size={17} color={COLORS.green} />
      <View>
        <Text style={styles.mapStatValue}>{value}</Text>
        <Text style={styles.mapStatLabel}>{label}</Text>
      </View>
    </View>
  );
}

function SettingsScreen() {
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.pageContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.pageHeading}>
        <View>
          <Text style={styles.pageTitle}>Admin settings</Text>
          <Text style={styles.pageSubtitle}>
            Manage operational preferences for this preview.
          </Text>
        </View>
      </View>
      <View style={styles.settingsCard}>
        <View style={styles.settingsIcon}>
          <ShieldCheck size={19} color={COLORS.green} />
        </View>
        <View style={styles.settingsCopy}>
          <Text style={styles.settingsTitle}>Operations alerts</Text>
          <Text style={styles.settingsSubtitle}>
            Get notified about urgent tickets and driver documents.
          </Text>
        </View>
        <Pressable
          onPress={() => setAlertsEnabled((enabled) => !enabled)}
          accessibilityRole="switch"
          accessibilityState={{ checked: alertsEnabled }}
          style={[
            styles.toggle,
            alertsEnabled && styles.toggleActive,
          ]}
        >
          <View
            style={[
              styles.toggleKnob,
              alertsEnabled && styles.toggleKnobActive,
            ]}
          />
        </Pressable>
      </View>
      <Pressable
        onPress={() => Alert.alert("Admin preview", "These settings are stored for this preview only.")}
        style={styles.previewNotice}
      >
        <Text style={styles.previewNoticeText}>
          This console uses sample data. Connect your admin API to manage live operations.
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  topbar: {
    backgroundColor: COLORS.navy,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    zIndex: 10,
    elevation: 10,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 0 },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
  },
  brandLetter: { color: COLORS.white, fontSize: 15, fontWeight: "800" },
  brandName: { color: COLORS.white, fontSize: 14, fontWeight: "800" },
  brandMeta: {
    color: "#90A0BA",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginTop: 3,
  },
  topbarActions: { flexDirection: "row", alignItems: "center", gap: 4, flexShrink: 1 },
  adminIdentity: { flexDirection: "row", alignItems: "center", gap: 8 },
  adminAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#274365",
  },
  adminAvatarText: { color: COLORS.white, fontSize: 9, fontWeight: "800" },
  adminName: { color: COLORS.white, fontSize: 11, fontWeight: "700" },
  menuButton: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 11,
    paddingHorizontal: 9,
    backgroundColor: "#FFFFFF",
  },
  menuButtonText: { color: COLORS.text, fontSize: 11, fontWeight: "700" },
  signOutButton: { paddingHorizontal: 12, paddingVertical: 10 },
  signOutText: { color: "#D9E2EF", fontSize: 11, fontWeight: "700" },
  menuDropdown: {
    position: "absolute",
    top: 58,
    right: 22,
    width: 230,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    padding: 8,
    shadowColor: COLORS.navy,
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  menuHeading: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
    paddingHorizontal: 10,
    paddingTop: 7,
    paddingBottom: 9,
  },
  menuItem: {
    minHeight: 41,
    borderRadius: 8,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  menuItemActive: { backgroundColor: "#E8F8F1" },
  menuItemLabel: { color: COLORS.text, fontSize: 11, fontWeight: "600", flex: 1 },
  menuItemLabelActive: { color: COLORS.greenInk, fontWeight: "800" },
  main: { flex: 1, minWidth: 0 },
  page: { flex: 1 },
  pageContent: {
    paddingHorizontal: 26,
    paddingTop: 25,
    paddingBottom: 32,
    width: "100%",
    maxWidth: 1500,
    alignSelf: "center",
  },
  pageHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    marginBottom: 22,
  },
  pageTitle: { color: COLORS.text, fontSize: 27, fontWeight: "800", letterSpacing: -0.6 },
  pageSubtitle: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
  liveBadge: {
    backgroundColor: "#DDF6EC",
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.green },
  liveBadgeText: { color: "#087A58", fontSize: 10, fontWeight: "800" },
  mapCard: { borderRadius: 18, backgroundColor: COLORS.navy, padding: 14 },
  map: { height: 430, borderRadius: 13, overflow: "hidden" },
  mapStats: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingTop: 13 },
  mapStat: {
    flex: 1,
    minWidth: 145,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderRadius: 12,
    backgroundColor: COLORS.navySoft,
    padding: 12,
  },
  mapStatValue: { color: COLORS.white, fontSize: 14, fontWeight: "800" },
  mapStatLabel: { color: "#A8B5CA", fontSize: 10, marginTop: 3 },
  settingsCard: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 15,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#E6F8F1",
    alignItems: "center",
    justifyContent: "center",
  },
  settingsCopy: { flex: 1 },
  settingsTitle: { color: COLORS.text, fontSize: 13, fontWeight: "800" },
  settingsSubtitle: { color: COLORS.muted, fontSize: 11, marginTop: 4 },
  toggle: {
    width: 42,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#C8D0DC",
    padding: 3,
    justifyContent: "center",
  },
  toggleActive: { backgroundColor: COLORS.green },
  toggleKnob: { width: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.white },
  toggleKnobActive: { alignSelf: "flex-end" },
  previewNotice: {
    marginTop: 15,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#E6ECF5",
  },
  previewNoticeText: { color: COLORS.muted, fontSize: 11, lineHeight: 17 },
});
