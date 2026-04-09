---
name: ui-patterns
description: Enforces UI code quality rules when writing JSX, page components, screen components, index.tsx, or React Native views in the EWI project. Covers UIModel rendering, no logic in JSX, theme tokens, localization, isDark branching.
user-invocable: false
---

# UI Patterns — Anti-pattern Enforcement

When generating UI code (pages, components, JSX), apply these corrections automatically. Do not produce code matching the "wrong" patterns.

## 1. Pages render UIModel only — no value computation in JSX

```typescript
// WRONG — computing values in JSX
<Text>{isSubmitting ? "Submitting..." : "Submit"}</Text>
<Text>{`${points} pts`}</Text>
<Text>{t("login.heading")}</Text>

// CORRECT — all values pre-resolved in UIModel via mapper
<Text>{uiModel.submitButtonLabel}</Text>
<Text>{uiModel.formattedPoints}</Text>
<Text>{uiModel.loginHeading}</Text>
```

Conditional rendering on UIModel booleans IS acceptable:
```typescript
// OK — conditional rendering, not value computation
{uiModel.showError && <Text>{uiModel.errorMessage}</Text>}
{uiModel.isLoading ? <Spinner /> : <Content />}
```

## 2. No isDark in JSX

```typescript
// WRONG — branching on isDark in template
<Text>{isDark ? "Switch to Light" : "Switch to Dark"}</Text>
<View style={{ backgroundColor: isDark ? "#000" : "#fff" }}>

// CORRECT — isDark resolved in mapper, theme provides correct tokens
<Text>{uiModel.themeToggleLabel}</Text>
<View style={{ backgroundColor: colors.background }}>
```

## 3. All design tokens from useTheme()

```typescript
// WRONG — hardcoded values
<View style={{ backgroundColor: "#f5f5f5", padding: 16, borderRadius: 8 }}>
<Text style={{ color: "black", fontSize: 14 }}>

// CORRECT — theme tokens
const { theme } = useTheme();
const { colors, spacing, fontSizes, borderRadius } = theme;
<View style={{ backgroundColor: colors.background, padding: spacing.md, borderRadius: borderRadius.md }}>
<Text style={{ color: colors.text, fontSize: fontSizes.md }}>
```

## 4. All strings from localization

```typescript
// WRONG — hardcoded labels
<Text>Login</Text>
<TextInput placeholder="Enter email" />
<TouchableOpacity><Text>Submit</Text></TouchableOpacity>

// CORRECT — from UIModel (which gets them from localization)
<Text>{uiModel.loginHeading}</Text>
<TextInput placeholder={uiModel.emailPlaceholder} />
<TouchableOpacity><Text>{uiModel.submitButtonLabel}</Text></TouchableOpacity>
```

## 5. No t() or translate() calls in JSX

```typescript
// WRONG — translation calls in template
<Text>{translateAuth("login.heading")}</Text>
<Text>{i18n.t("submit", { ns: "common" })}</Text>

// CORRECT — resolved in mapper, rendered from UIModel
<Text>{uiModel.loginHeading}</Text>
<Text>{uiModel.submitLabel}</Text>
```

## 6. No use case calls in page components

```typescript
// WRONG — calling use cases directly in page
const { data: products } = useGetProductsUseCase();

// CORRECT — page uses custom hook that wraps use cases
const { uiModel } = useProducts();
```

## 7. React Native: styles.ts is structural only

```typescript
// WRONG — design tokens in StyleSheet
export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
});

// CORRECT — structural only, tokens applied inline
export const styles = StyleSheet.create({
  container: { flex: 1 },
});
// In component: style={[styles.container, { backgroundColor: colors.background, padding: spacing.md }]}
```
