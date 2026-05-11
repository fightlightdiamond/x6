/**
 * Pinia store for the Reports module.
 *
 * Manages CRUD state for reports and delegates API calls to `reportsApiService`.
 *
 * @module modules/reports/store
 */

import { defineStore } from "pinia";
import { ref } from "vue";
import type { Report } from "./types";
import { reportsApiService } from "./api";

export const useReportsStore = defineStore("reports", () => {
  // ── State ──────────────────────────────────────────────────────────────────

  /** All loaded reports. */
  const reports = ref<Report[]>([]);

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
   * Fetches all reports from the API and replaces the local list.
   */
  async function fetchAll(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      reports.value = await reportsApiService.getAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  }

  /**
   * Fetches a single report by id.
   * Returns the report if found, or `null` otherwise.
   */
  async function fetchById(id: string): Promise<Report | null> {
    setLoading(true);
    setError(null);
    try {
      return await reportsApiService.getById(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch report");
      return null;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Creates a new report and appends it to the local list.
   */
  async function create(
    data: Omit<Report, "id" | "created_at" | "updated_at">,
  ): Promise<Report> {
    setLoading(true);
    setError(null);
    try {
      const newReport = await reportsApiService.create(data);
      reports.value = [...reports.value, newReport];
      return newReport;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create report");
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Updates an existing report and refreshes it in the local list.
   * Returns the updated report, or `null` if not found.
   */
  async function update(
    id: string,
    data: Partial<Omit<Report, "id" | "created_at">>,
  ): Promise<Report | null> {
    setLoading(true);
    setError(null);
    try {
      const updated = await reportsApiService.update(id, data);
      if (updated) {
        reports.value = reports.value.map((r) => (r.id === id ? updated : r));
      }
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update report");
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Deletes a report by id and removes it from the local list.
   * Returns `true` if deleted, `false` if not found.
   */
  async function deleteById(id: string): Promise<boolean> {
    setLoading(true);
    setError(null);
    try {
      const deleted = await reportsApiService.delete(id);
      if (deleted) {
        reports.value = reports.value.filter((r) => r.id !== id);
      }
      return deleted;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete report");
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return {
    // State
    reports,
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
