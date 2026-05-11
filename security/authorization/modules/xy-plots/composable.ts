/**
 * Composable for the XY Plots module.
 *
 * XY plots are a **scoped** resource — permissions depend on the plot's `type`
 * (private/shared) and `user_id` (owner). Unlike any-based resources, each
 * plot must be checked individually against the current user's ability.
 *
 * @module modules/xy-plots/composable
 */

import { computed } from "vue";
import type { ComputedRef, MaybeRef } from "vue";
import { useXYPlotsStore } from "./store";
import { useAuthorizationStore } from "../../stores/authorizationStore";
import { usePermission } from "../../composables/usePermission";
import type { SubjectMetadata } from "../../types/index";
import type { XYPlot } from "./types";

export interface UseXYPlotsReturn {
  /** XY plots visible to the current user (filtered by per-item view permission). */
  xyPlots: ComputedRef<XYPlot[]>;
  /** Whether an async operation is in progress. */
  loading: ComputedRef<boolean>;
  /** Error message from the last failed operation, or `null`. */
  error: ComputedRef<string | null>;
  /** Whether the current user can create XY plots (not scope-dependent). */
  canCreate: ComputedRef<boolean>;
  /** Returns `true` if the current user can view the given XY plot. */
  canViewPlot: (plot: XYPlot) => boolean;
  /** Returns `true` if the current user can edit the given XY plot. */
  canEditPlot: (plot: XYPlot) => boolean;
  /** Returns `true` if the current user can delete the given XY plot. */
  canDeletePlot: (plot: XYPlot) => boolean;
  /** Fetches all XY plots from the API. */
  fetchAll: () => Promise<void>;
  /** Creates a new XY plot (requires create permission). */
  create: (
    data: Omit<XYPlot, "id" | "created_at" | "updated_at">,
  ) => Promise<XYPlot>;
  /** Updates an existing XY plot (requires edit permission on that plot). */
  update: (
    id: string,
    data: Partial<Omit<XYPlot, "id" | "created_at">>,
    plot: XYPlot,
  ) => Promise<XYPlot | null>;
  /** Deletes an XY plot (requires delete permission on that plot). */
  delete: (id: string, plot: XYPlot) => Promise<boolean>;
}

/**
 * Provides reactive XY plot data and per-item permission-gated CRUD operations.
 *
 * Because XY plots are scoped, `canViewPlot`, `canEditPlot`, and
 * `canDeletePlot` accept the individual plot object and check permissions
 * based on its `type` and `user_id`.
 *
 * @param currentUserId - Optional reactive user id (unused directly; the
 *   authorization store tracks the current user). Kept for API symmetry with
 *   other scoped composables.
 *
 * @example
 * ```ts
 * const { xyPlots, canCreate, canEditPlot, update } = useXYPlots();
 * ```
 */
export function useXYPlots(
  _currentUserId?: MaybeRef<string>,
): UseXYPlotsReturn {
  const store = useXYPlotsStore();
  const authStore = useAuthorizationStore();

  // ── Per-item permission helpers ────────────────────────────────────────────

  /**
   * Builds the `SubjectMetadata` for an XY plot so CASL can evaluate scoped rules.
   */
  function toSubject(plot: XYPlot): SubjectMetadata {
    return { type: plot.type, user_id: plot.user_id };
  }

  function canViewPlot(plot: XYPlot): boolean {
    return authStore.can("view", "xy_plots", toSubject(plot));
  }

  function canEditPlot(plot: XYPlot): boolean {
    return authStore.can("edit", "xy_plots", toSubject(plot));
  }

  function canDeletePlot(plot: XYPlot): boolean {
    return authStore.can("delete", "xy_plots", toSubject(plot));
  }

  // ── Derived state ──────────────────────────────────────────────────────────

  /** Only expose XY plots the current user is allowed to view. */
  const visiblePlots = computed<XYPlot[]>(() =>
    store.xyPlots.filter((plot) => canViewPlot(plot)),
  );

  // ── Permission flags ───────────────────────────────────────────────────────

  /** create is not scope-dependent — check at the resource level. */
  const canCreate = usePermission("create", "xy_plots");

  // ── CRUD operations ────────────────────────────────────────────────────────

  async function fetchAll(): Promise<void> {
    return store.fetchAll();
  }

  async function create(
    data: Omit<XYPlot, "id" | "created_at" | "updated_at">,
  ): Promise<XYPlot> {
    if (!authStore.can("create", "xy_plots")) {
      throw new Error("Permission denied: cannot create xy_plots");
    }
    return store.create(data);
  }

  async function update(
    id: string,
    data: Partial<Omit<XYPlot, "id" | "created_at">>,
    plot: XYPlot,
  ): Promise<XYPlot | null> {
    if (!authStore.can("edit", "xy_plots", toSubject(plot))) {
      throw new Error("Permission denied: cannot edit xy_plots");
    }
    return store.update(id, data);
  }

  async function deleteById(id: string, plot: XYPlot): Promise<boolean> {
    if (!authStore.can("delete", "xy_plots", toSubject(plot))) {
      throw new Error("Permission denied: cannot delete xy_plots");
    }
    return store.delete(id);
  }

  return {
    xyPlots: visiblePlots,
    loading: computed(() => store.loading),
    error: computed(() => store.error),
    canCreate,
    canViewPlot,
    canEditPlot,
    canDeletePlot,
    fetchAll,
    create,
    update,
    delete: deleteById,
  };
}
