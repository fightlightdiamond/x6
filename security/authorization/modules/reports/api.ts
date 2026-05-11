/**
 * API service interface and mock implementation for the Reports module.
 *
 * @module modules/reports/api
 */

import type { Report } from "./types";
import { MOCK_REPORTS } from "./mock-data";

/**
 * Contract for the Reports API service.
 */
export interface ReportsApiService {
  getAll(): Promise<Report[]>;
  getById(id: string): Promise<Report | null>;
  create(
    data: Omit<Report, "id" | "created_at" | "updated_at">,
  ): Promise<Report>;
  update(
    id: string,
    data: Partial<Omit<Report, "id" | "created_at">>,
  ): Promise<Report | null>;
  delete(id: string): Promise<boolean>;
}

/** In-memory store for the mock implementation. */
let _reports: Report[] = MOCK_REPORTS.map((r) => ({ ...r }));

/** Generates a simple unique id for new reports. */
function generateId(): string {
  return `report-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Returns the current ISO timestamp. */
function now(): string {
  return new Date().toISOString();
}

/**
 * Mock implementation of `ReportsApiService` backed by an in-memory array.
 * Simulates async API calls with resolved promises.
 */
export const reportsApiService: ReportsApiService = {
  getAll(): Promise<Report[]> {
    return Promise.resolve(_reports.map((r) => ({ ...r })));
  },

  getById(id: string): Promise<Report | null> {
    const report = _reports.find((r) => r.id === id);
    return Promise.resolve(report ? { ...report } : null);
  },

  create(
    data: Omit<Report, "id" | "created_at" | "updated_at">,
  ): Promise<Report> {
    const timestamp = now();
    const newReport: Report = {
      id: generateId(),
      title: data.title,
      description: data.description,
      content: data.content,
      format: data.format,
      created_at: timestamp,
      updated_at: timestamp,
    };
    _reports = [..._reports, newReport];
    return Promise.resolve({ ...newReport });
  },

  update(
    id: string,
    data: Partial<Omit<Report, "id" | "created_at">>,
  ): Promise<Report | null> {
    const index = _reports.findIndex((r) => r.id === id);
    if (index === -1) {
      return Promise.resolve(null);
    }
    const existing = _reports[index];
    if (!existing) {
      return Promise.resolve(null);
    }
    const updated: Report = {
      ...existing,
      ...data,
      id: existing.id,
      created_at: existing.created_at,
      updated_at: now(),
    };
    _reports = _reports.map((r) => (r.id === id ? updated : r));
    return Promise.resolve({ ...updated });
  },

  delete(id: string): Promise<boolean> {
    const exists = _reports.some((r) => r.id === id);
    if (!exists) {
      return Promise.resolve(false);
    }
    _reports = _reports.filter((r) => r.id !== id);
    return Promise.resolve(true);
  },
};
