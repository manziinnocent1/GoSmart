import { DefaultTheme, Stack, ThemeProvider } from "expo-router";

export default function RootLayout() {
  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack
        screenOptions={{ headerShown: false, animation: "slide_from_right" }}
      />
    </ThemeProvider>
  );
}
