# Architecture: CASL Authorization System

This document explains the design decisions, trade-offs, and architectural patterns used in the CASL Authorization System.

## Table of Contents

- [Why CASL?](#why-casl)
- [Layered Architecture](#layered-architecture)
- [Type System Design](#type-system-design)
- [Policy Definition Design](#policy-definition-design)
- [Ability Builder Design](#ability-builder-design)
- [Pinia Store Design](#pinia-store-design)
- [Reactivity Model](#reactivity-model)
- [Directive vs. Composable vs. Component](#directive-vs-composable-vs-component)
- [Scoped Permissions and CASL Conditions](#scoped-permissions-and-casl-conditions)
- [Error Handling Strategy](#error-handling-strategy)
- [Testing Strategy](#testing-strategy)
- [Performance Decisions](#performance-decisions)
- [Migration Strategy](#migration-strategy)

---

## Why CASL?

The legacy authorization engine (`engine.ts`) was a custom implementation that worked but had several limitations:

- No standard API — every developer had to learn the custom API
- Limited type safety — permission checks were loosely typed
- No reactive integration — permissions had to be manually re-checked
- Hard to test — tightly coupled to application state

**CASL** was chosen because:

1. **Industry standard**: Widely used in the Vue/Node.js ecosystem with active maintenance
2. **Type-safe**: Full TypeScript support with generic types
3. **Condition-based rules**: Native support for MongoDB-style conditions (`$ne`, `$in`, etc.) needed for scoped permissions
4. **Reactive integration**: `@casl/vue` provides reactive ability instances
5. **Backward compatible**: The same permission logic can be expressed in CASL rules

---

## Layered Architecture

The system is organized into four layers, each with a single responsibility:

```
Policy Layer → Core Layer → Store Layer → UI Layer
```

### Policy Layer (`types/`, `core/policy.ts`)

Defines **what** permissions exist. This is the single source of truth for all authorization rules. Changes here automatically propagate to all permission checks.

**Design decision**: Using `as const satisfies PolicyDefinition` provides:

- Compile-time validation that the policy matches the expected structure
- Literal type inference for autocomplete
- Immutability at runtime

### Core Layer (`core/ability.ts`, `core/errors.ts`)

Converts the policy into a CASL `Ability` instance. This is a **pure function** — given the same inputs, it always produces the same output. This makes it trivially testable and predictable.

**Design decision**: `buildAbility` is a pure function rather than a class method. This:

- Enables property-based testing
- Avoids hidden state
- Makes the conversion logic explicit and auditable

### Store Layer (`stores/authorizationStore.ts`)

Manages the **lifecycle** of the ability instance. The store is the single source of truth for the current user and their permissions.

**Design decision**: Pinia was chosen over Vuex because:

- Better TypeScript support
- Simpler API (no mutations)
- Composable-friendly

### UI Layer (`composables/`, `directives/`, `components/`)

Provides **reactive** access to permissions in Vue components. This layer never contains authorization logic — it only reads from the store.

---

## Type System Design

### Const Assertions

All constant arrays use `as const`:

```ts
export const ACTIONS = ["view", "create", "edit", "delete", "export"] as const;
export type Action = (typeof ACTIONS)[number];
```

**Why**: This creates a union type `'view' | 'create' | 'edit' | 'delete' | 'export'` rather than `string`. TypeScript can then catch typos at compile time.

### Discriminated Union for ResourceDef

`ResourceDef` is a discriminated union:

```ts
type ResourceDef = AnyResourceDef | ScopedResourceDef;
```

Type guards (`isAnyResourceDef`, `isScopedResourceDef`) narrow the type in `buildAbility`. This avoids `as` casts and ensures exhaustive handling.

### SubjectMetadata Index Signature

```ts
interface SubjectMetadata {
  readonly type: ScopeType;
  readonly user_id: string | number;
  readonly [key: string]: unknown;
}
```

The index signature allows passing full entity objects (e.g., a `Trend`) as subjects without TypeScript errors, while still requiring the two mandatory fields.

---

## Policy Definition Design

### Two Permission Models

The system supports two fundamentally different permission models:

**Any-based** (e.g., `web`, `mimics`, `reports`):

- Permissions apply uniformly to all instances of the resource
- No subject metadata needed for permission checks
- Simpler CASL rules: `can(['view', 'create'], 'web')`

**Scoped** (e.g., `trends`, `xy_plots`):

- Permissions depend on the resource instance's `type` (private/shared) and `user_id` (owner)
- Subject metadata required for permission checks
- Four rule sets per resource: private/owner, private/other, shared/owner, shared/other

### Why Not a Flat Permission List?

An alternative design would be a flat list of `[role, action, resource, conditions]` tuples. The nested structure was chosen because:

1. **Readability**: The nested structure mirrors how humans think about permissions ("for trends, private resources owned by the user, admins can...")
2. **Completeness**: The structure enforces that all role/scope/ownership combinations are explicitly defined
3. **Type safety**: TypeScript can validate the structure at compile time

---

## Ability Builder Design

### createMongoAbility vs. createAbility

`createMongoAbility` is used instead of `createAbility` because:

- Scoped permissions require `$ne` conditions: `{ user_id: { $ne: userId } }`
- `createAbility` does not support MongoDB-style operators
- `createMongoAbility` is the standard CASL way to handle condition-based rules

### Rule Generation for Scoped Resources

For a scoped resource, four rule sets are generated:

```ts
// private/owner: user owns the private resource
can(actions, resource, { type: "private", user_id: userId });

// private/other: user does NOT own the private resource
can(actions, resource, { type: "private", user_id: { $ne: userId } });

// shared/owner: user owns the shared resource
can(actions, resource, { type: "shared", user_id: userId });

// shared/other: user does NOT own the shared resource
can(actions, resource, { type: "shared", user_id: { $ne: userId } });
```

**Why `$ne` instead of `cannot`?**

Using `can(..., { user_id: { $ne: userId } })` is cleaner than:

```ts
can(actions, resource, { type: "private" });
cannot(actions, resource, { type: "private", user_id: userId });
```

The `$ne` approach avoids rule ordering issues and is more explicit about intent.

### Validation Strategy

`buildAbility` validates both inputs before building rules:

1. **UserContext validation**: Checks `id` (non-empty) and `role` (known value)
2. **Policy validation**: Checks resource keys and required properties

**Why validate in `buildAbility`?**

- Fail fast: Catch configuration errors at initialization, not during permission checks
- Clear error messages: `InvalidUserContextError` and `InvalidPolicyError` include the problematic field
- Type narrowing: After validation, TypeScript knows the inputs are valid

---

## Pinia Store Design

### shallowRef for Ability

```ts
const ability = shallowRef<AppAbility>(buildAbility(GUEST_USER, POLICY));
```

`shallowRef` is used instead of `ref` because:

- CASL `Ability` instances contain complex internal state (rules, conditions)
- Deep reactivity would traverse all internal properties on every change
- `shallowRef` only tracks the reference itself, not the internal state
- When `ability.value` is replaced (on user change), Vue detects the change and re-renders

### Guest User Default

The store initializes with a guest user (`{ id: 'guest', role: 'browse' }`) rather than `null`:

- Avoids null checks throughout the codebase
- `browse` role has minimal permissions, so the guest user is safe
- Components render correctly before authentication completes

### setUser vs. updateAbility

Two separate actions:

- `setUser(user)`: Updates the user AND rebuilds ability (most common case)
- `updateAbility()`: Rebuilds ability without changing the user (e.g., after policy update)

---

## Reactivity Model

### How Permissions Stay Reactive

1. `authorizationStore.ability` is a `shallowRef`
2. `useAbility()` returns `computed(() => store.ability)` — a computed ref
3. `usePermission()` returns `computed(() => store.can(...))` — reads from the store
4. When `store.setUser()` is called, `ability.value` is replaced
5. Vue detects the `shallowRef` change and invalidates all computed refs
6. Components re-render with updated permissions

### Directive Reactivity

Directives (`v-can`, `v-cannot`) use `mounted` and `updated` hooks:

```ts
export const vCan: Directive = {
  mounted(el, binding) {
    applyPermission(el, binding);
  },
  updated(el, binding) {
    applyPermission(el, binding);
  },
};
```

**Why `updated` instead of a watcher?**

- Directives don't have a natural place to set up watchers
- `updated` fires whenever the component re-renders, which happens when reactive store state changes in the template
- This is simpler and avoids watcher cleanup issues

**Limitation**: The directive only updates when the component re-renders. If the ability changes but the component doesn't re-render for another reason, the directive won't update until the next render. In practice, this is not an issue because ability changes (via `setUser`) typically trigger re-renders through other reactive dependencies.

---

## Directive vs. Composable vs. Component

Three ways to check permissions in templates, each with different trade-offs:

### v-can / v-cannot Directive

```html
<button v-can="['create', 'web']">Create</button>
```

**Best for**: Simple show/hide of a single element. Minimal boilerplate.

**Limitation**: Only controls visibility (`display: none`). Cannot conditionally render different content.

### usePermission() Composable

```ts
const canCreate = usePermission("create", "web");
```

```html
<button v-if="canCreate">Create</button>
```

**Best for**: Complex conditional logic in `<script setup>`. Can be combined with other reactive state.

### CanAccess Component

```html
<CanAccess action="create" resource="web">
  <template #authorized><button>Create</button></template>
  <template #unauthorized><span>No access</span></template>
</CanAccess>
```

**Best for**: Rendering different content based on permission. Slot-based API is declarative and readable.

---

## Scoped Permissions and CASL Conditions

### The Subject Tagging Problem

CASL needs to know which rules apply to a given subject. When you pass a plain object:

```ts
ability.can("edit", { type: "private", user_id: "user-1" });
```

CASL doesn't know this is a `trends` subject. The `caslSubject` helper tags the object:

```ts
import { subject as caslSubject } from "@casl/ability";

ability.can(
  "edit",
  caslSubject("trends", { type: "private", user_id: "user-1" }),
);
```

The store's `can`/`cannot` methods handle this automatically:

```ts
function can(action, resource, subject?) {
  if (subject !== undefined) {
    return ability.value.can(action, caslSubject(resource, subject));
  }
  return ability.value.can(action, resource);
}
```

### Why Not Use Class Instances?

CASL supports class-based subjects (e.g., `ability.can('edit', trendInstance)`). This was not used because:

- Requires defining classes for each resource type
- Adds boilerplate
- Plain objects with `caslSubject` tagging achieve the same result
- Easier to serialize/deserialize

---

## Error Handling Strategy

### Three Error Classes

```
Error
├── PermissionDeniedError    — action was denied (use in API guards)
├── InvalidPolicyError       — policy structure is invalid (throw at init)
└── InvalidUserContextError  — user context is missing fields (throw in buildAbility)
```

**Design decision**: Separate error classes (rather than error codes) because:

- TypeScript can narrow error types with `instanceof`
- Each error carries relevant context (action, resource, field name)
- Easier to handle specific errors in catch blocks

### Fail Fast vs. Silent Failure

- **buildAbility**: Throws on invalid input (fail fast)
- **Permission checks with missing subject**: Returns `false` (silent failure)

**Why the difference?**

- Invalid `UserContext` or `PolicyDefinition` indicates a programming error — fail fast
- Missing subject for a scoped resource could be a valid runtime state (e.g., resource not yet loaded) — return `false` is safer

---

## Testing Strategy

### Pure Functions Enable Property Testing

`buildAbility` is a pure function, making it ideal for property-based testing with `fast-check`:

```ts
fc.assert(
  fc.property(
    arbUserContext,
    arbAction,
    arbAnyResource,
    (user, action, resource) => {
      const ability = buildAbility(user, POLICY);
      const expected = POLICY[resource].any[user.role].includes(action);
      return ability.can(action, resource) === expected;
    },
  ),
);
```

This tests the invariant across thousands of random inputs, catching edge cases that example-based tests miss.

### Test Utilities Design

`test-utils/index.ts` provides factory functions rather than fixtures:

```ts
createTestUser("admin"); // Fresh user each time
createTestSubject("private", id); // Explicit ownership
createTestAbility("browse"); // Real ability, not mocked
mountWithAbility(Component, { role: "admin" }); // Full integration
```

**Why factory functions?**

- Each test gets a fresh instance (no shared state)
- Parameters make test intent explicit
- `createTestAbility` uses the real `buildAbility` — tests validate real behavior

---

## Performance Decisions

### shallowRef for Ability

As noted above, `shallowRef` avoids deep reactivity overhead for the CASL ability instance.

### Computed Properties

All permission checks in composables use `computed`:

```ts
return computed(() =>
  store.can(resolvedAction, resolvedResource, resolvedSubject),
);
```

Vue caches computed values and only re-evaluates when dependencies change. This means permission checks are not re-run on every render — only when the ability, action, resource, or subject changes.

### No Memoization of buildAbility

`buildAbility` is not memoized at the store level because:

- It's only called when `setUser` or `updateAbility` is invoked
- These are infrequent operations (typically once per login)
- Memoization would add complexity without meaningful benefit

---

## Migration Strategy

### Backward Compatibility

The CASL system was designed to produce **identical results** to the legacy engine for all permission scenarios. This was verified with property-based comparison tests (`core/migration.pbt.spec.ts`).

### Typo Fix

The legacy code was in `x6/security/authoriztion/` (missing 'a'). The new system is in `x6/security/authorization/`. All imports were updated during migration.

### Deprecation Path

1. Legacy engine was marked with deprecation warnings
2. Comparison tests verified parity
3. All imports were updated to use the new system
4. Legacy engine was removed after tests passed

This incremental approach ensured no regressions during migration.
