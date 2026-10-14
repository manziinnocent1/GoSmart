import { useState } from "react";
import { useRouter } from "expo-router";
import AdminLoginScreen from "../screens/admin/AdminLoginScreen";
import AdminConsoleScreen from "../screens/admin/AdminConsoleScreen";

export default function AdminRoute() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);

  if (!authenticated) {
    return (
      <AdminLoginScreen
        onBack={() => router.back()}
        onAuthenticated={() => setAuthenticated(true)}
      />
    );
  }

  return <AdminConsoleScreen onExit={() => setAuthenticated(false)} />;
}
