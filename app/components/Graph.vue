<template>
  <div class="flex h-screen font-sans">
    <div class="w-[250px] border-r border-gray-300 p-4 bg-white">
      <h3>Menu Kéo Thả</h3>
      <div
        class="p-2.5 mb-2.5 bg-white border border-dashed border-gray-300 cursor-grab active:cursor-grabbing text-center rounded"
        @mousedown="startDrag($event, 'custom', 'Node Loại A')"
      >
        Kéo Vue Node A
      </div>
      <div
        class="p-2.5 mb-2.5 bg-white border border-dashed border-gray-300 cursor-grab active:cursor-grabbing text-center rounded"
        @mousedown="startDrag($event, 'custom', 'Node Loại B')"
      >
        Kéo Vue Node B
      </div>
      <!-- Kéo thả bồn lọc -->
      <div
        class="p-2.5 mb-2.5 bg-blue-50 border border-dashed border-blue-400 text-blue-700 font-bold cursor-grab active:cursor-grabbing text-center rounded hover:bg-blue-100"
        @mousedown="startDrag($event, 'filter-tank', 'Bồn Lọc')"
      >
        Kéo Bồn Lọc
      </div>

      <h3 class="mt-6 mb-3 font-bold border-t pt-4">Thiết bị IT</h3>
      <div
        class="p-2 mb-2 bg-gray-50 border border-gray-300 cursor-grab active:cursor-grabbing text-center rounded hover:bg-gray-200"
        @mousedown="startDrag($event, 'case', 'Server Case')"
      >Máy Chủ (Case)</div>
      <div
        class="p-2 mb-2 bg-gray-50 border border-gray-300 cursor-grab active:cursor-grabbing text-center rounded hover:bg-gray-200"
        @mousedown="startDrag($event, 'monitor', 'Màn Hình LG')"
      >Màn Hình</div>
      <div
        class="p-2 mb-2 bg-gray-50 border border-gray-300 cursor-grab active:cursor-grabbing text-center rounded hover:bg-gray-200"
        @mousedown="startDrag($event, 'mouse', 'Chuột Bluetooth')"
      >Chuột</div>
      <div
        class="p-2 mb-2 bg-gray-50 border border-gray-300 cursor-grab active:cursor-grabbing text-center rounded hover:bg-gray-200"
        @mousedown="startDrag($event, 'power', 'Nguồn PSU 850W')"
      >Nguồn điện</div>
      <div
        class="p-2 mb-2 bg-gray-50 border border-gray-300 cursor-grab active:cursor-grabbing text-center rounded hover:bg-gray-200"
        @mousedown="startDrag($event, 'network', 'Switch Cisco')"
      >Hệ thống Mạng</div>
    </div>

    <div class="flex-1 h-full relative overflow-hidden">
      <div class="absolute inset-0" ref="graphContainerRef"></div>
      <TeleportContainer />

      <!-- Nút Khởi động Giám sát -->
      <button 
        @click="toggleMonitoring"
        class="absolute top-4 right-4 z-50 px-5 py-2 rounded-lg font-bold shadow-lg transition-all"
        :class="isMonitoring ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-green-500 text-white hover:bg-green-600'"
      >
        {{ isMonitoring ? '⏹ Dừng Giám Sát' : '▶ Bắt Đầu Giám Sát' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Graph } from '@antv/x6';
import { register, getTeleport } from '@antv/x6-vue-shape';
import { Dnd } from '@antv/x6-plugin-dnd';
import CustomNode from './CustomNode.vue';
import FilterTankNode from './FilterTankNode.vue';
import DeviceNode from './DeviceNode.vue';

const TeleportContainer = getTeleport();

const graphContainerRef = ref(null);
let graph = null;
let dnd = null;

// Biến quản lý trạng thái Simulation
const isMonitoring = ref(false);
let simInterval = null;

const toggleMonitoring = () => {
  if (!graph) return;
  isMonitoring.value = !isMonitoring.value;

  if (isMonitoring.value) {
    // 1. Kích hoạt đường điện từ
    const edges = graph.getEdges();
    edges.forEach((edge) => {
      edge.attr('line/strokeDasharray', 5);
      edge.attr('line/style/animation', 'ant-line 30s infinite linear');
      edge.attr('line/stroke', '#10b981'); // Chuyển luồng màu cam xịn
    });

    // 2. Bắn data random vào Node
    simInterval = setInterval(() => {
      const nodes = graph.getNodes();
      nodes.forEach((node) => {
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
    // Tắt Giám sát
    clearInterval(simInterval);
    const edges = graph.getEdges();
    edges.forEach((edge) => {
      edge.attr('line/strokeDasharray', 0);
      edge.attr('line/style/animation', '');
      edge.attr('line/stroke', '#1890ff'); 
    });
  }
};

register({
  shape: 'my-vue-shape',
  width: 150,
  height: 50,
  component: CustomNode,
});

register({
  shape: 'filter-tank-node',
  width: 100,
  height: 120,
  component: FilterTankNode,
});

// Đăng ký Siêu Node Thiết Bị Máy Tính
register({
  shape: 'computer-device-node',
  width: 180,
  height: 80,
  component: DeviceNode,
  ports: {
    groups: {
      top: { position: 'top', attrs: { circle: { r: 5, magnet: true, stroke: '#31d0c6', strokeWidth: 2, fill: '#fff' } } },
      bottom: { position: 'bottom', attrs: { circle: { r: 5, magnet: true, stroke: '#31d0c6', strokeWidth: 2, fill: '#fff' } } },
      left: { position: 'left', attrs: { circle: { r: 5, magnet: true, stroke: '#31d0c6', strokeWidth: 2, fill: '#fff' } } },
      right: { position: 'right', attrs: { circle: { r: 5, magnet: true, stroke: '#31d0c6', strokeWidth: 2, fill: '#fff' } } },
    },
  },
});

onMounted(() => {
  // 2. Khởi tạo Graph
  graph = new Graph({
    container: graphContainerRef.value,
    autoResize: true,
    grid: {
      size: 10,
      visible: true,
      type: 'dot',
      args: { color: '#a0aabb', thickness: 1 },
    },
    background: { color: '#fafafa' },
    panning: {
      enabled: true,
      eventTypes: ['leftMouseDown', 'mouseWheel'],
    },
    mousewheel: {
      enabled: true,
      modifiers: 'ctrl',
      maxScale: 4,
      minScale: 0.2,
    },
    
    // THÊM CẤU HÌNH CONNECTING TẠI ĐÂY
    connecting: {
      snap: true,          // Tự động hút mũi tên vào điểm neo gần nhất khi thả chuột
      allowBlank: false,   // Không cho phép thả mũi tên ra khoảng trắng (phải nối vào node)
      allowLoop: false,    // Không cho phép nối mũi tên từ node A về lại chính node A
      highlight: true,     // Bật hiệu ứng sáng lên ở node đích khi kéo mũi tên tới
      
      // Bộ luật Xác thực Kết nối chuẩn mực IT
      validateConnection({ sourceView, targetView }) {
        if (!sourceView || !targetView) return false;
        
        const sourceNode = sourceView.cell;
        const targetNode = targetView.cell;
        
        if (sourceNode.id === targetNode.id) return false;

        const getDeviceType = (node) => {
          const type = node.getData()?.deviceType;
          if (type) return type;
          return node.shape === 'filter-tank-node' ? 'filter-tank' : 'unknown';
        };

        const sourceType = getDeviceType(sourceNode);
        const targetType = getDeviceType(targetNode);

        // 1. Phím/Chuột chỉ xuất tín hiệu (kết nối) vào Máy tính (Case)
        if (sourceType === 'mouse' || sourceType === 'keyboard') {
          return targetType === 'case';
        }
        
        // 2. Nguồn điện (PSU) cấp nguồn cho Case, Màn hình, Mạng, Bồn lọc
        if (sourceType === 'power') {
          return ['case', 'monitor', 'network', 'filter-tank'].includes(targetType); 
        }

        // 3. Máy tính (Case) xuất tín hiệu tới Màn hình và Mạng
        if (sourceType === 'case') {
          return ['monitor', 'network'].includes(targetType);
        }

        // 4. Mạng/Router nối vào Máy tính hoặc Router khác
        if (sourceType === 'network') {
          return ['case', 'network'].includes(targetType);
        }

        // 5. Màn hình mặc định không xuất đầu ra đi thiết bị khác
        if (sourceType === 'monitor') {
          return false;
        }

        return true; 
      },
      
      // Khai báo hình dáng mặc định của mũi tên khi kéo
      createEdge() {
        return graph.createEdge({
          shape: 'edge',
          attrs: {
            line: {
              stroke: '#1890ff', // Màu của đường nối
              strokeWidth: 2,    // Độ dày
              targetMarker: {    // Hình dáng đầu mũi tên
                name: 'block',
                width: 12,
                height: 8,
              },
            },
          },
          zIndex: 0, // Đẩy mũi tên nằm dưới các Node
        });
      },
    },
  });

  // Render một node mặc định ban đầu làm hướng dẫn (Từ GraphCanvas cũ)
  graph.addNode({
    x: 100,
    y: 100,
    shape: 'rect',
    width: 160,
    height: 60,
    label: 'Kéo hình vào đây ➔',
    attrs: {
      body: { stroke: '#8b5cf6', fill: '#ede9fe', rx: 6, ry: 6 },
      label: { fill: '#4c1d95', fontWeight: 'bold' }
    }
  });

  // 3. Khởi tạo plugin Dnd (Drag and Drop)
  dnd = new Dnd({
    target: graph,
    scaled: false,
    animation: true,
    // Tùy chọn nâng cao: Xác định chính xác node sẽ được thả vào graph
    getDropNode: (node) => {
      return node.clone(); 
    }
  });

  // 4. Thêm công cụ Xóa Kết Nối và Node (Chỉ bật khi đang ở chế độ Edit)
  graph.on('edge:mouseenter', ({ edge }) => {
    if (!isMonitoring.value) {
      edge.addTools([{ name: 'button-remove', args: { distance: '50%' } }]);
    }
  });
  graph.on('edge:mouseleave', ({ edge }) => {
    edge.removeTools();
  });

  graph.on('node:mouseenter', ({ node }) => {
    // Không cho phép xóa Node chữ nhật hướng dẫn ban đầu (shape: rect)
    if (!isMonitoring.value && node.shape !== 'rect') {
      node.addTools([{
        name: 'button-remove',
        args: { x: '100%', y: 0, offset: { x: -10, y: 10 } },
      }]);
    }
  });
  graph.on('node:mouseleave', ({ node }) => {
    node.removeTools();
  });
});

// 4. Hàm xử lý khi bắt đầu nhấn chuột vào item ở Sidebar
const startDrag = (e, type, labelName) => {
  if (!graph || !dnd) return;

  let nodeConfig = {};

  if (type === 'filter-tank') {
    nodeConfig = {
      shape: 'filter-tank-node',
      width: 100,
      height: 120,
      data: {
        status: 'chạy',
        voltage: 12.5,
        current: 450,
      },
    };
  } else if (['case', 'monitor', 'mouse', 'keyboard', 'power', 'network'].includes(type)) {
    // Generate metrics automatically based on type
    let defaultMetrics = [];
    if (type === 'case') defaultMetrics = [{label: 'CPU Temp', value: 45, unit: '°C'}, {label: 'RAM Usage', value: 64, unit: '%'}];
    if (type === 'monitor') defaultMetrics = [{label: 'Refresh', value: 144, unit: 'Hz'}];
    if (type === 'mouse' || type === 'keyboard') defaultMetrics = [{label: 'Battery', value: 85, unit: '%'}];
    if (type === 'power') defaultMetrics = [{label: 'Load', value: 350, unit: 'W'}];
    if (type === 'network') defaultMetrics = [{label: 'Ping', value: 12, unit: 'ms'}];
    
    nodeConfig = {
      shape: 'computer-device-node',
      width: 180,
      height: 80,
      // Khi kéo vào Graph, nó sẽ tạo ra sẵn 4 cổng (top, bottom, left, right)
      ports: {
        items: [
          { id: 'port_top', group: 'top' },
          { id: 'port_bottom', group: 'bottom' },
          { id: 'port_left', group: 'left' },
          { id: 'port_right', group: 'right' }
        ]
      },
      data: {
        deviceType: type,
        deviceName: labelName,
        status: 'online',
        metrics: defaultMetrics
      },
    };
  } else {
    nodeConfig = {
      shape: 'my-vue-shape',
      width: 150,
      height: 50,
      data: {
        label: labelName,
      },
    };
  }

  // Tạo một Node instance tạm thời dựa trên shape đã cấu hình
  const node = graph.createNode(nodeConfig);

  // Bắt đầu quá trình kéo thả
  dnd.start(node, e);
};
</script>

<style>
/* CSS Keyframes toàn cục để điều khiển animation cho đồ thị X6 */
@keyframes ant-line {
  to {
    stroke-dashoffset: -1000;
  }
}
</style>
