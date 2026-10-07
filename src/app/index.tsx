import { useState } from "react";
import type { ReactElement } from "react";
import { Alert, StyleSheet, View } from "react-native";
import {
  SafeAreaInsetsContext,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import PassengerTabBar from "@/components/PassengerTabBar";
import type { TabId } from "@/components/PassengerTabBar";
import {
  AppSettingsProvider,
  describeMethod,
  useAppSettings,
} from "@/context/AppSettings";
import type { RideTierId } from "@/constants/rideTiers";
import { DriverHomeScreen } from "@/screens/driver";
import {
  HomeScreen,
  LoginScreen,
  MyRideScreen,
  PaymentScreen,
  ProfileScreen,
  RegisterScreen,
  RideOptionsScreen,
  RidePaymentScreen,
  SearchingDriverScreen,
  SettingsScreen,
  SplashScreen,
} from "@/screens/passenger";
import type { Booking } from "@/screens/passenger/MyRideScreen";
import type { Driver } from "@/screens/passenger/SearchingDriverScreen";

type Step =
  | "splash"
  | "register"
  | "login"
  | "passengerHome"
  | "rideOptions"
  | "searchingDriver"
  | "ridePayment"
  | "myRide"
  | "profile"
  | "settings"
  | "payment"
  | "driverHome";

// Screens that show the bottom tab bar, and which tab each one belongs to
const TAB_FOR_STEP: Partial<Record<Step, TabId>> = {
  passengerHome: "home",
  rideOptions: "ride",
  myRide: "trip",
  profile: "profile",
  settings: "settings",
};

const STEP_FOR_TAB: Record<TabId, Step> = {
  home: "passengerHome",
  ride: "rideOptions",
  trip: "myRide",
  profile: "profile",
  settings: "settings",
};

// Placeholder route labels, until you connect real pickup and destination
const PICKUP = "Kimironko";
const DESTINATION = "Kigali Heights";

export default function Index() {
  return (
    <AppSettingsProvider>
      <App />
    </AppSettingsProvider>
  );
}

function App() {
  const insets = useSafeAreaInsets();
  const { selectedMethod, t } = useAppSettings();

  const [step, setStep] = useState<Step>("splash");
  const [tier, setTier] = useState<RideTierId>("moto");
  const [price, setPrice] = useState(0);
  // The driver found while searching, and the confirmed (paid) booking
  const [driver, setDriver] = useState<Driver | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  // Where the Payment screen should return to
  const [paymentBack, setPaymentBack] = useState<Step>("profile");

  const method = describeMethod(selectedMethod, t("cash"));
  const logout = () => setStep("splash");

  const cancelSearch = () => {
    setDriver(null);
    setStep("passengerHome");
  };

  // Only one ride at a time: send the passenger to the ride they already have
  const blockIfBooked = (): boolean => {
    if (!booking) return false;
    Alert.alert(
      "You already have a ride",
      "Finish or cancel your current ride before booking another one.",
    );
    setStep("myRide");
    return true;
  };

  const renderScreen = (): ReactElement => {
    switch (step) {
      case "splash":
        return (
          <SplashScreen
            onGetStarted={() => setStep("register")}
            onSignIn={() => setStep("login")}
          />
        );
      case "register":
        return (
          <RegisterScreen
            onBack={() => setStep("splash")}
            onCreateAccount={(role) =>
              setStep(role === "driver" ? "driverHome" : "passengerHome")
            }
            onGoToLogin={() => setStep("login")}
          />
        );
      case "login":
        return (
          <LoginScreen
            onBack={() => setStep("splash")}
            onLogin={(role) =>
              setStep(role === "driver" ? "driverHome" : "passengerHome")
            }
            onCreateAccount={() => setStep("register")}
          />
        );
      case "passengerHome":
        return (
          <HomeScreen
            onFindRide={(selectedTier) => {
              if (blockIfBooked()) return;
              setTier(selectedTier);
              setStep("rideOptions");
            }}
          />
        );
      case "rideOptions":
        return (
          <RideOptionsScreen
            initialTier={tier}
            payment={{
              badge: method.badge,
              badgeColor: method.badgeColor,
              title: method.title,
              subtitle: method.masked,
            }}
            onBack={() => setStep("passengerHome")}
            onChangePayment={() => {
              setPaymentBack("rideOptions");
              setStep("payment");
            }}
            onConfirm={(confirmedTier, confirmedPrice) => {
              // TODO: send the ride request to your backend here.
              setTier(confirmedTier);
              setPrice(confirmedPrice);
              setDriver(null);
              setStep("searchingDriver");
            }}
          />
        );
      case "searchingDriver":
        return (
          <SearchingDriverScreen
            tier={tier}
            price={price}
            driver={driver}
            onDriverFound={setDriver}
            onConfirm={() => setStep("ridePayment")}
            onCancel={cancelSearch}
          />
        );
      case "ridePayment":
        // Needs a driver. If there isn't one, go back to the search screen.
        if (!driver) {
          return (
            <SearchingDriverScreen
              tier={tier}
              price={price}
              onDriverFound={setDriver}
              onCancel={cancelSearch}
            />
          );
        }
        return (
          <RidePaymentScreen
            tier={tier}
            price={price}
            driver={driver}
            method={{
              badge: method.badge,
              badgeColor: method.badgeColor,
              title: method.title,
              subtitle: method.masked,
              isCash: selectedMethod.kind === "cash",
            }}
            onBack={() => setStep("searchingDriver")}
            onChangePayment={() => {
              setPaymentBack("ridePayment");
              setStep("payment");
            }}
            onPaid={() => {
              // The ride is booked: save it and open the My ride tab
              setBooking({
                ref: `GS-${Math.floor(10000 + Math.random() * 90000)}`,
                tier,
                price,
                driver,
                method: {
                  title: method.title,
                  masked: method.masked,
                  isCash: selectedMethod.kind === "cash",
                },
                pickup: PICKUP,
                destination: DESTINATION,
                bookedAt: Date.now(),
              });
              setDriver(null);
              setStep("myRide");
            }}
            // TODO: replace with your real payment request, for example:
            // processPayment={() => api.requestMomoPayment({ amount: price })}
          />
        );
      case "myRide":
        return (
          <MyRideScreen
            booking={booking}
            onFindRide={() => setStep("rideOptions")}
            onCancel={() => {
              // TODO: tell your backend the ride was cancelled.
              setBooking(null);
              Alert.alert("Ride cancelled", "Your ride has been cancelled.");
            }}
            onSimulateArrival={
              __DEV__
                ? () =>
                    setBooking((b) =>
                      b
                        ? {
                            ...b,
                            bookedAt:
                              Date.now() - b.driver.etaMinutes * 60 * 1000,
                          }
                        : b,
                    )
                : undefined
            }
          />
        );
      case "profile":
        return (
          <ProfileScreen
            onSettings={() => setStep("settings")}
            onPayment={() => {
              setPaymentBack("profile");
              setStep("payment");
            }}
            onLogout={logout}
            onRidePress={(ride) =>
              Alert.alert(
                `${ride.from} → ${ride.to}`,
                `${ride.when} • ${ride.tier.toUpperCase()} • RWF ${ride.priceRwf.toLocaleString()}\nRated ${ride.rating.toFixed(1)}`,
              )
            }
          />
        );
      case "settings":
        return <SettingsScreen onLogout={logout} />;
      case "payment":
        return <PaymentScreen onBack={() => setStep(paymentBack)} />;
      case "driverHome":
        return <DriverHomeScreen onLogout={logout} />;
    }
  };

  const screen = renderScreen();
  const activeTab = TAB_FOR_STEP[step];

  // Full-screen steps (login, searching for a driver, payment...) have no tab bar
  if (!activeTab) return screen;

  return (
    <View style={styles.flex}>
      <View style={styles.flex}>
        {/* The tab bar already covers the bottom safe area, so the screen above it shouldn't add it again */}
        <SafeAreaInsetsContext.Provider value={{ ...insets, bottom: 0 }}>
          {screen}
        </SafeAreaInsetsContext.Provider>
      </View>
      <PassengerTabBar
        active={activeTab}
        tripBadge={!!booking}
        onChange={(id) => {
          if (id === "ride" && blockIfBooked()) return;
          setStep(STEP_FOR_TAB[id]);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
