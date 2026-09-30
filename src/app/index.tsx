import { useState } from "react";

import { DriverHomeScreen } from "@/screens/driver";
import {
  HomeScreen,
  LoginScreen,
  RegisterScreen,
  SplashScreen,
} from "@/screens/passenger";

type Step = "splash" | "register" | "login" | "passengerHome" | "driverHome";

export default function Index() {
  const [step, setStep] = useState<Step>("splash");

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
          onFindRide={(tier) => console.log("Ride requested:", tier)}
        />
      );
    case "driverHome":
      return <DriverHomeScreen onLogout={() => setStep("splash")} />;
  }
}
