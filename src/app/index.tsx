import { useState } from "react";

import type { RideTierId } from "@/constants/rideTiers";
import { DriverHomeScreen } from "@/screens/driver";
import {
  HomeScreen,
  LoginScreen,
  RegisterScreen,
  RideOptionsScreen,
  SplashScreen,
} from "@/screens/passenger";

type Step =
  | "splash"
  | "register"
  | "login"
  | "passengerHome"
  | "rideOptions"
  | "driverHome";

export default function Index() {
  const [step, setStep] = useState<Step>("splash");
  const [tier, setTier] = useState<RideTierId>("moto");

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
            setTier(selectedTier);
            setStep("rideOptions");
          }}
        />
      );
    case "rideOptions":
      return (
        <RideOptionsScreen
          initialTier={tier}
          onBack={() => setStep("passengerHome")}
          onConfirm={async (confirmedTier) => {
            // TODO: send the ride request to your backend,
            // then move to a "Finding your driver" step.
            console.log("Ride confirmed:", confirmedTier);
          }}
        />
      );
    case "driverHome":
      return <DriverHomeScreen onLogout={() => setStep("splash")} />;
  }
}
