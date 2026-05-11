/**
 * API service interface and mock implementation for the XY Plots module.
 *
 * @module modules/xy-plots/api
 */

import type { XYPlot } from "./types";
import { MOCK_XY_PLOTS } from "./mock-data";

/**
 * Contract for the XY Plots API service.
 */
export interface XYPlotsApiService {
  getAll(): Promise<XYPlot[]>;
  getById(id: string): Promise<XYPlot | null>;
  create(
    data: Omit<XYPlot, "id" | "created_at" | "updated_at">,
  ): Promise<XYPlot>;
  update(
    id: string,
    data: Partial<Omit<XYPlot, "id" | "created_at">>,
  ): Promise<XYPlot | null>;
  delete(id: string): Promise<boolean>;
}

/** In-memory store for the mock implementation. */
let _xyPlots: XYPlot[] = MOCK_XY_PLOTS.map((p) => ({ ...p }));

/** Generates a simple unique id for new XY plots. */
function generateId(): string {
  return `xy-plot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Returns the current ISO timestamp. */
function now(): string {
  return new Date().toISOString();
}

/**
 * Mock implementation of `XYPlotsApiService` backed by an in-memory array.
 * Simulates async API calls with resolved promises.
 */
export const xyPlotsApiService: XYPlotsApiService = {
  getAll(): Promise<XYPlot[]> {
    return Promise.resolve(_xyPlots.map((p) => ({ ...p })));
  },

  getById(id: string): Promise<XYPlot | null> {
    const plot = _xyPlots.find((p) => p.id === id);
    return Promise.resolve(plot ? { ...plot } : null);
  },

  create(
    data: Omit<XYPlot, "id" | "created_at" | "updated_at">,
  ): Promise<XYPlot> {
    const timestamp = now();
    const newPlot: XYPlot = {
      id: generateId(),
      name: data.name,
      description: data.description,
      type: data.type,
      user_id: data.user_id,
      x_axis: data.x_axis,
      y_axis: data.y_axis,
      data_points: data.data_points,
      created_at: timestamp,
      updated_at: timestamp,
    };
    _xyPlots = [..._xyPlots, newPlot];
    return Promise.resolve({ ...newPlot });
  },

  update(
    id: string,
    data: Partial<Omit<XYPlot, "id" | "created_at">>,
  ): Promise<XYPlot | null> {
    const index = _xyPlots.findIndex((p) => p.id === id);
    if (index === -1) {
      return Promise.resolve(null);
    }
    const existing = _xyPlots[index];
    if (!existing) {
      return Promise.resolve(null);
    }
    const updated: XYPlot = {
      ...existing,
      ...data,
      id: existing.id,
      user_id: existing.user_id,
      created_at: existing.created_at,
      updated_at: now(),
    };
    _xyPlots = _xyPlots.map((p) => (p.id === id ? updated : p));
    return Promise.resolve({ ...updated });
  },

  delete(id: string): Promise<boolean> {
    const exists = _xyPlots.some((p) => p.id === id);
    if (!exists) {
      return Promise.resolve(false);
    }
    _xyPlots = _xyPlots.filter((p) => p.id !== id);
    return Promise.resolve(true);
  },
};
