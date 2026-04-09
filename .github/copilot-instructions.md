# Copilot Instructions

## Repository scope

- The shipping app lives in `focus-detox/`. Treat that as the working application directory for code changes.
- The repository root also contains product planning/context docs. `AGENTS.md` is the main project brief and explains the product goals, target users, and planned feature set.
- This is an Expo + React Native mobile app. `npm run web` exists because Expo provides it, but the product target is Android/iOS only.

## Commands

Run commands from `E:\Project\fomo\focus-detox`.

| Purpose | Command |
| --- | --- |
| Start Expo dev server | `npm start` |
| Open on Android | `npm run android` |
| Open on iOS | `npm run ios` |
| Open web preview | `npm run web` |

There are currently no dedicated `build`, `lint`, `test`, or single-test scripts in `package.json`.

## High-level architecture

- `App.tsx` is the root composition point: `SafeAreaProvider` -> `AppProvider` -> `NavigationContainer` -> `TabNavigator`. Splash screen hiding is tied to app-state initialization, so the app intentionally returns `null` while persisted data is loading.
- `src/context/AppContext.tsx` is the central state layer. It owns:
  - persisted `userData`
  - global loading/error state
  - derived `todayTasks`
  - reducer actions for low-stim completions, boredom sessions, exam reset records, and streak updates
- Persistence is handled through `src/utils/storage.ts` with AsyncStorage. The main durable record is a single `UserData` object containing `settings` plus `stats` arrays for:
  - low-stim window completions
  - boredom training sessions
  - exam reset records
- `src/navigation/TabNavigator.tsx` defines a single bottom-tab shell with five feature areas: `Home`, `LowStim`, `Training`, `ExamReset`, and `Profile`.
- `src/constants/index.ts` is the shared source for design tokens and domain catalog data such as `Colors`, `DEFAULT_SETTINGS`, boredom training types, achievements, and micro-reset actions.
- Screens in `src/screens/` own their local flow state and animations, while durable app data flows through `useApp()` from the context layer.

## Key conventions

- Keep user-facing copy in Chinese. Existing labels, headers, prompts, and tab titles are Chinese throughout the app.
- Follow the existing mobile screen pattern: `SafeAreaView` from `react-native-safe-area-context`, dark theme colors from `Colors`, `StatusBar barStyle="light-content"`, and screen-local `StyleSheet.create(...)`.
- Add or change persisted behavior through `AppContext` actions and helpers instead of having screens write to AsyncStorage directly. The current write path is reducer-driven and calls `saveUserData(...)` from the context layer.
- When changing navigation, update both `RootTabParamList` in `src/types/index.ts` and the tab registration in `src/navigation/TabNavigator.tsx`.
- Date records are stored as `YYYY-MM-DD` strings via `getTodayString()` / `formatDate()`. Keep that format consistent for streaks, daily stats, and history queries.
- Duration units are mixed by design: individual boredom sessions store `duration` in seconds, while `totalBoredomMinutes` is aggregated and stored in minutes.
- Feature flows often use explicit local mode unions such as `'list' | 'countdown'` or `'select' | 'intro' | 'training' | 'complete'` plus timer/animation refs. Extend those flows in the same style instead of introducing unrelated state management patterns.
- If a value is reused across screens and is part of the product domain or theme, add it to `src/constants/index.ts` rather than hardcoding another copy inside a screen.
