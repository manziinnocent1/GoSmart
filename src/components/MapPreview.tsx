import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { colors, radius } from "../theme";

const ROADS: ViewStyle[] = [
  { width: 520, top: 180, left: -60, transform: [{ rotate: "-14deg" }] },
  { width: 520, top: 330, left: -80, transform: [{ rotate: "8deg" }] },
  { width: 460, top: 300, left: -120, transform: [{ rotate: "72deg" }] },
  { width: 460, top: 260, left: 60, transform: [{ rotate: "62deg" }] },
];
const ROUTE = [
  { x: 70, y: 385, w: 130, deg: -38 },
  { x: 140, y: 330, w: 110, deg: -18 },
  { x: 225, y: 290, w: 120, deg: -42 },
];
const DRIVERS = [
  { left: 290, top: 400 },
  { left: 110, top: 250 },
  { left: 330, top: 210 },
];

/**
 * Placeholder map. Replace the body with <MapView> from react-native-maps
 * and keep the pins, route and driver markers as map children.
 */
export function MapPreview({ tripLabel }: { tripLabel: string }) {
  return (
    <View
      style={[StyleSheet.absoluteFill, { backgroundColor: colors.blueSoft }]}
    >
      {ROADS.map((style, i) => (
        <View key={i} style={[styles.road, style]} />
      ))}
      {ROUTE.map(({ x, y, w, deg }, i) => (
        <View
          key={i}
          style={[
            styles.route,
            { left: x, top: y, width: w, transform: [{ rotate: `${deg}deg` }] },
          ]}
        />
      ))}
      <View style={styles.pickupHalo}>
        <View style={styles.pickupDot} />
      </View>
      <View style={styles.destination} />
      <View style={styles.bubble}>
        <Text style={styles.bubbleText}>{tripLabel}</Text>
      </View>
      {DRIVERS.map((pos, i) => (
        <View key={i} style={[styles.driver, pos]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  road: {
    position: "absolute",
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.white,
  },
  route: {
    position: "absolute",
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.blue,
  },
  pickupHalo: {
    position: "absolute",
    left: 58,
    top: 372,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(27,77,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  pickupDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.blue,
    borderWidth: 3,
    borderColor: colors.white,
  },
  destination: {
    position: "absolute",
    left: 332,
    top: 244,
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: colors.ink,
    borderWidth: 3,
    borderColor: colors.white,
  },
  bubble: {
    position: "absolute",
    left: 250,
    top: 208,
    backgroundColor: colors.ink,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  bubbleText: { color: colors.white, fontSize: 12, fontWeight: "700" },
  driver: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 4,
    backgroundColor: colors.ink,
    borderWidth: 2,
    borderColor: colors.white,
    transform: [{ rotate: "45deg" }],
  },
});
