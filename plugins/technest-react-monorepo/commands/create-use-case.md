Add a new use case to an existing module in `packages/shared/src/features/` with all required layers.

## Step 1: Determine Operation Type

| Type | Verb | Repository | Remote fn | Example |
|------|------|-----------|-----------|---------|
| Read (list) | Get | `useQuery` | `fetchX` | `useGetRewardsUseCase` |
| Read (single) | GetById | `useQuery` | `getXById` | `useGetRewardByIdUseCase` |
| Create | Add | `useMutation` | `addX` | `useAddRewardUseCase` |
| Update | Update | `useMutation` | `updateX` | `useUpdateRewardUseCase` |
| Delete | Delete/Clear | `useMutation` | `deleteX` | `useDeleteRewardUseCase` |
| Toggle | Toggle | `useMutation` | `toggleX` | `useToggleFavoriteUseCase` |

Ask the user:
1. **Which module?** — e.g. `rewards/`, `shop/cart/`
2. **Operation type** — from the table above
3. **Entity name** — e.g. "Reward", "CartItem"
4. **API path** — e.g. `api/rewards`, `api/cart/:id`
5. **Request/response shape** — what fields does the API send/receive?

## Step 2: Create Files (bottom-up)

Work from data layer up to domain:

### 2a. Data Model (if new request/response shape)

`data/model/XRequest.ts`:
```typescript
export interface AddRewardRequest {
  name: string;
  points: number;
}
```

### 2b. Mapper (if new response needs mapping)

`data/mapper/mapToX.ts`:
```typescript
export function mapToReward(dataModel: RewardItemDataModel): Reward | null {
  if (!dataModel.name) return null;
  return { id: dataModel.id, name: dataModel.name, points: dataModel.points };
}
```

### 2c. Remote Function

Query:
```typescript
import { executeRequest } from '@networking/executeRequest';

export const fetchRewards = async (): Promise<Reward[]> => {
  const path = `api/rewards`;
  try {
    const response = await executeRequest<RewardDataModel>({ path });
    return response.data.map(mapToReward).filter((reward): reward is Reward => reward !== null);
  } catch (error) {
    throw error;
  }
};
```

Mutation:
```typescript
export const addReward = async (request: AddRewardRequest): Promise<RewardDataModel> => {
  const path = `api/rewards`;
  try {
    return await executeRequest<RewardDataModel>({ path, method: 'POST', bodyParams: request });
  } catch (error) {
    throw error;
  }
};
```

### 2d. Repository Hook

`data/repositories/use[Feature]Repository.ts` — encapsulates all React Query operations for this feature:

```typescript
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

  const addRewardMutation = useMutation<RewardDataModel, Error, AddRewardRequest>({
    mutationFn: (params) => addReward(params),
    onSettled: () => queryClient.invalidateQueries({ queryKey: [REWARDS_QUERY_KEY] }),
  });

  return { rewardsQuery, addRewardMutation };
};
```

### 2e. Use Case

```typescript
export const useAddRewardUseCase = (onSuccess?: () => void) => {
  const { addRewardMutation } = useRewardsRepository();
  return addRewardMutation;
};
```

## Step 3: Register Exports

1. Add use case to module `index.ts` under `// UseCase` section
2. Add any new models to module `index.ts` under `// Model` section
3. Add imports and re-exports to `packages/shared/src/index.ts`

## Step 4: Add Tests

Create in `packages/shared/src/__tests__/[feature]/`:
- `data/mapper/mapToX.test.ts` — valid data, null fields, edge cases
- `domain/useCase/useXUseCase.test.ts` — mock hook, verify delegation
- `data/remote/fetchX.test.ts` — mock `executeRequest`, verify path/method
- `data/repositories/use[Feature]Repository.test.ts` — mock React Query, verify config

## Checklist

- [ ] Remote function uses `executeRequest`, not axios
- [ ] Mapper handles null/missing fields gracefully
- [ ] Query key exported as constant
- [ ] Auth-gated queries use `enabled: !!userId`
- [ ] Mutations invalidate related queries in `onSettled`
- [ ] Use case is a thin wrapper with no business logic
- [ ] Barrel exports updated at module and root level
- [ ] Path alias exists in tsconfig.json
