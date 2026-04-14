<template>
  <div 
    class="relative w-full h-full flex flex-col items-center justify-center p-2"
    :class="containerClass"
  >
    <!-- SVG Bồn Lọc (Cylinder Shape) -->
    <div class="absolute inset-0 z-0 pointer-events-none overflow-visible">
      <svg viewBox="0 0 100 120" preserveAspectRatio="none" class="w-full h-full" :class="svgClass">
        <!-- Thân bồn lọc -->
        <path d="M 5 20 L 5 100 A 45 15 0 0 0 95 100 L 95 20 Z" :fill="cylinderFill" :stroke="cylinderStroke" stroke-width="2"/>
        <!-- Nắp bồn lọc (Mặt trên) -->
        <ellipse cx="50" cy="20" rx="45" ry="15" :fill="cylinderTopFill" :stroke="cylinderStroke" stroke-width="2"/>
        <!-- Hiệu ứng bóng/reflection trên thân -->
        <path d="M 12 28 L 12 95 A 35 10 0 0 0 30 102 L 30 25 Z" fill="rgba(255,255,255,0.15)"/>
      </svg>
    </div>

    <!-- Hiển thị thông số đè lên trên -->
    <div class="relative z-10 flex flex-col items-center justify-center text-white text-xs drop-shadow-md w-full h-full">
      <span class="font-bold text-sm mb-1 uppercase tracking-wider text-shadow">Bồn Lọc</span>
      
      <!-- Bảng thông số -->
      <div class="flex flex-col items-start bg-slate-900/60 backdrop-blur-sm p-1.5 rounded border border-white/20 w-[90%]">
        <div class="flex justify-between w-full gap-2">
          <span class="text-gray-300">U:</span>
          <span class="font-mono font-bold text-green-300">{{ internalVoltage }} kV</span>
        </div>
        <div class="flex justify-between w-full gap-2 mt-0.5">
          <span class="text-gray-300">I:</span>
          <span class="font-mono font-bold text-yellow-300">{{ internalCurrent }} mA</span>
        </div>
      </div>
      
      <!-- Cảnh báo trạng thái -->
      <div 
        class="absolute -bottom-3 px-3 py-1 rounded-full shadow-lg whitespace-nowrap text-[10px] uppercase font-bold border" 
        :class="statusBadgeClass"
      >
        {{ statusLabel }}
      </div>
    </div>

    <!-- Điểm nối (Ports cho X6) -->
    <div class="node-port port-left" data-magnet="true"></div>
    <div class="node-port port-right" data-magnet="true"></div>
    <div class="node-port port-top" data-magnet="true"></div>
    <div class="node-port port-bottom" data-magnet="true"></div>
  </div>
</template>

<script setup>
import { computed, inject, ref, onMounted, onBeforeUnmount, watch } from 'vue';

// 1. Nhận Props (Cách nhận độc lập nếu không dùng X6 Data)
const props = defineProps({
  status: { type: String, default: 'dừng' }, // 'chạy', 'dừng', 'lỗi'
  voltage: { type: Number, default: 0 },
  current: { type: Number, default: 0 }
});

// Trạng thái nội bộ để có thể ghi đè nếu X6 Graph truyền data vào
const internalStatus = ref(props.status);
const internalVoltage = ref(props.voltage);
const internalCurrent = ref(props.current);

// Đồng bộ props nếu có cập nhật từ bên ngoài (thông qua Vue bình thường)
watch(() => props.status, (v) => internalStatus.value = v);
watch(() => props.voltage, (v) => internalVoltage.value = v);
watch(() => props.current, (v) => internalCurrent.value = v);

// 2. Logic tương thích Node X6 
const getNode = inject('getNode', null);
let node = null;

const syncDataFromNode = () => {
  const data = node?.getData();
  if (data) {
    if (data.status !== undefined) internalStatus.value = data.status;
    if (data.voltage !== undefined) internalVoltage.value = data.voltage;
    if (data.current !== undefined) internalCurrent.value = data.current;
  }
};

onMounted(() => {
  // Nếu component được mount trong X6 Vue Shape, lấy node data
  if (getNode) {
    node = getNode();
    if (node) {
      syncDataFromNode();
      // Nghe sự kiện data thay đổi từ logic của class Node
      node.on('change:data', syncDataFromNode);
    }
  }
});

onBeforeUnmount(() => {
  // Hủy lắng nghe
  if (node) {
    node.off('change:data', syncDataFromNode);
  }
});

// 3. Xử lý tính toán màu sắc và hiệu ứng dựa trên trạng thái
const isError = computed(() => internalStatus.value === 'lỗi');
const isRunning = computed(() => internalStatus.value === 'chạy');

const containerClass = computed(() => [
  'transition-all duration-300',
  // Khi lỗi -> khung rung/bóp (pulses)
  isError.value ? 'animate-pulse scale-105' : ''
]);

const svgClass = computed(() => [
  'transition-all duration-300',
  // Viền đỏ rực (Glow) khi bị lỗi
  isError.value ? 'drop-shadow-[0_0_12px_rgba(239,68,68,1)]' : 'drop-shadow-lg hover:drop-shadow-xl'
]);

// Màu thân trụ
const cylinderFill = computed(() => {
  if (isError.value) return '#ef4444'; // Đỏ (Lỗi)
  if (isRunning.value) return '#0ea5e9'; // Xanh dương (Chạy)
  return '#94a3b8'; // Xám (Dừng)
});

// Màu nắp trên của bồn
const cylinderTopFill = computed(() => {
  if (isError.value) return '#f87171';
  if (isRunning.value) return '#38bdf8';
  return '#cbd5e1';
});

// Màu viền của bồn
const cylinderStroke = computed(() => {
  if (isError.value) return '#7f1d1d'; // Viền đỏ đậm
  if (isRunning.value) return '#0284c7'; // Viền xanh đậm
  return '#475569'; // Viền xám đậm
});

// Label trạng thái
const statusLabel = computed(() => {
  if (isError.value) return 'Sự cố!';
  if (isRunning.value) return 'Hoạt động';
  return 'Ngừng';
});

// Bảng màu Badge con tem trạng thái
const statusBadgeClass = computed(() => {
  if (isError.value) return 'bg-red-600 text-white border-red-300 animate-bounce';
  if (isRunning.value) return 'bg-green-500 text-white border-green-300 shadow-[0_0_8px_rgba(34,197,94,0.6)]';
  return 'bg-gray-500 text-white border-gray-400';
});
</script>

<style scoped>
@reference "tailwindcss";

.text-shadow {
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.9);
}

/* Các điểm neo (ports) của AntV X6 được ẩn đi mặc định */
.node-port {
  @apply absolute w-2.5 h-2.5 bg-white rounded-full cursor-crosshair opacity-0 transition-opacity duration-200 z-20;
  border: 2px solid #0ea5e9;
}

/* Chỉ hiện port khi rê chuột lên node */
div:hover > .node-port {
  @apply opacity-100;
}

.node-port:hover {
  transform: scale(1.8);
  @apply bg-blue-100 border-blue-600;
}

/* Định vị 4 cổng ở 4 mặt trung tâm */
.port-left { left: -8px; top: 50%; transform: translateY(-50%); }
.port-right { right: -8px; top: 50%; transform: translateY(-50%); }
.port-top { top: -8px; left: 50%; transform: translateX(-50%); }
.port-bottom { bottom: -8px; left: 50%; transform: translateX(-50%); }
</style>
