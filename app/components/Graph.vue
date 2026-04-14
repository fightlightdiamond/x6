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
        class="p-2.5 mb-2.5 bg-blue-50 border border-dashed border-blue-400 text-blue-700 font-bold cursor-grab active:cursor-grabbing text-center rounded"
        @mousedown="startDrag($event, 'filter-tank', 'Bồn Lọc')"
      >
        Kéo Bồn Lọc
      </div>
    </div>

    <div class="flex-1 h-full relative overflow-hidden" ref="graphContainerRef"></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Graph } from '@antv/x6';
import { register } from '@antv/x6-vue-shape';
import { Dnd } from '@antv/x6-plugin-dnd';
import CustomNode from './CustomNode.vue';
import FilterTankNode from './FilterTankNode.vue';

const graphContainerRef = ref(null);
let graph = null;
let dnd = null;

// 1. Đăng ký Vue Component như một Shape trong X6
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
        status: 'chạy', // Trạng thái mặc định
        voltage: 12.5,
        current: 450,
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
