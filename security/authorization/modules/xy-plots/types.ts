/**
 * TypeScript types for the XY Plots module.
 *
 * @module modules/xy-plots/types
 */

import type { ScopeType } from "../../types/index";

/**
 * Configuration for a single axis in an XY plot.
 */
export interface AxisConfig {
  label: string;
  unit: string;
  min?: number;
  max?: number;
}

/**
 * A single data point in an XY plot.
 */
export interface DataPoint {
  x: number;
  y: number;
}

/**
 * Represents an XY plot resource managed by the authorization system.
 * XY plots are scoped resources — permissions depend on `type` (private/shared)
 * and `user_id` (owner).
 */
export interface XYPlot {
  readonly id: string;
  name: string;
  description: string;
  /** Scope type: 'private' (owner-only by default) or 'shared' (visible to others). */
  type: ScopeType;
  /** The id of the user who owns this XY plot. */
  readonly user_id: string;
  x_axis: AxisConfig;
  y_axis: AxisConfig;
  data_points: DataPoint[];
  readonly created_at: string;
  updated_at: string;
}
