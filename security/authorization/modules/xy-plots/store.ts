/**
 * Pinia store for the XY Plots module.
 *
 * Manages CRUD state for XY plots and delegates API calls to `xyPlotsApiService`.
 *
 * @module modules/xy-plots/store
 */

import { defineStore } from "pinia";
import { ref } from "vue";
import type { XYPlot } from "./types";
import { xyPlotsApiService } from "./api";

export const useXYPlotsStore = defineStore("xy-plots", () => {
  // ── State ──────────────────────────────────────────────────────────────────

  /** All loaded XY plots. */
  const xyPlots = ref<XYPlot[]>([]);

  /** Whether an async operation is in progress. */
  const loading = ref<boolean>(false);

  /** Error message from the last failed operation, or `null` if none. */
  const error = ref<string | null>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────

  function setLoading(value: boolean): void {
    loading.value = value;
  }

  function setError(message: string | null): void {
    error.value = message;
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  /**
   * Fetches all XY plots from the API and replaces the local list.
   */
  async function fetchAll(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      xyPlots.value = await xyPlotsApiService.getAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch XY plots");
    } finally {
      setLoading(false);
    }
  }

  /**
   * Fetches a single XY plot by id.
   * Returns the plot if found, or `null` otherwise.
   */
  async function fetchById(id: string): Promise<XYPlot | null> {
    setLoading(true);
    setError(null);
    try {
      return await xyPlotsApiService.getById(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch XY plot");
      return null;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Creates a new XY plot and appends it to the local list.
   */
  async function create(
    data: Omit<XYPlot, "id" | "created_at" | "updated_at">,
  ): Promise<XYPlot> {
    setLoading(true);
    setError(null);
    try {
      const newPlot = await xyPlotsApiService.create(data);
      xyPlots.value = [...xyPlots.value, newPlot];
      return newPlot;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create XY plot");
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Updates an existing XY plot and refreshes it in the local list.
   * Returns the updated plot, or `null` if not found.
   */
  async function update(
    id: string,
    data: Partial<Omit<XYPlot, "id" | "created_at">>,
  ): Promise<XYPlot | null> {
    setLoading(true);
    setError(null);
    try {
      const updated = await xyPlotsApiService.update(id, data);
      if (updated) {
        xyPlots.value = xyPlots.value.map((p) => (p.id === id ? updated : p));
      }
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update XY plot");
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Deletes an XY plot by id and removes it from the local list.
   * Returns `true` if deleted, `false` if not found.
   */
  async function deleteById(id: string): Promise<boolean> {
    setLoading(true);
    setError(null);
    try {
      const deleted = await xyPlotsApiService.delete(id);
      if (deleted) {
        xyPlots.value = xyPlots.value.filter((p) => p.id !== id);
      }
      return deleted;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete XY plot");
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return {
    // State
    xyPlots,
    loading,
    error,
    // Actions
    fetchAll,
    fetchById,
    create,
    update,
    delete: deleteById,
  };
});
