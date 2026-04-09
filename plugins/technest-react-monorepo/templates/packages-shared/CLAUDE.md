# @ewi/shared — Rules

## Clean Architecture Layers

```
src/features/[feature]/
├── domain/
│   ├── model/       # Plain TS interfaces — no framework imports
│   └── useCase/     # Thin wrappers delegating to repository hooks
├── data/
│   ├── remote/      # API calls via executeRequest
│   ├── repositories/ # React Query hooks (use[Feature]Repository)
│   ├── model/       # DTOs matching API shape
│   ├── mapper/      # DataModel → Domain conversion
│   └── local/       # Zustand stores (optional)
└── presentations/   # Shared base hooks consumed by both apps
    ├── useX.ts
    └── validators/  # Zod schemas (always under presentations/)
        └── xSchema.ts
```

## Presentation Module

Cross-cutting UI concerns — localization and shared components — live under `src/features/presentation/`:

```
src/features/presentation/
├── localization/    # i18n config, translations, resources/
└── components/      # Shared UI components (Button, etc.)
```

These are exposed via `package.json` exports as `@ewi/shared/localization` and `@ewi/shared/components`. **Never** place localization or shared component files at the top level of `src/` — they must live under `features/presentation/`. Theme is owned by the mobile app (`apps/mobile/features/theme/`).

## Base Hooks (`presentations/`)

If two or more apps need the same stateful logic (form state, validation, submit flows, shared data-transformation), the base hook lives in `presentations/`. App-level hooks compose it and add only platform-specific behavior. `domain/useCase/` is reserved for thin React Query wrappers only.

---

## Dependency Rules

- Domain models must NOT import from data layer or any framework
- Use cases delegate to repository hooks; no business logic in use cases
- Remote functions use `executeRequest`, never axios directly
- Mappers convert DataModel → Domain only; never the reverse
- **Always use path aliases instead of deep relative imports.** The package defines `@networking/*` → `lib/networking/*`, `@authentication/*` → `features/auth/*`, `@globalConfig/*` → `lib/globalConfig/*`, `@persistence/*` → `lib/persistence/*`, and `@userProfile/*` → `features/user-profile/*`. These are resolved by both TypeScript (`tsconfig.json` paths) and Metro (`metro.config.js` extraNodeModules). Use these aliases — never write `../../../../lib/networking/...` or similar multi-level relative paths. Relative imports are only acceptable within the same feature module (e.g. `../mapper/mapToX` within `features/shop/data/`).
- **When renaming or adding a path alias in shared, always update all consuming tsconfig.json files.** Path aliases are duplicated in `packages/shared/tsconfig.json`, `apps/web/tsconfig.json`, `apps/mobile/tsconfig.json`, and `packages/shared/vitest.config.ts`. A mismatch causes build failures in Next.js (Turbopack) or Metro. Update all four locations in the same commit.

## SOLID

- **S**: One file per use case / remote function / mapper / hook
- **O**: New features = new modules; never modify unrelated modules
- **I**: Small specific interfaces (`AddToCartRequest`, not a god type)
- **D**: Depend on `executeRequest` abstraction; inject `Storage` into stores

---

## Module Folder Structure

```
features/[feature]/
├── index.ts
├── domain/
│   ├── model/Entity.ts
│   └── useCase/useXUseCase.ts
└── data/
│   ├── remote/fetchX.ts
│   ├── repositories/use[Feature]Repository.ts
│   ├── model/XDataModel.ts
│   ├── mapper/mapToX.ts
│   └── local/          # only if client state needed
│       ├── index.ts    # initializeXStore, useXStore, getXStore
│       └── types.ts
├── presentations/
│   ├── useX.ts
│   └── validators/
│       └── xSchema.ts

features/presentation/          # Cross-cutting UI concerns
├── theme/
├── localization/
└── components/
```

Sub-modules: group under parent (e.g. `shop/cart/`, `shop/product/`).

---

## Localization

All user-facing strings live in `src/features/presentation/localization/`. Organized by feature:

- `common.ts` — brand, navigation, footer, theme toggle
- `auth.ts` — login, register, validation messages

Every new feature module must add its labels here. Zod schemas reference these label constants for validation messages.

---

## Naming Conventions

| Layer             | Pattern                                    | Examples                                   |
| ----------------- | ------------------------------------------ | ------------------------------------------ |
| Domain model      | `Entity.ts`                                | `News.ts`, `Cart.ts`                       |
| Use case          | `useVerbEntityUseCase.ts`                  | `useGetNewsUseCase.ts`                     |
| Remote            | `verbEntity.ts`                            | `fetchNews.ts`, `addToCart.ts`             |
| Repository hook   | `use[Feature]Repository.ts`                | `useNewsRepository.ts`                     |
| Data model        | `EntityDataModel.ts` / `EntityRequest.ts`  | `NewsDataModel.ts`                         |
| Mapper            | `mapToEntity.ts`                           | `mapToNews.ts`                             |
| Shared base hook  | `use[Feature].ts` or `use[Feature]Form.ts` | `useActivityHistory.ts`, `useLoginForm.ts` |
| Validation schema | `[feature]Schema.ts`                       | `loginSchema.ts`                           |

- Domain types: `User`, `News` — plain names, no suffix
- Data models: `XDataModel`, `XResponse`
- Requests: `XRequest`
- Enums: PascalCase + UPPER_CASE members — `NewsDisplayType.BASIC`
- Query keys: `USER_QUERY_KEY`, `CART_QUERY_KEY` (exported constants)
- Names starting with `use` are commonly interpreted as React hooks in the broader ecosystem. In this monorepo, `useVerbEntityUseCase.ts` is an internal architecture naming convention.
- For new non-hook utilities outside this architecture pattern, prefer names that do not imply React Hook semantics.

---

## Barrel Exports

### Module barrel (`features/[feature]/index.ts`)

```typescript
// UseCase
export { useGetXUseCase } from "./domain/useCase/useGetXUseCase";
// Model
export { X } from "./domain/model/X";
// Local Store (only if applicable)
export { initializeXStore, useXStore, getXStore } from "./data/local";
```

### Root barrel (`src/index.ts`)

- Import `@networking/requestInterceptor` at top
- Use path aliases (`@feature/index`), not relative paths
- Each import + re-export on separate lines:

```typescript
// Feature - UseCase
import { useGetXUseCase } from "@feature/index";
export { useGetXUseCase };
```

**Never** export data-layer internals (remote functions, data models, mappers, repository hooks directly).

**Note:** Theme, localization, and components are NOT re-exported from the root barrel. They are accessed via their own sub-path exports (`@ewi/shared/theme`, `@ewi/shared/localization`, `@ewi/shared/components`).

---

## Form Validation (Zod)

All form validation schemas live in `@ewi/shared`. **Never define validation logic in apps.**

### Location

```
features/[feature]/
└── presentations/
    └── validators/
        └── [feature]Schema.ts   # Zod schema + inferred type
```

### Pattern

```typescript
// packages/shared/src/features/auth/presentations/validators/loginSchema.ts
import { z } from "zod";

export const createLoginSchema = (translate: (key: string) => string) =>
  z.object({
    email: z.string().email({ message: translate("validation.emailInvalid") }),
    password: z.string().min(6, translate("validation.passwordMinLength")),
  });

export type LoginForm = z.infer<ReturnType<typeof createLoginSchema>>;
```

### Barrel export

Export from the module's `index.ts`:

```typescript
export { createLoginSchema } from "./presentations/validators/loginSchema";
export type { LoginForm } from "./presentations/validators/loginSchema";
```

Apps import `createLoginSchema` and instantiate it with a scoped translate function. Zero validation logic in apps.

---

## Networking & Error Handling

All API calls through `executeRequest<T>()` — never axios directly:

```typescript
import { executeRequest } from "@networking/executeRequest";

export const fetchX = async (): Promise<X[]> => {
  const path = `api/x`;
  try {
    const response = await executeRequest<XDataModel>({ path });
    return response.data.map(mapToX);
  } catch (error) {
    throw error;
  }
};
```

Interceptor chain (centralized error handling):

1. `refreshTokenOnUnauthorized` — 401: refresh + retry
2. `handleForbiddenError` — 403: queue + emit `auth:loginRequired`
3. `mapApiError` — maps HTTP codes to `APIError` enum

Auth events via `mitt`: `auth:loginRequired`, `auth:loginSuccess`, `auth:loginFailed`

Never catch and swallow errors silently.

**Never validate API response shape in repositories or remote functions.** Do not check `response.code`, `response.message`, or `Array.isArray(response.result)` — the interceptor chain (`mapApiError`) already handles HTTP errors and maps them to `APIError` enum values centrally. Repository hooks and remote functions trust the response shape after the interceptors pass it through. If the response is malformed, the mapper will handle it (returning `null` for invalid items, filtered out downstream).

---

## React Query Patterns

### Repository Hook Pattern

Each feature has a single repository hook (`use[Feature]Repository`) in `data/repositories/` that encapsulates all React Query queries and mutations for that feature.

```typescript
// data/repositories/useRewardsRepository.ts
export const REWARDS_QUERY_KEY = "rewardsList";

export const useRewardsRepository = () => {
  const { data: user } = useUserUseCase();
  const queryClient = useQueryClient();

  const rewardsQuery = useQuery({
    queryKey: [REWARDS_QUERY_KEY, user?.id],
    queryFn: fetchRewards,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60 * 24,
    enabled: !!user?.id,
  });

  const addRewardMutation = useMutation<
    RewardDataModel,
    Error,
    AddRewardRequest
  >({
    mutationFn: (params) => addReward(params),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: [REWARDS_QUERY_KEY] }),
  });

  return { rewardsQuery, addRewardMutation };
};
```

- Always invalidate related queries in `onSettled`
- Accept `onSuccess`/`onError` callbacks for UI-level feedback
- Use optimistic updates when syncing with local stores

---

## Testing (Vitest)

- **Use `vi.hoisted()` for mock variables referenced inside `vi.mock` factories.** Standard `const` declarations are not available inside `vi.mock` due to hoisting — Vitest moves `vi.mock` calls to the top of the file before any variable declarations. Use `vi.hoisted()` to declare mocks that need to be referenced in factory functions:

```typescript
// ✅ Correct — vi.hoisted ensures availability inside vi.mock
const { mockFn } = vi.hoisted(() => ({
  mockFn: vi.fn(),
}));

vi.mock("./module", () => ({
  someExport: mockFn,
}));

// ❌ Wrong — mockFn is undefined inside vi.mock due to hoisting
const mockFn = vi.fn();

vi.mock("./module", () => ({
  someExport: mockFn, // ReferenceError
}));
```
