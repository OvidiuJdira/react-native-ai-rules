Scaffold a new screen/page in @ewi/mobile with all required files — UI component, custom hook, UIModel mapper, styles, types, and route file. Automatically scaffolds shared dependencies if they don't exist.

## Step 0: Verify Prerequisites

Before creating the page, check that all required shared infrastructure exists. **Run these checks silently — do not ask the user. Fix missing pieces automatically.**

### 0a. Shared module exists?

Check if `packages/shared/src/features/[feature]/index.ts` exists. If NOT:

- Run `/create-module` for this feature with the information gathered in Step 1.
- Wait for it to complete before continuing.

### 0b. Shared base hook exists? (form pages only)

If the page has a form, check if the shared base hook exists (e.g. `packages/shared/src/features/[feature]/presentations/use[Feature]Form.ts`). If NOT:

- Run `/create-shared-hook` for this feature.
- Wait for it to complete before continuing.

### 0c. Localization namespace exists?

Check if `packages/shared/src/features/presentation/localization/` has a file for this feature's namespace (e.g. `auth.ts`, `shop.ts`). If NOT:

- Create the localization file with label constants for the page being scaffolded.
- Register it in the localization index.

### 0d. Theme is wired?

Check if `packages/shared/src/features/presentation/theme/index.ts` exists and exports `useTheme`. If NOT:

- Create the minimal theme module with `ThemeContext`, `useTheme`, `colors`, `spacing`, `fontSizes`, `borderRadius` for both light and dark modes.
- Register it in `package.json` exports under `"./theme"`.

### 0e. Root barrel updated?

Check if `packages/shared/src/index.ts` exports the use cases and models for this feature. If NOT:

- Add the missing imports and re-exports.

**After all prerequisites are satisfied, continue to Step 1.**

## Step 1: Gather Requirements

Ask the user:

1. **Screen name** — e.g. "reward detail", "notifications"
2. **Which module?** — e.g. `shop/`, `offers/`, or a new module
3. **What data does it show?** — which `@ewi/shared` use cases does it consume?
4. **Has mutations?** — add to cart, toggle favorite, etc.
5. **Route path** — e.g. `/shop/reward`, `/more/notifications`
6. **Needs params?** — e.g. `id` from URL

## Step 2: Create the 6 Files

All files go under `apps/mobile/features/[feature]/pages/[pageName]/`.

### 2a. Types (`types.ts`)

Define the navigation target, UIModel, mapper input, and hook return type. Import domain models from `@ewi/shared`:

```typescript
import { Reward } from "@ewi/shared";

export type RewardNavigationTarget = "back" | null;

export interface RewardUIModel {
  title: string;
  points: string;
  isLoading: boolean;
}

export interface MapToRewardUIModelInput {
  reward: Reward | null;
  isLoading: boolean;
}

export interface UseRewardReturn {
  uiModel: RewardUIModel;
  navigationTarget: RewardNavigationTarget;
  clearNavigationTarget: () => void;
  handleBack: () => void;
}
```

### 2b. UIModel Mapper (`mapTo[Feature]UIModel.ts`)

Pure function — no hooks, no side effects. All derived labels and conditional values resolved here:

```typescript
import { scopedTranslations } from "@ewi/shared/localization";
import { MapToRewardUIModelInput, RewardUIModel } from "./types";

const translateReward = scopedTranslations("reward");

export const mapToRewardUIModel = ({
  reward,
  isLoading,
}: MapToRewardUIModelInput): RewardUIModel => ({
  title: reward?.name ?? translateReward("detail.placeholder"),
  points: reward
    ? `${reward.points} ${translateReward("detail.pointsSuffix")}`
    : "",
  isLoading,
});
```

### 2c. Custom Hook (`use[Feature].ts`)

All logic here — use cases, state, notifications. **NO router import.** Exposes `navigationTarget` state instead. Calls the mapper to build the UIModel before returning:

```typescript
import { useState, useCallback } from "react";
import { useGetRewardByIdUseCase } from "@ewi/shared";
import { mapToRewardUIModel } from "./mapToRewardUIModel";
import type { UseRewardReturn, RewardNavigationTarget } from "./types";

export const useReward = (rewardId: string): UseRewardReturn => {
  const { data: reward, isLoading } = useGetRewardByIdUseCase(rewardId);
  const [navigationTarget, setNavigationTarget] =
    useState<RewardNavigationTarget>(null);

  const uiModel = mapToRewardUIModel({ reward: reward ?? null, isLoading });

  const handleBack = useCallback(() => setNavigationTarget("back"), []);
  const clearNavigationTarget = useCallback(
    () => setNavigationTarget(null),
    [],
  );

  return { uiModel, navigationTarget, clearNavigationTarget, handleBack };
};
```

### 2d. Navigation Handler (`use[Feature]NavigationHandler.ts`)

Owns the router. Reacts to navigation state from the hook:

```typescript
import { useEffect } from "react";
import { useRouter } from "expo-router";
import type { RewardNavigationTarget } from "./types";

export const useRewardNavigationHandler = (
  target: RewardNavigationTarget,
  onNavigated: () => void,
) => {
  const router = useRouter();

  useEffect(() => {
    if (!target) return;
    switch (target) {
      case "back":
        router.back();
        break;
    }
    onNavigated();
  }, [target, router, onNavigated]);
};
```

For mutations, use `Notifier` with `SuccessNotification` / `ErrorNotification`:

```typescript
import { Notifier } from "react-native-notifier";
import { SuccessNotification } from "@/features/designSystem/components/Notifications/Success";
import { ErrorNotification } from "@/features/designSystem/components/Notifications/Error";

const { mutate, isPending } = useSomeMutationUseCase(() => {
  Notifier.showNotification({
    title: "Success!",
    description: "Done.",
    Component: SuccessNotification,
  });
});
```

### 2e. Styles (`styles.ts`)

Use `StyleSheet.create()` with `scale()` for all numeric values:

```typescript
import { StyleSheet } from "react-native";
import { scale } from "@designSystem/responsiveness/scale";

export const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: scale(16), paddingTop: scale(16) },
});
```

### 2f. Page Component (`index.tsx`)

UI only — renders `uiModel.*`, wires navigation handler. No `t()` calls, no ternaries, no inline logic:

```typescript
import React from "react";
import { View, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTheme } from "@ewi/shared/theme";
import { styles } from "./styles";
import { useReward } from "./useReward";
import { useRewardNavigationHandler } from "./useRewardNavigationHandler";

export const RewardPage: React.FC = () => {
  const { theme } = useTheme();
  const { id } = useLocalSearchParams() as { id: string };
  const { uiModel, navigationTarget, clearNavigationTarget, handleBack } = useReward(id);
  useRewardNavigationHandler(navigationTarget, clearNavigationTarget);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView>{/* Render uiModel.* */}</ScrollView>
    </View>
  );
};

export default RewardPage;
```

## Step 3: Create Route File

Add a thin wrapper in `apps/mobile/app/`:

```typescript
// apps/mobile/app/(tabs)/shop/reward.tsx
import { RewardPage } from "@/features/shop/reward/pages/reward";

const RewardDetailPage: React.FC = () => <RewardPage />;
export default RewardDetailPage;
```

## Step 4: Add Tests

Create `apps/mobile/__tests__/features/[feature]/pages/[page]/use[Feature].test.ts`:

```typescript
jest.mock("@ewi/shared", () => ({
  useGetRewardByIdUseCase: jest.fn(),
}));

describe("useReward", () => {
  it("returns uiModel from use case data", () => {
    // renderHook + assertions on uiModel fields
  });
});
```

And `apps/mobile/__tests__/features/[feature]/pages/[page]/mapTo[Feature]UIModel.test.ts`:

```typescript
describe("mapToRewardUIModel", () => {
  it("returns placeholder title when reward is null", () => {
    // test with reward: null
  });
  it("formats points correctly", () => {
    // test with a real reward
  });
});
```

## Checklist

- [ ] **Prerequisites** — shared module, shared hook (if form), localization, theme, and barrel exports all exist
- [ ] `types.ts` — navigation target type, UIModel, mapper input type, and hook return type all defined
- [ ] `mapTo[Feature]UIModel.ts` — pure function, no hooks, all labels resolved via `scopedTranslations`
- [ ] `use[Feature].ts` — calls mapper before returning; all logic in hook; **NO router import** — exposes `navigationTarget` + `clearNavigationTarget` instead
- [ ] `use[Feature]NavigationHandler.ts` — owns the router, reacts to `navigationTarget` via `useEffect`, calls `onNavigated` after each navigation
- [ ] `styles.ts` — uses `scale()`, no hardcoded colors
- [ ] `index.tsx` — renders `uiModel.*` only; wires `use[Feature]NavigationHandler(navigationTarget, clearNavigationTarget)`; no `t()`, no ternaries, no inline logic
- [ ] Route file in `app/` — thin wrapper with default export
- [ ] Notifications via `Notifier` in hook for mutations
- [ ] If screen has a form: hook composes `use[Feature]Form` from `@ewi/shared` — never reimplements form state, validation, or submit logic directly
