---
name: hook-patterns
description: Enforces hook code quality rules when writing custom hooks (useX.ts), form hooks, shared hooks, or presentations/ hooks in the EWI project. Covers hook composition, form delegation, dependency resolution, naming conventions, UIModel building, navigation state pattern.
user-invocable: false
---

# Hook Patterns — Anti-pattern Enforcement

When generating hooks, apply these corrections automatically. Do not produce code matching the "wrong" patterns.

## 1. App hooks compose shared base hooks — never reimplement

```typescript
// WRONG — reimplementing form state in an app hook
export const useLogin = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const schema = createLoginSchema(translateAuth);
  // ... 40 lines of validation logic ...
};

// CORRECT — compose shared hook, expose navigation state (NO router)
export const useLogin = (): UseLoginReturn => {
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
  const uiModel = mapToLoginPageUIModel({ form, errors, isSubmitting });
  const handleRegister = useCallback(() => setNavigationTarget("register"), []);
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
  };
};
```

Naming convention: shared base = `use[Feature]Form` for form hooks, `use[Feature]Data` for data/state hooks; app hook = `use[Feature]` (same name in both apps).

## 1b. Every feature used by both apps MUST have a shared base hook

Before creating an app-level hook, check if `@ewi/shared` already has a base hook for this feature. If the feature exists (or will exist) in both mobile and web, the base hook MUST live in `@ewi/shared/features/[feature]/presentations/`. Never create app-only hooks for shared features — extract first, compose per platform.

## 2. NEVER call router in a custom hook — use navigation state

```typescript
// WRONG — hook imports and calls router directly
import { useRouter } from "expo-router";
export const useLogin = (): UseLoginReturn => {
  const router = useRouter();
  const handleRegister = useCallback(
    () => router.push("/(auth)/register"),
    [router],
  );
  return { handleRegister };
};

// CORRECT — hook exposes navigation state, separate handler owns the router
export const useLogin = (): UseLoginReturn => {
  const [navigationTarget, setNavigationTarget] =
    useState<LoginNavigationTarget>(null);
  const handleRegister = useCallback(() => setNavigationTarget("register"), []);
  const clearNavigationTarget = useCallback(
    () => setNavigationTarget(null),
    [],
  );
  return { navigationTarget, clearNavigationTarget, handleRegister };
};

// use[Feature]NavigationHandler.ts — separate file, owns the router
export const useLoginNavigationHandler = (
  target: LoginNavigationTarget,
  onNavigated: () => void,
) => {
  const router = useRouter();
  useEffect(() => {
    if (!target) return;
    switch (target) {
      case "register":
        router.push("/(auth)/register");
        break;
    }
    onNavigated();
  }, [target, router, onNavigated]);
};

// index.tsx — page wires them together
const { navigationTarget, clearNavigationTarget, handleRegister } = useLogin();
useLoginNavigationHandler(navigationTarget, clearNavigationTarget);
```

## 3. Dependencies resolved internally — never passed as parameters

```typescript
// WRONG — threading dependencies
export const useLogin = (theme: Theme, translateAuth: TranslateFn) => { ... };
const uiModel = buildUI({ form, isSubmitting, translateAuth });

// CORRECT — each function resolves its own
export const useLogin = (): UseLoginReturn => {
  const { isDark } = useTheme();       // resolved inside hook
  const { form, ... } = useLoginForm();
  const uiModel = mapToLoginPageUIModel({ form, errors, isSubmitting, isDark }); // mapper uses scopedTranslations internally
  return { uiModel, ... };
};
```

## 4. Hooks always build UIModel via pure mapper before returning

```typescript
// WRONG — returning raw data
export const useProducts = () => {
  const { data: products, isLoading } = useGetProductsUseCase();
  return { products, isLoading };
};

// CORRECT — mapper transforms to UIModel
export const useProducts = (): UseProductsReturn => {
  const { data: products = [], isLoading } = useGetProductsUseCase();
  const uiModel = mapToProductsPageUIModel({ products, isLoading });
  return { uiModel };
};
```

## 5. Loading/pending state from use cases — never separate useState

```typescript
// WRONG — manual loading state
const [isLoading, setIsLoading] = useState(false);
const handleSubmit = async () => {
  setIsLoading(true);
  await submitLogin(form);
  setIsLoading(false);
};

// CORRECT — from mutation's isPending
const { mutate: submitLogin, isPending: isSubmitting } = useLoginUseCase();
```

## 6. No single-letter or cryptic names — anywhere

```typescript
// WRONG
setForm((p) => ({ ...p, [f]: v }));
errors.forEach((e) => {
  const f = e.path[0];
});
const cb = () => setNavigationTarget("home");

// CORRECT
setForm((previousForm) => ({ ...previousForm, [field]: value }));
errors.forEach((validationIssue) => {
  const field = validationIssue.path[0];
});
const handleNavigateHome = useCallback(() => setNavigationTarget("home"), []);
```

This applies everywhere: `useCallback` bodies, `setState` updaters, `.map()`, `.filter()`, `.forEach()`, `.reduce()`.

## 7. Scoped translations — never inline namespace

```typescript
// WRONG — in hooks
const label = i18n.t("login.heading", { ns: "auth" });

// CORRECT — in hooks (useTranslations)
const translateAuth = useTranslations("auth");
const label = translateAuth("login.heading");

// CORRECT — in mappers (scopedTranslations at module level)
const translateAuth = scopedTranslations("auth");
export const mapToLoginPageUIModel = ({ form }) => ({
  heading: translateAuth("login.heading"),
});
```

## 8. All handlers wrapped in useCallback

```typescript
// WRONG — inline arrow in return
return { handleSubmit: () => submitLogin(form) };

// CORRECT — useCallback
const handleSubmit = useCallback(() => {
  submitLogin(form);
}, [submitLogin, form]);
return { handleSubmit };
```

## 9. Hook return type always explicitly typed

```typescript
// WRONG — inferred return
export const useLogin = () => { ... };

// CORRECT — explicit return type
export const useLogin = (): UseLoginReturn => { ... };
```
