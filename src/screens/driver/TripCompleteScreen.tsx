import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Check, Star } from "lucide-react-native";
import { useAppSettings } from "../../context/AppSettings";
import type { Palette } from "../../context/AppSettings";
import { formatRwf } from "../../utils/format";
import {
  COMMISSION_RATE,
  commissionOf,
  firstNameOf,
  netOf,
} from "./driverData";
import type { RideRequest } from "./driverData";

interface Props {
  request: RideRequest;
  /** Called with the star rating (1 to 5), or null if the driver skipped it. */
  onDone: (rating: number | null) => void;
}

const PAD = 20;

export default function TripCompleteScreen({ request, onDone }: Props) {
  const { palette: c, isDark } = useAppSettings();
  const insets = useSafeAreaInsets();
  const s = useMemo(() => makeStyles(c), [c]);
  const [rating, setRating] = useState(0);

  const first = firstNameOf(request.passenger.name);
  const fare = request.fareRwf;
  const commission = commissionOf(fare);
  const net = netOf(fare);
  const isCash = request.payment === "cash";

  return (
    <View style={s.root}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <ScrollView
        style={s.flex}
        contentContainerStyle={[s.content, { paddingTop: insets.top + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.check}>
          <Check size={40} strokeWidth={3.5} color="#FFFFFF" />
        </View>
        <Text style={s.title}>Trip complete</Text>
        <Text style={s.sub}>
          {request.tripKm} km • {request.tripMin} min • {request.dropoff}
        </Text>

        {/* What to do about the money */}
        <View style={[s.notice, isCash ? s.noticeCash : s.noticeMomo]}>
          <Text style={s.noticeTitle}>
            {isCash ? `Collect ${formatRwf(fare)} in cash` : "Paid in the app"}
          </Text>
          <Text style={s.noticeText}>
            {isCash
              ? `Take the cash from ${first}. The ${formatRwf(commission)} commission is taken from your wallet.`
              : `${first} paid with MoMo. ${formatRwf(net)} was added to your wallet.`}
          </Text>
        </View>

        {/* Breakdown */}
        <View style={s.card}>
          <View style={s.row}>
            <Text style={s.label}>Fare</Text>
            <Text style={s.value}>{formatRwf(fare)}</Text>
          </View>
          <View style={[s.row, s.line]}>
            <Text style={s.label}>
              Commission ({Math.round(COMMISSION_RATE * 100)}%)
            </Text>
            <Text style={s.value}>- {formatRwf(commission)}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.totalLabel}>Your earnings</Text>
            <Text style={s.totalValue}>{formatRwf(net)}</Text>
          </View>
        </View>

        {/* Rating */}
        <View style={s.card}>
          <Text style={s.rateTitle}>How was {first}?</Text>
          <Text style={s.rateSub}>Your rating helps keep GoSmart safe.</Text>
          <View style={s.stars} accessibilityRole="radiogroup">
            {[1, 2, 3, 4, 5].map((n) => {
              const on = n <= rating;
              return (
                <Pressable
                  key={n}
                  onPress={() => setRating(n)}
                  hitSlop={6}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: n === rating }}
                  accessibilityLabel={`${n} ${n === 1 ? "star" : "stars"}`}
                >
                  <Star
                    size={38}
                    strokeWidth={2}
                    color={on ? c.amber : c.border}
                    fill={on ? c.amber : "transparent"}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable
          onPress={() => onDone(rating > 0 ? rating : null)}
          style={({ pressed }) => [s.cta, pressed && s.pressed]}
          accessibilityRole="button"
        >
          <Text style={s.ctaText}>{rating > 0 ? "Submit and finish" : "Done"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    flex: { flex: 1 },
    pressed: { opacity: 0.85 },

    content: { paddingHorizontal: PAD, paddingBottom: 24, gap: 14, alignItems: "stretch" },
    check: {
      alignSelf: "center",
      width: 84,
      height: 84,
      borderRadius: 42,
      backgroundColor: c.green,
      alignItems: "center",
      justifyContent: "center",
    },
    title: { fontSize: 28, fontWeight: "800", color: c.ink, textAlign: "center", marginTop: 6 },
    sub: { fontSize: 14, color: c.muted, textAlign: "center", marginTop: -6, marginBottom: 6 },

    notice: { borderRadius: 22, borderWidth: 1, padding: 16 },
    noticeCash: { backgroundColor: c.soft, borderColor: c.amber },
    noticeMomo: { backgroundColor: c.greenSoft, borderColor: c.green },
    noticeTitle: { fontSize: 16, fontWeight: "800", color: c.ink },
    noticeText: { fontSize: 13, lineHeight: 19, color: c.muted, marginTop: 4 },

    card: {
      backgroundColor: c.card,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: c.border,
      padding: 18,
    },
    row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10 },
    line: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
    label: { fontSize: 15, color: c.muted },
    value: { fontSize: 15, fontWeight: "700", color: c.ink },
    totalLabel: { fontSize: 17, fontWeight: "800", color: c.ink },
    totalValue: { fontSize: 22, fontWeight: "800", color: c.greenInk },

    rateTitle: { fontSize: 17, fontWeight: "800", color: c.ink },
    rateSub: { fontSize: 13, color: c.muted, marginTop: 3 },
    stars: { flexDirection: "row", justifyContent: "center", gap: 10, marginTop: 16 },

    footer: { paddingHorizontal: PAD, paddingTop: 10, backgroundColor: c.bg },
    cta: {
      height: 62,
      borderRadius: 31,
      backgroundColor: c.green,
      alignItems: "center",
      justifyContent: "center",
    },
    ctaText: { color: "#FFFFFF", fontSize: 18, fontWeight: "800" },
  });
