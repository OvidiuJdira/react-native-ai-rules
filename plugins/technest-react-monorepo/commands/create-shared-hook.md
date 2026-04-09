Add a shared base hook to `@ewi/shared/features/[feature]/presentations/` that encapsulates logic consumed by both the mobile and web apps. App-level hooks compose this hook and add only platform-specific behavior.

## Step 1: Gather Requirements

Ask the user:

1. **Hook name** — e.g. "useQuantitySelector", "useProductCard", "useLoginForm"
2. **Which feature module?** — already has a module in `@ewi/shared`? If not, run `/create-module` first.
3. **Hook type** — is this a **form hook** (owns form state, validation, submit) or a **component/data hook** (manages UI state, calls use cases)?
4. **What data does it need?** — which use cases does it call? what parameters does it accept?
5. **What does it return?** — state values, computed values, handlers

---

## Pattern A: Component / Data Hook

Use this when the hook manages UI state or fetches/mutates data for a component — no form fields or Zod validation.

### File

`packages/shared/src/features/[feature]/presentations/use[Feature].ts`:

```typescript
import { useState, useCallback } from "react";
import { useGetProductUseCase } from "../domain/useCase/useGetProductUseCase";
import { useAddToCartUseCase } from "../domain/useCase/useAddToCartUseCase";

export interface UseQuantitySelectorReturn {
  quantity: number;
  canDecrement: boolean;
  handleIncrement: () => void;
  handleDecrement: () => void;
  handleAddToCart: () => void;
  isAdding: boolean;
}

export const useQuantitySelector = (
  productId: string,
  onSuccess?: () => void,
): UseQuantitySelectorReturn => {
  const { data: product } = useGetProductUseCase(productId);
  const { mutate: addToCart, isPending: isAdding } =
    useAddToCartUseCase(onSuccess);

  const [quantity, setQuantity] = useState(1);

  const handleIncrement = useCallback(() => {
    setQuantity((previousQuantity) => previousQuantity + 1);
  }, []);

  const handleDecrement = useCallback(() => {
    setQuantity((previousQuantity) => Math.max(1, previousQuantity - 1));
  }, []);

  const handleAddToCart = useCallback(() => {
    if (!product) return;
    addToCart({ productId: product.id, quantity });
  }, [addToCart, product, quantity]);

  return {
    quantity,
    canDecrement: quantity > 1,
    handleIncrement,
    handleDecrement,
    handleAddToCart,
    isAdding,
  };
};
```

Rules:

- `isAdding` / `isLoading` come from use case `isPending` / `isLoading` — never a separate `useState` for loading state
- `onSuccess` accepted as optional parameter so app hooks can inject platform-specific success behavior
- All handlers defined with `useCallback`
- No single-letter or cryptic names

---

## Pattern B: Form Hook

Use this when the hook owns form state, field validation, and a submit flow.

### Step B1: Create the Schema

`packages/shared/src/features/[feature]/presentations/validators/[feature]Schema.ts`:

```typescript
import { z } from "zod";
import { authLabelsEn } from "@ewi/shared/localization";

export const createLoginSchema = (translate: (key: string) => string) =>
  z.object({
    email: z.string().email(translate(authLabelsEn.validation.invalidEmail)),
    password: z
      .string()
      .min(6, translate(authLabelsEn.validation.passwordTooShort)),
  });

export type LoginForm = z.infer<ReturnType<typeof createLoginSchema>>;
```

Rules:

- Schema is always a factory that accepts `translate` — never a static `z.object({...})` export
- Validation messages reference label constants from `@ewi/shared/localization`, never hardcoded strings

### Step B2: Create the Base Hook

`packages/shared/src/features/[feature]/presentations/use[Feature]Form.ts`:

```typescript
import { useState, useCallback } from "react";
import { useTranslations } from "@ewi/shared/localization";
import { useLoginUseCase } from "../../domain/useCase/useLoginUseCase";
import { createLoginSchema } from "./validators/loginSchema";
import type { LoginForm } from "./validators/loginSchema";

type LoginFormErrors = Partial<Record<keyof LoginForm, string>>;

export const useLoginForm = (onSuccess?: () => void) => {
  const translateAuth = useTranslations("auth");
  const schema = createLoginSchema(translateAuth);
  const { mutate: submitLogin, isPending: isSubmitting } =
    useLoginUseCase(onSuccess);

  const [form, setForm] = useState<LoginForm>({ email: "", password: "" });
  const [errors, setErrors] = useState<LoginFormErrors>({});

  const validateField = useCallback(
    (field: keyof LoginForm, value: string): string | undefined => {
      const result = schema.shape[field].safeParse(value);
      return result.success ? undefined : result.error.errors[0]?.message;
    },
    [schema],
  );

  const handleInputChange = useCallback(
    (field: keyof LoginForm, value: string) => {
      setForm((previousForm) => ({ ...previousForm, [field]: value }));
      const fieldError = validateField(field, value);
      setErrors((previousErrors) => ({
        ...previousErrors,
        [field]: fieldError,
      }));
    },
    [validateField],
  );

  const handleInputBlur = useCallback(
    (field: keyof LoginForm) => {
      const fieldError = validateField(field, form[field]);
      setErrors((previousErrors) => ({
        ...previousErrors,
        [field]: fieldError,
      }));
    },
    [validateField, form],
  );

  const handleSubmit = useCallback(() => {
    const result = schema.safeParse(form);
    if (!result.success) {
      const fieldErrors: LoginFormErrors = {};
      result.error.errors.forEach((validationIssue) => {
        const field = validationIssue.path[0] as keyof LoginForm;
        fieldErrors[field] = validationIssue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    submitLogin(form);
  }, [form, schema, submitLogin]);

  return {
    form,
    errors,
    isSubmitting,
    handleInputChange,
    handleInputBlur,
    handleSubmit,
  };
};
```

Rules:

- `useTranslations` (not `scopedTranslations`) — this is a React hook
- `isSubmitting` comes from the mutation's `isPending` — never a separate `useState`
- `onSuccess` injected by app hooks for platform-specific success behavior (navigation, notifications)
- App hooks never reimplement form state, validation, or submit logic

---

## Step 2: Register Exports

1. Add to `features/[feature]/index.ts`:

```typescript
export { useQuantitySelector } from "./presentations/useQuantitySelector";
export type { UseQuantitySelectorReturn } from "./presentations/useQuantitySelector";

// Form hook only:
export { useLoginForm } from "./presentations/useLoginForm";
export { createLoginSchema } from "./presentations/validators/loginSchema";
export type { LoginForm } from "./presentations/validators/loginSchema";
```

2. Add to `packages/shared/src/index.ts`:

```typescript
import { useQuantitySelector } from "@shop/presentations/useQuantitySelector";
export { useQuantitySelector };
```

## Step 3: Wire App Hooks

**Mobile** (`apps/mobile/features/[feature]/pages/[page]/use[Feature].ts` or `components/[Component]/use[Component].ts`):

```typescript
import { useQuantitySelector } from "@ewi/shared";
import { Notifier } from "react-native-notifier";
import { SuccessNotification } from "@/features/designSystem/components/Notifications/Success";
import { mapToQuantitySelectorUIModel } from "./mapToQuantitySelectorUIModel";

export const useQuantitySelectorComponent = (productId: string) => {
  const sharedHook = useQuantitySelector(productId, () => {
    Notifier.showNotification({
      title: "Added!",
      Component: SuccessNotification,
    });
  });
  const uiModel = mapToQuantitySelectorUIModel(sharedHook);
  return { uiModel, ...sharedHook };
};
```

**Web** (`apps/web/app/[route]/use[Feature].ts` or `components/[Component]/use[Component].ts`):

```typescript
"use client";
import { useQuantitySelector } from "@ewi/shared";
import { mapToQuantitySelectorUIModel } from "./mapToQuantitySelectorUIModel";

export function useQuantitySelectorComponent(productId: string) {
  const sharedHook = useQuantitySelector(productId);
  const uiModel = mapToQuantitySelectorUIModel(sharedHook);
  return { uiModel, ...sharedHook };
}
```

## Step 4: Add Tests

`packages/shared/src/__tests__/[feature]/presentations/use[Feature].test.ts`:

```typescript
jest.mock("@ewi/shared", () => ({
  useGetProductUseCase: jest.fn(),
  useAddToCartUseCase: jest.fn(),
}));

describe("useQuantitySelector", () => {
  it("initializes quantity at 1", () => {
    /* renderHook + assert */
  });
  it("increments quantity", () => {
    /* act(handleIncrement) + assert */
  });
  it("does not decrement below 1", () => {
    /* act(handleDecrement) + assert */
  });
  it("calls addToCart with correct quantity on handleAddToCart", () => {
    /* mock mutate + act + assert */
  });
});
```

## Checklist

- [ ] Hook lives in `features/[feature]/presentations/`
- [ ] Loading/pending state comes from use case `isPending` — no separate `useState`
- [ ] `onSuccess` accepted as optional parameter for platform-specific behavior
- [ ] All handlers wrapped in `useCallback`
- [ ] No single-letter or cryptic names anywhere
- [ ] Return type interface exported alongside the hook
- [ ] Barrel exports updated at module and root level
- [ ] App hooks compose this hook and add only platform-specific behavior (navigation, notifications)
- [ ] **Form hook only:** schema is a factory (`createXSchema(translate)`); `useTranslations` used inside hook; app hooks never reimplement form state or validation
