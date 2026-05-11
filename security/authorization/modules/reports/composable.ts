/**
 * Composable for the Reports module.
 *
 * Combines the reports store with reactive permission checks so components
 * only need to import `useReports()` to get both data and authorization state.
 *
 * Reports are an **any-based** resource — permissions are not scope-dependent.
 * `browse` role has no access at all; `admin` and `design` have full CRUD.
 *
 * @module modules/reports/composable
 */

import { computed } from "vue";
import type { ComputedRef } from "vue";
import { useReportsStore } from "./store";
import { useAuthorizationStore } from "../../stores/authorizationStore";
import { usePermission } from "../../composables/usePermission";
import type { Report } from "./types";

export interface UseReportsReturn {
  /** Reports visible to the current user (empty when view permission is denied). */
  reports: ComputedRef<Report[]>;
  /** Whether an async operation is in progress. */
  loading: ComputedRef<boolean>;
  /** Error message from the last failed operation, or `null`. */
  error: ComputedRef<string | null>;
  /** Whether the current user can view reports. */
  canView: ComputedRef<boolean>;
  /** Whether the current user can create reports. */
  canCreate: ComputedRef<boolean>;
  /** Whether the current user can edit reports. */
  canEdit: ComputedRef<boolean>;
  /** Whether the current user can delete reports. */
  canDelete: ComputedRef<boolean>;
  /** Fetches all reports (requires view permission). */
  fetchAll: () => Promise<void>;
  /** Creates a new report (requires create permission). */
  create: (
    data: Omit<Report, "id" | "created_at" | "updated_at">,
  ) => Promise<Report>;
  /** Updates an existing report (requires edit permission). */
  update: (
    id: string,
    data: Partial<Omit<Report, "id" | "created_at">>,
  ) => Promise<Report | null>;
  /** Deletes a report (requires delete permission). */
  delete: (id: string) => Promise<boolean>;
}

/**
 * Provides reactive report data and permission-gated CRUD operations.
 *
 * @example
 * ```ts
 * const { reports, canCreate, create } = useReports();
 * ```
 */
export function useReports(): UseReportsReturn {
  const store = useReportsStore();
  const authStore = useAuthorizationStore();

  const canView = usePermission("view", "reports");
  const canCreate = usePermission("create", "reports");
  const canEdit = usePermission("edit", "reports");
  const canDelete = usePermission("delete", "reports");

  /** Only expose reports when the user has view permission. */
  const reports = computed<Report[]>(() =>
    canView.value ? store.reports : [],
  );

  async function fetchAll(): Promise<void> {
    if (!authStore.can("view", "reports")) {
      throw new Error("Permission denied: cannot view reports");
    }
    return store.fetchAll();
  }

  async function create(
    data: Omit<Report, "id" | "created_at" | "updated_at">,
  ): Promise<Report> {
    if (!authStore.can("create", "reports")) {
      throw new Error("Permission denied: cannot create reports");
    }
    return store.create(data);
  }

  async function update(
    id: string,
    data: Partial<Omit<Report, "id" | "created_at">>,
  ): Promise<Report | null> {
    if (!authStore.can("edit", "reports")) {
      throw new Error("Permission denied: cannot edit reports");
    }
    return store.update(id, data);
  }

  async function deleteById(id: string): Promise<boolean> {
    if (!authStore.can("delete", "reports")) {
      throw new Error("Permission denied: cannot delete reports");
    }
    return store.delete(id);
  }

  return {
    reports,
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
