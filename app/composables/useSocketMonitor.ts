import { onUnmounted } from "vue";
import { storeToRefs } from "pinia";
import type { Graph } from "@antv/x6";
import type { ScadaFrame } from "~/types/socket-monitor";
import { useMonitorStore } from "~/stores/monitorStore";

export function useSocketMonitor(getGraph: () => Graph | null) {
  const store = useMonitorStore();
  const { isMonitoring, deviceStatuses } = storeToRefs(store);
  const { $socket } = useNuxtApp();
  const socket = $socket as ReturnType<
    (typeof import("socket.io-client"))["io"]
  >;

  const onFrame = (frame: ScadaFrame) => {
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
    store.updateDeviceStatuses(frame.devices as any);
  };

  const onStopped = () => store.setMonitoring(false);

  socket.on("scada:frame", onFrame);
  socket.on("scada:stopped", onStopped);

  function startMonitoring(): void {
    store.setMonitoring(true);
    // Notify backend of current template if one is active
    if (store.activeTemplateId) {
      socket.emit("monitor:set-template", {
        templateId: store.activeTemplateId,
      });
    }
    socket.emit("monitor:start");
  }

  function stopMonitoring(): void {
    socket.emit("monitor:stop");
  }

  onUnmounted(() => {
    socket.off("scada:frame", onFrame);
    socket.off("scada:stopped", onStopped);
  });

  return { isMonitoring, deviceStatuses, startMonitoring, stopMonitoring };
}
