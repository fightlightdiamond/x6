/**
 * API service interface and mock implementation for the Web Pages module.
 *
 * @module modules/web/api
 */

import type { WebPage } from "./types";
import { MOCK_WEB_PAGES } from "./mock-data";

/**
 * Contract for the Web Pages API service.
 */
export interface WebApiService {
  getAll(): Promise<WebPage[]>;
  getById(id: string): Promise<WebPage | null>;
  create(
    data: Omit<WebPage, "id" | "created_at" | "updated_at">,
  ): Promise<WebPage>;
  update(
    id: string,
    data: Partial<Omit<WebPage, "id" | "created_at">>,
  ): Promise<WebPage | null>;
  delete(id: string): Promise<boolean>;
}

/** In-memory store for the mock implementation. */
let _pages: WebPage[] = MOCK_WEB_PAGES.map((p) => ({ ...p }));

/** Generates a simple unique id for new pages. */
function generateId(): string {
  return `web-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Returns the current ISO timestamp. */
function now(): string {
  return new Date().toISOString();
}

/**
 * Mock implementation of `WebApiService` backed by an in-memory array.
 * Simulates async API calls with resolved promises.
 */
export const webApiService: WebApiService = {
  getAll(): Promise<WebPage[]> {
    return Promise.resolve(_pages.map((p) => ({ ...p })));
  },

  getById(id: string): Promise<WebPage | null> {
    const page = _pages.find((p) => p.id === id);
    return Promise.resolve(page ? { ...page } : null);
  },

  create(
    data: Omit<WebPage, "id" | "created_at" | "updated_at">,
  ): Promise<WebPage> {
    const timestamp = now();
    const newPage: WebPage = {
      id: generateId(),
      title: data.title,
      content: data.content,
      url: data.url,
      created_at: timestamp,
      updated_at: timestamp,
    };
    _pages = [..._pages, newPage];
    return Promise.resolve({ ...newPage });
  },

  update(
    id: string,
    data: Partial<Omit<WebPage, "id" | "created_at">>,
  ): Promise<WebPage | null> {
    const index = _pages.findIndex((p) => p.id === id);
    if (index === -1) {
      return Promise.resolve(null);
    }
    const existing = _pages[index];
    if (!existing) {
      return Promise.resolve(null);
    }
    const updated: WebPage = {
      ...existing,
      ...data,
      id: existing.id,
      created_at: existing.created_at,
      updated_at: now(),
    };
    _pages = _pages.map((p) => (p.id === id ? updated : p));
    return Promise.resolve({ ...updated });
  },

  delete(id: string): Promise<boolean> {
    const exists = _pages.some((p) => p.id === id);
    if (!exists) {
      return Promise.resolve(false);
    }
    _pages = _pages.filter((p) => p.id !== id);
    return Promise.resolve(true);
  },
};
