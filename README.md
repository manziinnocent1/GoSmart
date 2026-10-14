# GoSmart

GoSmart is a cross-platform ride-booking app prototype for passengers, drivers, and operations staff. It is built with React Native, Expo, TypeScript, and Expo Router, with a web target as well as iOS and Android targets.

The app currently demonstrates the main user journeys and admin screens. It is a front-end prototype: connect and secure production services before using it to manage real users, rides, payments, or support requests.

## What the app includes

- **Passenger experience:** onboarding, sign-in and registration screens, ride selection, driver search, trip status, payment flows, profile, and settings.
- **Driver experience:** driver dashboard, incoming ride requests, trip navigation and completion, account details, and earnings.
- **Admin experience:** operations overview, driver onboarding, pricing and surge controls, and a support inbox for reviewing and replying to sample tickets.
- **Cross-platform UI:** built with React Native and Expo Router to support web and native app workflows.

Some app data and interactions are demo-only and held in memory. They are not persisted to a backend, and some screens use sample ride, driver, and ticket information.

## Requirements

- Node.js (use a current LTS release) and npm.
- Git, if you are cloning the repository.
- For native builds: Xcode on macOS for iOS, or Android Studio and the Android SDK for Android.
- For a quick device preview: Expo Go, subject to compatibility with this project's Expo SDK and any native module requirements.

## Get started

Run these commands from the project directory (the folder containing `package.json`):

```bash
git clone <repository-url>
cd gosmart
npm install
npm start
```

If you already have the project files, start at `npm install`. The `npm start` command launches the Expo development server. Use the options printed in the terminal to open the app:

- Press **w** to open the web app.
- Press **a** to open an Android emulator.
- Press **i** to open an iOS simulator (requires macOS and Xcode).
- Scan the QR code with Expo Go to preview on a device when supported.

You can also start a specific target with the package scripts:

```bash
npm run web
npm run android
npm run ios
```

The native `ios` and `android` scripts build/run the native app and require their respective development toolchains. If Metro serves stale cached code, stop the server and restart it with `npx expo start --clear`.

## Local environment configuration

The app reads configuration from environment variables prefixed with `EXPO_PUBLIC_`. To enable the local demo admin sign-in, create a `.env.local` file in the project root:

```dotenv
EXPO_PUBLIC_ADMIN_EMAIL=admin@example.com
EXPO_PUBLIC_ADMIN_PASSWORD=replace-with-a-local-demo-password
```

Use only throwaway values for local development. The admin screen checks these values in the client app; because `EXPO_PUBLIC_` variables are bundled into client code, this is **not secure authentication**. Do not use real or production admin credentials here. A production app must authenticate and authorize admins on a trusted server.

Google sign-in can also be configured with OAuth client IDs:

```dotenv
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-android-client-id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id
```

Create the client IDs in your Google Cloud project and configure the appropriate OAuth consent screen and platform settings. These values identify OAuth clients; do not put private keys, client secrets, service-account credentials, or other secrets in `EXPO_PUBLIC_` variables. Google sign-in requires valid platform configuration and should be verified end to end before relying on it.

After changing environment variables, restart Expo so the new values are loaded. `.env.local` is ignored by Git; never commit credentials.

## Useful commands

| Command | Description |
| --- | --- |
| `npm start` | Start the Expo development server. |
| `npm run web` | Start the app targeting web. |
| `npm run android` | Build/run on Android using the local Android toolchain. |
| `npm run ios` | Build/run on iOS using Xcode on macOS. |
| `npm run lint` | Run the project's Expo/ESLint checks. |
| `npm run reset-project` | Run the Expo starter reset script. Review the script before using it; it is not needed for normal development. |

## Project structure

```text
src/
  app/                  Expo Router routes and root layout
  components/           Shared UI components
  constants/            App constants, themes, and ride tiers
  context/              Shared app settings/context
  screens/
    passenger/          Passenger screens
    driver/             Driver screens and sample driver data
    admin/              Admin dashboard, pricing, onboarding, and support
  hooks/                Reusable React hooks
  utils/                Shared utilities
assets/                 App images, icons, and other static assets
```

The root route (`src/app/index.tsx`) coordinates the passenger and driver demo journeys. The admin route is at `/admin` (`src/app/admin.tsx`), reached from the sign-in entry screen. The root navigation layout is in `src/app/_layout.tsx`.

## Current integration status

This repository contains UI and demo flows, not a complete production ride-hailing backend. Before a real launch, add and test trusted services for account creation and sign-in, role-based access control, trip dispatch and location, payment processing and refunds, durable data storage, and support operations. The current admin credentials are checked on-device, and several ride, driver, pricing, and support actions are simulated; do not treat them as real operational or financial actions.

## Tech stack

- Expo SDK 57 and Expo Router
- React Native 0.86 and React 19
- TypeScript 6
- `lucide-react-native` icons
- ESLint with the Expo configuration

Dependency versions and available scripts are defined in `package.json`.

## Further reading

- [Expo documentation](https://docs.expo.dev/)
- [Expo Router documentation](https://docs.expo.dev/router/introduction/)
- [React Native documentation](https://reactnative.dev/docs/getting-started)
- [Expo environment variables](https://docs.expo.dev/guides/environment-variables/)
