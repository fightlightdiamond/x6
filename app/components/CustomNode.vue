<template>
  <div class="w-full h-full flex items-center justify-center bg-sky-50 border border-blue-400 rounded text-blue-400 font-bold relative">
    <span>{{ label }}</span>
    
    <div class="node-port port-left" data-magnet="true"></div>
    
    <div class="node-port port-right" data-magnet="true"></div>
  </div>
</template>

<script setup>
import { inject, ref, onMounted } from 'vue';

const getNode = inject('getNode');
const label = ref('');

onMounted(() => {
  const node = getNode();
  const data = node.getData();
  label.value = data?.label || 'Node';
});
</script>

<style scoped>
/* Điểm neo (port) cần vị trí tuyệt đối chính xác — không thể dùng Tailwind */
.node-port {
  @apply absolute w-3 h-3 bg-white rounded-full cursor-crosshair;
  border: 2px solid #1890ff;
  transition: transform 0.2s;
}

.node-port:hover {
  transform: scale(1.5);
}

.port-left {
  left: -6px;
  top: 50%;
  transform: translateY(-50%);
}
.port-left:hover {
  transform: translateY(-50%) scale(1.5);
}

.port-right {
  right: -6px;
  top: 50%;
  transform: translateY(-50%);
}
.port-right:hover {
  transform: translateY(-50%) scale(1.5);
}
</style>