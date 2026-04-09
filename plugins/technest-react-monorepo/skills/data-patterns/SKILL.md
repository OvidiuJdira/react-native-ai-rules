---
name: data-patterns
description: Enforces data layer code quality rules when writing code in packages/shared — mappers, remote functions, React Query hooks, use cases, domain models, Zustand stores, barrel exports, or data models in the EWI project.
user-invocable: false
---

# Data Patterns — Anti-pattern Enforcement

When generating code in `packages/shared/`, apply these corrections automatically. Do not produce code matching the "wrong" patterns.

## 1. Mappers return null for invalid data — filtered by caller

```typescript
// WRONG — mapper throws or returns partial data
export function mapToReward(dataModel: RewardItemDataModel): Reward {
  return {
    id: dataModel.id,
    name: dataModel.name ?? "Unknown",  // masking bad data
    points: dataModel.points,
  };
}

// CORRECT — null for invalid, caller filters
export function mapToReward(dataModel: RewardItemDataModel): Reward | null {
  if (!dataModel.name) return null;
  return {
    id: dataModel.id,
    name: dataModel.name,
    points: dataModel.points,
  };
}

// In remote function:
response.data.map(mapToReward).filter((reward): reward is Reward => reward !== null);
```

## 2. Remote functions use executeRequest — never axios

```typescript
// WRONG
import axios from "axios";
export const fetchRewards = async () => {
  const response = await axios.get("/api/rewards");
  return response.data;
};

// CORRECT
import { executeRequest } from "@networking/executeRequest";
export const fetchRewards = async (): Promise<Reward[]> => {
  const path = "api/rewards";
  const response = await executeRequest<RewardDataModel>({ path });
  return response.data.map(mapToReward).filter((reward): reward is Reward => reward !== null);
};
```

## 3. Use cases are thin wrappers — zero business logic

```typescript
// WRONG — logic in use case
export const useGetRewardsUseCase = () => {
  const query = useGetRewards();
  const filtered = query.data?.filter((reward) => reward.points > 0);
  return { ...query, data: filtered };
};

// CORRECT — pure delegation
export const useGetRewardsUseCase = () => {
  return useGetRewards();
};
```

## 4. Query keys are exported constants

```typescript
// WRONG — inline string
useQuery({ queryKey: ["rewards", userId], ... });

// CORRECT — constant
export const REWARDS_QUERY_KEY = "rewardsList";
useQuery({ queryKey: [REWARDS_QUERY_KEY, userId], ... });
```

## 5. Auth-gated queries use enabled

```typescript
// WRONG — no guard
export const useGetRewards = () => {
  const { data: user } = useUserUseCase();
  return useQuery({
    queryKey: [REWARDS_QUERY_KEY, user?.id],
    queryFn: fetchRewards,
  });
};

// CORRECT — enabled guard
export const useGetRewards = () => {
  const { data: user } = useUserUseCase();
  return useQuery({
    queryKey: [REWARDS_QUERY_KEY, user?.id],
    queryFn: fetchRewards,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60 * 24,
    enabled: !!user?.id,
  });
};
```

## 6. Mutations invalidate in onSettled

```typescript
// WRONG — invalidate in onSuccess only (misses error case)
useMutation({
  mutationFn: addReward,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: [REWARDS_QUERY_KEY] }),
});

// CORRECT — onSettled covers both success and error
useMutation({
  mutationFn: (params) => addReward(params),
  onSettled: () => queryClient.invalidateQueries({ queryKey: [REWARDS_QUERY_KEY] }),
  onSuccess: () => onSuccess?.(),
});
```

## 7. Domain models are plain TS — no framework imports

```typescript
// WRONG — framework dependency in domain
import { z } from "zod";
export interface Reward { ... }
export const rewardSchema = z.object({ ... });

// CORRECT — domain is pure TS interfaces
export interface Reward {
  id: string;
  name: string;
  points: number;
}
// Zod schemas go in presentations/validators/, not domain/
```

## 8. Barrel exports — never expose data internals

```typescript
// WRONG — leaking data layer
export { fetchRewards } from "./data/remote/fetchRewards";
export { RewardDataModel } from "./data/model/RewardDataModel";
export { useRewardsRepository } from "./data/repositories/useRewardsRepository";

// CORRECT — only use cases, domain models, stores
export { useGetRewardsUseCase } from "./domain/useCase/useGetRewardsUseCase";
export type { Reward } from "./domain/model/Reward";
export { initializeRewardStore, useRewardStore, getRewardStore } from "./data/local";
```

## 9. Zod schemas are factories accepting translate

```typescript
// WRONG — static schema with hardcoded messages
export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password too short"),
});

// CORRECT — factory with translate for localized messages
export const createLoginSchema = (translate: (key: string) => string) =>
  z.object({
    email: z.string().email(translate("validation.emailInvalid")),
    password: z.string().min(6, translate("validation.passwordMinLength")),
  });

export type LoginForm = z.infer<ReturnType<typeof createLoginSchema>>;
```

## 10. No single-letter names in data layer

```typescript
// WRONG
response.data.map((d) => mapToReward(d)).filter((r): r is Reward => r !== null);

// CORRECT
response.data.map((dataItem) => mapToReward(dataItem)).filter((reward): reward is Reward => reward !== null);
```
