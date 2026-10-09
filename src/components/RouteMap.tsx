import React, { useState } from "react";
import {
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import Svg, { Circle, Line, Path, Rect } from "react-native-svg";
import { Flag, MapPin, Navigation2 } from "lucide-react-native";

/** A position on the map, as a fraction of its width and height (0 to 1). */
export interface MapPoint {
  x: number;
  y: number;
}

export interface DemandZone {
  x: number;
  y: number;
  /** Radius as a fraction of the map's shorter side. */
  r: number;
}

interface Props {
  variant?: "light" | "dark";
  /** The route to draw, as 2 or more points. */
  route?: MapPoint[];
  /** 0 to 1. When set, a driver marker moves along the route. */
  progress?: number;
  /** A fixed driver marker, used when there is no moving progress. */
  driverAt?: MapPoint;
  driverBearing?: number;
  startKind?: "origin" | "none";
  endKind?: "pickup" | "dropoff" | "none";
  zones?: DemandZone[];
  /** Keeps the route out of the areas covered by cards on top of the map. */
  inset?: { top?: number; bottom?: number };
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

const THEME = {
  light: {
    bg: "#DCE5F3",
    major: "#FFFFFF",
    minor: "#EDF2FA",
    park: "#CFE6DA",
    route: "#2FA56B",
    done: "#A5B3CB",
    casing: "#FFFFFF",
    originBg: "#111F3F",
    originDot: "#FFFFFF",
    endBg: "#111F3F",
    endFg: "#FFFFFF",
    ring: "#FFFFFF",
  },
  dark: {
    bg: "#0A1329",
    major: "#17264A",
    minor: "#122041",
    park: "#0E2A2E",
    route: "#4FD08F",
    done: "#34456E",
    casing: "#0A1329",
    originBg: "#FFFFFF",
    originDot: "#111F3F",
    endBg: "#FFFFFF",
    endFg: "#111F3F",
    ring: "#0A1329",
  },
} as const;

const GREEN = "#4FB27E";
const AMBER = "#F5A03C";

// Roads and parks are drawn in fractions of the map, so they fit any screen size.
const MAJOR: readonly [number, number, number, number][] = [
  [-0.1, 0.32, 1.1, 0.14],
  [-0.1, 0.66, 1.1, 0.58],
  [0.3, -0.1, 0.2, 1.1],
  [0.74, -0.1, 0.9, 1.1],
];
const MINOR: readonly [number, number, number, number][] = [
  [-0.1, 0.88, 1.1, 0.82],
  [-0.1, 0.46, 1.1, 0.4],
  [0.52, -0.1, 0.56, 1.1],
];
const PARKS: readonly [number, number, number, number][] = [
  [0.58, 0.64, 0.2, 0.12],
  [0.04, 0.18, 0.16, 0.1],
];

interface Pt {
  x: number;
  y: number;
}

/** Finds the point `t` (0 to 1) along a polyline, and splits the line there. */
function locate(pts: Pt[], t: number) {
  const lens: number[] = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    lens.push(l);
    total += l;
  }
  let target = Math.min(1, Math.max(0, t)) * total;
  let seg = 0;
  while (seg < lens.length - 1 && target > lens[seg]) {
    target -= lens[seg];
    seg++;
  }
  const a = pts[seg];
  const b = pts[seg + 1];
  const f = lens[seg] === 0 ? 0 : Math.min(1, target / lens[seg]);
  const pos = { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
  const bearing = (Math.atan2(b.x - a.x, -(b.y - a.y)) * 180) / Math.PI;
  return {
    pos,
    bearing,
    done: [...pts.slice(0, seg + 1), pos],
    remaining: [pos, ...pts.slice(seg + 1)],
  };
}

const pathOf = (pts: Pt[]) =>
  pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

interface PinProps {
  at: Pt;
  bg: string;
  ring: string;
  size?: number;
  children: React.ReactNode;
}

function Pin({ at, bg, ring, size = 34, children }: PinProps) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.pin,
        {
          left: at.x - size / 2,
          top: at.y - size / 2,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          borderColor: ring,
        },
      ]}
    >
      {children}
    </View>
  );
}

export default function RouteMap({
  variant = "light",
  route,
  progress,
  driverAt,
  driverBearing = 35,
  startKind = "origin",
  endKind = "dropoff",
  zones,
  inset,
  style,
  children,
}: Props) {
  const th = THEME[variant];
  const [size, setSize] = useState({ w: 0, h: 0 });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) =>
      prev.w === width && prev.h === height ? prev : { w: width, h: height },
    );
  };

  const { w, h } = size;
  const top = inset?.top ?? 0;
  const bottom = inset?.bottom ?? 0;
  const innerH = Math.max(h - top - bottom, 0);
  const toPx = (p: MapPoint): Pt => ({ x: p.x * w, y: top + p.y * innerH });

  const pts = route && route.length >= 2 ? route.map(toPx) : null;
  const moving = pts && progress !== undefined ? locate(pts, progress) : null;
  const driverPx = moving ? moving.pos : driverAt ? toPx(driverAt) : null;
  const bearing = moving ? moving.bearing : driverBearing;

  return (
    <View
      style={[styles.root, { backgroundColor: th.bg }, style]}
      onLayout={onLayout}
    >
      {w > 0 && h > 0 && (
        <>
          <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
            {PARKS.map(([x, y, pw, ph], i) => (
              <Rect
                key={`p${i}`}
                x={x * w}
                y={y * h}
                width={pw * w}
                height={ph * h}
                rx={18}
                fill={th.park}
              />
            ))}
            {MINOR.map(([x1, y1, x2, y2], i) => (
              <Line
                key={`n${i}`}
                x1={x1 * w}
                y1={y1 * h}
                x2={x2 * w}
                y2={y2 * h}
                stroke={th.minor}
                strokeWidth={9}
                strokeLinecap="round"
              />
            ))}
            {MAJOR.map(([x1, y1, x2, y2], i) => (
              <Line
                key={`m${i}`}
                x1={x1 * w}
                y1={y1 * h}
                x2={x2 * w}
                y2={y2 * h}
                stroke={th.major}
                strokeWidth={16}
                strokeLinecap="round"
              />
            ))}

            {zones?.map((z, i) => (
              <Circle
                key={`z${i}`}
                cx={z.x * w}
                cy={z.y * h}
                r={z.r * Math.min(w, h)}
                fill={AMBER}
                fillOpacity={0.2}
                stroke={AMBER}
                strokeOpacity={0.5}
                strokeWidth={1.5}
              />
            ))}

            {pts && (
              <>
                <Path
                  d={pathOf(pts)}
                  stroke={th.casing}
                  strokeWidth={11}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                {moving ? (
                  <>
                    <Path
                      d={pathOf(moving.done)}
                      stroke={th.done}
                      strokeWidth={6}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                    <Path
                      d={pathOf(moving.remaining)}
                      stroke={th.route}
                      strokeWidth={6}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </>
                ) : (
                  <Path
                    d={pathOf(pts)}
                    stroke={th.route}
                    strokeWidth={6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                )}
              </>
            )}
          </Svg>

          {pts && startKind === "origin" && !moving && (
            <Pin at={pts[0]} bg={th.originBg} ring={th.ring} size={30}>
              <View style={[styles.dot, { backgroundColor: th.originDot }]} />
            </Pin>
          )}

          {pts && endKind === "pickup" && (
            <Pin at={pts[pts.length - 1]} bg={GREEN} ring={th.ring}>
              <MapPin size={17} strokeWidth={2.5} color="#FFFFFF" />
            </Pin>
          )}
          {pts && endKind === "dropoff" && (
            <Pin at={pts[pts.length - 1]} bg={th.endBg} ring={th.ring}>
              <Flag size={16} strokeWidth={2.5} color={th.endFg} />
            </Pin>
          )}

          {driverPx && (
            <Pin at={driverPx} bg={AMBER} ring={th.ring} size={38}>
              <View style={{ transform: [{ rotate: `${bearing}deg` }] }}>
                <Navigation2
                  size={18}
                  strokeWidth={2}
                  color="#FFFFFF"
                  fill="#FFFFFF"
                />
              </View>
            </Pin>
          )}
        </>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { overflow: "hidden" },
  pin: {
    position: "absolute",
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
