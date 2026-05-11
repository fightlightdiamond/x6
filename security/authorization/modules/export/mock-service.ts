/**
 * Mock export service.
 *
 * Provides a unified, service-oriented façade over the `useTrendsExport` and
 * `useXYPlotsExport` composables. Intended for use in tests, Storybook stories,
 * and development tooling where a plain-object API is more convenient than
 * composable hooks (Req 12.13).
 *
 * @module modules/export/mock-service
 */

import type { ExportFormat } from "./composables/useTrendsExport";

// ── Types ──────────────────────────────────────────────────────────────────────

/** Resource types supported by the export service. */
export type ExportResourceType = "trends_export" | "xy_plots_export";

/** Result returned by every export operation. */
export interface ExportResult {
  /** Whether the export completed successfully. */
  readonly success: boolean;
  /** Human-readable message describing the outcome. */
  readonly message: string;
  /** The resource id that was exported. */
  readonly resourceId: string;
  /** The format used for the export. */
  readonly format: ExportFormat;
  /** The resource type that was exported. */
  readonly resourceType: ExportResourceType;
}

/** Options accepted by `mockExportService.export`. */
export interface ExportOptions {
  /** The type of resource to export. */
  resourceType: ExportResourceType;
  /** The id of the resource instance to export. */
  resourceId: string;
  /** The desired output format. Defaults to `'csv'`. */
  format?: ExportFormat;
}

// ── Mock service implementation ────────────────────────────────────────────────

/**
 * Simulates an export operation without triggering a real browser download.
 *
 * In a production environment this would be replaced by a real API call or
 * delegated to the composables. Here it simply validates inputs and returns a
 * resolved `ExportResult` after a short artificial delay, making it easy to
 * test loading/success/error states in isolation.
 *
 * @param options - Export configuration.
 * @returns A promise that resolves to an `ExportResult`.
 */
async function exportResource(options: ExportOptions): Promise<ExportResult> {
  const { resourceType, resourceId, format = "csv" } = options;

  if (!resourceId || resourceId.trim() === "") {
    return {
      success: false,
      message: "Export failed: resourceId must not be empty",
      resourceId,
      format,
      resourceType,
    };
  }

  // Simulate async network / processing delay
  await simulateDelay(300);

  const label = resourceType === "trends_export" ? "Trend" : "XY Plot";

  return {
    success: true,
    message: `${label} "${resourceId}" exported successfully as ${format.toUpperCase()}`,
    resourceId,
    format,
    resourceType,
  };
}

/**
 * Simulates an export operation that always fails.
 * Useful for testing error-state UI.
 *
 * @param options - Export configuration.
 * @returns A promise that resolves to a failed `ExportResult`.
 */
async function exportResourceWithError(
  options: ExportOptions,
): Promise<ExportResult> {
  const { resourceType, resourceId, format = "csv" } = options;

  await simulateDelay(200);

  return {
    success: false,
    message: "Export failed: simulated server error",
    resourceId,
    format,
    resourceType,
  };
}

/**
 * Returns the list of export formats supported by the mock service.
 *
 * @returns Array of supported `ExportFormat` values.
 */
function getSupportedFormats(): readonly ExportFormat[] {
  return ["csv", "json", "excel"] as const;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Returns a promise that resolves after `ms` milliseconds.
 *
 * @param ms - Delay in milliseconds.
 */
function simulateDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Mock export service singleton.
 *
 * @example
 * ```ts
 * import { mockExportService } from '../mock-service';
 *
 * const result = await mockExportService.export({
 *   resourceType: 'trends_export',
 *   resourceId: 'trend-1',
 *   format: 'json',
 * });
 *
 * if (result.success) {
 *   console.log(result.message);
 * }
 * ```
 */
export const mockExportService = {
  export: exportResource,
  exportWithError: exportResourceWithError,
  getSupportedFormats,
} as const;
