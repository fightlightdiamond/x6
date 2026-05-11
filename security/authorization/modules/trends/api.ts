/**
 * API service interface and mock implementation for the Trends module.
 *
 * @module modules/trends/api
 */

import type { Trend } from "./types";
import { MOCK_TRENDS } from "./mock-data";

/**
 * Contract for the Trends API service.
 */
export interface TrendsApiService {
  getAll(): Promise<Trend[]>;
  getById(id: string): Promise<Trend | null>;
  create(data: Omit<Trend, "id" | "created_at" | "updated_at">): Promise<Trend>;
  update(
    id: string,
    data: Partial<Omit<Trend, "id" | "created_at">>,
  ): Promise<Trend | null>;
  delete(id: string): Promise<boolean>;
}

/** In-memory store for the mock implementation. */
let _trends: Trend[] = MOCK_TRENDS.map((t) => ({ ...t }));

/** Generates a simple unique id for new trends. */
function generateId(): string {
  return `trend-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Returns the current ISO timestamp. */
function now(): string {
  return new Date().toISOString();
}

/**
 * Mock implementation of `TrendsApiService` backed by an in-memory array.
 * Simulates async API calls with resolved promises.
 */
export const trendsApiService: TrendsApiService = {
  getAll(): Promise<Trend[]> {
    return Promise.resolve(_trends.map((t) => ({ ...t })));
  },

  getById(id: string): Promise<Trend | null> {
    const trend = _trends.find((t) => t.id === id);
    return Promise.resolve(trend ? { ...trend } : null);
  },

  create(
    data: Omit<Trend, "id" | "created_at" | "updated_at">,
  ): Promise<Trend> {
    const timestamp = now();
    const newTrend: Trend = {
      id: generateId(),
      name: data.name,
      description: data.description,
      type: data.type,
      user_id: data.user_id,
      data: data.data,
      created_at: timestamp,
      updated_at: timestamp,
    };
    _trends = [..._trends, newTrend];
    return Promise.resolve({ ...newTrend });
  },

  update(
    id: string,
    data: Partial<Omit<Trend, "id" | "created_at">>,
  ): Promise<Trend | null> {
    const index = _trends.findIndex((t) => t.id === id);
    if (index === -1) {
      return Promise.resolve(null);
    }
    const existing = _trends[index];
    if (!existing) {
      return Promise.resolve(null);
    }
    const updated: Trend = {
      ...existing,
      ...data,
      id: existing.id,
      user_id: existing.user_id,
      created_at: existing.created_at,
      updated_at: now(),
    };
    _trends = _trends.map((t) => (t.id === id ? updated : t));
    return Promise.resolve({ ...updated });
  },

  delete(id: string): Promise<boolean> {
    const exists = _trends.some((t) => t.id === id);
    if (!exists) {
      return Promise.resolve(false);
    }
    _trends = _trends.filter((t) => t.id !== id);
    return Promise.resolve(true);
  },
};
