/**
 * Composable for exporting XY Plots data in various formats.
 *
 * Checks `export` permission on `xy_plots_export` resource before performing
 * any export operation. Manages loading, success, and error states reactively.
 *
 * @module modules/export/composables/useXYPlotsExport
 */

import { ref } from "vue";
import { useAuthorizationStore } from "../../../stores/authorizationStore";
import { xyPlotsApiService } from "../../xy-plots/api";

/** Supported export formats. */
export type ExportFormat = "csv" | "json" | "excel";

/**
 * Composable that provides XY plot export functionality with permission checking,
 * loading state, success message, and error message.
 *
 * @example
 * ```ts
 * const { loading, success, error, exportXYPlot } = useXYPlotsExport();
 * await exportXYPlot('xy-plot-123', 'json');
 * ```
 */
export function useXYPlotsExport(): {
  loading: ReturnType<typeof ref<boolean>>;
  success: ReturnType<typeof ref<string | null>>;
  error: ReturnType<typeof ref<string | null>>;
  exportXYPlot: (plotId: string, format: ExportFormat) => Promise<void>;
} {
  const authStore = useAuthorizationStore();

  /** Whether an export operation is currently in progress. */
  const loading = ref<boolean>(false);

  /** Success message set after a successful export, or `null` when idle. */
  const success = ref<string | null>(null);

  /** Error message set when an export fails, or `null` when idle. */
  const error = ref<string | null>(null);

  /**
   * Exports a single XY plot by id in the specified format.
   *
   * Checks `export` permission on `xy_plots_export` before fetching data.
   * Sets `loading`, `success`, and `error` states accordingly.
   *
   * @param plotId - The id of the XY plot to export.
   * @param format - The desired export format: 'csv', 'json', or 'excel'.
   */
  async function exportXYPlot(
    plotId: string,
    format: ExportFormat,
  ): Promise<void> {
    // Check export permission before doing anything (Requirement 12.4)
    if (!authStore.can("export", "xy_plots_export")) {
      error.value = "Permission denied: cannot export XY plots";
      return;
    }

    loading.value = true;
    success.value = null;
    error.value = null;

    try {
      const plot = await xyPlotsApiService.getById(plotId);

      if (!plot) {
        error.value = "XY plot not found";
        return;
      }

      // Convert to the requested format and trigger browser download
      const content = convertToFormat(plot, format);
      downloadFile(
        content,
        `xy-plot-${plotId}.${getExtension(format)}`,
        format,
      );

      success.value = `XY plot exported successfully as ${format.toUpperCase()}`;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Export failed";
    } finally {
      loading.value = false;
    }
  }

  return { loading, success, error, exportXYPlot };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Converts a data object to the specified export format string.
 *
 * For 'excel', a CSV representation is used as a mock (a real implementation
 * would use a library such as `xlsx`).
 *
 * @param data   - The data object to convert.
 * @param format - Target format.
 * @returns String representation of the data in the requested format.
 */
function convertToFormat(data: unknown, format: ExportFormat): string {
  if (format === "json") {
    return JSON.stringify(data, null, 2);
  }
  // Both 'csv' and 'excel' use CSV representation
  return convertToCSV(data);
}

/**
 * Converts a flat object to a two-row CSV string (headers + values).
 * Nested objects are JSON-stringified inline.
 *
 * @param data - The data to convert.
 * @returns CSV string.
 */
function convertToCSV(data: unknown): string {
  if (typeof data !== "object" || data === null) {
    return String(data);
  }

  const obj = data as Record<string, unknown>;
  const headers = Object.keys(obj).join(",");
  const values = Object.values(obj)
    .map((v) => {
      if (typeof v === "object" && v !== null) {
        // Wrap JSON in quotes and escape inner quotes for CSV safety
        return `"${JSON.stringify(v).replace(/"/g, '""')}"`;
      }
      const str = String(v);
      // Wrap in quotes if the value contains a comma, newline, or quote
      return str.includes(",") || str.includes("\n") || str.includes('"')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    })
    .join(",");

  return `${headers}\n${values}`;
}

/**
 * Returns the appropriate file extension for the given export format.
 *
 * @param format - The export format.
 * @returns File extension string (without leading dot).
 */
function getExtension(format: ExportFormat): string {
  const extensions: Record<ExportFormat, string> = {
    csv: "csv",
    json: "json",
    excel: "xls",
  };
  return extensions[format];
}

/**
 * Triggers a browser file download for the given content.
 *
 * @param content  - The file content as a string.
 * @param filename - The suggested filename for the download.
 * @param format   - The export format (used to determine MIME type).
 */
function downloadFile(
  content: string,
  filename: string,
  format: ExportFormat,
): void {
  const mimeTypes: Record<ExportFormat, string> = {
    csv: "text/csv",
    json: "application/json",
    excel: "application/vnd.ms-excel",
  };

  const blob = new Blob([content], { type: mimeTypes[format] });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
