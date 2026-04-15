import { ref } from 'vue';

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
        edge.attr('line/strokeDasharray', 5);
        edge.attr('line/style/animation', 'ant-line 30s infinite linear');
        edge.attr('line/stroke', '#10b981'); 
      });

      // Tắt nút xóa Node
      const nodes = graph.getNodes();
      nodes.forEach((node: any) => node.removeTools());

      // 2. Chạy logic giả lập
      simInterval = setInterval(() => {
        const nodes = graph.getNodes();
        nodes.forEach((node: any) => {
          const data = node.getData() || {};
          if (!data.deviceType) return;
          
          let newStatus = data.status;
          let newMetrics = [...(data.metrics || [])];

          if (data.deviceType === 'case') {
            const temp = 40 + Math.floor(Math.random() * 40);
            newStatus = temp > 75 ? 'warning' : 'online';
            const cpuIdx = newMetrics.findIndex(m => m.label === 'CPU Temp');
            if (cpuIdx > -1) newMetrics[cpuIdx].value = temp;
            
            const ram = 50 + Math.floor(Math.random() * 40);
            const ramIdx = newMetrics.findIndex(m => m.label === 'RAM Usage');
            if (ramIdx > -1) newMetrics[ramIdx].value = ram;
          }

          if (data.deviceType === 'network') {
            const ping = 5 + Math.floor(Math.random() * 145);
            newStatus = ping > 100 ? 'warning' : 'online';
            const pingIdx = newMetrics.findIndex(m => m.label === 'Ping');
            if (pingIdx > -1) newMetrics[pingIdx].value = ping;
          }

          if (data.deviceType === 'power') {
            const load = 100 + Math.floor(Math.random() * 750);
            newStatus = load > 800 ? 'warning' : 'online';
            const loadIdx = newMetrics.findIndex(m => m.label === 'Load');
            if (loadIdx > -1) newMetrics[loadIdx].value = load;
          }

          if (data.deviceType === 'filter-tank') {
            const volt = 10 + Math.random() * 10;
            newStatus = volt > 18 ? 'lỗi' : 'chạy';
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
        edge.attr('line/strokeDasharray', 0);
        edge.attr('line/style/animation', '');
        edge.attr('line/stroke', '#1890ff'); 
      });
    }
  };

  return {
    isMonitoring,
    toggleMonitoring
  };
};
