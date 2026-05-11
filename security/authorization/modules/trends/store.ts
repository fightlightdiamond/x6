/**
 * Pinia store for the Trends module.
 *
 * Manages CRUD state for trends and delegates API calls to `trendsApiService`.
 *
 * @module modules/trends/store
 */

import { defineStore } from "pinia";
import { ref } from "vue";
import type { Trend } from "./types";
import { trendsApiService } from "./api";

export const useTrendsStore = defineStore("trends", () => {
  // ── State ──────────────────────────────────────────────────────────────────

  /** All loaded trends. */
  const trends = ref<Trend[]>([]);

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
   * Fetches all trends from the API and replaces the local list.
   */
  async function fetchAll(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      trends.value = await trendsApiService.getAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch trends");
    } finally {
      setLoading(false);
    }
  }

  /**
   * Fetches a single trend by id.
   * Returns the trend if found, or `null` otherwise.
   */
  async function fetchById(id: string): Promise<Trend | null> {
    setLoading(true);
    setError(null);
    try {
      return await trendsApiService.getById(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch trend");
      return null;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Creates a new trend and appends it to the local list.
   */
  async function create(
    data: Omit<Trend, "id" | "created_at" | "updated_at">,
  ): Promise<Trend> {
    setLoading(true);
    setError(null);
    try {
      const newTrend = await trendsApiService.create(data);
      trends.value = [...trends.value, newTrend];
      return newTrend;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create trend");
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Updates an existing trend and refreshes it in the local list.
   * Returns the updated trend, or `null` if not found.
   */
  async function update(
    id: string,
    data: Partial<Omit<Trend, "id" | "created_at">>,
  ): Promise<Trend | null> {
    setLoading(true);
    setError(null);
    try {
      const updated = await trendsApiService.update(id, data);
      if (updated) {
        trends.value = trends.value.map((t) => (t.id === id ? updated : t));
      }
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update trend");
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Deletes a trend by id and removes it from the local list.
   * Returns `true` if deleted, `false` if not found.
   */
  async function deleteById(id: string): Promise<boolean> {
    setLoading(true);
    setError(null);
    try {
      const deleted = await trendsApiService.delete(id);
      if (deleted) {
        trends.value = trends.value.filter((t) => t.id !== id);
      }
      return deleted;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete trend");
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return {
    // State
    trends,
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
