<template>
  <div class="flex-1 h-full relative overflow-hidden" @click="onContainerClick">
    <!-- X6 Graph Mount Point -->
    <div class="absolute inset-0" ref="graphContainerRef"></div>

    <!-- Render Vue Components on top of SVG elements -->
    <TeleportContainer />

    <!-- Node Configuration Panel -->
    <NodeConfigPanel :get-graph="getGraph" />

    <!-- Layer Panel -->
    <LayerPanel />

    <!-- Context Menu: Move to Layer -->
    <div
      v-if="contextMenu.visible"
      class="absolute z-[100] bg-white border border-gray-200 rounded-lg shadow-xl py-1 min-w-[180px]"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
      @click.stop
    >
      <div class="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
        Move to Layer
      </div>
      <button
        v-for="layer in layerStore.layers"
        :key="layer.id"
        class="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        @click="moveNodesToLayer(layer.id)"
      >
        <span class="w-3 h-3 rounded-full flex-shrink-0" :style="{ backgroundColor: layer.color }"></span>
        <span>{{ layer.name }}</span>
      </button>
    </div>

    <!-- Toolbar Actions -->
    <div class="absolute top-4 right-4 z-50 flex items-center gap-2">
      <!-- Persistence Buttons -->
      <button @click="saveGraph" title="Lưu thiết kế vào trình duyệt"
        class="px-3 py-2 rounded-lg font-bold shadow-lg transition-all bg-blue-600 text-white hover:bg-blue-700 text-sm flex items-center gap-1">💾
        Lưu</button>
      <button v-if="hasSavedData" @click="loadGraph" title="Tải lại thiết kế đã lưu"
        class="px-3 py-2 rounded-lg font-bold shadow-lg transition-all bg-indigo-600 text-white hover:bg-indigo-700 text-sm flex items-center gap-1">📂
        Tải</button>
      <button @click="exportJSON" title="Xuất file JSON ra máy tính"
        class="px-3 py-2 rounded-lg font-bold shadow-lg transition-all bg-gray-600 text-white hover:bg-gray-700 text-sm flex items-center gap-1">⬇️
        Export</button>
      <label title="Nhập file JSON từ máy tính"
        class="px-3 py-2 rounded-lg font-bold shadow-lg transition-all bg-gray-600 text-white hover:bg-gray-700 text-sm flex items-center gap-1 cursor-pointer">
        ⬆️ Import
        <input type="file" accept=".json" class="hidden" @change="handleImport" />
      </label>
      <button @click="clearGraph" title="Xóa toàn bộ bản vẽ"
        class="px-3 py-2 rounded-lg font-bold shadow-lg transition-all bg-orange-500 text-white hover:bg-orange-600 text-sm flex items-center gap-1">🗑️
        Xóa</button>

      <!-- Divider -->
      <div class="w-px h-8 bg-gray-400 mx-1"></div>

      <!-- Monitor toggle -->
      <button @click="isMonitoring ? stopMonitoring() : startMonitoring()"
        class="px-4 py-2 rounded-lg font-bold shadow-lg transition-all text-sm"
        :class="isMonitoring ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-green-500 text-white hover:bg-green-600'">
        {{ isMonitoring ? '⏹ Dừng Monitor' : '▶ Bắt Đầu Monitor' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { getTeleport } from '@antv/x6-vue-shape';
import { useX6Graph } from '../composables/useX6Graph';
import { useGraphPersistence } from '../composables/useGraphPersistence';
import { useSocketMonitor } from '../composables/useSocketMonitor';
import { useLayerManager } from '../composables/useLayerManager';
import { useNodeConfigStore } from '~/stores/nodeConfigStore';
import { useLayerStore } from '~/stores/layerStore';
import NodeConfigPanel from '~/components/NodeConfigPanel.vue';
import LayerPanel from '~/components/LayerPanel.vue';

const TeleportContainer = getTeleport();
const graphContainerRef = ref<HTMLElement | null>(null);

const { initGraph, getGraph } = useX6Graph();
const { hasSavedData, saveGraph, loadGraph, clearGraph, exportJSON, importJSON } = useGraphPersistence(getGraph);
const { isMonitoring, startMonitoring, stopMonitoring } = useSocketMonitor(getGraph);
const nodeConfigStore = useNodeConfigStore();
const layerStore = useLayerStore();
const { onNodeAdded } = useLayerManager(getGraph);

// Task 6.1: Context menu state
const contextMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  nodeIds: [] as string[],
});

function closeContextMenu() {
  contextMenu.visible = false;
  contextMenu.nodeIds = [];
}

function onContainerClick() {
  if (contextMenu.visible) closeContextMenu();
}

// Task 6.2: Move nodes to layer
function moveNodesToLayer(layerId: string) {
  if (contextMenu.nodeIds.length > 0) {
    layerStore.assignNodes(contextMenu.nodeIds, layerId);
  }
  closeContextMenu();
}

const handleImport = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) importJSON(file);
};

// Task 6.3: node:click → set active layer
function onNodeClick({ node, e }: { node: any; e: MouseEvent }) {
  nodeConfigStore.openPanel(node.id);
  // Highlight the layer this node belongs to
  const layerId = layerStore.getLayerOfNode(node.id);
  if (layerId) {
    layerStore.setActiveLayer(layerId);
  }
}

// Task 6.1: node:contextmenu → show context menu
function onNodeContextMenu({ node, e }: { node: any; e: MouseEvent }) {
  e.preventDefault();
  contextMenu.nodeIds = [node.id];
  contextMenu.x = e.clientX;
  contextMenu.y = e.clientY;
  contextMenu.visible = true;
}

function onBlankClick() {
  nodeConfigStore.closePanel();
  closeContextMenu();
}

onMounted(() => {
  if (graphContainerRef.value) {
    // Only init default if store has no layers yet (avoid resetting on re-mount)
    if (layerStore.layers.length === 0) {
      layerStore.initDefault();
    }
    initGraph(graphContainerRef.value);
    const graph = getGraph();
    if (graph) {
      graph.on('node:added', ({ node }: { node: any }) => onNodeAdded(node));
      graph.on('node:click', onNodeClick);
      graph.on('node:contextmenu', onNodeContextMenu);
      graph.on('blank:click', onBlankClick);
    }
  }
});

onUnmounted(() => {
  const graph = getGraph();
  if (graph) {
    graph.off('node:click', onNodeClick);
    graph.off('node:contextmenu', onNodeContextMenu);
    graph.off('blank:click', onBlankClick);
  }
});
</script>

<style>
/* ── Pipe flow animations — luôn chạy, không cần toggle ─────────────────── */

/* Dòng chảy chính: dash chạy từ source → target */
@keyframes pipe-flow {
  from {
    stroke-dashoffset: 0;
  }

  to {
    stroke-dashoffset: -24;
  }
}

/* Highlight shimmer: opacity + offset nhấp nháy */
@keyframes pipe-shimmer {
  0% {
    stroke-dashoffset: 0;
    stroke-opacity: 0.5;
  }

  50% {
    stroke-dashoffset: -30;
    stroke-opacity: 0.85;
  }

  100% {
    stroke-dashoffset: -60;
    stroke-opacity: 0.5;
  }
}

/* Signal flow: dash nhỏ chạy nhanh */
@keyframes signal-flow {
  from {
    stroke-dashoffset: 0;
  }

  to {
    stroke-dashoffset: -16;
  }
}

/* Legacy fallback */
@keyframes ant-line {
  to {
    stroke-dashoffset: -1000;
  }
}
</style>
