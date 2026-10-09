import type { DemandZone, MapPoint } from "../../components/RouteMap";

/* ---------- Types ---------- */

export type VehicleKind = "moto" | "car" | "xl";
export type PayKind = "cash" | "momo";

export const KIND_LABEL: Record<VehicleKind, string> = {
  moto: "Moto",
  car: "Car",
  xl: "XL Van",
};

export interface DriverProfile {
  name: string;
  firstName: string;
  initials: string;
  kind: VehicleKind;
  vehicle: string;
  plate: string;
  rating: number;
  trips: number;
  since: string;
  phone: string;
  /** Where cash outs are sent. */
  payoutNumber: string;
}

export interface RideRequest {
  id: string;
  tier: VehicleKind;
  passenger: { name: string; rating: number; trips: number; phone: string };
  pickup: string;
  pickupArea: string;
  dropoff: string;
  /** Distance and time from the driver to the pickup point. */
  pickupKm: number;
  pickupMin: number;
  /** Distance and time of the trip itself. */
  tripKm: number;
  tripMin: number;
  fareRwf: number;
  payment: PayKind;
  surge?: number;
  /** The passenger's 4-digit trip PIN. In production your backend checks it. */
  pin: string;
}

export type HistoryItem =
  | {
      id: string;
      kind: "trip";
      when: string;
      title: string;
      tier: VehicleKind;
      fare: number;
      commission: number;
      payment: PayKind;
    }
  | { id: string; kind: "cashout"; when: string; amount: number };

/* ---------- Business rules (change these to match your pricing) ---------- */

export const COMMISSION_RATE = 0.15;
export const DAILY_GOAL = 30000;
export const YESTERDAY_EARNINGS = 20800;
export const MIN_CASHOUT = 1000;
export const REQUEST_SECONDS = 15;
export const FREE_WAIT_SECONDS = 180;
export const PIN_ATTEMPTS = 5;
/** How close to the destination (0 to 1) before "I've arrived" unlocks. */
export const ARRIVE_AT = 0.9;
/** Demo only: 1 real second moves the map by this many simulated seconds. */
export const SIM_SPEED = 20;

export const commissionOf = (fare: number) =>
  Math.round(fare * COMMISSION_RATE);
export const netOf = (fare: number) => fare - commissionOf(fare);
export const firstNameOf = (full: string) => full.split(" ")[0];

const pad = (n: number) => String(n).padStart(2, "0");
export const clockNow = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/* ---------- Demo data ---------- */

export const DRIVER: DriverProfile = {
  name: "Jean-Paul Nshuti",
  firstName: "Jean-Paul",
  initials: "JN",
  kind: "moto",
  vehicle: "Red TVS Apache",
  plate: "RAE 452 B",
  rating: 4.92,
  trips: 1284,
  since: "Mar 2024",
  phone: "+250 788 555 012",
  payoutNumber: "078 ••• 012",
};

type RequestTemplate = Omit<RideRequest, "id">;

const TEMPLATES: RequestTemplate[] = [
  {
    tier: "moto",
    passenger: {
      name: "Alice U.",
      rating: 4.9,
      trips: 86,
      phone: "+250788123456",
    },
    pickup: "KN 5 Rd, Kimironko",
    pickupArea: "Kimironko",
    dropoff: "Kigali Heights",
    pickupKm: 2.1,
    pickupMin: 4,
    tripKm: 4.8,
    tripMin: 14,
    fareRwf: 1200,
    payment: "momo",
    surge: 1.2,
    pin: "4827",
  },
  {
    tier: "moto",
    passenger: {
      name: "Eric N.",
      rating: 4.8,
      trips: 41,
      phone: "+250788200300",
    },
    pickup: "KG 9 Ave, Remera",
    pickupArea: "Remera",
    dropoff: "Kigali Convention Centre",
    pickupKm: 1.4,
    pickupMin: 3,
    tripKm: 3.6,
    tripMin: 11,
    fareRwf: 1000,
    payment: "cash",
    pin: "1593",
  },
  {
    tier: "moto",
    passenger: {
      name: "Diane M.",
      rating: 5.0,
      trips: 212,
      phone: "+250788400500",
    },
    pickup: "KK 15 Rd, Kicukiro",
    pickupArea: "Kicukiro",
    dropoff: "Nyabugogo Taxi Park",
    pickupKm: 2.8,
    pickupMin: 5,
    tripKm: 7.2,
    tripMin: 22,
    fareRwf: 1800,
    payment: "momo",
    pin: "7314",
  },
];

/** Picks the next demo request. Skips cash rides if the driver turned them off. */
export function makeRequest(counter: number, acceptCash: boolean): RideRequest {
  const pool = acceptCash
    ? TEMPLATES
    : TEMPLATES.filter((t) => t.payment !== "cash");
  const tpl = pool[counter % pool.length];
  return { ...tpl, id: `req-${counter}-${Date.now()}` };
}

export const INITIAL_HISTORY: HistoryItem[] = [
  {
    id: "h1",
    kind: "trip",
    when: "11:42",
    title: "Kacyiru → Downtown",
    tier: "moto",
    fare: 900,
    commission: 135,
    payment: "momo",
  },
  {
    id: "h2",
    kind: "trip",
    when: "10:58",
    title: "Remera → Gisozi",
    tier: "moto",
    fare: 1500,
    commission: 225,
    payment: "cash",
  },
  {
    id: "h3",
    kind: "trip",
    when: "10:15",
    title: "Kimironko → Nyabugogo",
    tier: "moto",
    fare: 1800,
    commission: 270,
    payment: "momo",
  },
  {
    id: "h4",
    kind: "trip",
    when: "09:30",
    title: "Gikondo → Kicukiro",
    tier: "moto",
    fare: 1100,
    commission: 165,
    payment: "cash",
  },
];

/** Earnings for each day of the week (Mon to Sun) before today. */
export const PAST_DAYS = [18200, 21400, 16800, 23900, 26100, 31200, 19800];

/* ---------- Map data ---------- */

/** From the driver's start point to the pickup point. */
export const PICKUP_ROUTE: MapPoint[] = [
  { x: 0.12, y: 0.9 },
  { x: 0.2, y: 0.78 },
  { x: 0.3, y: 0.68 },
  { x: 0.34, y: 0.56 },
];

/** From the pickup point to the dropoff point. */
export const TRIP_ROUTE: MapPoint[] = [
  { x: 0.34, y: 0.56 },
  { x: 0.44, y: 0.5 },
  { x: 0.56, y: 0.44 },
  { x: 0.66, y: 0.32 },
  { x: 0.78, y: 0.22 },
  { x: 0.88, y: 0.1 },
];

export const DEMAND_ZONES: DemandZone[] = [
  { x: 0.72, y: 0.3, r: 0.22 },
  { x: 0.28, y: 0.72, r: 0.14 },
];

/* ---------- Turn-by-turn steps (demo) ---------- */

export type TurnKind = "right" | "left" | "straight" | "arrive";

export interface TurnStep {
  kind: TurnKind;
  text: string;
  road: string;
}

export const PICKUP_STEPS: TurnStep[] = [
  { kind: "right", text: "Turn right", road: "onto KN 3 Rd" },
  { kind: "straight", text: "Continue straight", road: "on KG 11 Ave" },
  { kind: "left", text: "Turn left", road: "onto KN 5 Rd toward Kimironko" },
  { kind: "arrive", text: "Arrive at pickup", road: "" },
];

export const TRIP_STEPS: TurnStep[] = [
  { kind: "straight", text: "Head north", road: "on KN 5 Rd" },
  { kind: "right", text: "Turn right", road: "onto KG 7 Ave" },
  { kind: "left", text: "Turn left", road: "onto KG 2 Ave toward Kacyiru" },
  { kind: "arrive", text: "Arrive at dropoff", road: "" },
];
