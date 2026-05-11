/**
 * API service interface and mock implementation for the Mimics module.
 *
 * @module modules/mimics/api
 */

import type { Mimic } from "./types";
import { MOCK_MIMICS } from "./mock-data";

/**
 * Contract for the Mimics API service.
 */
export interface MimicsApiService {
  getAll(): Promise<Mimic[]>;
  getById(id: string): Promise<Mimic | null>;
  create(data: Omit<Mimic, "id" | "created_at" | "updated_at">): Promise<Mimic>;
  update(
    id: string,
    data: Partial<Omit<Mimic, "id" | "created_at">>,
  ): Promise<Mimic | null>;
  delete(id: string): Promise<boolean>;
}

/** In-memory store for the mock implementation. */
let _mimics: Mimic[] = MOCK_MIMICS.map((m) => ({ ...m }));

/** Generates a simple unique id for new mimics. */
function generateId(): string {
  return `mimic-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Returns the current ISO timestamp. */
function now(): string {
  return new Date().toISOString();
}

/**
 * Mock implementation of `MimicsApiService` backed by an in-memory array.
 * Simulates async API calls with resolved promises.
 */
export const mimicsApiService: MimicsApiService = {
  getAll(): Promise<Mimic[]> {
    return Promise.resolve(_mimics.map((m) => ({ ...m })));
  },

  getById(id: string): Promise<Mimic | null> {
    const mimic = _mimics.find((m) => m.id === id);
    return Promise.resolve(mimic ? { ...mimic } : null);
  },

  create(
    data: Omit<Mimic, "id" | "created_at" | "updated_at">,
  ): Promise<Mimic> {
    const timestamp = now();
    const newMimic: Mimic = {
      id: generateId(),
      name: data.name,
      description: data.description,
      config: { ...data.config },
      layout: { ...data.layout },
      created_at: timestamp,
      updated_at: timestamp,
    };
    _mimics = [..._mimics, newMimic];
    return Promise.resolve({ ...newMimic });
  },

  update(
    id: string,
    data: Partial<Omit<Mimic, "id" | "created_at">>,
  ): Promise<Mimic | null> {
    const index = _mimics.findIndex((m) => m.id === id);
    if (index === -1) {
      return Promise.resolve(null);
    }
    const existing = _mimics[index];
    if (!existing) {
      return Promise.resolve(null);
    }
    const updated: Mimic = {
      ...existing,
      ...data,
      id: existing.id,
      created_at: existing.created_at,
      updated_at: now(),
    };
    _mimics = _mimics.map((m) => (m.id === id ? updated : m));
    return Promise.resolve({ ...updated });
  },

  delete(id: string): Promise<boolean> {
    const exists = _mimics.some((m) => m.id === id);
    if (!exists) {
      return Promise.resolve(false);
    }
    _mimics = _mimics.filter((m) => m.id !== id);
    return Promise.resolve(true);
  },
};
