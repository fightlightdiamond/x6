/**
 * Composable for the Trends module.
 *
 * Trends are a **scoped** resource — permissions depend on the trend's `type`
 * (private/shared) and `user_id` (owner). Unlike any-based resources, each
 * trend must be checked individually against the current user's ability.
 *
 * @module modules/trends/composable
 */

import { computed } from "vue";
import type { ComputedRef, MaybeRef } from "vue";
import { useTrendsStore } from "./store";
import { useAuthorizationStore } from "../../stores/authorizationStore";
import { usePermission } from "../../composables/usePermission";
import type { SubjectMetadata } from "../../types/index";
import type { Trend } from "./types";

export interface UseTrendsReturn {
  /** Trends visible to the current user (filtered by per-item view permission). */
  trends: ComputedRef<Trend[]>;
  /** Whether an async operation is in progress. */
  loading: ComputedRef<boolean>;
  /** Error message from the last failed operation, or `null`. */
  error: ComputedRef<string | null>;
  /** Whether the current user can create trends (not scope-dependent). */
  canCreate: ComputedRef<boolean>;
  /** Returns `true` if the current user can view the given trend. */
  canViewTrend: (trend: Trend) => boolean;
  /** Returns `true` if the current user can edit the given trend. */
  canEditTrend: (trend: Trend) => boolean;
  /** Returns `true` if the current user can delete the given trend. */
  canDeleteTrend: (trend: Trend) => boolean;
  /** Fetches all trends from the API. */
  fetchAll: () => Promise<void>;
  /** Creates a new trend (requires create permission). */
  create: (
    data: Omit<Trend, "id" | "created_at" | "updated_at">,
  ) => Promise<Trend>;
  /** Updates an existing trend (requires edit permission on that trend). */
  update: (
    id: string,
    data: Partial<Omit<Trend, "id" | "created_at">>,
    trend: Trend,
  ) => Promise<Trend | null>;
  /** Deletes a trend (requires delete permission on that trend). */
  delete: (id: string, trend: Trend) => Promise<boolean>;
}

/**
 * Provides reactive trend data and per-item permission-gated CRUD operations.
 *
 * Because trends are scoped, `canViewTrend`, `canEditTrend`, and
 * `canDeleteTrend` accept the individual trend object and check permissions
 * based on its `type` and `user_id`.
 *
 * @param currentUserId - Optional reactive user id (unused directly; the
 *   authorization store tracks the current user). Kept for API symmetry with
 *   other scoped composables.
 *
 * @example
 * ```ts
 * const { trends, canCreate, canEditTrend, update } = useTrends();
 * ```
 */
export function useTrends(_currentUserId?: MaybeRef<string>): UseTrendsReturn {
  const store = useTrendsStore();
  const authStore = useAuthorizationStore();

  // ── Per-item permission helpers ────────────────────────────────────────────

  /**
   * Builds the `SubjectMetadata` for a trend so CASL can evaluate scoped rules.
   */
  function toSubject(trend: Trend): SubjectMetadata {
    return { type: trend.type, user_id: trend.user_id };
  }

  function canViewTrend(trend: Trend): boolean {
    return authStore.can("view", "trends", toSubject(trend));
  }

  function canEditTrend(trend: Trend): boolean {
    return authStore.can("edit", "trends", toSubject(trend));
  }

  function canDeleteTrend(trend: Trend): boolean {
    return authStore.can("delete", "trends", toSubject(trend));
  }

  // ── Derived state ──────────────────────────────────────────────────────────

  /** Only expose trends the current user is allowed to view. */
  const visibleTrends = computed<Trend[]>(() =>
    store.trends.filter((trend) => canViewTrend(trend)),
  );

  // ── Permission flags ───────────────────────────────────────────────────────

  /** create is not scope-dependent — check at the resource level. */
  const canCreate = usePermission("create", "trends");

  // ── CRUD operations ────────────────────────────────────────────────────────

  async function fetchAll(): Promise<void> {
    return store.fetchAll();
  }

  async function create(
    data: Omit<Trend, "id" | "created_at" | "updated_at">,
  ): Promise<Trend> {
    if (!authStore.can("create", "trends")) {
      throw new Error("Permission denied: cannot create trends");
    }
    return store.create(data);
  }

  async function update(
    id: string,
    data: Partial<Omit<Trend, "id" | "created_at">>,
    trend: Trend,
  ): Promise<Trend | null> {
    if (!authStore.can("edit", "trends", toSubject(trend))) {
      throw new Error("Permission denied: cannot edit trends");
    }
    return store.update(id, data);
  }

  async function deleteById(id: string, trend: Trend): Promise<boolean> {
    if (!authStore.can("delete", "trends", toSubject(trend))) {
      throw new Error("Permission denied: cannot delete trends");
    }
    return store.delete(id);
  }

  return {
    trends: visibleTrends,
    loading: computed(() => store.loading),
    error: computed(() => store.error),
    canCreate,
    canViewTrend,
    canEditTrend,
    canDeleteTrend,
    fetchAll,
    create,
    update,
    delete: deleteById,
  };
}
