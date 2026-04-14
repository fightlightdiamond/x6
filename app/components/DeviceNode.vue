<template>
  <div class="relative group">
    <!-- Cụm Node Chính -->
    <div 
      class="w-[180px] min-h-[80px] bg-white rounded-xl shadow-md border-2 transition-all duration-300"
      :class="statusColors.border"
    >
      <!-- Header Device -->
      <div 
        class="flex items-center justify-between px-3 py-2 border-b rounded-t-lg transition-colors"
        :class="statusColors.bg"
      >
        <div class="flex items-center gap-2">
          <!-- Icon theo loại thiết bị -->
          <img :src="deviceIcon" class="w-5 h-5 opacity-90" alt="icon" />
          <span class="text-sm font-bold text-gray-800 drop-shadow-sm">{{ nodeData.deviceName || 'Thiết bị' }}</span>
        </div>
        
        <!-- Đèn trạng thái -->
        <span class="relative flex h-3 w-3">
          <span v-if="nodeData.status === 'warning'" class="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
          <span v-if="nodeData.status === 'offline'" class="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
          <span v-if="nodeData.status === 'online'" class="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
          <span 
            class="relative inline-flex rounded-full h-3 w-3 border border-white"
            :class="{
              'bg-yellow-500': nodeData.status === 'warning',
              'bg-red-600': nodeData.status === 'offline',
              'bg-green-500': nodeData.status === 'online'
            }"
          ></span>
        </span>
      </div>

      <!-- Danh sách Chỉ số Metrics -->
      <div class="px-3 py-2 flex flex-col gap-1.5" v-if="nodeData.metrics && nodeData.metrics.length > 0">
        <div 
          v-for="(metric, idx) in nodeData.metrics" 
          :key="idx"
          class="flex items-center justify-between text-xs font-medium"
        >
          <span class="text-gray-500">{{ metric.label }}</span>
          <span class="text-gray-900 font-bold bg-gray-100 px-1.5 py-0.5 rounded">
            {{ metric.value }} <span class="text-[10px] text-gray-500">{{ metric.unit }}</span>
          </span>
        </div>
      </div>
      <div v-else class="px-3 py-2 text-xs text-center text-gray-400 italic">
        (Chưa cấu hình theo dõi)
      </div>
    </div>

    <!-- CÁC ĐIỂM NEO (PORTS) TRONG VUE ĐỂ KÉO MŨI TÊN -->
    <div port="top" class="node-port absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 border-2 border-white rounded-full opacity-0 group-hover:opacity-100 cursor-crosshair transition-opacity"></div>
    <div port="bottom" class="node-port absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 border-2 border-white rounded-full opacity-0 group-hover:opacity-100 cursor-crosshair transition-opacity"></div>
    <div port="left" class="node-port absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-blue-500 border-2 border-white rounded-full opacity-0 group-hover:opacity-100 cursor-crosshair transition-opacity"></div>
    <div port="right" class="node-port absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-blue-500 border-2 border-white rounded-full opacity-0 group-hover:opacity-100 cursor-crosshair transition-opacity"></div>
  </div>
</template>

<script setup lang="ts">
import { inject, ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';

// 1. Nhận Props (Cho phép Storybook Controls tuỳ chỉnh giao diện)
const props = defineProps({
  deviceType: { type: String, default: 'unknown' },
  deviceName: { type: String, default: 'Device' },
  status: { type: String, default: 'offline' }, // online | offline | warning
  metrics: { type: Array, default: () => [] as Array<{label: string; value: string | number; unit: string}> }
});

// Data nội bộ
const nodeData = ref({
  deviceType: props.deviceType,
  deviceName: props.deviceName,
  status: props.status,
  metrics: props.metrics as Array<{label: string; value: string | number; unit: string}>
});

// Reactivity khi Storybook đổi Props
watch(() => props, (newProps) => {
  nodeData.value = { ...nodeData.value, ...newProps };
}, { deep: true, immediate: true });

// Lấy Node Object do X6 nạp vào Component này
const getNode = inject<() => any>('getNode', () => null);
let node: any = null;

// Map Icon từ Iconify API
const ICON_URLS: Record<string, string> = {
  case: 'https://api.iconify.design/mdi:desktop-tower.svg?color=%231f2937',
  monitor: 'https://api.iconify.design/mdi:monitor.svg?color=%231f2937',
  mouse: 'https://api.iconify.design/mdi:mouse.svg?color=%231f2937',
  keyboard: 'https://api.iconify.design/mdi:keyboard.svg?color=%231f2937',
  power: 'https://api.iconify.design/mdi:power-plug.svg?color=%231f2937',
  network: 'https://api.iconify.design/mdi:router-wireless.svg?color=%231f2937',
  unknown: 'https://api.iconify.design/mdi:help-box.svg?color=%231f2937'
};

const deviceIcon = computed(() => {
  return ICON_URLS[nodeData.value.deviceType] || ICON_URLS['unknown'];
});

// Map màu sắc viền/header tuỳ thuộc vào trạng thái
const statusColors = computed(() => {
  switch (nodeData.value.status) {
    case 'online':
      return { border: 'border-green-300 hover:border-green-400', bg: 'bg-green-50' };
    case 'warning':
      return { border: 'border-yellow-400 hover:border-yellow-500', bg: 'bg-yellow-50' };
    case 'offline':
    default:
      return { border: 'border-gray-300 hover:border-gray-400', bg: 'bg-gray-100' };
  }
});

const syncDataFromNode = () => {
  const data = node?.getData();
  if (data) {
    nodeData.value = { ...nodeData.value, ...data };
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
</script>

<style scoped>
@reference "tailwindcss";

/* Điểm kết nối (Port) được cấp quyền hút đường nối từ X6 */
.node-port {
  z-index: 10;
}
</style>
