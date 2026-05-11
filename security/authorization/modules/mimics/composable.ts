/**
 * Composable for the Mimics module.
 *
 * Combines the mimics store with reactive permission checks so components
 * only need to import `useMimics()` to get both data and authorization state.
 *
 * Mimics are an **any-based** resource — permissions are not scope-dependent.
 * `browse` role has no access at all; `admin` and `design` have full CRUD.
 *
 * @module modules/mimics/composable
 */

import { computed } from "vue";
import type { ComputedRef } from "vue";
import { useMimicsStore } from "./store";
import { useAuthorizationStore } from "../../stores/authorizationStore";
import { usePermission } from "../../composables/usePermission";
import type { Mimic } from "./types";

export interface UseMimicsReturn {
  /** Mimics visible to the current user (empty when view permission is denied). */
  mimics: ComputedRef<Mimic[]>;
  /** Whether an async operation is in progress. */
  loading: ComputedRef<boolean>;
  /** Error message from the last failed operation, or `null`. */
  error: ComputedRef<string | null>;
  /** Whether the current user can view mimics. */
  canView: ComputedRef<boolean>;
  /** Whether the current user can create mimics. */
  canCreate: ComputedRef<boolean>;
  /** Whether the current user can edit mimics. */
  canEdit: ComputedRef<boolean>;
  /** Whether the current user can delete mimics. */
  canDelete: ComputedRef<boolean>;
  /** Fetches all mimics (requires view permission). */
  fetchAll: () => Promise<void>;
  /** Creates a new mimic (requires create permission). */
  create: (
    data: Omit<Mimic, "id" | "created_at" | "updated_at">,
  ) => Promise<Mimic>;
  /** Updates an existing mimic (requires edit permission). */
  update: (
    id: string,
    data: Partial<Omit<Mimic, "id" | "created_at">>,
  ) => Promise<Mimic | null>;
  /** Deletes a mimic (requires delete permission). */
  delete: (id: string) => Promise<boolean>;
}

/**
 * Provides reactive mimic data and permission-gated CRUD operations.
 *
 * @example
 * ```ts
 * const { mimics, canCreate, create } = useMimics();
 * ```
 */
export function useMimics(): UseMimicsReturn {
  const store = useMimicsStore();
  const authStore = useAuthorizationStore();

  const canView = usePermission("view", "mimics");
  const canCreate = usePermission("create", "mimics");
  const canEdit = usePermission("edit", "mimics");
  const canDelete = usePermission("delete", "mimics");

  /** Only expose mimics when the user has view permission. */
  const mimics = computed<Mimic[]>(() => (canView.value ? store.mimics : []));

  async function fetchAll(): Promise<void> {
    if (!authStore.can("view", "mimics")) {
      throw new Error("Permission denied: cannot view mimics");
    }
    return store.fetchAll();
  }

  async function create(
    data: Omit<Mimic, "id" | "created_at" | "updated_at">,
  ): Promise<Mimic> {
    if (!authStore.can("create", "mimics")) {
      throw new Error("Permission denied: cannot create mimics");
    }
    return store.create(data);
  }

  async function update(
    id: string,
    data: Partial<Omit<Mimic, "id" | "created_at">>,
  ): Promise<Mimic | null> {
    if (!authStore.can("edit", "mimics")) {
      throw new Error("Permission denied: cannot edit mimics");
    }
    return store.update(id, data);
  }

  async function deleteById(id: string): Promise<boolean> {
    if (!authStore.can("delete", "mimics")) {
      throw new Error("Permission denied: cannot delete mimics");
    }
    return store.delete(id);
  }

  return {
    mimics,
    loading: computed(() => store.loading),
    error: computed(() => store.error),
    canView,
    canCreate,
    canEdit,
    canDelete,
    fetchAll,
    create,
    update,
    delete: deleteById,
  };
}
