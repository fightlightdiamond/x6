/**
 * Example 05: Adding a New Resource
 *
 * Step-by-step guide for adding a new resource type ("projects") to the
 * authorization system.
 *
 * NOTE: This file shows the changes needed — do not import it directly.
 * Apply these changes to the actual source files.
 */

// ─── Step 1: Update types/index.ts ───────────────────────────────────────────
//
// Add 'projects' to RESOURCE_TYPES:
//
// export const RESOURCE_TYPES = [
//   "web",
//   "trends",
//   "mimics",
//   "reports",
//   "xy_plots",
//   "trends_export",
//   "xy_plots_export",
//   "projects",  // ← Add here
// ] as const;

// ─── Step 2: Update core/policy.ts ───────────────────────────────────────────
//
// Add the resource definition to POLICY:
//
// export const POLICY = {
//   // ... existing resources
//   projects: {
//     any: {
//       admin: ['view', 'create', 'edit', 'delete'],
//       design: ['view', 'create', 'edit'],
//       browse: ['view'],
//     },
//   },
// } as const satisfies PolicyDefinition;

// ─── Step 3: Create the module ────────────────────────────────────────────────

// modules/projects/types.ts
export interface Project {
  readonly id: string;
  name: string;
  description: string;
  status: "active" | "archived";
  readonly created_at: string;
  updated_at: string;
}

// modules/projects/composable.ts
import { computed } from "vue";
import { useAuthorizationStore } from "../stores/authorizationStore";

export function useProjects() {
  const authStore = useAuthorizationStore();

  const canView = computed(() => authStore.can("view", "projects"));
  const canCreate = computed(() => authStore.can("create", "projects"));
  const canEdit = computed(() => authStore.can("edit", "projects"));
  const canDelete = computed(() => authStore.can("delete", "projects"));

  return { canView, canCreate, canEdit, canDelete };
}

// ─── Step 4: Use in components ────────────────────────────────────────────────
//
// <template>
//   <button v-can="['create', 'projects']">Create Project</button>
//
//   <CanAccess action="delete" resource="projects">
//     <template #authorized>
//       <button @click="deleteProject">Delete</button>
//     </template>
//   </CanAccess>
// </template>
