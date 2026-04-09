Scaffold a new page in @ewi/web with all required files — page component, custom hook, UIModel mapper, navigation handler, and types. Automatically scaffolds shared dependencies if they don't exist.

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
1. **Page name** — e.g. "products", "reward-detail"
2. **Route path** — e.g. `/shop/products`, `/more/notifications`
3. **What data does it show?** — which `@ewi/shared` use cases does it consume?
4. **Has mutations?** — add to cart, toggle favorite, etc.
5. **Has a form?** — if yes, which shared base hook does it compose (e.g. `useLoginForm`)?
6. **Needs route params?** — e.g. `id` from URL via `useSearchParams()`

## Step 2: Create the 5 Files

All files go under `apps/web/app/[route]/`.

### 2a. Types (`types.ts`)

Define the navigation target, UIModel, mapper input type, and hook return type. Import domain models from `@ewi/shared`:

```typescript
import type { Product } from "@ewi/shared";

export type ProductsNavigationTarget = "productDetail" | null;

export interface ProductsPageUIModel {
  pageTitle: string;
  isLoading: boolean;
  products: Array<{ id: string; name: string; formattedPrice: string }>;
}

export interface MapToProductsPageUIModelInput {
  products: Product[];
  isLoading: boolean;
}

export interface UseProductsReturn {
  uiModel: ProductsPageUIModel;
}
```

### 2b. UIModel Mapper (`mapTo[Feature]PageUIModel.ts`)

Pure function — no hooks, no side effects. Import label constants directly from `@ewi/shared/localization`. Never call `t()` or `useTranslations` here:

```typescript
import { productLabels } from "@ewi/shared/localization";
import type { Product } from "@ewi/shared";
import type { MapToProductsPageUIModelInput, ProductsPageUIModel } from "./types";

export const mapToProductsPageUIModel = ({
  products,
  isLoading,
}: MapToProductsPageUIModelInput): ProductsPageUIModel => ({
  pageTitle: productLabels.pageTitle,
  isLoading,
  products: products.map((product) => ({
    id: product.id,
    name: product.name,
    formattedPrice: `${productLabels.currencySymbol}${product.price}`,
  })),
});
```

### 2c. Custom Hook (`use[Feature].ts`)

All logic here — use cases, state. Always `"use client"`. **NO router import** — exposes `navigationTarget` state. Calls the mapper before returning:

```typescript
"use client";
import { useState, useCallback } from "react";
import { useGetProductsUseCase } from "@ewi/shared";
import { mapToProductsPageUIModel } from "./mapToProductsPageUIModel";
import type { UseProductsReturn, ProductsNavigationTarget } from "./types";

export function useProducts(): UseProductsReturn {
  const { data: products = [], isLoading } = useGetProductsUseCase();
  const [navigationTarget, setNavigationTarget] = useState<ProductsNavigationTarget>(null);

  const uiModel = mapToProductsPageUIModel({ products, isLoading });
  const handleProductClick = useCallback((productId: string) => setNavigationTarget("productDetail"), []);
  const clearNavigationTarget = useCallback(() => setNavigationTarget(null), []);

  return { uiModel, navigationTarget, clearNavigationTarget, handleProductClick };
}
```

For forms, compose the shared base hook and add only web-specific behavior:

```typescript
"use client";
import { useState, useCallback } from "react";
import { useTheme } from "@ewi/shared/theme";
import { useLoginForm } from "@ewi/shared";
import { mapToAuthPageUIModel } from "./mapToAuthPageUIModel";
import type { UseLoginReturn, AuthNavigationTarget } from "./types";

export function useLogin(): UseLoginReturn {
  const { isDark } = useTheme();
  const { form, errors, isSubmitting, handleInputChange, handleInputBlur, handleLogin } = useLoginForm();
  const [navigationTarget, setNavigationTarget] = useState<AuthNavigationTarget>(null);

  const uiModel = mapToAuthPageUIModel({ form, errors, isSubmitting, isDark });
  const handleRegister = useCallback(() => setNavigationTarget("register"), []);
  const clearNavigationTarget = useCallback(() => setNavigationTarget(null), []);

  return { uiModel, navigationTarget, clearNavigationTarget, handleInputChange, handleInputBlur, handleLogin, handleRegister };
}
```

### 2d. Navigation Handler (`use[Feature]NavigationHandler.ts`)

Owns the router. Reacts to navigation state from the hook:

```typescript
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ProductsNavigationTarget } from "./types";

export function useProductsNavigationHandler(
  target: ProductsNavigationTarget,
  onNavigated: () => void,
) {
  const router = useRouter();

  useEffect(() => {
    if (!target) return;
    switch (target) {
      case "productDetail": router.push("/shop/product"); break;
    }
    onNavigated();
  }, [target, router, onNavigated]);
}
```

### 2e. Page Component (`page.tsx`)

UI only — renders `uiModel.*`, wires navigation handler. Always `"use client"`. No label strings, no inline logic:

```typescript
"use client";
import { useTheme } from "@ewi/shared/theme";
import { useProducts } from "./useProducts";
import { useProductsNavigationHandler } from "./useProductsNavigationHandler";

export default function ProductsPage() {
  const { theme } = useTheme();
  const { uiModel, navigationTarget, clearNavigationTarget } = useProducts();
  useProductsNavigationHandler(navigationTarget, clearNavigationTarget);

  return (
    <main style={{ backgroundColor: theme.colors.background }}>
      <h1 style={{ color: theme.colors.text, fontSize: theme.fontSizes.xl }}>
        {uiModel.pageTitle}
      </h1>
      {/* Render uiModel.* */}
    </main>
  );
}
```

## Step 3: Add Tests

Create `apps/web/__tests__/app/[route]/use[Feature].test.ts`:

```typescript
jest.mock("@ewi/shared", () => ({
  useGetProductsUseCase: jest.fn(),
}));

describe("useProducts", () => {
  it("returns uiModel from use case data", () => {
    // renderHook + assertions on uiModel fields
  });
});
```

And `apps/web/__tests__/app/[route]/mapTo[Feature]PageUIModel.test.ts`:

```typescript
describe("mapToProductsPageUIModel", () => {
  it("returns empty products array when input is empty", () => {
    // test with products: []
  });
  it("formats price correctly", () => {
    // test with a real product
  });
});
```

## Checklist

- [ ] **Prerequisites** — shared module, shared hook (if form), localization, theme, and barrel exports all exist
- [ ] `types.ts` — navigation target type, UIModel, mapper input type, and hook return type all defined
- [ ] `mapTo[Feature]PageUIModel.ts` — pure function, no hooks, all labels from `@ewi/shared/localization` constants (never `t()`, never `useTranslations`)
- [ ] `use[Feature].ts` — `"use client"`, calls mapper before returning; all logic in hook; **NO router import** — exposes `navigationTarget` + `clearNavigationTarget` instead
- [ ] `use[Feature]NavigationHandler.ts` — `"use client"`, owns the router, reacts to `navigationTarget` via `useEffect`, calls `onNavigated` after each navigation
- [ ] `page.tsx` — `"use client"`, renders `uiModel.*` only; wires `use[Feature]NavigationHandler(navigationTarget, clearNavigationTarget)`; no label strings, no inline logic
- [ ] If page has a form: hook composes `use[Feature]Form` from `@ewi/shared` — never reimplements form state, validation, or submit logic directly
- [ ] No hardcoded color values, pixel numbers, or font sizes — all from `theme.*`
- [ ] No single-letter or cryptic names anywhere
