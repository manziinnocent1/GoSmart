import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Bell, X, Zap } from "lucide-react-native";
import RouteMap from "../../components/RouteMap";
import { useAppSettings } from "../../context/AppSettings";
import type { Palette } from "../../context/AppSettings";
import { formatRwf } from "../../utils/format";
import {
  DAILY_GOAL,
  DEMAND_ZONES,
  KIND_LABEL,
  YESTERDAY_EARNINGS,
} from "./driverData";
import type { DriverProfile } from "./driverData";

interface Props {
  driver: DriverProfile;
  online: boolean;
  onToggleOnline: (next: boolean) => void;
  earningsToday: number;
  tripsToday: number;
  /** Percent of requests accepted, 0 to 100. */
  acceptance: number;
  onlineMinutes: number;
  /** A short message shown at the top, for example after a missed request. */
  notice: string | null;
  onWallet: () => void;
}

const PAD = 20;

const NOTIFICATIONS = [
  {
    id: "n1",
    title: "Surge x1.2 in Remera",
    body: "Fares are higher for the next 30 minutes. Head there to earn more.",
    time: "Now",
  },
  {
    id: "n2",
    title: "Weekly bonus: 5 trips to go",
    body: "Complete 5 more trips this week to earn a RWF 5,000 bonus.",
    time: "1h ago",
  },
  {
    id: "n3",
    title: "Insurance expires in 14 days",
    body: "Upload your renewed insurance to keep receiving requests.",
    time: "Yesterday",
  },
];

function LiveDot({ color }: { color: string }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(a, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(a, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [a]);
  return (
    <Animated.View
      style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: color,
        opacity: a.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
      }}
    />
  );
}

export default function DriverDashboardScreen({
  driver,
  online,
  onToggleOnline,
  earningsToday,
  tripsToday,
  acceptance,
  onlineMinutes,
  notice,
  onWallet,
}: Props) {
  const { palette: c, isDark } = useAppSettings();
  const insets = useSafeAreaInsets();
  const s = useMemo(() => makeStyles(c), [c]);

  const [showNotifs, setShowNotifs] = useState(false);
  const [unread, setUnread] = useState(NOTIFICATIONS.length);

  const goalPct = Math.min(100, Math.round((earningsToday / DAILY_GOAL) * 100));
  const vsYesterday = Math.round((earningsToday / YESTERDAY_EARNINGS - 1) * 100);
  const hours = Math.floor(onlineMinutes / 60);
  const mins = onlineMinutes % 60;
  const kind = KIND_LABEL[driver.kind];

  const openNotifs = () => {
    setShowNotifs(true);
    setUnread(0);
  };

  return (
    <View style={s.root}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <ScrollView
        style={s.flex}
        contentContainerStyle={[s.content, { paddingTop: insets.top + 12 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{driver.initials}</Text>
          </View>
          <View style={s.flex}>
            <Text style={s.greeting} numberOfLines={1}>
              Muraho, {driver.firstName} 👋
            </Text>
            <Text style={s.sub} numberOfLines={1}>
              {kind} • {driver.plate} • ★ {driver.rating.toFixed(2)}
            </Text>
          </View>
          <Pressable
            onPress={openNotifs}
            style={s.bell}
            accessibilityRole="button"
            accessibilityLabel={`Notifications, ${unread} unread`}
            hitSlop={8}
          >
            <Bell size={20} strokeWidth={2.25} color={c.ink} />
            {unread > 0 && (
              <View style={s.badge}>
                <Text style={s.badgeText}>{unread}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {!!notice && (
          <View style={s.notice} accessibilityLiveRegion="polite">
            <Text style={s.noticeText}>{notice}</Text>
          </View>
        )}

        {/* Online switch */}
        <View style={[s.statusCard, online ? s.statusOn : s.statusOff]}>
          <View style={s.flex}>
            <Text style={[s.statusTitle, online && s.onHero]}>
              {online ? "You are Online" : "You are Offline"}
            </Text>
            <Text style={[s.statusSub, online && s.subOnHero]}>
              {online
                ? `Receiving ${kind} requests`
                : "Go online to start receiving requests"}
            </Text>
            {online && (
              <View style={s.searching}>
                <LiveDot color={c.green} />
                <Text style={s.searchingText}>Looking for requests nearby</Text>
              </View>
            )}
          </View>
          <Switch
            value={online}
            onValueChange={onToggleOnline}
            trackColor={{ false: c.border, true: c.green }}
            thumbColor="#FFFFFF"
            ios_backgroundColor={c.border}
            accessibilityLabel="Go online"
          />
        </View>

        {/* Map */}
        <RouteMap
          variant={isDark ? "dark" : "light"}
          zones={online ? DEMAND_ZONES : undefined}
          driverAt={{ x: 0.44, y: 0.5 }}
          style={s.map}
        >
          {online ? (
            <View style={s.surgeChip}>
              <Zap size={14} strokeWidth={2.5} color={c.amber} fill={c.amber} />
              <Text style={s.surgeText}>Surge x1.2 • Remera</Text>
            </View>
          ) : (
            <View style={s.mapOff}>
              <Text style={s.mapOffTitle}>You're offline</Text>
              <Text style={s.mapOffText}>Go online to see busy areas</Text>
            </View>
          )}
        </RouteMap>

        {/* Earnings */}
        <View style={s.card}>
          <View style={s.earnRow}>
            <View style={s.flex}>
              <Text style={s.cardLabel}>Today's earnings</Text>
              <Text style={s.earnAmount}>{formatRwf(earningsToday)}</Text>
              <Text style={s.earnSub}>
                <Text style={vsYesterday >= 0 ? s.up : s.down}>
                  {vsYesterday >= 0 ? "+" : ""}
                  {vsYesterday}% vs yesterday
                </Text>
                {` • ${tripsToday} trips`}
              </Text>
            </View>
            <Pressable
              onPress={onWallet}
              style={({ pressed }) => [s.walletBtn, pressed && s.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Open wallet"
            >
              <Text style={s.walletText}>Wallet</Text>
            </Pressable>
          </View>

          <View style={s.goalTrack}>
            <View style={[s.goalFill, { width: `${goalPct}%` }]} />
          </View>
          <View style={s.goalRow}>
            <Text style={s.goalText}>
              {goalPct >= 100
                ? "Daily goal reached"
                : `${formatRwf(DAILY_GOAL - earningsToday)} to your daily goal`}
            </Text>
            <Text style={s.goalPct}>{goalPct}%</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={s.stats}>
          <View style={s.stat}>
            <Text style={s.statValue}>
              {hours}h {String(mins).padStart(2, "0")}m
            </Text>
            <Text style={s.statLabel}>Online time</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statValue}>{acceptance}%</Text>
            <Text style={s.statLabel}>Acceptance</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statValue}>{driver.rating.toFixed(2)}</Text>
            <Text style={s.statLabel}>Rating</Text>
          </View>
        </View>
      </ScrollView>

      {/* Notifications */}
      <Modal
        visible={showNotifs}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNotifs(false)}
      >
        <View style={s.modalWrap}>
          <Pressable style={s.scrim} onPress={() => setShowNotifs(false)} />
          <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>Notifications</Text>
              <Pressable
                onPress={() => setShowNotifs(false)}
                style={s.closeBtn}
                accessibilityRole="button"
                accessibilityLabel="Close"
                hitSlop={8}
              >
                <X size={18} strokeWidth={2.5} color={c.ink} />
              </Pressable>
            </View>
            {NOTIFICATIONS.map((n, i) => (
              <View
                key={n.id}
                style={[s.notif, i < NOTIFICATIONS.length - 1 && s.notifLine]}
              >
                <View style={s.flex}>
                  <Text style={s.notifTitle}>{n.title}</Text>
                  <Text style={s.notifBody}>{n.body}</Text>
                </View>
                <Text style={s.notifTime}>{n.time}</Text>
              </View>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    flex: { flex: 1 },
    pressed: { opacity: 0.8 },
    onHero: { color: c.onHero },
    subOnHero: { color: c.mutedOnHero },

    content: { paddingHorizontal: PAD, paddingBottom: 28, gap: 14 },

    header: { flexDirection: "row", alignItems: "center", gap: 12 },
    avatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: c.hero,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: { color: c.onHero, fontSize: 18, fontWeight: "800" },
    greeting: { fontSize: 18, fontWeight: "800", color: c.ink },
    sub: { fontSize: 13, color: c.muted, marginTop: 2 },
    bell: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: "center",
      justifyContent: "center",
    },
    badge: {
      position: "absolute",
      top: -3,
      right: -3,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      paddingHorizontal: 4,
      backgroundColor: c.red,
      borderWidth: 2,
      borderColor: c.bg,
      alignItems: "center",
      justifyContent: "center",
    },
    badgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "800" },

    notice: {
      backgroundColor: c.greenSoft,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.amber,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    noticeText: { color: c.ink, fontSize: 14, fontWeight: "700" },

    statusCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderRadius: 28,
      paddingVertical: 18,
      paddingHorizontal: 20,
    },
    statusOn: { backgroundColor: c.hero },
    statusOff: {
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
    },
    statusTitle: { fontSize: 18, fontWeight: "800", color: c.ink },
    statusSub: { fontSize: 13, color: c.muted, marginTop: 3 },
    searching: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
    searchingText: { color: c.green, fontSize: 12, fontWeight: "700" },

    map: { height: 220, borderRadius: 28 },
    surgeChip: {
      position: "absolute",
      left: 12,
      bottom: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: c.card,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    surgeText: { color: c.ink, fontSize: 13, fontWeight: "800" },
    mapOff: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: c.scrim,
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    },
    mapOffTitle: { color: "#FFFFFF", fontSize: 17, fontWeight: "800" },
    mapOffText: { color: "#D5DBEA", fontSize: 13, marginTop: 4 },

    card: {
      backgroundColor: c.card,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: c.border,
      padding: 20,
    },
    cardLabel: { fontSize: 13, fontWeight: "700", color: c.muted },
    earnRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    earnAmount: { fontSize: 32, fontWeight: "800", color: c.ink, marginTop: 2 },
    earnSub: { fontSize: 13, color: c.muted, marginTop: 4 },
    up: { color: c.greenInk, fontWeight: "800" },
    down: { color: c.red, fontWeight: "800" },
    walletBtn: {
      backgroundColor: c.green,
      borderRadius: 22,
      paddingHorizontal: 22,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    walletText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
    goalTrack: {
      height: 8,
      borderRadius: 4,
      backgroundColor: c.soft,
      marginTop: 18,
      overflow: "hidden",
    },
    goalFill: { height: 8, borderRadius: 4, backgroundColor: c.green },
    goalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 8,
    },
    goalText: { fontSize: 12, color: c.muted },
    goalPct: { fontSize: 12, fontWeight: "800", color: c.ink },

    stats: { flexDirection: "row", gap: 10 },
    stat: {
      flex: 1,
      backgroundColor: c.card,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: c.border,
      paddingVertical: 16,
      alignItems: "center",
    },
    statValue: { fontSize: 18, fontWeight: "800", color: c.ink },
    statLabel: { fontSize: 12, color: c.muted, marginTop: 4 },

    modalWrap: { flex: 1, justifyContent: "flex-end" },
    scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: c.scrim },
    sheet: {
      backgroundColor: c.card,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      paddingHorizontal: PAD,
      paddingTop: 20,
    },
    sheetHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    sheetTitle: { fontSize: 22, fontWeight: "800", color: c.ink },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.soft,
      alignItems: "center",
      justifyContent: "center",
    },
    notif: { flexDirection: "row", gap: 12, paddingVertical: 14 },
    notifLine: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    notifTitle: { fontSize: 15, fontWeight: "800", color: c.ink },
    notifBody: { fontSize: 13, lineHeight: 19, color: c.muted, marginTop: 3 },
    notifTime: { fontSize: 12, color: c.muted },
  });
