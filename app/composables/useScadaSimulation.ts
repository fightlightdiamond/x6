import { ref } from "vue";
import type { DeviceStatus } from "~/types/scada";

// ─── Pure helper functions (exported for testability) ─────────────────────────

export function computeFilterStatus(voltage: number): "chạy" | "lỗi" {
  return voltage < 60 || voltage > 90 ? "lỗi" : "chạy";
}

export function computeBlowerStatus(statorTemp: number): "running" | "fault" {
  return statorTemp > 85 ? "fault" : "running";
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ─── Tracked device IDs ───────────────────────────────────────────────────────

const TRACKED_DEVICE_IDS = [
  "filtr-1",
  "filtr-2",
  "filtr-3",
  "filtr-4",
  "vent-1",
  "vent-2",
];

// ─── Composable ───────────────────────────────────────────────────────────────

export function useScadaSimulation(getGraph: () => any) {
  const isMonitoring = ref(false);

  const deviceStatuses = ref<DeviceStatus[]>([
    { id: "filtr-1", label: "Filtr 1", status: "dừng" },
    { id: "filtr-2", label: "Filtr 2", status: "dừng" },
    { id: "filtr-3", label: "Filtr 3", status: "dừng" },
    { id: "filtr-4", label: "Filtr 4", status: "dừng" },
    { id: "vent-1", label: "Ventilátor 1", status: "stopped" },
    { id: "vent-2", label: "Ventilátor 2", status: "stopped" },
  ]);

  let simInterval: ReturnType<typeof setInterval> | null = null;

  // ── Sync deviceStatuses from graph node data ────────────────────────────────
  function syncDeviceStatuses(graph: any): void {
    deviceStatuses.value = deviceStatuses.value.map((entry) => {
      try {
        const node = graph.getCellById(entry.id);
        if (node) {
          const data = node.getData() ?? {};
          return { ...entry, status: data.status ?? entry.status };
        }
      } catch {
        // ignore
      }
      return entry;
    });
  }

  // ── Simulation tick ─────────────────────────────────────────────────────────
  function runTick(graph: any): void {
    const nodes = graph.getNodes();

    nodes.forEach((node: any) => {
      const shape = node.shape;
      const data = node.getData() ?? {};

      // 3.3 — esp-filter-tank with threshold detection
      if (shape === "esp-filter-tank") {
        try {
          const newVoltage = clamp(
            data.voltage + (Math.random() - 0.5) * 4,
            40,
            120,
          );
          const newCurrent = clamp(
            data.current + (Math.random() - 0.5) * 100,
            0,
            1200,
          );
          const newStatus = computeFilterStatus(newVoltage);
          node.setData({
            voltage: +newVoltage.toFixed(1),
            current: Math.round(newCurrent),
            status: newStatus,
          });
        } catch (err) {
          console.warn(
            `[ScadaSimulation] Skipping esp-filter-tank node ${node.id}:`,
            err,
          );
        }
        return;
      }

      // 3.4 — motor-blower with threshold detection
      if (shape === "motor-blower") {
        try {
          const newStatorTemp = clamp(
            data.statorTemp + (Math.random() - 0.5) * 6,
            0,
            200,
          );
          const newCurrent = clamp(
            data.current + (Math.random() - 0.5) * 10,
            0,
            500,
          );
          const newBearingTemp = clamp(
            data.bearingTemp + (Math.random() - 0.5) * 4,
            0,
            150,
          );
          const newStatus = computeBlowerStatus(newStatorTemp);
          node.setData({
            statorTemp: +newStatorTemp.toFixed(1),
            current: +newCurrent.toFixed(1),
            bearingTemp: +newBearingTemp.toFixed(1),
            status: newStatus,
          });
        } catch (err) {
          console.warn(
            `[ScadaSimulation] Skipping motor-blower node ${node.id}:`,
            err,
          );
        }
        return;
      }

      // 3.5 — control-valve
      if (shape === "control-valve") {
        try {
          const openPercent = clamp(
            data.openPercent + (Math.random() - 0.5) * 10,
            0,
            100,
          );
          node.setData({ openPercent: Math.round(openPercent) });
        } catch (err) {
          console.warn(
            `[ScadaSimulation] Skipping control-valve node ${node.id}:`,
            err,
          );
        }
        return;
      }

      // 3.5 — data-tag
      if (shape === "data-tag") {
        try {
          const value = +(data.value + (Math.random() - 0.5) * 5).toFixed(2);
          node.setData({ value });
        } catch (err) {
          console.warn(
            `[ScadaSimulation] Skipping data-tag node ${node.id}:`,
            err,
          );
        }
        return;
      }
    });

    // After tick: update deviceStatuses from graph
    syncDeviceStatuses(graph);
  }

  // ── startMonitoring ─────────────────────────────────────────────────────────
  function startMonitoring(): void {
    const graph = getGraph();
    if (!graph) return;

    isMonitoring.value = true;

    // Set Filtr nodes to 'chạy'
    TRACKED_DEVICE_IDS.filter((id) => id.startsWith("filtr-")).forEach((id) => {
      try {
        const node = graph.getCellById(id);
        if (node) node.setData({ status: "chạy" });
      } catch (err) {
        console.warn(`[ScadaSimulation] Could not set status for ${id}:`, err);
      }
    });

    // Set Ventilátor nodes to 'running'
    TRACKED_DEVICE_IDS.filter((id) => id.startsWith("vent-")).forEach((id) => {
      try {
        const node = graph.getCellById(id);
        if (node) node.setData({ status: "running" });
      } catch (err) {
        console.warn(`[ScadaSimulation] Could not set status for ${id}:`, err);
      }
    });

    // Activate flow animation on all edges
    graph.getEdges().forEach((edge: any) => {
      try {
        edge.addClass("flow-active");
      } catch {
        // ignore
      }
    });

    // Sync initial statuses
    syncDeviceStatuses(graph);

    // Start simulation interval
    simInterval = setInterval(() => {
      const g = getGraph();
      if (g) runTick(g);
    }, 1500);
  }

  // ── stopMonitoring ──────────────────────────────────────────────────────────
  function stopMonitoring(): void {
    if (simInterval !== null) {
      clearInterval(simInterval);
      simInterval = null;
    }

    isMonitoring.value = false;

    const graph = getGraph();
    if (!graph) return;

    // Set Filtr nodes to 'dừng'
    TRACKED_DEVICE_IDS.filter((id) => id.startsWith("filtr-")).forEach((id) => {
      try {
        const node = graph.getCellById(id);
        if (node) node.setData({ status: "dừng" });
      } catch (err) {
        console.warn(`[ScadaSimulation] Could not set status for ${id}:`, err);
      }
    });

    // Set Ventilátor nodes to 'stopped'
    TRACKED_DEVICE_IDS.filter((id) => id.startsWith("vent-")).forEach((id) => {
      try {
        const node = graph.getCellById(id);
        if (node) node.setData({ status: "stopped" });
      } catch (err) {
        console.warn(`[ScadaSimulation] Could not set status for ${id}:`, err);
      }
    });

    // Remove flow animation from all edges
    graph.getEdges().forEach((edge: any) => {
      try {
        edge.removeClass("flow-active");
      } catch {
        // ignore
      }
    });

    // Sync final statuses
    syncDeviceStatuses(graph);
  }

  return { isMonitoring, deviceStatuses, startMonitoring, stopMonitoring };
}
