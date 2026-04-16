<template>
  <div class="relative w-full h-full flex flex-col items-center justify-start" :class="containerClass">
    <!-- SVG Bồn Lọc (Cylinder Shape) — viewBox 100×140 -->
    <div class="absolute inset-0 z-0 pointer-events-none overflow-visible">
      <svg viewBox="0 0 100 140" preserveAspectRatio="none" class="w-full h-full" :class="svgClass" role="img"
        :aria-label="`Bồn lọc ESP ${internalLabel}, trạng thái: ${statusLabel}`">
        <!-- Thân trụ -->
        <path d="M 5 25 L 5 115 A 45 15 0 0 0 95 115 L 95 25 Z" :fill="cylinderFill" :stroke="cylinderStroke"
          stroke-width="2" />
        <!-- Nắp trên (ellipse) -->
        <ellipse cx="50" cy="25" rx="45" ry="15" :fill="cylinderTopFill" :stroke="cylinderStroke" stroke-width="2" />
        <!-- Đáy mờ (ellipse opacity 0.6) -->
        <ellipse cx="50" cy="115" rx="45" ry="15" :fill="cylinderFill" :stroke="cylinderStroke" stroke-width="1.5"
          opacity="0.6" />
        <!-- Highlight reflection -->
        <path d="M 12 33 L 12 108 A 35 10 0 0 0 30 115 L 30 38 Z" fill="rgba(255,255,255,0.15)" />
      </svg>
    </div>

    <!-- Nội dung đè lên SVG -->
    <div
      class="relative z-10 flex flex-col items-center w-full h-full px-1 pt-1 pb-1 text-white text-xs drop-shadow-md">
      <!-- Label tên bồn -->
      <span class="font-bold text-[10px] uppercase tracking-wide text-shadow mt-0.5 leading-none">{{ internalLabel
      }}</span>

      <!-- Bảng thông số -->
      <div class="flex flex-col items-start bg-black/40 p-1 rounded w-[88%] mt-1 gap-0.5">
        <div class="flex justify-between w-full">
          <span class="text-gray-300 text-[9px]">U:</span>
          <span class="font-mono font-bold text-[10px] text-green-300">{{ internalVoltage.toFixed(1) }} kV</span>
        </div>
        <div class="flex justify-between w-full">
          <span class="text-gray-300 text-[9px]">I:</span>
          <span class="font-mono font-bold text-[10px] text-yellow-300">{{ internalCurrent }} mA</span>
        </div>
      </div>

      <!-- Status dot nhỏ góc dưới -->
      <div class="absolute bottom-1 right-1 w-2 h-2 rounded-full border border-white/40" :class="statusDotClass"></div>
    </div>

    <!-- Điểm nối (Ports cho X6) -->
    <div class="node-port port-left" data-magnet="true"></div>
    <div class="node-port port-right" data-magnet="true"></div>
    <div class="node-port port-top" data-magnet="true"></div>
    <div class="node-port port-bottom" data-magnet="true"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, onMounted, onBeforeUnmount, watch } from 'vue';

// 1.1 Props — thêm label, cập nhật defaults voltage=80.2, current=600
const props = defineProps({
  status: { type: String, default: 'dừng' }, // 'chạy' | 'dừng' | 'lỗi'
  voltage: { type: Number, default: 80.2 },
  current: { type: Number, default: 600 },
  label: { type: String, default: 'Filtr' },
});

// Trạng thái nội bộ — có thể bị ghi đè bởi X6 node data
const internalStatus = ref(props.status);
const internalVoltage = ref(props.voltage);
const internalCurrent = ref(props.current);
const internalLabel = ref(props.label);

// Đồng bộ props khi Storybook / parent thay đổi
watch(() => props.status, (v) => (internalStatus.value = v));
watch(() => props.voltage, (v) => (internalVoltage.value = v));
watch(() => props.current, (v) => (internalCurrent.value = v));
watch(() => props.label, (v) => (internalLabel.value = v));

// Pattern inject getNode từ X6 (giống DeviceNode.vue)
const getNode = inject<() => any>('getNode', () => null);
let node: any = null;

const syncDataFromNode = () => {
  const data = node?.getData();
  if (data) {
    if (data.status !== undefined) internalStatus.value = data.status;
    if (data.voltage !== undefined) internalVoltage.value = data.voltage;
    if (data.current !== undefined) internalCurrent.value = data.current;
    if (data.label !== undefined) internalLabel.value = data.label;
  }
};

onMounted(() => {
  if (getNode) {
    node = getNode();
    if (node) {
      syncDataFromNode();
      node.on('change:data', syncDataFromNode);
    }
  }
});

onBeforeUnmount(() => {
  if (node) {
    node.off('change:data', syncDataFromNode);
  }
});

// Computed helpers
const isError = computed(() => internalStatus.value === 'lỗi');
const isRunning = computed(() => internalStatus.value === 'chạy');

// Container: animate-pulse khi lỗi
const containerClass = computed(() => [
  'transition-all duration-300',
  isError.value ? 'animate-pulse' : '',
]);

// SVG: drop-shadow glow đỏ khi lỗi (1.4 + design spec)
const svgClass = computed(() => [
  'transition-all duration-300',
  isError.value
    ? 'drop-shadow-[0_0_12px_rgba(239,68,68,1)]'
    : 'drop-shadow-lg hover:drop-shadow-xl',
]);

// 1.4 cylinderFill với fallback cho status không hợp lệ — không crash
const cylinderFill = computed(
  () =>
    ({
      lỗi: '#ef4444',
      chạy: '#0ea5e9',
      dừng: '#94a3b8',
    } as Record<string, string>)[internalStatus.value] ?? '#94a3b8',
);

// Màu nắp trên sáng hơn thân
const cylinderTopFill = computed(() => {
  if (isError.value) return '#f87171';
  if (isRunning.value) return '#38bdf8';
  return '#cbd5e1';
});

// Màu viền
const cylinderStroke = computed(() => {
  if (isError.value) return '#7f1d1d';
  if (isRunning.value) return '#0284c7';
  return '#475569';
});

// Label trạng thái
const statusLabel = computed(() => {
  if (isError.value) return 'Sự cố!';
  if (isRunning.value) return 'Hoạt động';
  return 'Ngừng';
});

// Badge trạng thái
const statusBadgeClass = computed(() => {
  if (isError.value) return 'bg-red-600 text-white border-red-300 animate-bounce';
  if (isRunning.value) return 'bg-green-500 text-white border-green-300 shadow-[0_0_8px_rgba(34,197,94,0.6)]';
  return 'bg-gray-500 text-white border-gray-400';
});

const statusDotClass = computed(() => {
  if (isError.value) return 'bg-red-500 animate-ping';
  if (isRunning.value) return 'bg-green-400';
  return 'bg-slate-400';
});
</script>

<style scoped>
@reference "tailwindcss";

.text-shadow {
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.9);
}

/* Các điểm neo (ports) của AntV X6 */
.node-port {
  @apply absolute w-2.5 h-2.5 bg-white rounded-full cursor-crosshair opacity-0 transition-opacity duration-200 z-20;
  border: 2px solid #0ea5e9;
}

div:hover>.node-port {
  @apply opacity-100;
}

.node-port:hover {
  transform: scale(1.8);
  @apply bg-blue-100 border-blue-600;
}

/* Định vị 4 cổng ở 4 mặt trung tâm */
.port-left {
  left: -8px;
  top: 50%;
  transform: translateY(-50%);
}

.port-right {
  right: -8px;
  top: 50%;
  transform: translateY(-50%);
}

.port-top {
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
}

.port-bottom {
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
}
</style>
