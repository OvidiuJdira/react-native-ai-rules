# AI Rules — React Native Mobile App (`apps/mobile`)

These instructions apply when working inside `apps/mobile/`. They supplement the root CLAUDE.md rules.

## Project Structure

```
apps/mobile/
├── src/
│   ├── app/              # App entry, providers, navigation root
│   ├── screens/          # Screen components (one per route)
│   ├── components/       # Mobile-specific UI components
│   ├── hooks/            # Mobile-specific custom hooks
│   ├── services/         # Native module wrappers, push notifications, etc.
│   ├── navigation/       # React Navigation setup, types, navigators
│   ├── utils/            # Mobile-specific utilities
│   └── types/            # Mobile-specific type definitions
├── ios/                  # Native iOS project
├── android/              # Native Android project
├── __tests__/            # Integration / E2E tests
├── metro.config.js
├── app.json
└── package.json
```

## React Native Rules

### Navigation
- Use React Navigation (not Expo Router unless the project already uses it).
- Define all route param types in `navigation/types.ts`.
- Every navigator is in its own file: `navigation/MainTabNavigator.tsx`, `navigation/AuthStackNavigator.tsx`.
- Use typed `useNavigation<ScreenNavigationProp>()` and `useRoute<ScreenRouteProp>()` — never use untyped versions.
- Screen components are default exports (React Navigation convention).

### Components
- Mobile-specific components live in `src/components/`. Shared components come from `@project/ui`.
- Use `StyleSheet.create()` for styles — no inline styles except for dynamic values.
- Never use `px` or fixed pixel values for text sizes — use a scale utility or theme.
- Respect safe area insets: wrap screens with `SafeAreaView` or use `useSafeAreaInsets()`.
- Use `Platform.select()` for platform-specific logic, not `Platform.OS === 'ios'` in conditionals.

### Platform-Specific Code
- When platform logic is more than 3 lines, use platform-specific files: `Component.ios.tsx` / `Component.android.tsx`.
- Native module bridges go in `src/services/` with a TypeScript interface.
- Always handle the case where a native module might not be available (dev mode, simulators).

### Performance
- Use `FlatList` (not `ScrollView`) for lists longer than 10 items.
- Set `keyExtractor`, `getItemLayout` (if fixed height), and `windowSize` on FlatList.
- Use `React.memo` on FlatList `renderItem` components.
- Avoid anonymous functions in `renderItem` — extract to a named component.
- Images: use `FastImage` (or equivalent) for network images. Always specify dimensions.
- Animations: prefer `Reanimated` over `Animated` API. Run animations on the UI thread.

### State Management
- Use the project's state management library (Zustand / Redux Toolkit / etc.) for global state.
- Use React Query / TanStack Query for server state.
- Local component state with `useState` is fine for UI-only state.
- Never store navigation state in global state.

### Testing
- Use `@testing-library/react-native` for component tests.
- Mock native modules in `jest.setup.js`, not inline in tests.
- Test user interactions (press, swipe) not implementation details.
- Snapshot tests only for design-system components, not screens.

### Common Pitfalls to Avoid
- **NEVER** use `console.log` in committed code — use a logger utility.
- **NEVER** hardcode API URLs — use environment config.
- **NEVER** store sensitive data in AsyncStorage — use Keychain/Keystore.
- **NEVER** use `setTimeout` for navigation timing — use navigation events.
- **NEVER** skip error handling for native module calls — they can throw platform-specific errors.

### Build & Release
- Don't modify `ios/` or `android/` native files unless absolutely necessary. Prefer configuration via `app.json` or native config plugins.
- After any native dependency change, run `cd ios && pod install`.
- Test on both iOS and Android before marking a task complete.
