<template>
  <div class="relative w-full h-full flex flex-col items-center justify-center">
    <!-- SVG Van ISA (viewBox 60×60) — thu nhỏ -->
    <svg viewBox="0 0 60 60" class="w-full" style="max-width: 60px; max-height: 60px;" role="img"
      :aria-label="`Van ${internalLabel}, ${internalOpenPercent}%, ${internalMode}`">
      <!-- Tam giác trái -->
      <polygon points="4,6 30,30 4,54" :fill="valveFill" stroke="#1e293b" stroke-width="1.5" stroke-linejoin="round" />
      <!-- Tam giác phải -->
      <polygon points="56,6 30,30 56,54" :fill="valveFill" stroke="#1e293b" stroke-width="1.5"
        stroke-linejoin="round" />
      <!-- Vòng tròn giữa -->
      <circle cx="30" cy="30" r="9" :fill="valveFill" stroke="#1e293b" stroke-width="1.5" />
      <!-- Cần van (stem) -->
      <line x1="30" y1="6" x2="30" y2="21" :transform="`rotate(${valveAngle}, 30, 30)`" stroke="#0f172a"
        stroke-width="2.5" stroke-linecap="round" />
    </svg>

    <!-- Badge AUTO/MANUAL + % — một dòng gọn -->
    <div class="flex items-center gap-0.5 mt-0.5">
      <span class="text-[8px] font-bold px-1 py-0.5 rounded leading-none" :class="modeBadgeClass">
        {{ internalMode }}
      </span>
      <span class="text-[9px] font-mono font-bold text-white leading-none">{{ internalOpenPercent }}%</span>
    </div>

    <!-- Ports -->
    <div class="node-port port-left" data-magnet="true"></div>
    <div class="node-port port-right" data-magnet="true"></div>
    <div class="node-port port-top" data-magnet="true"></div>
    <div class="node-port port-bottom" data-magnet="true"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, onMounted, onBeforeUnmount, watch } from 'vue';

// 3.1 Props
const props = defineProps({
  mode: { type: String, default: 'AUTO' },        // 'AUTO' | 'MANUAL'
  openPercent: { type: Number, default: 0 },       // 0–100
  label: { type: String, default: 'Van' },
});

// Trạng thái nội bộ — có thể bị ghi đè bởi X6 node data
const internalMode = ref(props.mode as 'AUTO' | 'MANUAL');
const internalOpenPercent = ref(props.openPercent);
const internalLabel = ref(props.label);

// Đồng bộ props khi Storybook / parent thay đổi
watch(() => props.mode, (v) => (internalMode.value = v as 'AUTO' | 'MANUAL'));
watch(() => props.openPercent, (v) => (internalOpenPercent.value = v));
watch(() => props.label, (v) => (internalLabel.value = v));

// 3.6 Pattern inject getNode từ X6 (giống DeviceNode.vue)
const getNode = inject<() => any>('getNode', () => null);
let node: any = null;

const syncDataFromNode = () => {
  const data = node?.getData();
  if (data) {
    if (data.mode !== undefined) internalMode.value = data.mode;
    if (data.openPercent !== undefined) internalOpenPercent.value = data.openPercent;
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

// 3.3 Tính góc xoay: openPercent 0% → 0°, 100% → 90°
const valveAngle = computed(
  () => Math.max(0, Math.min(100, internalOpenPercent.value)) * 0.9,
);

// 3.4 Màu fill theo openPercent
const valveFill = computed(() => {
  const pct = internalOpenPercent.value;
  if (pct === 0) return '#94a3b8';       // xám — đóng hoàn toàn
  if (pct === 100) return '#0284c7';     // xanh đậm — mở hoàn toàn
  return '#22c55e';                       // xanh lá — đang mở một phần
});

// 3.5 Badge chế độ AUTO/MANUAL
const modeBadgeClass = computed(() => {
  return internalMode.value === 'AUTO'
    ? 'bg-blue-600 text-white'
    : 'bg-amber-500 text-white';
});
</script>

<style scoped>
@reference "tailwindcss";

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
