<template>
  <div class="flex-1 h-full relative overflow-hidden">
    <!-- X6 Graph Mount Point -->
    <div class="absolute inset-0" ref="graphContainerRef"></div>
    
    <!-- Render Vue Components on top of SVG elements -->
    <TeleportContainer />

    <!-- Toolbar Actions -->
    <div class="absolute top-4 right-4 z-50 flex items-center gap-2">
      <!-- Persistence Buttons -->
      <button
        @click="saveGraph"
        title="Lưu thiết kế vào trình duyệt"
        class="px-3 py-2 rounded-lg font-bold shadow-lg transition-all bg-blue-600 text-white hover:bg-blue-700 text-sm flex items-center gap-1"
      >💾 Lưu</button>
      <button
        v-if="hasSavedData"
        @click="loadGraph"
        title="Tải lại thiết kế đã lưu"
        class="px-3 py-2 rounded-lg font-bold shadow-lg transition-all bg-indigo-600 text-white hover:bg-indigo-700 text-sm flex items-center gap-1"
      >📂 Tải</button>
      <button
        @click="exportJSON"
        title="Xuất file JSON ra máy tính"
        class="px-3 py-2 rounded-lg font-bold shadow-lg transition-all bg-gray-600 text-white hover:bg-gray-700 text-sm flex items-center gap-1"
      >⬇️ Export</button>
      <label
        title="Nhập file JSON từ máy tính"
        class="px-3 py-2 rounded-lg font-bold shadow-lg transition-all bg-gray-600 text-white hover:bg-gray-700 text-sm flex items-center gap-1 cursor-pointer"
      >
        ⬆️ Import
        <input type="file" accept=".json" class="hidden" @change="handleImport" />
      </label>
      <button
        @click="clearGraph"
        title="Xóa toàn bộ bản vẽ"
        class="px-3 py-2 rounded-lg font-bold shadow-lg transition-all bg-orange-500 text-white hover:bg-orange-600 text-sm flex items-center gap-1"
      >🗑️ Xóa</button>

      <!-- Divider -->
      <div class="w-px h-8 bg-gray-300 mx-1"></div>

      <!-- Monitor Button -->
      <button 
        @click="toggleMonitoring"
        class="px-5 py-2 rounded-lg font-bold shadow-lg transition-all text-sm"
        :class="isMonitoring ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-green-500 text-white hover:bg-green-600'"
      >
        {{ isMonitoring ? '⏹ Dừng Giám Sát' : '▶ Bắt Đầu Giám Sát' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getTeleport } from '@antv/x6-vue-shape';
import { useX6Graph } from '../composables/useX6Graph';
import { useGraphMonitor } from '../composables/useGraphMonitor';
import { useGraphPersistence } from '../composables/useGraphPersistence';

const TeleportContainer = getTeleport();
const graphContainerRef = ref<HTMLElement | null>(null);

const { initGraph, getGraph } = useX6Graph();
const { isMonitoring, toggleMonitoring } = useGraphMonitor(getGraph);
const { hasSavedData, saveGraph, loadGraph, clearGraph, exportJSON, importJSON } = useGraphPersistence(getGraph);

const handleImport = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) importJSON(file);
};

onMounted(() => {
  if (graphContainerRef.value) {
    initGraph(graphContainerRef.value);
  }
});
</script>

<style>
/* CSS Keyframes toàn cục để điều khiển animation chạy dọc đường truyền */
@keyframes ant-line {
  to {
    stroke-dashoffset: -1000;
  }
}
</style>

