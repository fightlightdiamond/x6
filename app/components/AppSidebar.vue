<template>
  <div class="w-[250px] border-r border-gray-300 p-4 bg-white h-full overflow-y-auto">
    <h3>Menu Kéo Thả</h3>
    <div
      class="p-2.5 mb-2.5 bg-white border border-dashed border-gray-300 cursor-grab active:cursor-grabbing text-center rounded"
      @mousedown="startDrag($event, 'custom', 'Node Loại A')">
      Kéo Vue Node A
    </div>
    <div
      class="p-2.5 mb-2.5 bg-white border border-dashed border-gray-300 cursor-grab active:cursor-grabbing text-center rounded"
      @mousedown="startDrag($event, 'custom', 'Node Loại B')">
      Kéo Vue Node B
    </div>
    <!-- Kéo thả bồn lọc -->
    <div
      class="p-2.5 mb-2.5 bg-blue-50 border border-dashed border-blue-400 text-blue-700 font-bold cursor-grab active:cursor-grabbing text-center rounded hover:bg-blue-100"
      @mousedown="startDrag($event, 'filter-tank', 'Bồn Lọc')">
      Kéo Bồn Lọc
    </div>

    <h3 class="mt-6 mb-3 font-bold border-t pt-4 text-blue-700">⚡ Hệ thống ESP</h3>

    <!-- Templates nhanh -->
    <p class="text-xs text-gray-500 mb-2">📋 Load template:</p>
    <div v-for="tpl in Object.values(ESP_TEMPLATES)" :key="tpl.id" class="mb-1.5">
      <div v-if="pendingTemplate !== tpl.id"
        class="p-2 bg-indigo-900 border border-indigo-600 text-indigo-100 text-xs cursor-pointer rounded hover:bg-indigo-800"
        :title="tpl.description" @click="pendingTemplate = tpl.id">
        ⚡ {{ tpl.name }}
      </div>
      <div v-else class="border border-yellow-400 rounded p-2 bg-yellow-50">
        <p class="text-xs text-yellow-800 mb-1.5">Canvas hiện tại sẽ bị xóa. Tiếp tục?</p>
        <div class="flex gap-1">
          <button class="flex-1 text-xs bg-indigo-700 text-white rounded px-2 py-1 hover:bg-indigo-600"
            @click="loadTemplate(tpl.id)">✓ Load</button>
          <button class="flex-1 text-xs bg-gray-200 text-gray-700 rounded px-2 py-1 hover:bg-gray-300"
            @click="pendingTemplate = null">✕ Hủy</button>
        </div>
      </div>
    </div>
    <div class="border-t border-dashed border-gray-200 my-3"></div>
    <!-- Bồn lọc ESP -->
    <div
      class="p-2.5 mb-2.5 bg-blue-50 border border-dashed border-blue-400 text-blue-700 font-bold cursor-grab active:cursor-grabbing text-center rounded hover:bg-blue-100"
      @mousedown="startDrag($event, 'esp-filter-tank', 'Filtr 1')">
      Bồn lọc ESP
    </div>
    <!-- Động cơ quạt (Ventilátor) -->
    <div
      class="p-2.5 mb-2.5 bg-green-50 border border-dashed border-green-400 text-green-700 font-bold cursor-grab active:cursor-grabbing text-center rounded hover:bg-green-100"
      @mousedown="startDrag($event, 'motor-blower', 'Ventilátor 1')">
      Động cơ quạt
    </div>
    <!-- Van điều khiển -->
    <div
      class="p-2.5 mb-2.5 bg-yellow-50 border border-dashed border-yellow-400 text-yellow-700 font-bold cursor-grab active:cursor-grabbing text-center rounded hover:bg-yellow-100"
      @mousedown="startDrag($event, 'control-valve', 'Van 1')">
      Van điều khiển
    </div>
    <!-- Tag thông số (SCADA) -->
    <div
      class="p-2.5 mb-2.5 bg-slate-800 border border-dashed border-slate-600 text-white font-bold cursor-grab active:cursor-grabbing text-center rounded hover:bg-slate-700"
      @mousedown="startDrag($event, 'data-tag', 'TEMP-01')">
      Tag thông số
    </div>
    <!-- Mini sensor tag -->
    <div
      class="p-2 mb-2.5 bg-slate-700 border border-dashed border-slate-500 text-white text-sm cursor-grab active:cursor-grabbing text-center rounded hover:bg-slate-600"
      @mousedown="startDrag($event, 'data-tag-mini', '65°C')">
      Sensor mini
    </div>
    <!-- Đèn báo LED -->
    <div
      class="p-2.5 mb-2.5 bg-gray-50 border border-dashed border-gray-400 text-gray-700 font-bold cursor-grab active:cursor-grabbing text-center rounded hover:bg-gray-100"
      @mousedown="startDrag($event, 'indicator-light', 'RUN')">
      Đèn báo LED
    </div>
    <!-- Phễu thu bụi (Cyclone) -->
    <div
      class="p-2.5 mb-2.5 bg-indigo-50 border border-dashed border-indigo-400 text-indigo-700 font-bold cursor-grab active:cursor-grabbing text-center rounded hover:bg-indigo-100"
      @mousedown="startDrag($event, 'static-equipment', 'Cyclone 1')">
      Phễu thu bụi (Cyclone)
    </div>
    <!-- Ống khói (Chimney) -->
    <div
      class="p-2.5 mb-2.5 bg-orange-50 border border-dashed border-orange-400 text-orange-700 font-bold cursor-grab active:cursor-grabbing text-center rounded hover:bg-orange-100"
      @mousedown="startDrag($event, 'static-equipment-chimney', 'Chimney 1')">
      Ống khói (Chimney)
    </div>

    <h3 class="mt-6 mb-3 font-bold border-t pt-4">Thiết bị IT</h3>
    <div
      class="p-2 mb-2 bg-gray-50 border border-gray-300 cursor-grab active:cursor-grabbing text-center rounded hover:bg-gray-200"
      @mousedown="startDrag($event, 'case', 'Server Case')">Máy Chủ (Case)</div>
    <div
      class="p-2 mb-2 bg-gray-50 border border-gray-300 cursor-grab active:cursor-grabbing text-center rounded hover:bg-gray-200"
      @mousedown="startDrag($event, 'monitor', 'Màn Hình LG')">Màn Hình</div>
    <div
      class="p-2 mb-2 bg-gray-50 border border-gray-300 cursor-grab active:cursor-grabbing text-center rounded hover:bg-gray-200"
      @mousedown="startDrag($event, 'mouse', 'Chuột Bluetooth')">Chuột</div>
    <div
      class="p-2 mb-2 bg-gray-50 border border-gray-300 cursor-grab active:cursor-grabbing text-center rounded hover:bg-gray-200"
      @mousedown="startDrag($event, 'power', 'Nguồn PSU 850W')">Nguồn điện</div>
    <div
      class="p-2 mb-2 bg-gray-50 border border-gray-300 cursor-grab active:cursor-grabbing text-center rounded hover:bg-gray-200"
      @mousedown="startDrag($event, 'network', 'Switch Cisco')">Hệ thống Mạng</div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { useX6Graph } from '../composables/useX6Graph';
import { createNodeConfig } from '../utils/x6/nodeTemplates';
import { ESP_TEMPLATES } from '../utils/x6/espTemplates';

const { getGraph, getDnd } = useX6Graph();

const startDrag = (e: MouseEvent, type: string, labelName: string) => {
  const graph = getGraph();
  const dnd = getDnd();
  if (!graph || !dnd) return;

  const nodeConfig = createNodeConfig(type, labelName);
  const node = graph.createNode(nodeConfig);
  dnd.start(node, e);
};

const pendingTemplate = ref<string | null>(null);

const loadTemplate = async (templateId: string) => {
  const graph = getGraph();
  if (!graph) return;
  const tpl = ESP_TEMPLATES[templateId];
  if (!tpl) return;

  pendingTemplate.value = null;

  // Clear canvas và đợi Vue unmount xong hoàn toàn
  graph.clearCells();

  // 100ms đủ để Vue destroy tất cả component instances trong TeleportContainer
  await new Promise(resolve => setTimeout(resolve, 100));

  // Load template — bên trong cũng gọi clearCells() nhưng canvas đã trống
  tpl.load(graph);
};
</script>
