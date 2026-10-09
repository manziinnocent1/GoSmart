import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ArrowDownToLine, Banknote, Smartphone } from "lucide-react-native";
import { useAppSettings } from "../../context/AppSettings";
import type { Palette } from "../../context/AppSettings";
import { formatRwf } from "../../utils/format";
import { MIN_CASHOUT, PAST_DAYS, commissionOf } from "./driverData";
import type { HistoryItem } from "./driverData";

interface Props {
  wallet: number;
  earningsToday: number;
  tripsToday: number;
  history: HistoryItem[];
  payoutNumber: string;
  onCashOut: () => void;
}

const PAD = 20;
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const BAR_MAX = 120;

type Range = "today" | "week";

export default function DriverEarningsScreen({
  wallet,
  earningsToday,
  tripsToday,
  history,
  payoutNumber,
  onCashOut,
}: Props) {
  const { palette: c, isDark } = useAppSettings();
  const insets = useSafeAreaInsets();
  const s = useMemo(() => makeStyles(c), [c]);
  const [range, setRange] = useState<Range>("today");

  // Monday = 0. Days before today use past totals, days after today are empty.
  const todayIdx = (new Date().getDay() + 6) % 7;
  const week = DAYS.map((_, i) =>
    i < todayIdx ? PAST_DAYS[i] : i === todayIdx ? earningsToday : 0,
  );
  const weekTotal = week.reduce((a, b) => a + b, 0);
  const weekMax = Math.max(...week, 1);
  const bestIdx = week.indexOf(Math.max(...week));
  const avgPerTrip = tripsToday > 0 ? Math.round(earningsToday / tripsToday) : 0;
  const canCashOut = wallet >= MIN_CASHOUT;

  return (
    <View style={s.root}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <ScrollView
        style={s.flex}
        contentContainerStyle={[s.content, { paddingTop: insets.top + 12 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.title}>Earnings</Text>

        {/* Wallet */}
        <View style={s.wallet}>
          <Text style={s.walletLabel}>Wallet balance</Text>
          <Text style={s.walletAmount}>{formatRwf(wallet)}</Text>
          <Text style={s.walletSub}>Cash out to MoMo {payoutNumber}</Text>
          <Pressable
            onPress={onCashOut}
            disabled={!canCashOut}
            style={({ pressed }) => [
              s.cashBtn,
              !canCashOut && s.cashBtnOff,
              pressed && s.pressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canCashOut }}
          >
            <ArrowDownToLine size={18} strokeWidth={2.5} color="#FFFFFF" />
            <Text style={s.cashText}>Cash out</Text>
          </Pressable>
          {!canCashOut && (
            <Text style={s.walletHint}>
              The minimum cash out is {formatRwf(MIN_CASHOUT)}.
            </Text>
          )}
        </View>

        {/* Range */}
        <View style={s.segment} accessibilityRole="radiogroup">
          {(["today", "week"] as const).map((r) => {
            const active = range === r;
            return (
              <Pressable
                key={r}
                onPress={() => setRange(r)}
                style={[s.segmentItem, active && s.segmentItemOn]}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
              >
                <Text style={[s.segmentText, active && s.segmentTextOn]}>
                  {r === "today" ? "Today" : "This week"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Summary */}
        <View style={s.card}>
          {range === "today" ? (
            <View style={s.summaryRow}>
              <View style={s.summaryItem}>
                <Text style={s.summaryValue}>{formatRwf(earningsToday)}</Text>
                <Text style={s.summaryLabel}>Earned</Text>
              </View>
              <View style={s.summaryItem}>
                <Text style={s.summaryValue}>{tripsToday}</Text>
                <Text style={s.summaryLabel}>Trips</Text>
              </View>
              <View style={s.summaryItem}>
                <Text style={s.summaryValue}>{formatRwf(avgPerTrip)}</Text>
                <Text style={s.summaryLabel}>Per trip</Text>
              </View>
            </View>
          ) : (
            <>
              <View style={s.summaryRow}>
                <View style={s.summaryItem}>
                  <Text style={s.summaryValue}>{formatRwf(weekTotal)}</Text>
                  <Text style={s.summaryLabel}>This week</Text>
                </View>
                <View style={s.summaryItem}>
                  <Text style={s.summaryValue}>{DAYS[bestIdx]}</Text>
                  <Text style={s.summaryLabel}>Best day</Text>
                </View>
              </View>
              <View style={s.chart}>
                {week.map((v, i) => {
                  const isToday = i === todayIdx;
                  const barH = Math.max(6, Math.round((v / weekMax) * BAR_MAX));
                  return (
                    <View key={DAYS[i]} style={s.barCol}>
                      <View style={s.barSlot}>
                        <View
                          style={[
                            s.bar,
                            { height: v === 0 ? 6 : barH },
                            isToday && s.barToday,
                            v === 0 && s.barEmpty,
                          ]}
                        />
                      </View>
                      <Text style={[s.barLabel, isToday && s.barLabelToday]}>
                        {DAYS[i]}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </>
          )}
        </View>

        {/* History */}
        <Text style={s.sectionTitle}>Recent activity</Text>
        <View style={s.card}>
          {history.slice(0, 8).map((item, i) => {
            const last = i === Math.min(history.length, 8) - 1;
            if (item.kind === "cashout") {
              return (
                <View key={item.id} style={[s.item, !last && s.itemLine]}>
                  <View style={s.itemIcon}>
                    <ArrowDownToLine size={18} strokeWidth={2.25} color={c.ink} />
                  </View>
                  <View style={s.flex}>
                    <Text style={s.itemTitle}>Cash out to MoMo</Text>
                    <Text style={s.itemSub}>{item.when}</Text>
                  </View>
                  <Text style={s.itemAmountOut}>- {formatRwf(item.amount)}</Text>
                </View>
              );
            }
            const PayIcon = item.payment === "momo" ? Smartphone : Banknote;
            return (
              <View key={item.id} style={[s.item, !last && s.itemLine]}>
                <View style={s.itemIcon}>
                  <PayIcon size={18} strokeWidth={2.25} color={c.ink} />
                </View>
                <View style={s.flex}>
                  <Text style={s.itemTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={s.itemSub}>
                    {item.when} • {item.payment === "momo" ? "MoMo" : "Cash"} • fare{" "}
                    {formatRwf(item.fare)}
                  </Text>
                </View>
                <View style={s.amountCol}>
                  <Text style={s.itemAmount}>
                    + {formatRwf(item.fare - item.commission)}
                  </Text>
                  <Text style={s.itemSub}>
                    - {formatRwf(commissionOf(item.fare))} fee
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    flex: { flex: 1 },
    pressed: { opacity: 0.85 },

    content: { paddingHorizontal: PAD, paddingBottom: 28, gap: 14 },
    title: { fontSize: 32, fontWeight: "800", color: c.ink },

    wallet: { backgroundColor: c.hero, borderRadius: 28, padding: 22 },
    walletLabel: { color: c.mutedOnHero, fontSize: 14, fontWeight: "600" },
    walletAmount: { color: c.onHero, fontSize: 38, fontWeight: "800", marginTop: 4 },
    walletSub: { color: c.mutedOnHero, fontSize: 13, marginTop: 4 },
    cashBtn: {
      marginTop: 18,
      height: 54,
      borderRadius: 27,
      backgroundColor: c.green,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    cashBtnOff: { opacity: 0.4 },
    cashText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
    walletHint: { color: c.mutedOnHero, fontSize: 12, textAlign: "center", marginTop: 10 },

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
      alignItems: "center",
      justifyContent: "center",
    },
    segmentItemOn: { backgroundColor: c.card },
    segmentText: { fontSize: 14, fontWeight: "700", color: c.muted },
    segmentTextOn: { color: c.ink, fontWeight: "800" },

    card: {
      backgroundColor: c.card,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: c.border,
      padding: 18,
    },
    summaryRow: { flexDirection: "row", gap: 12 },
    summaryItem: { flex: 1 },
    summaryValue: { fontSize: 18, fontWeight: "800", color: c.ink },
    summaryLabel: { fontSize: 12, color: c.muted, marginTop: 3 },

    chart: {
      flexDirection: "row",
      gap: 8,
      marginTop: 22,
    },
    barCol: { flex: 1, alignItems: "center", gap: 8 },
    barSlot: { height: BAR_MAX, justifyContent: "flex-end", alignSelf: "stretch" },
    bar: { borderRadius: 8, backgroundColor: c.soft },
    barToday: { backgroundColor: c.green },
    barEmpty: { opacity: 0.5 },
    barLabel: { fontSize: 12, color: c.muted, fontWeight: "600" },
    barLabelToday: { color: c.ink, fontWeight: "800" },

    sectionTitle: { fontSize: 18, fontWeight: "800", color: c.ink, marginTop: 4 },
    item: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
    itemLine: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
    itemIcon: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: c.soft,
      alignItems: "center",
      justifyContent: "center",
    },
    itemTitle: { fontSize: 15, fontWeight: "800", color: c.ink },
    itemSub: { fontSize: 12, color: c.muted, marginTop: 2 },
    amountCol: { alignItems: "flex-end" },
    itemAmount: { fontSize: 15, fontWeight: "800", color: c.greenInk },
    itemAmountOut: { fontSize: 15, fontWeight: "800", color: c.ink },
  });
