import { ref, onUnmounted } from "vue";
import type { Graph } from "@antv/x6";
import type { ScadaFrame } from "~/types/socket-monitor";
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:3001";
const CONNECTION_TIMEOUT_MS = 5000;

export function useSocketMonitor(getGraph: () => Graph | null) {
  const isMonitoring = ref(false);
  const deviceStatuses = ref<
    Array<{ id: string; label: string; status: string }>
  >([]);

  const socket = io(SOCKET_URL, { autoConnect: false });

  const onFrame = (frame: ScadaFrame) => {
    const graph = getGraph();
    if (graph) {
      for (const update of frame.devices) {
        const node = graph.getCellById(update.id);
        if (node) {
          node.setData(update.data);
        } else {
          console.warn("[useSocketMonitor] Node not found:", update.id);
        }
      }
    }
    deviceStatuses.value = frame.devices.map((u) => ({
      id: u.id,
      label: (u.data as any)?.label ?? u.id,
      status: (u.data as any)?.status ?? "normal",
    }));
  };

  socket.on("scada:frame", onFrame);

  function startMonitoring(): void {
    isMonitoring.value = true;
    socket.connect();
    socket.emit("monitor:start");

    // Connection timeout: if socket not connected within 5s, abort
    const timeoutId = setTimeout(() => {
      if (!socket.connected) {
        isMonitoring.value = false;
      }
    }, CONNECTION_TIMEOUT_MS);

    socket.once("connect", () => clearTimeout(timeoutId));
  }

  function stopMonitoring(): void {
    socket.emit("monitor:stop");
    socket.once("scada:stopped", () => {
      isMonitoring.value = false;
    });
  }

  onUnmounted(() => {
    socket.disconnect();
  });

  return { isMonitoring, deviceStatuses, startMonitoring, stopMonitoring };
}
