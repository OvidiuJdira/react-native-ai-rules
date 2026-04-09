# @ewi/mobile — Rules

Presentation layer only. Consumes `@ewi/shared` — never creates domain models, API calls, mappers, or React Query hooks here.

> All critical rules (localization, dependency resolution, scoped translations, naming, theming, UIModel, hook composition, forms) are defined in the **root `CLAUDE.md`**. Below are mobile-specific patterns for applying them.

### Dependency resolution — mobile patterns

```typescript
import { scopedTranslations } from "@ewi/shared/localization";
const translateAuth = scopedTranslations("auth"); // mapper: resolved at module level
const { theme } = useTheme(); // hook: resolved inside hook
```

### Translations — mobile uses `scopedTranslations` (mappers) and `useTranslations` (hooks)

```typescript
import { scopedTranslations } from "@ewi/shared/localization";
const translateAuth = scopedTranslations("auth");
translateAuth("login.heading"); // in mapper (pure function)

import { useTranslations } from "@ewi/shared/localization";
const translateAuth = useTranslations("auth"); // in hook/component
```

## Consuming @ewi/shared

```typescript
import { useGetProductByIdUseCase, useAddToCartUseCase } from "@ewi/shared";
import { useCartStore } from "@ewi/shared";
import { useStore } from "zustand";
import { useTheme } from "@/features/theme"; // → features/theme/
import { scopedTranslations, useTranslations } from "@ewi/shared/localization"; // → features/presentation/localization/
import type { Product } from "@ewi/shared";

const { products } = useStore(useCartStore());
```

---

## Module Folder Structure

**Single-page features** — when a feature has only one page, files go directly under `features/[feature]/` (no `pages/` nesting):

```
features/[feature]/
├── index.tsx                            # UI only
├── use[Feature].ts                      # All logic, NO router
├── use[Feature]NavigationHandler.ts     # Owns router, reacts to navigation state
├── mapTo[Feature]UIModel.ts            # Pure mapper
├── constants.ts
├── styles.ts
├── types.ts
└── components/                          # Feature-scoped components (optional)
    └── [ComponentName]/
        ├── index.tsx
        ├── [ComponentName]Skeleton.tsx  # Skeleton lives alongside its view
        ├── use[ComponentName].ts        # only if needed
        ├── styles.ts
        └── types.ts
```

**Skeleton components live alongside their parent view component.** When a feature component has a loading skeleton, place the skeleton file in the same component directory (e.g. `TariffDetails/TariffDetailsCardSkeleton.tsx` next to `TariffDetailsView.tsx`). This keeps loading/loaded states co-located. Never place skeletons in a separate directory or at the feature root.

**Page-level hooks own data fetching; component hooks own only UI behavior** — unless the page uses the **self-contained sections pattern** (see below). In the default pattern, the page hook (e.g. `useContractDetails`) calls use cases and maps data. Component-level hooks only handle local UI interactions, never fetch data. Data flows down via props/UIModel.

**Single mapper per page consolidates all UIModel building** — unless the page uses the **self-contained sections pattern**. In the default pattern, one `mapTo[Feature]UIModel` builds the full page UIModel including nested component models.

**Self-contained sections pattern** — when a page has independent data-fetching sections (each backed by its own use case), each section owns its hook, mapper, navigation handler, and UI components. The page hook only provides page-level labels (e.g. heading, subHeadline). Section directories use **kebab-case** and live under `sections/`. Each section view calls its own hook internally and is rendered as a prop-less component from the page.

```
features/[feature]/[subFeature]/
├── index.tsx                            # UI only — renders PageTitle + sections
├── use[SubFeature].ts                   # Page-level labels only
├── constants.ts                         # Shared constants (navigation targets, mock IDs)
├── styles.ts
├── types.ts
└── sections/
    └── [section-name]/                  # kebab-case directory
        ├── components/                  # View, skeleton, and styles
        │   ├── [SectionName]View.tsx    # Calls its own hook internally
        │   ├── [SectionName]CardSkeleton.tsx
        │   └── styles.ts               # StyleSheet for view + skeleton
        ├── use[SectionName].ts          # Data fetching + UIModel + navigation state
        ├── use[SectionName]NavigationHandler.ts
        ├── mapTo[SectionName]UIModel.ts # Pure mapper
        └── types.ts                     # UIModel, navigation target, hook return type
```

**Section hook responsibilities:** The section hook (`use[SectionName]`) calls its own use case, builds the UIModel via its mapper, and owns navigation target state. The section view imports the hook and navigation handler, renders skeleton on loading, and displays the UIModel.

**Page imports from `sections/[name]/components/[Name]View`** — the page `index.tsx` imports each section's view from its `components/` directory (e.g. `./sections/tariff-details/components/TariffDetailsView`).

Use this pattern when: (1) sections fetch from different use cases independently, (2) sections have their own navigation targets, (3) sections can show skeletons independently. Use the default pattern when sections share data or are tightly coupled.

**Multi-page features** — when a feature has multiple sub-features, the main page files move into a `list/` sub-folder (not left at the feature root), and each sub-feature gets its own folder:

```
features/[feature]/
├── list/                                # Main/list page for this feature
│   ├── index.tsx
│   ├── use[Feature]List.ts
│   ├── mapTo[Feature]ListUIModel.ts
│   ├── styles.ts
│   └── types.ts
├── [subFeature]/                        # Sub-feature (e.g. details, create, edit)
│   ├── index.tsx
│   ├── use[SubFeature].ts
│   ├── mapTo[SubFeature]UIModel.ts
│   ├── styles.ts
│   └── types.ts
└── components/                          # Feature-scoped shared components (optional)
    └── [ComponentName]/
        └── ...
```

Examples: `features/contracts/list/`, `features/contracts/contract-details/`, `features/shop/product/`, `features/shop/cart/`

---

## Theming

The theme lives in `features/theme/` — not in `@ewi/shared`. It auto-resolves light/dark based on the phone's system appearance via `useColorScheme()` in `app/_layout.tsx`.

- **Use `theme.colors.*` from `useTheme()` for all colors.** Never hardcode hex values — not in components, not in constants files, not anywhere. Never branch on `isDark` to pick colors — the theme system does that automatically.
- **ALL colors must be defined in the theme with both light and dark mode variants.** New color tokens go in `features/theme/`: add them to the `Colors` interface in `types.ts` and both `lightColors`/`darkColors` in `colors.ts`. They auto-resolve like every other token. Never define color constants (e.g. `const AUTH_INPUT_BG = "#FFFFFF"`) outside the theme — always add a proper theme token instead.

```typescript
import { useTheme } from "@/features/theme";

// ✅ Correct — colors auto-resolve
const { theme } = useTheme();
const { colors } = theme;
return <View style={{ backgroundColor: colors.navSurface }} />;

// ❌ Wrong — manual isDark branching
const navColors = isDark ? darkNavColors : lightNavColors;

// ❌ Wrong — hardcoded hex
return <View style={{ backgroundColor: "#0A0A0A" }} />;
```

---

## Custom Components

**CRITICAL: Use `react-native-paper` as the primary UI component library for ALL UI elements.** Prefer Paper components (`Button`, `Text`, `TextInput`, `Card`, `Surface`, `Chip`, `IconButton`, `Divider`, `Banner`, `Snackbar`, `FAB`, `Menu`, `Dialog`, `Switch`, `Checkbox`, `RadioButton`, `ProgressBar`, `ActivityIndicator`, `Avatar`, `Badge`, `Appbar`, `BottomNavigation`, `List`, `DataTable`, `Searchbar`, `SegmentedButtons`, `Tooltip`, etc.) over custom implementations or raw React Native primitives. Never build a custom component for functionality that `react-native-paper` already provides.

```typescript
// ✅ Correct — use react-native-paper components
import { Button, Text, Card, TextInput, Surface } from "react-native-paper";

// ❌ Wrong — custom implementation when Paper has it
import { TouchableOpacity, Text } from "react-native";
```

**Before writing ANY UI element, check in this order:**

1. `react-native-paper` — use the Paper component if one exists for the use case
2. `components/` — check for an existing project-specific wrapper/component
3. Create a new component in `components/` only if neither Paper nor an existing wrapper covers the need

**All project-specific custom components MUST live in `components/[ComponentName]/`.** The directory name is the **base name** (e.g. `TabBar`); the main file is suffixed with `View` (e.g. `TabBarView.tsx`). **Exception:** Buttons use their semantic name without `View` suffix (e.g. `ButtonPrimary.tsx`, not `ButtonPrimaryView.tsx`). Custom components should wrap or compose `react-native-paper` components when possible rather than building from raw RN primitives. Never place custom components inside `features/designSystem/` or scattered across feature modules. Each component folder contains all related files:

```
components/
├── index.ts                        # Single barrel export for all components
└── [ComponentName]/
    ├── [ComponentName]View.tsx     # Main component (wraps Paper where possible)
    ├── types.ts                    # Props, interfaces
    ├── styles.ts                   # StyleSheet (structural only)
    └── [SubComponent].tsx          # Sub-components if needed
```

No `index.ts` inside component folders — the single barrel at `components/index.ts` re-exports everything. Import via: `import { TabBarView } from "@/components";`

**Paper theming:** The app's `react-native-paper` theme is configured via `PaperProvider` in the root layout, wired to the existing theme system. Paper components automatically pick up the app's color tokens — never override Paper's theme colors inline unless the design explicitly requires a deviation.

### Raw React Native primitives — allowed vs disallowed

Only use raw React Native imports for **layout and containers** that Paper does not provide equivalents for: `View`, `ScrollView`, `FlatList`, `SectionList`, `ImageBackground`, `StatusBar`, `KeyboardAvoidingView`, `SafeAreaView` (from `react-native-safe-area-context`). For everything else — text, buttons, inputs, cards, indicators, ripples, badges, dialogs, menus, chips, switches, etc. — use the Paper component.

```typescript
// ✅ Allowed — layout primitives from react-native
import { View, ScrollView, FlatList, ImageBackground } from "react-native";

// ❌ Disallowed — Paper provides these
import {
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
} from "react-native";
```

### No manual MD3 style replication

**Never manually define Material Design 3 typography, elevation, or shape constants.** Paper's `Text variant="..."`, `Surface elevation={...}`, and component `mode` props handle MD3 tokens natively. If you find yourself creating lookup tables for `fontWeight`, `letterSpacing`, `lineHeight`, or `elevation` values — you are duplicating what Paper already provides. Use Paper's built-in variant system instead.

```typescript
// ❌ Wrong — manual MD3 lookup table
const MD3_STYLES = {
  bodyMedium: { fontWeight: "400", letterSpacing: 0.25, lineHeight: 20 },
};
<RNText style={MD3_STYLES.bodyMedium}>...</RNText>

// ✅ Correct — Paper handles it
<Text variant="bodyMedium">...</Text>
```

### Paper theme integration

**Wire `PaperProvider` theme to the app's theme system for consistent token resolution.** Pass the app's color tokens to Paper's `MD3LightTheme`/`MD3DarkTheme` customization so that Paper components auto-resolve colors without per-instance overrides. When Paper components need app-specific colors (e.g. `buttonColor`, `textColor`), use `theme.colors.*` from `useTheme()` — never hardcode values.

### Paper theme is the single source of truth for Paper component colors

**Do NOT pass explicit color overrides to Paper components when the theme already resolves the correct value.** Paper's `Text` auto-resolves `onSurface`, `Button mode="contained"` auto-resolves `primary`/`onPrimary`, `Surface` auto-resolves `surface`, etc. Only override with `useTheme().colors.*` when the design requires a non-standard color (e.g. a button using `colors.brand` instead of the default `colors.primary`). Redundant overrides (e.g. `<Text style={{ color: colors.text }}>` when `onSurface` is already mapped to `colors.text`) add noise and defeat the purpose of theme integration.

### Custom component props must not conflict with Paper's prop types

**When a custom component wraps a Paper component and extends its props, always `Omit` any props whose type you are changing.** Never rely on TypeScript interface merging to silently override a Paper prop type (e.g. Paper's `error: boolean` → custom `error: string`). Use `Omit<ParentProps, "error">` and re-declare the prop with the new type. This prevents silent breakage when Paper upgrades change prop types.

```typescript
// ✅ Correct — explicit Omit before re-declaring
export interface ValidatedTextInputProps extends Omit<
  PrimaryTextInputProps,
  "error"
> {
  error?: string | null;
}

// ❌ Wrong — implicit override, fragile on Paper upgrades
export interface ValidatedTextInputProps extends PrimaryTextInputProps {
  error?: string | null;
}
```

### Keep `buildPaperTheme` in sync with the `Colors` interface

**When adding new color tokens to `Colors` in `features/theme/types.ts`, also update `buildPaperTheme()` in `ThemeContext.tsx`** to map the new token to the appropriate Paper MD3 color slot. If no MD3 slot exists (app-specific tokens like `navBadgeBackground`), the token is consumed only via `useTheme().colors.*` and does not need a Paper mapping. Review the [MD3 color roles](https://m3.material.io/styles/color/roles) to find the right slot.

---

## Project Folder Structure

```
[root]/
├── app/                        # Expo Router routes (thin wrappers)
│   ├── _layout.tsx             # Root: ThemeProvider, QueryClientProvider
│   ├── index.tsx               # Splash → auth or tabs redirect
│   ├── RootLayout.tsx          # Stack navigator (index, tabs, auth, standalone screens)
│   ├── (auth)/                 # Auth flow (unauthenticated screens)
│   │   └── (authtabs)/         # Material top tabs (e.g. Login | Register)
│   └── (tabs)/                 # Main tab navigator
│       └── [tabName]/          # One folder per tab with its screens
├── components/                 # Custom reusable components (Custom[Name].tsx)
├── features/                   # Feature modules (files directly under feature/)
│   ├── appConfig/              # Tenant config mapping (CONFIG object)
│   ├── designSystem/           # Shared UI, theme, responsiveness, tenants
│   ├── networking/             # API abstraction layer
│   └── [feature]/              # Single-page: files here; multi-page: sub-folders
├── assets/
│   ├── fonts/                  # Tenant font files (.ttf)
│   └── images/[tenant]/        # Tenant-specific images, SVGs, Lottie
└── __tests__/                  # Jest tests (mirrors features/ structure)
```

Route files in `app/` are thin wrappers — they import and render the page component from `features/`:

```typescript
import { SomePage } from "@/features/[feature]/pages/[pageName]";
const Route: React.FC = () => <SomePage />;
export default Route;
```

---

## Assets

- **ALL asset files must live in the `assets/` directory.** Never place SVG string exports, images, icons, or Lottie files inside feature or page folders. This includes inline SVG constants (e.g. `logoSvg.ts`) — they belong in `assets/images/`, not co-located with pages. Import from `@/assets/images/` or `@/assets/icons/`.

---

## Tenant System

The app supports white-labelling via a tenant config system. The active tenant is set in Expo config (`expo.extra.TENANT`).

### Tenant Files

Each tenant lives under `features/designSystem/tenants/[tenantName]/`:

```
tenants/[tenantName]/
├── Colors.ts       # { light: Colors, dark: Colors } theme tokens
├── Fonts.ts        # FONT_NAMES map + require() for font files
├── TextStyles.ts   # Typography presets using scaleFont() and scale()
└── Assets.ts       # All tenant images, icons, and Lottie animations
```

### Config Wiring

1. `features/appConfig/index.ts` maps tenant id → `Config` (base_urls, header, theme, text_styles, fonts, assets)
2. `ThemeProvider` reads the tenant id from Expo config, looks up `CONFIG[TENANT]`
3. Components consume via `useTheme()` → `{ colors, theme, TENANT, setTheme }`

### Adding a New Tenant

1. Create `features/designSystem/tenants/[newTenant]/` with `Colors.ts`, `Fonts.ts`, `TextStyles.ts`, `Assets.ts`
2. Add font files to `assets/fonts/` and images to `assets/images/[newTenant]/`
3. Add the tenant entry in `features/appConfig/index.ts` importing the new tenant's design tokens
4. Set `TENANT` in Expo config to the new tenant id

### Tenant Rules

- **Never hardcode tenant-specific values outside `tenants/`** — always go through `useTheme()` or `CONFIG`
- `Colors.ts` must export both `light` and `dark` variants conforming to the `Colors` interface
- `TextStyles.ts` must use `scaleFont()` for `fontSize` and `scale()` for `letterSpacing`
- Assets are accessed via `theme.assets.[KEY]`, never by direct path

---

Design system components live in `features/designSystem/`:

- `components/` — Buttons, Headers, CustomInput, SVG, Notifications
- `context/ThemeContext` — `useTheme()`
- `responsiveness/` — `scale()`, `scaleFont()`

---

## Naming Conventions

See root `CLAUDE.md` naming rule. Mobile-specific conventions:

| Type               | Case              | Example                     |
| ------------------ | ----------------- | --------------------------- |
| Feature folder     | camelCase         | `features/dashboard/`       |
| Sub-feature folder | camelCase         | `features/shop/product/`    |
| Component folder   | PascalCase        | `components/HeaderButtons/` |
| Page hook          | `use[Feature].ts` | `useDashboard.ts`           |
| Hook return type   | `Use[Name]Return` | `UseDashboardReturn`        |
| Component props    | `[Name]Props`     | `HeaderButtonsProps`        |

- Page components: `export const ProductPage: React.FC` + `export default ProductPage`
- Path aliases: `@/features/`, `@designSystem/` — never `../../` across features

---

## Screen Pattern

Mobile hooks compose shared base hooks and add platform-specific behavior (navigation, biometric, notifications). See root `CLAUDE.md` for hook composition and UIModel rules.

### `index.tsx` — UI only: renders `uiModel.*`, wires navigation handler

```typescript
export const LoginPage: React.FC = () => {
  const { theme } = useTheme();
  const { colors } = theme;
  const { uiModel, navigationTarget, clearNavigationTarget, handleInputChange, handleLogin, handleRegister } = useLogin();
  useLoginNavigationHandler(navigationTarget, clearNavigationTarget);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={{ color: colors.text }}>{uiModel.loginHeading}</Text>
      <TextInput value={uiModel.emailValue} placeholder={uiModel.emailPlaceholder} onChangeText={(value) => handleInputChange("email", value)} />
      {uiModel.emailError && <Text style={{ color: colors.error }}>{uiModel.emailError}</Text>}
      <TouchableOpacity onPress={handleLogin} disabled={uiModel.submitButtonDisabled} style={{ opacity: uiModel.submitButtonOpacity }}>
        <Text>{uiModel.submitButtonLabel}</Text>
      </TouchableOpacity>
    </View>
  );
};
export default LoginPage;
```

### `useX.ts` — composes shared base hook + builds UIModel + exposes navigation state (NO router)

```typescript
import { useState, useCallback } from "react";
import { useLoginForm } from "@ewi/shared";
import { useTheme } from "@/features/theme";
import { mapToLoginPageUIModel } from "./mapToLoginPageUIModel";
import type { UseLoginReturn, LoginNavigationTarget } from "./types";

export const useLogin = (): UseLoginReturn => {
  const { isDark, toggleTheme } = useTheme();
  const {
    form,
    errors,
    isSubmitting,
    handleInputChange,
    handleInputBlur,
    handleLogin,
  } = useLoginForm();
  const [navigationTarget, setNavigationTarget] =
    useState<LoginNavigationTarget>(null);

  const uiModel = mapToLoginPageUIModel({ form, errors, isSubmitting, isDark });

  const handleRegister = useCallback(() => setNavigationTarget("register"), []);
  const handleForgotPassword = useCallback(
    () => setNavigationTarget("forgotPassword"),
    [],
  );
  const clearNavigationTarget = useCallback(
    () => setNavigationTarget(null),
    [],
  );

  return {
    uiModel,
    navigationTarget,
    clearNavigationTarget,
    handleInputChange,
    handleInputBlur,
    handleLogin,
    handleRegister,
    handleForgotPassword,
    toggleTheme,
  };
};
```

### `use[Feature]NavigationHandler.ts` — owns the router, reacts to navigation state

```typescript
import { useEffect } from "react";
import { useRouter } from "expo-router";
import type { LoginNavigationTarget } from "./types";

export const useLoginNavigationHandler = (
  target: LoginNavigationTarget,
  onNavigated: () => void,
) => {
  const router = useRouter();

  useEffect(() => {
    if (!target) return;
    switch (target) {
      case "register":
        router.push("/(auth)/(authtabs)/register");
        break;
      case "forgotPassword":
        router.push("/(auth)/resetPassword");
        break;
    }
    onNavigated();
  }, [target, router, onNavigated]);
};
```

### `mapToXPageUIModel.ts` — pure mapper: domain state + translations → UIModel

```typescript
import { scopedTranslations } from "@ewi/shared/localization";

const translateAuth = scopedTranslations("auth");
const translateCommon = scopedTranslations("common");

export const mapToLoginPageUIModel = ({
  form,
  errors,
  isSubmitting,
  isDark,
}): LoginPageUIModel => ({
  emailValue: form.email,
  emailError: errors.email,
  submitButtonLabel: isSubmitting
    ? translateAuth("login.submittingButton")
    : translateAuth("login.submitButton"),
  submitButtonDisabled: isSubmitting,
  submitButtonOpacity: isSubmitting ? 0.7 : 1,
  themeToggleLabel: isDark
    ? translateCommon("themeToggleLight")
    : translateCommon("themeToggleDark"),
  loginHeading: translateAuth("login.heading"),
  // ...all other labels resolved here via translateAuth / translateCommon
});
```

### `types.ts` — navigation target, UIModel interface, hook return type

```typescript
export type LoginNavigationTarget = "register" | "forgotPassword" | null;

export interface LoginPageUIModel {
  emailValue: string;
  emailError: string | null;
  submitButtonLabel: string;
  submitButtonDisabled: boolean;
  submitButtonOpacity: number;
  loginHeading: string;
  // ...all pre-resolved labels and derived state
}

export interface UseLoginReturn {
  uiModel: LoginPageUIModel;
  navigationTarget: LoginNavigationTarget;
  clearNavigationTarget: () => void;
  handleInputChange: (field: keyof LoginForm, value: string) => void;
  handleLogin: () => void;
  handleRegister: () => void;
  // ...handlers only
}
```

Notifications (`react-native-notifier`) always in the hook, never in the page component.

---

## Error Handling — Mobile

See root `CLAUDE.md` for the general error handling rule. Mobile-specific patterns:

- **Transient errors (network failures, submission errors) use `Notifier` + `ErrorNotification` in the hook** — never in the page component. Import from `react-native-notifier`.
- **Persistent errors (validation, login failures) surface through the UIModel** as `uiModel.loginError`, `uiModel.showErrorBanner`, etc. The page component renders them inline.
- **Unrecoverable errors are caught by the top-level error boundary in the root layout** (`app/_layout.tsx`). Individual screens do not need their own error boundaries.

---

## Accessibility — Mobile

See root `CLAUDE.md` for the general accessibility rule. Mobile-specific patterns:

- **Every interactive and visible element must have accessibility attributes.** Every `TouchableOpacity`, `Pressable`, `TextInput`, `Image`, and custom component must have `accessibilityLabel` and appropriate `accessibilityRole` (e.g. `"button"`, `"link"`, `"text"`, `"image"`). No exceptions — if it renders on screen, it must be accessible.
- **Accessibility labels must NEVER be hardcoded.** All `accessibilityLabel` values must come from localization — never inline strings like `accessibilityLabel="Logo"`. Use `scopedTranslations` to resolve the `*.accessibility` key from the localization JSON.
- **Accessibility labels are static — resolve them directly in the component, not via UIModel.** Since accessibility descriptions don't depend on state, call `scopedTranslations` at module level and use the result inline: `accessibilityLabel={translateAuth("loginButton.accessibility")}`. Do NOT pass accessibility labels through the UIModel or mapper — UIModel is for state-derived values only. This keeps UIModel lean and avoids unnecessary prop threading for values that never change.
- Decorative images use `accessibilityElementsHidden={true}` or `importantForAccessibility="no"`
- Form inputs: always pair with a visible label component — never rely on `placeholder` alone

---

## Performance — Mobile

See root `CLAUDE.md` for the general performance rule. Mobile-specific patterns:

- **Use `FlashList` for large or dynamic datasets (> 20 items).** Always provide `estimatedItemSize`. Use `FlatList` only for short, static lists. Never render large lists inside `ScrollView`.
- **Extract list item components and wrap with `React.memo`** when items are complex (multiple children, images, nested views).
- **Image assets**: use appropriately sized assets per density (`@2x`, `@3x`) and prefer WebP or compressed PNG. Access tenant images via `theme.assets.[KEY]`, never by direct path.

---

## Testing — Mobile

See root `CLAUDE.md` for the general testing rule. Mobile-specific exclusions:

- **Do NOT write unit tests for UI-only files.** The following are excluded from test coverage and must not have corresponding test files:
  - `app/**` — Expo Router route files (thin wrappers with no logic)
  - `components/**` — reusable UI components
  - `features/debug/**` — internal debug tooling, not production code
  - `**/index.tsx` — page components that only render UIModel props
  - `**/styles.ts` — StyleSheet definitions (structural layout only)
- **DO write unit tests for all logic files:** hooks (`useX.ts`), mappers (`mapToXUIModel.ts`), navigation handlers (`useXNavigationHandler.ts`), and `types.ts` type guards or utilities.

---

## Form Handling

See root `CLAUDE.md` for form validation rules. Mobile-specific:

- Use `CustomInput` from the design system for all text inputs
- Use `Notifier` + `ErrorNotification` in the app hook for submission errors

---

## Styling

See the **Theming** section above for color/token rules. React Native patterns:

```typescript
import { StyleSheet } from "react-native";
import { useTheme } from "@/features/theme";

// In component:
const { theme } = useTheme();
const { colors, spacing, fontSizes, borderRadius } = theme;

// styles.ts — structural layout only, no design tokens
export const styles = StyleSheet.create({
  container: { flex: 1 },
  row: { flexDirection: "row", alignItems: "center" },
});

// Apply tokens inline:
<View style={[styles.container, { backgroundColor: colors.background, padding: spacing.md }]} />
<Text style={{ color: colors.text, fontSize: fontSizes.md }} />
```

- `styles.ts` holds only `flex`, `flexDirection`, `position`, `alignItems` etc. — never colors, sizes, or spacing values
- All dynamic design values always applied inline as the second array item: `style={[styles.x, { color: colors.text }]}`

---

## Navigation (Expo Router)

```
app/
├── _layout.tsx       # Providers
├── RootLayout.tsx    # Store init, fonts, Stack
├── index.tsx         # Auth redirect
├── (tabs)/           # Tab navigator
│   ├── shop/         # index, products, product, cart, search
│   ├── offers/
│   ├── coupons/
│   └── more/
└── (auth)/
    ├── intro.tsx, start.tsx, resetPassword.tsx
    └── (authtabs)/   # Login, Register
```

```typescript
// Expo Router API reference — NOT for use inside hooks.
// Hooks use navigationTarget state; only NavigationHandler files call the router.
import { useLocalSearchParams } from "expo-router";
const { id } = useLocalSearchParams() as { id: string };
```

Auth redirects:

- No token + no seenIntro → `/(auth)/intro`
- No token → `/(auth)/start`
- `auth:loginRequired` event → `/(auth)/(authtabs)/`

Route files are thin wrappers — all navigation logic in hooks:

```typescript
// app/(tabs)/shop/reward.tsx — single-page feature
import { RewardPage } from "@/features/reward";
const Page: React.FC = () => <RewardPage />;
export default Page;

// app/(tabs)/shop/product.tsx — multi-page feature (sub-feature)
import { ProductPage } from "@/features/shop/product";
const Page: React.FC = () => <ProductPage />;
export default Page;
```
