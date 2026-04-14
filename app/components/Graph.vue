<template>
  <div class="flex h-screen font-sans">
    <div class="w-[250px] border-r border-gray-300 p-4 bg-white">
      <h3>Menu Kéo Thả</h3>
      <div
        class="p-2.5 mb-2.5 bg-white border border-dashed border-gray-300 cursor-grab active:cursor-grabbing text-center rounded"
        @mousedown="startDrag($event, 'Node Loại A')"
      >
        Kéo Vue Node A
      </div>
      <div
        class="p-2.5 mb-2.5 bg-white border border-dashed border-gray-300 cursor-grab active:cursor-grabbing text-center rounded"
        @mousedown="startDrag($event, 'Node Loại B')"
      >
        Kéo Vue Node B
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

onMounted(() => {
  // 2. Khởi tạo Graph
  // App.vue (phần khởi tạo Graph)
graph = new Graph({
  container: graphContainerRef.value,
  width: 800,
  height: 600,
  grid: true,
  background: { color: '#fafafa' },
  
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
const startDrag = (e, labelName) => {
  if (!graph || !dnd) return;

  // Tạo một Node instance tạm thời dựa trên shape đã đăng ký
  const node = graph.createNode({
    shape: 'my-vue-shape',
    width: 150,  // BẮT BUỘC: Khai báo rõ chiều rộng
    height: 50,  // BẮT BUỘC: Khai báo rõ chiều cao
    data: {
      label: labelName, // Truyền dữ liệu vào Vue component
    },
  });

  // Bắt đầu quá trình kéo thả
  dnd.start(node, e);
};
</script>