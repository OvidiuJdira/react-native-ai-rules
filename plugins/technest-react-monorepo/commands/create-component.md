Scaffold a reusable feature component with UI, optional hook, styles, and typed props.

## Step 1: Gather Requirements

Ask the user:
1. **Component name** — PascalCase, e.g. "QuantitySelector", "HeaderButtons"
2. **Target app** — `@ewi/mobile`, `@ewi/web`, or `@ewi/shared` (cross-platform)?
3. **Which module?** — e.g. `shop/cart/`, `offers/`
4. **Props** — what data/callbacks does it receive?
5. **Has internal logic?** — does it need its own custom hook?
6. **Uses shared library?** — stores, use cases, domain models from `@ewi/shared`?

Before creating, check existing design system components (mobile):
- **Buttons**: `PrimaryButton`, `RoundButton`, `SocialButton`
- **Headers**: `AppHeader`, `ScreenHeader`, `DetailsHeader`, `SearchHeader`
- **Input**: `CustomInput` (label, icon, password toggle, error display)
- **Media**: `LoyaltyImage`, `SVG`
- **Layout**: `SectionWrapper`, `DetailsContent`, `FloatingActionView`
- **Feedback**: `SuccessNotification`, `ErrorNotification`

---

## Mobile Component (React Native)

Files go in `apps/mobile/features/[feature]/components/[ComponentName]/`

If the component is reusable across all mobile features, place it in `apps/mobile/features/designSystem/components/` instead.

### Types (`types.ts`)

```typescript
export interface QuantitySelectorProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  isLoading?: boolean;
}
```

### Styles (`styles.ts`)

```typescript
import { StyleSheet } from "react-native";
import { scale } from "@designSystem/responsiveness/scale";

export const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
});
```

### Custom Hook (`useX.ts` — only if needed)

Create when the component has non-trivial logic (state, effects, store access). Always derive and return concrete values — never return undefined references:

```typescript
import { useStore } from "zustand";
import { useCartStore } from "@ewi/shared";
import { UseQuantitySelectorReturn } from "./types";

export const useQuantitySelector = (productId: string): UseQuantitySelectorReturn => {
  const { products, incrementProduct, decrementProduct } = useStore(useCartStore());
  const cartItem = products.find((product) => product.id === productId);
  const quantity = cartItem?.quantity ?? 0;

  return {
    quantity,
    increment: () => incrementProduct(productId),
    decrement: () => decrementProduct(productId),
  };
};
```

### Component (`index.tsx`)

All UI labels come from `@ewi/shared/localization` — no hardcoded strings:

```typescript
import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { useTheme } from "@ewi/shared/theme";
import { commonLabels } from "@ewi/shared/localization";
import { styles } from "./styles";
import { QuantitySelectorProps } from "./types";

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  onIncrement,
  onDecrement,
  isLoading,
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onDecrement}>
        <Text style={theme.text_styles.TITLE_M_BLACK}>{commonLabels.decrement}</Text>
      </TouchableOpacity>
      <Text style={theme.text_styles.BODY_M_BLACK}>{quantity}</Text>
      <TouchableOpacity onPress={onIncrement}>
        <Text style={theme.text_styles.TITLE_M_BLACK}>{commonLabels.increment}</Text>
      </TouchableOpacity>
    </View>
  );
};
```

---

## Web Component (Next.js)

Files go in `apps/web/components/[ComponentName]/`

```typescript
"use client";
import { useTheme } from "@ewi/shared/theme";

interface ProductCardProps {
  title: string;
  price: number;
  onClick: () => void;
}

export function ProductCard({ title, price, onClick }: ProductCardProps) {
  const { theme } = useTheme();

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        border: `1px solid ${theme.colors.border}`,
        cursor: "pointer",
      }}
    >
      <h3 style={{ color: theme.colors.text, fontSize: theme.fontSizes.lg }}>{title}</h3>
      <p style={{ color: theme.colors.primary }}>{price}</p>
    </div>
  );
}
```

---

## Checklist

- [ ] PascalCase folder name
- [ ] Props typed in `types.ts` (mobile) or inline interface (web)
- [ ] Mobile: `styles.ts` uses `scale()` for all numeric values
- [ ] Web: theme tokens via `useTheme()`, not hardcoded colors
- [ ] Theme colors accessed via `useTheme()`, applied inline
- [ ] Mobile: text uses `theme.text_styles.*` — no hardcoded font families
- [ ] No hardcoded UI strings — all labels from `@ewi/shared/localization`
- [ ] Hook only if component has non-trivial logic; hook returns fully derived values, not undefined references
- [ ] Checked design system for existing components before creating new ones
