Scaffold a complete feature module in @ewi/shared following Clean Architecture.

## Step 1: Gather Requirements

Ask the user:

1. **Module name** — e.g. "reward", "loyalty-card"
2. **API endpoint(s)** — e.g. `api/rewards`, `api/rewards/:id`
3. **Operations** — which CRUD operations? (get list, get by id, create, update, delete, toggle)
4. **Needs local state?** — does the module need a Zustand persistent store?
5. **Parent module?** — is this a sub-module (e.g. under `shop/`)?

## Step 2: Create Folder Structure

```
packages/shared/src/features/[feature]/
├── index.ts
├── domain/
│   ├── model/
│   │   └── Entity.ts
│   └── useCase/
│       └── useGetEntityUseCase.ts
├── data/
│   ├── remote/
│   │   └── fetchEntity.ts
│   ├── repositories/
│   │   └── use[Feature]Repository.ts
│   ├── model/
│   │   └── EntityDataModel.ts
│   └── mapper/
│       └── mapToEntity.ts
└── presentations/        # shared hooks consumed by both apps (run /create-shared-hook)
    ├── use[Feature].ts
    └── validators/       # Zod schemas (always under presentations/)
        └── [feature]Schema.ts
```

> **Note:** Cross-cutting UI concerns (theme, localization, components) live in `features/presentation/`, not inside individual feature modules. See `packages/shared/CLAUDE.md` for details.

If local state is needed, add:

```
    └── local/
        ├── index.ts
        └── types.ts
```

## Step 3: Create Domain Model

`domain/model/Entity.ts` — Plain TypeScript interfaces, no framework imports:

```typescript
export interface Reward {
  id: string;
  name: string;
  points: number;
}
```

## Step 4: Create Data Model

`data/model/EntityDataModel.ts` — Mirrors the API response shape. Use `| null` for nullable fields:

```typescript
export interface RewardItemDataModel {
  id: string;
  name: string | null;
  points: number;
}

export interface RewardDataModel {
  data: RewardItemDataModel[];
}
```

## Step 5: Create Mapper

`data/mapper/mapToEntity.ts` — Convert data model to domain. Return `null` for invalid data:

```typescript
import { RewardItemDataModel } from "../model/RewardDataModel";
import { Reward } from "../../domain/model/Reward";

export function mapToReward(dataModel: RewardItemDataModel): Reward | null {
  if (!dataModel.name) return null;
  return {
    id: dataModel.id,
    name: dataModel.name,
    points: dataModel.points,
  };
}
```

## Step 6: Create Remote Function

`data/remote/fetchEntity.ts` — Uses `executeRequest`, returns domain type:

```typescript
import { executeRequest } from "@networking/executeRequest";
import { RewardDataModel } from "../model/RewardDataModel";
import { mapToReward } from "../mapper/mapToReward";
import { Reward } from "../../domain/model/Reward";

export const fetchRewards = async (): Promise<Reward[]> => {
  const path = `api/rewards`;
  try {
    const response = await executeRequest<RewardDataModel>({ path });
    return response.data
      .map(mapToReward)
      .filter((reward): reward is Reward => reward !== null);
  } catch (error) {
    throw error;
  }
};
```

For mutations:

```typescript
export const addReward = async (
  request: AddRewardRequest,
): Promise<RewardDataModel> => {
  const path = `api/rewards`;
  try {
    return await executeRequest<RewardDataModel>({
      path,
      method: "POST",
      bodyParams: request,
    });
  } catch (error) {
    throw error;
  }
};
```

## Step 7: Create Repository Hook

`data/repositories/use[Feature]Repository.ts` — encapsulates all React Query queries and mutations for this feature:

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchRewards } from "../remote/fetchRewards";
import { addReward } from "../remote/addReward";
import { useUserUseCase } from "@user/domain/useCase/useUserUseCase";

export const REWARDS_QUERY_KEY = "rewardsList";

export const useRewardsRepository = () => {
  const { data: user } = useUserUseCase();
  const userId = user?.id;
  const queryClient = useQueryClient();

  const rewardsQuery = useQuery({
    queryKey: [REWARDS_QUERY_KEY, userId],
    queryFn: fetchRewards,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60 * 24,
    enabled: !!userId,
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

## Step 8: Create Use Case

`domain/useCase/useGetEntityUseCase.ts` — Thin wrapper, single delegation:

```typescript
import { useRewardsRepository } from "../../data/repositories/useRewardsRepository";

export const useGetRewardsUseCase = () => {
  const { rewardsQuery } = useRewardsRepository();
  return rewardsQuery;
};
```

For mutations, pass callbacks through:

```typescript
export const useAddRewardUseCase = () => {
  const { addRewardMutation } = useRewardsRepository();
  return addRewardMutation;
};
```

## Step 9: Create Local Store (if needed)

`data/local/types.ts`:

```typescript
import { StoreApi } from "zustand";
import { Reward } from "../../domain/model/Reward";

export interface RewardState extends Reward {}
export type StoreActions<TState> = {
  [actionName: string]: (
    set: StoreApi<TState>["setState"],
    get: StoreApi<TState>["getState"],
    ...actionArgs: unknown[]
  ) => void;
};
```

`data/local/index.ts`:

```typescript
import { createPersistentStore } from "@persistence/index";
import { RewardState, StoreActions } from "./types";

let rewardStore: ReturnType<typeof createPersistentStore<RewardState>> | null =
  null;
const initialState: RewardState = {
  /* defaults */
};
const actions: StoreActions<RewardState> = {
  /* actions */
};

export const initializeRewardStore = (storage: Storage) => {
  if (!rewardStore) {
    rewardStore = createPersistentStore(
      initialState,
      actions,
      "reward-store",
      storage,
    );
  }
};
export const useRewardStore = () => {
  if (!rewardStore) throw new Error("Store not initialized");
  return rewardStore;
};
export const getRewardStore = () => {
  if (!rewardStore) throw new Error("Store not initialized");
  return rewardStore.getState();
};
```

## Step 10: Create Barrel & Register

1. Create `features/[feature]/index.ts` with grouped exports:

```typescript
// UseCase
export { useGetRewardsUseCase } from "./domain/useCase/useGetRewardsUseCase";

// Model
export { Reward } from "./domain/model/Reward";

// Local Store (only if applicable)
export {
  initializeRewardStore,
  useRewardStore,
  getRewardStore,
} from "./data/local";
```

2. Add path alias to `packages/shared/tsconfig.json` paths: `"@reward/*": ["features/reward/*"]`
3. Add imports and re-exports to `packages/shared/src/index.ts` following the existing pattern

## Step 11: Add Tests

Create test files in `packages/shared/src/__tests__/[feature]/` mirroring the module structure:

- `mapToEntity.test.ts` — mapper with valid/null/edge cases
- `useGetEntityUseCase.test.ts` — mock repository, verify delegation
- `fetchEntity.test.ts` — mock `executeRequest`

## Checklist

- [ ] Remote function uses `executeRequest`, not axios
- [ ] Mapper handles null/missing fields gracefully, returns `null` for invalid data
- [ ] Query key exported as constant
- [ ] Auth-gated queries use `enabled: !!userId`
- [ ] Mutations invalidate related queries in `onSettled`
- [ ] Use case is a thin wrapper with no business logic
- [ ] Barrel exports updated at module and root level
- [ ] Path alias added to `tsconfig.json`
