import { ref } from "vue";

// Industrial edge types for ESP system
const INDUSTRIAL_EDGE_TYPES = ["gas", "clean-air", "signal"];

export const useGraphMonitor = (getGraph: () => any) => {
  const isMonitoring = ref(false);
  let simInterval: any = null;

  const toggleMonitoring = () => {
    const graph = getGraph();
    if (!graph) return;

    isMonitoring.value = !isMonitoring.value;

    if (isMonitoring.value) {
      // 1. Bật animation Edge
      const edges = graph.getEdges();
      edges.forEach((edge: any) => {
        // Tắt nút xóa khi đang monitor
        edge.removeTools();

        const edgeData = edge.getData() ?? {};

        if (INDUSTRIAL_EDGE_TYPES.includes(edgeData.edgeType)) {
          // 11.5: Thêm class flow-active cho industrial edges (gas, clean-air, signal)
          edge.addClass("flow-active");
        } else {
          // Giữ nguyên animation ant-line cho IT edges
          edge.attr("line/strokeDasharray", 5);
          edge.attr("line/style/animation", "ant-line 30s infinite linear");
          edge.attr("line/stroke", "#10b981");
        }
      });

      // Tắt nút xóa Node
      const nodes = graph.getNodes();
      nodes.forEach((node: any) => node.removeTools());

      // 2. Chạy logic giả lập
      simInterval = setInterval(() => {
        const nodes = graph.getNodes();
        nodes.forEach((node: any) => {
          const shape = node.shape;
          const data = node.getData() ?? {};

          // 11.1: Handler cho esp-filter-tank: voltage ±2 kV, current ±50 mA mỗi tick
          if (shape === "esp-filter-tank") {
            node.setData({
              voltage: +(data.voltage + (Math.random() - 0.5) * 4).toFixed(1),
              current: Math.round(data.current + (Math.random() - 0.5) * 100),
            });
            return;
          }

          // 11.2: Handler cho motor-blower: current ±5 A, statorTemp ±3°C, bearingTemp ±2°C
          if (shape === "motor-blower") {
            node.setData({
              current: +(data.current + (Math.random() - 0.5) * 10).toFixed(1),
              statorTemp: +(
                data.statorTemp +
                (Math.random() - 0.5) * 6
              ).toFixed(1),
              bearingTemp: +(
                data.bearingTemp +
                (Math.random() - 0.5) * 4
              ).toFixed(1),
            });
            return;
          }

          // 11.3: Handler cho control-valve: openPercent thay đổi ±5%, clamp [0, 100]
          if (shape === "control-valve") {
            node.setData({
              openPercent: Math.round(
                Math.max(
                  0,
                  Math.min(100, data.openPercent + (Math.random() - 0.5) * 10),
                ),
              ),
            });
            return;
          }

          // 11.4: Handler cho data-tag: value thay đổi ±2.5 mỗi tick
          if (shape === "data-tag") {
            node.setData({
              value: +(+data.value + (Math.random() - 0.5) * 5).toFixed(2),
            });
            return;
          }

          // IT node simulation (existing logic)
          if (!data.deviceType) return;

          let newStatus = data.status;
          let newMetrics = [...(data.metrics || [])];

          if (data.deviceType === "case") {
            const temp = 40 + Math.floor(Math.random() * 40);
            newStatus = temp > 75 ? "warning" : "online";
            const cpuIdx = newMetrics.findIndex(
              (m: any) => m.label === "CPU Temp",
            );
            if (cpuIdx > -1) newMetrics[cpuIdx].value = temp;

            const ram = 50 + Math.floor(Math.random() * 40);
            const ramIdx = newMetrics.findIndex(
              (m: any) => m.label === "RAM Usage",
            );
            if (ramIdx > -1) newMetrics[ramIdx].value = ram;
          }

          if (data.deviceType === "network") {
            const ping = 5 + Math.floor(Math.random() * 145);
            newStatus = ping > 100 ? "warning" : "online";
            const pingIdx = newMetrics.findIndex(
              (m: any) => m.label === "Ping",
            );
            if (pingIdx > -1) newMetrics[pingIdx].value = ping;
          }

          if (data.deviceType === "power") {
            const load = 100 + Math.floor(Math.random() * 750);
            newStatus = load > 800 ? "warning" : "online";
            const loadIdx = newMetrics.findIndex(
              (m: any) => m.label === "Load",
            );
            if (loadIdx > -1) newMetrics[loadIdx].value = load;
          }

          if (data.deviceType === "filter-tank") {
            const volt = 10 + Math.random() * 10;
            newStatus = volt > 18 ? "lỗi" : "chạy";
            node.setData({ status: newStatus, voltage: volt.toFixed(1) });
            return;
          }

          node.setData({ status: newStatus, metrics: newMetrics });
        });
      }, 1500);
    } else {
      // Dừng Monitor
      clearInterval(simInterval);
      const edges = graph.getEdges();
      edges.forEach((edge: any) => {
        const edgeData = edge.getData() ?? {};

        if (INDUSTRIAL_EDGE_TYPES.includes(edgeData.edgeType)) {
          // 11.5: Xóa class flow-active khỏi industrial edges
          edge.removeClass("flow-active");
        } else {
          // Khôi phục IT edges về trạng thái ban đầu
          edge.attr("line/strokeDasharray", 0);
          edge.attr("line/style/animation", "");
          edge.attr("line/stroke", "#1890ff");
        }
      });
    }
  };

  return {
    isMonitoring,
    toggleMonitoring,
  };
};
