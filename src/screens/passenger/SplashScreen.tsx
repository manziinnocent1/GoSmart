import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../../components/Button";
import { ImageCarousel } from "../../components/ImageCarousel";
import { GALLERY_IMAGES } from "../../constants/galleryImages";
import { colors, radius, spacing, typography } from "../../theme";

const KIGALI_MAP = require("../../../assets/images/kigali-city.jpeg");

type Language = "RW" | "EN" | "FR";
const LANGUAGES: readonly Language[] = ["RW", "EN", "FR"];

const SHEET_OVERLAP = 36;

interface Props {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export default function SplashScreen({ onGetStarted, onSignIn }: Props) {
  const [language, setLanguage] = useState<Language>("EN");
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const heroHeight = height * 0.42;
  const galleryHeight = Math.min(Math.max(height * 0.16, 110), 150);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Hero: clean photo, neutral dark scrim (no blue), centered description */}
      <View style={[styles.hero, { height: heroHeight }]}>
        <Image
          source={KIGALI_MAP}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
        <View style={styles.scrim} />

        <View style={[styles.topRow, { paddingTop: insets.top + spacing.sm }]}>
          <View style={styles.brand}>
            <View style={styles.brandMark}>
              <Text style={styles.brandLetter}>G</Text>
            </View>
            <Text style={styles.brandName}>GoSmart</Text>
          </View>

          <View style={styles.langSwitch}>
            {LANGUAGES.map((code) => (
              <Pressable
                key={code}
                onPress={() => setLanguage(code)}
                style={[styles.langBtn, language === code && styles.langActive]}
              >
                <Text
                  style={[
                    styles.langText,
                    language === code && styles.langTextActive,
                  ]}
                >
                  {code}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.heroCenter}>
          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionKicker}>WHY GOSMART</Text>
            <Text style={styles.descriptionText}>
              Simplify your daily commute with the smartest way to move across
              Kigali. Tap once to book and watch a trusted driver arrive at your
              exact location in minutes. Enjoy clear, transparent pricing with
              no surprise charges, and pay instantly with MoMo or card.
            </Text>
          </View>
        </View>
      </View>

      <View
        style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}
      >
        <Text style={styles.headline}>
          Move smart across the hills of Kigali.
        </Text>
        <Text style={styles.subtitle}>
          Muraho! Safe moto and car rides, paid with MoMo or cash.
        </Text>

        <View style={styles.gallery}>
          <ImageCarousel images={GALLERY_IMAGES} height={galleryHeight} />
        </View>

        <View style={styles.actions}>
          <Button label="Get started" onPress={onGetStarted} />
          <Text style={styles.accountText}>
            Already have an account?{" "}
            <Text style={styles.accountLink} onPress={onSignIn}>
              Log in
            </Text>
          </Text>
        </View>

        <Text style={styles.legal}>
          By continuing you accept our Terms and Privacy Policy.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  hero: { width: "100%", backgroundColor: colors.ink },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,7,12,0.5)",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  brand: { flexDirection: "row", alignItems: "center" },
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.blue,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  brandLetter: { color: colors.white, fontSize: 19, fontWeight: "900" },
  brandName: {
    color: colors.white,
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  langSwitch: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: radius.pill,
    padding: 3,
  },
  langBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  langActive: { backgroundColor: colors.white },
  langText: { color: colors.white, fontSize: 12, fontWeight: "700" },
  langTextActive: { color: colors.ink },
  heroCenter: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: SHEET_OVERLAP,
  },
  descriptionCard: {
    backgroundColor: "rgba(5,7,12,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  descriptionKicker: {
    ...typography.caption,
    color: "#9FB6FF",
    fontWeight: "800",
    letterSpacing: 1.6,
    marginBottom: spacing.sm,
  },
  descriptionText: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 21,
    color: colors.white,
    textAlign: "center",
  },
  sheet: {
    flex: 1,
    marginTop: -SHEET_OVERLAP,
    backgroundColor: colors.white,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl + 4,
  },
  headline: {
    ...typography.title,
    fontSize: 28,
    lineHeight: 33,
    color: colors.ink,
    textAlign: "center",
  },
  subtitle: {
    ...typography.body,
    color: colors.muted,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  gallery: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    marginHorizontal: -spacing.xl,
  },
  actions: { marginTop: spacing.md, gap: spacing.sm },
  accountText: {
    ...typography.body,
    color: colors.ink,
    textAlign: "center",
    marginTop: spacing.xs,
    fontSize: 16,
    lineHeight: 22,
  },
  accountLink: { color: colors.blue, fontWeight: "700" },
  legal: {
    ...typography.caption,
    color: colors.muted,
    textAlign: "center",
    marginTop: spacing.xs,
  },
});
