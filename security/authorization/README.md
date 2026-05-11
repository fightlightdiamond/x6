# CASL Authorization System

A type-safe, reactive authorization system for Nuxt 3 applications built on [@casl/ability](https://casl.js.org/). This system replaces the legacy custom authorization engine with a standards-based solution that provides full TypeScript support, reactive permissions, and seamless integration with Vue 3 and Pinia.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [Interfaces and Types](#interfaces-and-types)
- [Defining Policies](#defining-policies)
- [Using Composables](#using-composables)
- [Using Directives](#using-directives)
- [Using the CanAccess Component](#using-the-canaccess-component)
- [Pinia Store Integration](#pinia-store-integration)
- [Adding New Resources](#adding-new-resources)
- [Testing Permissions](#testing-permissions)
- [Migration Guide](#migration-guide)
- [Troubleshooting](#troubleshooting)
- [Extension Points](#extension-points)
- [Further Reading](#further-reading)

---

## Architecture Overview

The authorization system is organized into layers:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Vue Components / Pages                        │
│  (v-can, v-cannot, CanAccess, PermissionGuard, RoleSwitcher)    │
└──────────────────────────┬──────────────────────────────────────┘
                           │ uses
┌──────────────────────────▼──────────────────────────────────────┐
│                   Vue Composables Layer                          │
│       useAbility()  usePermission()  usePermissions()            │
└──────────────────────────┬──────────────────────────────────────┘
                           │ reads from
┌──────────────────────────▼──────────────────────────────────────┐
│                 Pinia authorizationStore                         │
│   currentUser | ability | policyDefinition                      │
│   setUser() | updateAbility() | can() | cannot()                │
└──────────────────────────┬──────────────────────────────────────┘
                           │ builds via
┌──────────────────────────▼──────────────────────────────────────┐
│                  Core Authorization Layer                        │
│   buildAbility(userContext, policy) → AppAbility                │
│   errors.ts (PermissionDeniedError, InvalidPolicyError, ...)    │
└──────────────────────────┬──────────────────────────────────────┘
                           │ reads
┌──────────────────────────▼──────────────────────────────────────┐
│                  Policy Definition Layer                         │
│   policy.ts (typed policy definition)                           │
│   types/index.ts (all TypeScript interfaces & types)            │
└─────────────────────────────────────────────────────────────────┘
```

**Key Features:**

- **Type-safe**: Full TypeScript strict mode support with no implicit `any`
- **Reactive**: Permissions automatically update when user context changes
- **Declarative**: Define permissions in a single policy file
- **Flexible**: Supports both any-based and scoped (ownership + type) permissions
- **Testable**: Pure functions and comprehensive test utilities

---

## Quick Start

### 1. Install Dependencies

```bash
npm install @casl/ability @casl/vue
```

### 2. Set Up the Authorization Store

In your Nuxt plugin or app initialization:

```ts
// plugins/authorization.ts
import { useAuthorizationStore } from "~/security/authorization/stores/authorizationStore";

export default defineNuxtPlugin(() => {
  const authStore = useAuthorizationStore();

  // Initialize with a user (e.g., from authentication)
  authStore.setUser({
    id: "user-123",
    role: "admin",
  });
});
```

### 3. Use in Components

```vue
<script setup lang="ts">
import { usePermission } from "~/security/authorization/composables/usePermission";

const canCreateWeb = usePermission("create", "web");
</script>

<template>
  <button v-if="canCreateWeb">Create Web Page</button>
</template>
```

### 4. Use Directives

```vue
<template>
  <!-- Hide button if user cannot create -->
  <button v-can="['create', 'web']">Create</button>

  <!-- Show read-only badge if user cannot edit -->
  <span v-cannot="['edit', 'trends']">Read-only</span>
</template>
```

### 5. Use CanAccess Component

```vue
<template>
  <CanAccess action="delete" resource="reports">
    <template #authorized>
      <button @click="deleteReport">Delete</button>
    </template>
    <template #unauthorized>
      <span class="text-gray-400">No permission</span>
    </template>
  </CanAccess>
</template>
```

---

## Core Concepts

### Actions

Five standard actions are supported:

- `view` — Read access to a resource
- `create` — Create new instances
- `edit` — Modify existing instances
- `delete` — Remove instances
- `export` — Export data

### Roles

Three roles are defined:

- `admin` — Full access to most resources
- `design` — Create and edit access, limited delete
- `browse` — Read-only access

### Resources

Seven resource types:

- `web` — Web pages (any-based)
- `trends` — Trend data (scoped)
- `mimics` — Mimic displays (any-based)
- `reports` — Reports (any-based)
- `xy_plots` — XY plot data (scoped)
- `trends_export` — Trend export operations (any-based)
- `xy_plots_export` — XY plot export operations (any-based)

### Permission Types

**Any-based permissions**: Permissions apply uniformly regardless of the resource instance.

Example: All users with `admin` or `design` roles can create web pages.

**Scoped permissions**: Permissions depend on:

- **Type**: `private` or `shared`
- **Ownership**: Whether the current user is the owner (`user_id` matches)

Example: A `browse` user can view and edit their own private trends, but can only view shared trends owned by others.

---

## Interfaces and Types

### UserContext

Represents the currently authenticated user:

```ts
interface UserContext {
  readonly id: string | number;
  readonly role: Role; // 'admin' | 'design' | 'browse'
  readonly metadata?: Record<string, unknown>;
}
```

### SubjectMetadata

Metadata for scoped resources:

```ts
interface SubjectMetadata {
  readonly type: ScopeType; // 'private' | 'shared'
  readonly user_id: string | number;
  readonly [key: string]: unknown; // Additional fields
}
```

### PolicyDefinition

The policy structure:

```ts
type PolicyDefinition = Readonly<Record<ResourceType, ResourceDef>>;

type ResourceDef = AnyResourceDef | ScopedResourceDef;

interface AnyResourceDef {
  readonly any: Readonly<Record<Role, readonly Action[]>>;
}

interface ScopedResourceDef {
  readonly scopedBy: ScopedResourceConfig;
  readonly private: ScopePermissions;
  readonly shared: ScopePermissions;
}

interface ScopePermissions {
  readonly owner: Readonly<Record<Role, readonly Action[]>>;
  readonly other: Readonly<Record<Role, readonly Action[]>>;
}
```

### AppAbility

The CASL ability type:

```ts
type AppAbility = PureAbility<[Action, AppSubjects]>;
type AppSubjects = ResourceType | SubjectMetadata | "all";
```

---

## Defining Policies

Policies are defined in `core/policy.ts` using a declarative structure with full type safety.

### Any-Based Resource Example

```ts
export const POLICY = {
  web: {
    any: {
      admin: ["view", "create"],
      design: ["view", "create"],
      browse: ["view", "create"],
    },
  },
  // ...
} as const satisfies PolicyDefinition;
```

### Scoped Resource Example

```ts
export const POLICY = {
  trends: {
    scopedBy: { typeField: "type", ownerField: "user_id" },
    private: {
      owner: {
        admin: ["view", "create", "edit", "delete"],
        design: ["view", "create", "edit", "delete"],
        browse: ["view", "create", "edit", "delete"],
      },
      other: {
        admin: ["delete"], // Admin can delete others' private trends
        design: [],
        browse: [],
      },
    },
    shared: {
      owner: {
        admin: ["view", "create", "edit", "delete"],
        design: ["view", "create", "edit", "delete"],
        browse: [],
      },
      other: {
        admin: ["view", "delete"],
        design: ["view", "delete"],
        browse: ["view"], // Browse can only view shared trends
      },
    },
  },
  // ...
} as const satisfies PolicyDefinition;
```

**Key Points:**

- Use `as const satisfies PolicyDefinition` for type safety
- `scopedBy` specifies which fields carry type and ownership info
- Define permissions separately for `private`/`shared` and `owner`/`other`

---

## Using Composables

### useAbility()

Returns the reactive ability instance and helper functions:

```ts
import { useAbility } from "~/security/authorization/composables/useAbility";

const { ability, can, cannot } = useAbility();

// Access the raw ability
console.log(ability.value.rules);

// Check permissions
if (can("create", "web")) {
  // User can create web pages
}

if (cannot("delete", "mimics")) {
  // User cannot delete mimics
}
```

### usePermission()

Returns a reactive boolean for a single permission check:

```ts
import { usePermission } from "~/security/authorization/composables/usePermission";

// Any-based resource
const canCreateWeb = usePermission("create", "web");

// Scoped resource
const trend = ref({ type: "private", user_id: "user-123" });
const canEditTrend = usePermission("edit", "trends", trend);
```

**Reactive behavior**: The returned `ComputedRef<boolean>` automatically updates when:

- The user's role changes
- The action, resource, or subject changes (if passed as refs)

---

## Using Directives

### v-can

Hides the element when the user does not have permission:

```vue
<template>
  <!-- Any-based -->
  <button v-can="['create', 'web']">Create Web Page</button>

  <!-- Scoped -->
  <button v-can="['edit', 'trends', trendSubject]">Edit Trend</button>
</template>

<script setup lang="ts">
const trendSubject = ref({ type: "private", user_id: "user-123" });
</script>
```

### v-cannot

Shows the element when the user does NOT have permission (inverse of `v-can`):

```vue
<template>
  <span v-cannot="['edit', 'reports']" class="badge">Read-only</span>
</template>
```

**Note**: Both directives set `display: none` to hide elements. They re-evaluate on every component update, ensuring reactivity.

---

## Using the CanAccess Component

The `CanAccess` component provides slot-based conditional rendering:

```vue
<template>
  <CanAccess action="delete" resource="mimics">
    <template #authorized>
      <button @click="handleDelete" class="btn-danger">Delete</button>
    </template>
    <template #unauthorized>
      <span class="text-gray-400">No permission to delete</span>
    </template>
  </CanAccess>
</template>
```

**Props:**

- `action: Action` — The action to check
- `resource: ResourceType` — The resource type
- `subject?: SubjectMetadata` — Optional subject for scoped resources

**Slots:**

- `#authorized` — Rendered when permission is granted
- `#unauthorized` — Rendered when permission is denied

---

## Pinia Store Integration

The `authorizationStore` manages global authorization state.

### Store State

```ts
const store = useAuthorizationStore();

// Current user
store.currentUser; // UserContext | null

// CASL ability instance (shallowRef)
store.ability; // AppAbility

// Policy definition
store.policyDefinition; // PolicyDefinition
```

### Store Actions

```ts
// Set the current user and rebuild ability
store.setUser({ id: "user-456", role: "design" });

// Force rebuild ability (e.g., after policy update)
store.updateAbility();

// Reset to guest user
store.initializeWithGuestUser();
```

### Store Getters

```ts
// Check permission
const allowed = store.can("create", "web");

// Check scoped permission
const canEdit = store.can("edit", "trends", {
  type: "private",
  user_id: "user-123",
});

// Check negative permission
const denied = store.cannot("delete", "reports");
```

---

## Adding New Resources

To add a new resource type:

### 1. Update Types

In `types/index.ts`, add the new resource to `RESOURCE_TYPES`:

```ts
export const RESOURCE_TYPES = [
  "web",
  "trends",
  "mimics",
  "reports",
  "xy_plots",
  "trends_export",
  "xy_plots_export",
  "projects", // New resource
] as const;
```

### 2. Update Policy

In `core/policy.ts`, add the resource definition:

```ts
export const POLICY = {
  // ... existing resources
  projects: {
    any: {
      admin: ["view", "create", "edit", "delete"],
      design: ["view", "create", "edit"],
      browse: ["view"],
    },
  },
} as const satisfies PolicyDefinition;
```

### 3. Create Module (Optional)

If the resource needs CRUD operations, create a module:

```
modules/projects/
├── types.ts          # Project interface
├── store.ts          # Pinia store
├── composable.ts     # useProjects()
├── api.ts            # API service
├── mock-data.ts      # Sample data
├── pages/
│   ├── ProjectsListPage.vue
│   └── ProjectDetailPage.vue
└── components/
    ├── ProjectCard.vue
    └── ProjectForm.vue
```

### 4. Use in Components

```vue
<template>
  <button v-can="['create', 'projects']">Create Project</button>
</template>
```

---

## Testing Permissions

### Test Utilities

The `test-utils` module provides helpers for testing:

```ts
import {
  createTestUser,
  createTestSubject,
  createTestAbility,
  mountWithAbility,
} from "~/security/authorization/test-utils";

// Create test user
const adminUser = createTestUser("admin");
const designUser = createTestUser("design", "user-42");

// Create test subject
const privateSubject = createTestSubject("private", "user-1");
const sharedSubject = createTestSubject("shared", "user-2");

// Create test ability
const ability = createTestAbility("admin");
expect(ability.can("create", "web")).toBe(true);

// Mount component with authorization
const wrapper = mountWithAbility(MyComponent, { role: "admin" });
expect(wrapper.find('[data-testid="create-btn"]').exists()).toBe(true);
```

### Unit Test Example

```ts
import { describe, it, expect } from "vitest";
import { buildAbility } from "~/security/authorization/core/ability";
import { POLICY } from "~/security/authorization/core/policy";

describe("buildAbility", () => {
  it("grants admin full access to web pages", () => {
    const ability = buildAbility({ id: "user-1", role: "admin" }, POLICY);
    expect(ability.can("view", "web")).toBe(true);
    expect(ability.can("create", "web")).toBe(true);
  });

  it("restricts browse role from creating mimics", () => {
    const ability = buildAbility({ id: "user-2", role: "browse" }, POLICY);
    expect(ability.can("create", "mimics")).toBe(false);
  });
});
```

### Component Test Example

```ts
import { describe, it, expect } from "vitest";
import { mountWithAbility } from "~/security/authorization/test-utils";
import MyComponent from "./MyComponent.vue";

describe("MyComponent", () => {
  it("shows create button for admin", () => {
    const wrapper = mountWithAbility(MyComponent, { role: "admin" });
    expect(wrapper.find('[data-testid="create-btn"]').exists()).toBe(true);
  });

  it("hides create button for browse", () => {
    const wrapper = mountWithAbility(MyComponent, { role: "browse" });
    expect(wrapper.find('[data-testid="create-btn"]').exists()).toBe(false);
  });
});
```

---

## Migration Guide

### From Legacy Engine

The legacy authorization engine (`x6/security/authoriztion/engine.ts`) has been replaced by this CASL-based system.

#### Key Differences

| Legacy Engine            | CASL System                         |
| ------------------------ | ----------------------------------- |
| Custom implementation    | Industry-standard @casl/ability     |
| Manual permission checks | Reactive composables and directives |
| Limited type safety      | Full TypeScript strict mode         |
| Imperative API           | Declarative policy definition       |

#### Migration Steps

1. **Update imports**:

   ```ts
   // Before
   import { createCan } from "~/security/authoriztion/engine";

   // After
   import { useAbility } from "~/security/authorization/composables/useAbility";
   ```

2. **Replace permission checks**:

   ```ts
   // Before
   const can = createCan({ me: currentUser, policy: POLICY });
   if (can('create', 'web')) { ... }

   // After
   const { can } = useAbility();
   if (can('create', 'web')) { ... }
   ```

3. **Update templates**:

   ```vue
   <!-- Before -->
   <button v-if="can('create', 'web')">Create</button>

   <!-- After -->
   <button v-can="['create', 'web']">Create</button>
   ```

4. **Update scoped checks**:

   ```ts
   // Before
   const can = createCan({ me: currentUser, policy: POLICY });
   if (can('edit', 'trends', trend)) { ... }

   // After
   const { can } = useAbility();
   if (can('edit', 'trends', { type: trend.type, user_id: trend.user_id })) { ... }
   ```

#### Compatibility

The CASL system maintains **100% backward compatibility** with the legacy policy logic. All permission rules produce identical results.

---

## Troubleshooting

### Permission Check Always Returns False

**Cause**: Subject metadata is missing or incorrect for scoped resources.

**Solution**: Ensure you pass the correct `SubjectMetadata` with `type` and `user_id`:

```ts
// ❌ Wrong
const canEdit = store.can("edit", "trends");

// ✅ Correct
const canEdit = store.can("edit", "trends", {
  type: "private",
  user_id: "user-123",
});
```

### Directive Not Updating

**Cause**: The component is not re-rendering when the ability changes.

**Solution**: Ensure the store is properly initialized and the user context is reactive:

```ts
const store = useAuthorizationStore();
store.setUser({ id: "user-456", role: "design" }); // Triggers ability rebuild
```

### TypeScript Errors

**Cause**: Incorrect types or missing type assertions.

**Solution**: Use the provided types from `types/index.ts`:

```ts
import type {
  Action,
  ResourceType,
  SubjectMetadata,
} from "~/security/authorization/types";

const action: Action = "create";
const resource: ResourceType = "web";
```

### Invalid UserContext Error

**Cause**: Missing `id` or `role` in `UserContext`.

**Solution**: Ensure both fields are present:

```ts
// ❌ Wrong
store.setUser({ id: "", role: "admin" }); // Empty id

// ✅ Correct
store.setUser({ id: "user-123", role: "admin" });
```

### Performance Issues

**Cause**: Excessive permission checks or deep reactivity overhead.

**Solution**:

- Use `computed` for permission checks in components
- The store uses `shallowRef` for the ability instance to avoid deep reactivity
- Batch permission checks when possible

---

## Extension Points

### Custom Actions

To add custom actions beyond the built-in five:

1. Update `ACTIONS` in `types/index.ts`:

   ```ts
   export const ACTIONS = [
     "view",
     "create",
     "edit",
     "delete",
     "export",
     "approve",
     "publish", // Custom actions
   ] as const;
   ```

2. Update the policy:

   ```ts
   export const POLICY = {
     articles: {
       any: {
         admin: ["view", "create", "edit", "delete", "approve", "publish"],
         design: ["view", "create", "edit"],
         browse: ["view"],
       },
     },
   } as const satisfies PolicyDefinition;
   ```

### Custom Conditions

CASL supports MongoDB-style conditions. To add custom conditions:

```ts
// In buildAbility or a custom builder
can("edit", "articles", { status: "draft" }); // Only draft articles
can("view", "articles", { published: true }); // Only published articles
```

### Custom Roles

To add custom roles:

1. Update `ROLES` in `types/index.ts`:

   ```ts
   export const ROLES = [
     "admin",
     "design",
     "browse",
     "editor",
     "reviewer",
   ] as const;
   ```

2. Update all policy definitions to include the new roles.

### Dynamic Policy Loading

To load policies from a backend:

```ts
// In a plugin or initialization hook
const authStore = useAuthorizationStore();

const policyFromBackend = await fetchPolicy();
authStore.policyDefinition = policyFromFromBackend;
authStore.updateAbility(); // Rebuild with new policy
```

### Example: Custom Permission Guard

Create a reusable permission guard component:

```vue
<!-- components/PermissionGuard.vue -->
<script setup lang="ts">
import { usePermission } from "~/security/authorization/composables/usePermission";
import type {
  Action,
  ResourceType,
  SubjectMetadata,
} from "~/security/authorization/types";

const props = defineProps<{
  action: Action;
  resource: ResourceType;
  subject?: SubjectMetadata;
  fallback?: string;
}>();

const isAllowed = usePermission(
  () => props.action,
  () => props.resource,
  () => props.subject ?? null,
);
</script>

<template>
  <slot v-if="isAllowed" />
  <div v-else-if="fallback" class="text-gray-500">{{ fallback }}</div>
</template>
```

Usage:

```vue
<template>
  <PermissionGuard action="delete" resource="reports" fallback="No permission">
    <button @click="handleDelete">Delete</button>
  </PermissionGuard>
</template>
```

---

## Further Reading

- [CASL Documentation](https://casl.js.org/v6/en/)
- [CASL Vue Integration](https://casl.js.org/v6/en/package/casl-vue)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [Vue 3 Composables](https://vuejs.org/guide/reusability/composables.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

---

## License

This authorization system is part of the X6 project. See the project root for license information.
