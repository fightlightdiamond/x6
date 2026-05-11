/**
 * Pinia store for the Web Pages module.
 *
 * Manages CRUD state for web pages and delegates API calls to `webApiService`.
 *
 * @module modules/web/store
 */

import { defineStore } from "pinia";
import { ref } from "vue";
import type { WebPage } from "./types";
import { webApiService } from "./api";

export const useWebStore = defineStore("web", () => {
  // ── State ──────────────────────────────────────────────────────────────────

  /** All loaded web pages. */
  const pages = ref<WebPage[]>([]);

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
   * Fetches all web pages from the API and replaces the local list.
   */
  async function fetchAll(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      pages.value = await webApiService.getAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch pages");
    } finally {
      setLoading(false);
    }
  }

  /**
   * Fetches a single web page by id.
   * Returns the page if found, or `null` otherwise.
   */
  async function fetchById(id: string): Promise<WebPage | null> {
    setLoading(true);
    setError(null);
    try {
      return await webApiService.getById(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch page");
      return null;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Creates a new web page and appends it to the local list.
   */
  async function create(
    data: Omit<WebPage, "id" | "created_at" | "updated_at">,
  ): Promise<WebPage> {
    setLoading(true);
    setError(null);
    try {
      const newPage = await webApiService.create(data);
      pages.value = [...pages.value, newPage];
      return newPage;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create page");
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Updates an existing web page and refreshes it in the local list.
   * Returns the updated page, or `null` if not found.
   */
  async function update(
    id: string,
    data: Partial<Omit<WebPage, "id" | "created_at">>,
  ): Promise<WebPage | null> {
    setLoading(true);
    setError(null);
    try {
      const updated = await webApiService.update(id, data);
      if (updated) {
        pages.value = pages.value.map((p) => (p.id === id ? updated : p));
      }
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update page");
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Deletes a web page by id and removes it from the local list.
   * Returns `true` if deleted, `false` if not found.
   */
  async function deleteById(id: string): Promise<boolean> {
    setLoading(true);
    setError(null);
    try {
      const deleted = await webApiService.delete(id);
      if (deleted) {
        pages.value = pages.value.filter((p) => p.id !== id);
      }
      return deleted;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete page");
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return {
    // State
    pages,
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
