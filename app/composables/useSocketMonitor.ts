import { ref, onUnmounted } from "vue";
import type { Graph } from "@antv/x6";
import type { ScadaFrame, DeviceUpdate } from "~/types/socket-monitor";
import type { DeviceStatus } from "~/types/scada";

export type { DeviceStatus };

export function useSocketMonitor(getGraph: () => Graph | null) {
  const { $socket } = useNuxtApp();
  const socket = $socket as ReturnType<
    (typeof import("socket.io-client"))["io"]
  >;

  const isMonitoring = ref(false);
  const deviceStatuses = ref<DeviceStatus[]>([]);

  const onFrame = (frame: ScadaFrame) => {
    console.log(
      "[useSocketMonitor] scada:frame, devices:",
      frame.devices.length,
    );
    const graph = getGraph();
    if (graph) {
      for (const update of frame.devices) {
        const node = graph.getCellById(update.id);
        if (node) {
          node.setData(update.data, { overwrite: true });
        } else {
          console.warn("[useSocketMonitor] Node not found:", update.id);
        }
      }
    }
    deviceStatuses.value = frame.devices.map((u: DeviceUpdate) => ({
      id: u.id,
      label: (u.data as any).label ?? u.id,
      status: (u.data as any).status ?? "normal",
    }));
  };

  const onStopped = () => {
    isMonitoring.value = false;
  };

  socket.on("scada:frame", onFrame);
  socket.on("scada:stopped", onStopped);

  function startMonitoring(): void {
    console.log("[useSocketMonitor] startMonitoring()");
    isMonitoring.value = true;
    socket.emit("monitor:start");
  }

  function stopMonitoring(): void {
    socket.emit("monitor:stop");
    isMonitoring.value = false;
  }

  onUnmounted(() => {
    socket.off("scada:frame", onFrame);
    socket.off("scada:stopped", onStopped);
  });

  return { isMonitoring, deviceStatuses, startMonitoring, stopMonitoring };
}
