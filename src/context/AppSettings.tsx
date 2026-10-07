import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useColorScheme } from "react-native";

/* ---------- Types ---------- */

export type ThemeMode = "light" | "dark" | "system";
export type Language = "rw" | "en" | "fr";
export type PaymentKind = "mtn" | "airtel" | "cash";

export interface Palette {
  bg: string;
  card: string;
  ink: string;
  muted: string;
  border: string;
  soft: string;
  hero: string;
  onHero: string;
  mutedOnHero: string;
  green: string;
  greenSoft: string;
  greenInk: string;
  amber: string;
  red: string;
  inputBg: string;
  scrim: string;
}

export interface UserProfile {
  name: string;
  phone: string;
  email: string;
}

export interface PaymentMethod {
  id: string;
  kind: PaymentKind;
  /** Local format, e.g. 0788123456. Not used for cash. */
  number?: string;
  custom?: boolean;
}

/* ---------- Palettes ---------- */

const LIGHT: Palette = {
  bg: "#EEF0F4",
  card: "#FFFFFF",
  ink: "#111F3F",
  muted: "#6B7488",
  border: "#DDE1EA",
  soft: "#E8ECF4",
  hero: "#111F3F",
  onHero: "#FFFFFF",
  mutedOnHero: "#A9B4CE",
  green: "#4FB27E",
  greenSoft: "#E1F3E9",
  greenInk: "#2E7D55",
  amber: "#F5A03C",
  red: "#E5484D",
  inputBg: "#F3F5F9",
  scrim: "rgba(6,14,34,0.55)",
};

const DARK: Palette = {
  bg: "#060E22",
  card: "#101A36",
  ink: "#FFFFFF",
  muted: "#8F9BB8",
  border: "#1E2B4F",
  soft: "#1A2547",
  hero: "#1B2D5C",
  onHero: "#FFFFFF",
  mutedOnHero: "#A9B4CE",
  green: "#4FB27E",
  greenSoft: "rgba(79,178,126,0.16)",
  greenInk: "#6FD39C",
  amber: "#F5A03C",
  red: "#FF6B6B",
  inputBg: "#0B1530",
  scrim: "rgba(0,0,0,0.65)",
};

/* ---------- Translations (used by the Payment, Profile and Settings screens) ---------- */

const EN = {
  // Payment
  // Tabs
  tab_home: "Home",
  tab_ride: "Find ride",
  tab_trip: "My ride",
  tab_profile: "Profile",
  tab_settings: "Settings",
  payment: "Payment",
  payment_sub: "Choose how you pay for every trip.",
  default: "Default",
  instant_debit: "Instant debit",
  mobile_money: "Mobile money",
  cash: "Cash • RWF",
  pay_driver: "Pay driver directly",
  add_momo: "+ Add new MoMo number",
  save_payment: "Save Payment",
  new_number: "New MoMo number",
  provider: "Provider",
  phone_number: "Phone number",
  add_number: "Add number",
  cancel: "Cancel",
  remove: "Remove",
  remove_q: "Remove this payment method?",
  invalid_phone: "Enter a 10-digit number, for example 0788123456.",
  wrong_prefix_mtn: "MTN numbers start with 078 or 079.",
  wrong_prefix_airtel: "Airtel numbers start with 072 or 073.",
  exists: "This number is already added.",
  // Profile
  profile: "Profile",
  passenger: "Passenger",
  ride_history: "Ride history",
  trips: "trips",
  no_rides: "No rides yet. Your trips will show up here.",
  saved_places: "Saved places",
  payment_methods: "Payment methods",
  safety_center: "Safety center",
  sos_on: "SOS on",
  log_out: "Log out",
  log_out_q: "Log out of GoSmart?",
  coming_soon: "Coming soon",
  coming_soon_msg: "This section isn't available yet.",
  // Settings
  settings: "Settings",
  theme_mode: "Theme mode",
  theme_sub: "Light for sun, dark for night rides",
  light: "Light",
  dark: "Dark",
  system: "System",
  language: "Language",
  profile_info: "Profile",
  full_name: "Full name",
  phone: "Phone number",
  email: "Email",
  save_changes: "Save changes",
  saved: "Saved",
  notifications: "Notifications",
  ride_updates: "Ride updates",
  ride_updates_sub: "Driver arrival, trip status",
  promotions: "Offers and promos",
  promotions_sub: "Discounts and news",
  err_name: "Enter your full name.",
  err_email: "Enter a valid email address.",
};

type Key = keyof typeof EN;

const FR: Record<Key, string> = {
  tab_home: "Accueil",
  tab_ride: "Course",
  tab_trip: "Ma course",
  tab_profile: "Profil",
  tab_settings: "Paramètres",
  payment: "Paiement",
  payment_sub: "Choisissez comment payer chaque course.",
  default: "Par défaut",
  instant_debit: "Débit instantané",
  mobile_money: "Mobile money",
  cash: "Espèces • RWF",
  pay_driver: "Payer le chauffeur directement",
  add_momo: "+ Ajouter un numéro MoMo",
  save_payment: "Enregistrer le paiement",
  new_number: "Nouveau numéro MoMo",
  provider: "Opérateur",
  phone_number: "Numéro de téléphone",
  add_number: "Ajouter le numéro",
  cancel: "Annuler",
  remove: "Supprimer",
  remove_q: "Supprimer ce moyen de paiement ?",
  invalid_phone: "Entrez un numéro à 10 chiffres, par exemple 0788123456.",
  wrong_prefix_mtn: "Les numéros MTN commencent par 078 ou 079.",
  wrong_prefix_airtel: "Les numéros Airtel commencent par 072 ou 073.",
  exists: "Ce numéro est déjà ajouté.",
  profile: "Profil",
  passenger: "Passager",
  ride_history: "Historique des courses",
  trips: "courses",
  no_rides: "Aucune course pour l'instant. Vos trajets apparaîtront ici.",
  saved_places: "Lieux enregistrés",
  payment_methods: "Moyens de paiement",
  safety_center: "Centre de sécurité",
  sos_on: "SOS activé",
  log_out: "Se déconnecter",
  log_out_q: "Se déconnecter de GoSmart ?",
  coming_soon: "Bientôt disponible",
  coming_soon_msg: "Cette section n'est pas encore disponible.",
  settings: "Paramètres",
  theme_mode: "Thème",
  theme_sub: "Clair le jour, sombre pour les courses de nuit",
  light: "Clair",
  dark: "Sombre",
  system: "Système",
  language: "Langue",
  profile_info: "Profil",
  full_name: "Nom complet",
  phone: "Numéro de téléphone",
  email: "E-mail",
  save_changes: "Enregistrer",
  saved: "Enregistré",
  notifications: "Notifications",
  ride_updates: "Suivi des courses",
  ride_updates_sub: "Arrivée du chauffeur, état du trajet",
  promotions: "Offres et promotions",
  promotions_sub: "Réductions et actualités",
  err_name: "Entrez votre nom complet.",
  err_email: "Entrez une adresse e-mail valide.",
};

// Kinyarwanda: please have a native speaker review these before release.
const RW: Record<Key, string> = {
  tab_home: "Ahabanza",
  tab_ride: "Shaka urugendo",
  tab_trip: "Urugendo rwanjye",
  tab_profile: "Umwirondoro",
  tab_settings: "Igenamiterere",
  payment: "Kwishyura",
  payment_sub: "Hitamo uko wishyura buri rugendo.",
  default: "Isanzwe",
  instant_debit: "Kwishyura ako kanya",
  mobile_money: "Mobile Money",
  cash: "Amafaranga mu ntoki • RWF",
  pay_driver: "Ishyura umushoferi mu buryo butaziguye",
  add_momo: "+ Ongeraho nimero ya MoMo",
  save_payment: "Bika uburyo bwo kwishyura",
  new_number: "Nimero nshya ya MoMo",
  provider: "Umuyoboro",
  phone_number: "Nimero ya telefone",
  add_number: "Ongeraho nimero",
  cancel: "Bireke",
  remove: "Kuramo",
  remove_q: "Kuramo ubu buryo bwo kwishyura?",
  invalid_phone: "Andika nimero y'imibare 10, urugero 0788123456.",
  wrong_prefix_mtn: "Nimero za MTN zitangira kuri 078 cyangwa 079.",
  wrong_prefix_airtel: "Nimero za Airtel zitangira kuri 072 cyangwa 073.",
  exists: "Iyi nimero yamaze kongerwaho.",
  profile: "Umwirondoro",
  passenger: "Umugenzi",
  ride_history: "Amateka y'ingendo",
  trips: "ingendo",
  no_rides: "Nta rugendo urakora. Ingendo zawe zizagaragara hano.",
  saved_places: "Ahabitswe",
  payment_methods: "Uburyo bwo kwishyura",
  safety_center: "Ikigo cy'umutekano",
  sos_on: "SOS irakora",
  log_out: "Sohoka",
  log_out_q: "Gusohoka muri GoSmart?",
  coming_soon: "Bidatinze",
  coming_soon_msg: "Iki gice nticiraboneka.",
  settings: "Igenamiterere",
  theme_mode: "Isura ya porogaramu",
  theme_sub: "Yoroheje ku manywa, yijimye nijoro",
  light: "Yoroheje",
  dark: "Yijimye",
  system: "Ukurikije telefone",
  language: "Ururimi",
  profile_info: "Umwirondoro",
  full_name: "Amazina yose",
  phone: "Nimero ya telefone",
  email: "Imeri",
  save_changes: "Bika impinduka",
  saved: "Byabitswe",
  notifications: "Imenyesha",
  ride_updates: "Amakuru y'urugendo",
  ride_updates_sub: "Uko umushoferi ageze, uko urugendo rumeze",
  promotions: "Ibyatanzwe n'amaturo",
  promotions_sub: "Igabanuka ry'ibiciro n'amakuru mashya",
  err_name: "Andika amazina yawe yose.",
  err_email: "Andika imeri nyayo.",
};

const STRINGS: Record<Language, Record<Key, string>> = {
  en: EN,
  fr: FR,
  rw: RW,
};

/* ---------- Helpers ---------- */

/**
 * Turns "+250 788 123 456", "250788123456" or "0788 123 456"
 * into "0788123456". Returns null if it isn't a valid Rwandan mobile number.
 */
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("250")) digits = "0" + digits.slice(3);
  return /^07[2389]\d{7}$/.test(digits) ? digits : null;
}

export interface MethodInfo {
  title: string;
  /** e.g. "•••• 456" */
  masked?: string;
  /** Short label for small badges, e.g. on the ride screen. */
  badge: string;
  badgeColor: string;
}

export function describeMethod(
  m: PaymentMethod,
  cashLabel: string,
): MethodInfo {
  const masked = m.number ? `•••• ${m.number.slice(-3)}` : undefined;
  switch (m.kind) {
    case "mtn":
      return {
        title: "MTN MoMo",
        masked,
        badge: "MoMo",
        badgeColor: "#2447FF",
      };
    case "airtel":
      return {
        title: "Airtel Money",
        masked,
        badge: "Airtel",
        badgeColor: "#D92D3A",
      };
    default:
      return { title: cashLabel, badge: "Cash", badgeColor: "#4FB27E" };
  }
}

/* ---------- Context ---------- */

interface Ctx {
  palette: Palette;
  isDark: boolean;
  themeMode: ThemeMode;
  setThemeMode: (m: ThemeMode) => void;
  language: Language;
  setLanguage: (l: Language) => void;
  t: (key: Key) => string;
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  methods: PaymentMethod[];
  selectedMethodId: string;
  selectedMethod: PaymentMethod;
  setSelectedMethodId: (id: string) => void;
  addMethod: (kind: "mtn" | "airtel", number: string) => string;
  removeMethod: (id: string) => void;
}

const AppSettingsContext = createContext<Ctx | null>(null);

const INITIAL_METHODS: PaymentMethod[] = [
  { id: "mtn-456", kind: "mtn", number: "0788123456" },
  { id: "airtel-789", kind: "airtel", number: "0732123789" },
  { id: "cash", kind: "cash" },
];

const INITIAL_PROFILE: UserProfile = {
  name: "Alice Uwase",
  phone: "+250 788 123 456",
  email: "alice@gmail.com",
};

export function AppSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const [language, setLanguage] = useState<Language>("en");
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [methods, setMethods] = useState<PaymentMethod[]>(INITIAL_METHODS);
  const [selectedMethodId, setSelectedMethodId] = useState("mtn-456");

  const isDark =
    themeMode === "dark" || (themeMode === "system" && systemScheme === "dark");

  const t = useCallback((key: Key) => STRINGS[language][key], [language]);

  const addMethod = useCallback((kind: "mtn" | "airtel", number: string) => {
    const id = `custom-${kind}-${number}`;
    setMethods((prev) => {
      const cash = prev.filter((m) => m.kind === "cash");
      const others = prev.filter((m) => m.kind !== "cash");
      return [...others, { id, kind, number, custom: true }, ...cash];
    });
    return id;
  }, []);

  const removeMethod = useCallback((id: string) => {
    setMethods((prev) => prev.filter((m) => m.id !== id || !m.custom));
    setSelectedMethodId((cur) => (cur === id ? "cash" : cur));
  }, []);

  const selectedMethod =
    methods.find((m) => m.id === selectedMethodId) ?? methods[0];

  const value = useMemo<Ctx>(
    () => ({
      palette: isDark ? DARK : LIGHT,
      isDark,
      themeMode,
      setThemeMode,
      language,
      setLanguage,
      t,
      profile,
      setProfile,
      methods,
      selectedMethodId,
      selectedMethod,
      setSelectedMethodId,
      addMethod,
      removeMethod,
    }),
    [
      isDark,
      themeMode,
      language,
      t,
      profile,
      methods,
      selectedMethodId,
      selectedMethod,
      addMethod,
      removeMethod,
    ],
  );

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings(): Ctx {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) {
    throw new Error("useAppSettings must be used inside <AppSettingsProvider>");
  }
  return ctx;
}
