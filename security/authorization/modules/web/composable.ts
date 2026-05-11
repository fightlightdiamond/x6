/**
 * Composable for the Web Pages module.
 *
 * Combines the web store with reactive permission checks so components
 * only need to import `useWeb()` to get both data and authorization state.
 *
 * @module modules/web/composable
 */

import { computed } from "vue";
import type { ComputedRef } from "vue";
import { useWebStore } from "./store";
import { useAuthorizationStore } from "../../stores/authorizationStore";
import { usePermission } from "../../composables/usePermission";
import type { WebPage } from "./types";

export interface UseWebReturn {
  /** Pages visible to the current user (empty when view permission is denied). */
  pages: ComputedRef<WebPage[]>;
  /** Whether an async operation is in progress. */
  loading: ComputedRef<boolean>;
  /** Error message from the last failed operation, or `null`. */
  error: ComputedRef<string | null>;
  /** Whether the current user can view web pages. */
  canView: ComputedRef<boolean>;
  /** Whether the current user can create web pages. */
  canCreate: ComputedRef<boolean>;
  /** Whether the current user can edit web pages. */
  canEdit: ComputedRef<boolean>;
  /** Whether the current user can delete web pages. */
  canDelete: ComputedRef<boolean>;
  /** Fetches all web pages (requires view permission). */
  fetchAll: () => Promise<void>;
  /** Creates a new web page (requires create permission). */
  create: (
    data: Omit<WebPage, "id" | "created_at" | "updated_at">,
  ) => Promise<WebPage>;
  /** Updates an existing web page (requires edit permission). */
  update: (
    id: string,
    data: Partial<Omit<WebPage, "id" | "created_at">>,
  ) => Promise<WebPage | null>;
  /** Deletes a web page (requires delete permission). */
  delete: (id: string) => Promise<boolean>;
}

/**
 * Provides reactive web page data and permission-gated CRUD operations.
 *
 * @example
 * ```ts
 * const { pages, canCreate, create } = useWeb();
 * ```
 */
export function useWeb(): UseWebReturn {
  const store = useWebStore();
  const authStore = useAuthorizationStore();

  const canView = usePermission("view", "web");
  const canCreate = usePermission("create", "web");
  const canEdit = usePermission("edit", "web");
  const canDelete = usePermission("delete", "web");

  /** Only expose pages when the user has view permission. */
  const pages = computed<WebPage[]>(() => (canView.value ? store.pages : []));

  async function fetchAll(): Promise<void> {
    if (!authStore.can("view", "web")) {
      throw new Error("Permission denied: cannot view web");
    }
    return store.fetchAll();
  }

  async function create(
    data: Omit<WebPage, "id" | "created_at" | "updated_at">,
  ): Promise<WebPage> {
    if (!authStore.can("create", "web")) {
      throw new Error("Permission denied: cannot create web");
    }
    return store.create(data);
  }

  async function update(
    id: string,
    data: Partial<Omit<WebPage, "id" | "created_at">>,
  ): Promise<WebPage | null> {
    if (!authStore.can("edit", "web")) {
      throw new Error("Permission denied: cannot edit web");
    }
    return store.update(id, data);
  }

  async function deleteById(id: string): Promise<boolean> {
    if (!authStore.can("delete", "web")) {
      throw new Error("Permission denied: cannot delete web");
    }
    return store.delete(id);
  }

  return {
    pages,
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
