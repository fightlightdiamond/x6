/**
 * Pinia store for the Mimics module.
 *
 * Manages CRUD state for mimics and delegates API calls to `mimicsApiService`.
 *
 * @module modules/mimics/store
 */

import { defineStore } from "pinia";
import { ref } from "vue";
import type { Mimic } from "./types";
import { mimicsApiService } from "./api";

export const useMimicsStore = defineStore("mimics", () => {
  // ── State ──────────────────────────────────────────────────────────────────

  /** All loaded mimics. */
  const mimics = ref<Mimic[]>([]);

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
   * Fetches all mimics from the API and replaces the local list.
   */
  async function fetchAll(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      mimics.value = await mimicsApiService.getAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch mimics");
    } finally {
      setLoading(false);
    }
  }

  /**
   * Fetches a single mimic by id.
   * Returns the mimic if found, or `null` otherwise.
   */
  async function fetchById(id: string): Promise<Mimic | null> {
    setLoading(true);
    setError(null);
    try {
      return await mimicsApiService.getById(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch mimic");
      return null;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Creates a new mimic and appends it to the local list.
   */
  async function create(
    data: Omit<Mimic, "id" | "created_at" | "updated_at">,
  ): Promise<Mimic> {
    setLoading(true);
    setError(null);
    try {
      const newMimic = await mimicsApiService.create(data);
      mimics.value = [...mimics.value, newMimic];
      return newMimic;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create mimic");
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Updates an existing mimic and refreshes it in the local list.
   * Returns the updated mimic, or `null` if not found.
   */
  async function update(
    id: string,
    data: Partial<Omit<Mimic, "id" | "created_at">>,
  ): Promise<Mimic | null> {
    setLoading(true);
    setError(null);
    try {
      const updated = await mimicsApiService.update(id, data);
      if (updated) {
        mimics.value = mimics.value.map((m) => (m.id === id ? updated : m));
      }
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update mimic");
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Deletes a mimic by id and removes it from the local list.
   * Returns `true` if deleted, `false` if not found.
   */
  async function deleteById(id: string): Promise<boolean> {
    setLoading(true);
    setError(null);
    try {
      const deleted = await mimicsApiService.delete(id);
      if (deleted) {
        mimics.value = mimics.value.filter((m) => m.id !== id);
      }
      return deleted;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete mimic");
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return {
    // State
    mimics,
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
