<template>
  <div class="w-[250px] border-r border-gray-300 p-4 bg-white h-full overflow-y-auto">
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
      class="p-2.5 mb-2.5 bg-blue-50 border border-dashed border-blue-400 text-blue-700 font-bold cursor-grab active:cursor-grabbing text-center rounded hover:bg-blue-100"
      @mousedown="startDrag($event, 'filter-tank', 'Bồn Lọc')"
    >
      Kéo Bồn Lọc
    </div>

    <h3 class="mt-6 mb-3 font-bold border-t pt-4">Thiết bị IT</h3>
    <div
      class="p-2 mb-2 bg-gray-50 border border-gray-300 cursor-grab active:cursor-grabbing text-center rounded hover:bg-gray-200"
      @mousedown="startDrag($event, 'case', 'Server Case')"
    >Máy Chủ (Case)</div>
    <div
      class="p-2 mb-2 bg-gray-50 border border-gray-300 cursor-grab active:cursor-grabbing text-center rounded hover:bg-gray-200"
      @mousedown="startDrag($event, 'monitor', 'Màn Hình LG')"
    >Màn Hình</div>
    <div
      class="p-2 mb-2 bg-gray-50 border border-gray-300 cursor-grab active:cursor-grabbing text-center rounded hover:bg-gray-200"
      @mousedown="startDrag($event, 'mouse', 'Chuột Bluetooth')"
    >Chuột</div>
    <div
      class="p-2 mb-2 bg-gray-50 border border-gray-300 cursor-grab active:cursor-grabbing text-center rounded hover:bg-gray-200"
      @mousedown="startDrag($event, 'power', 'Nguồn PSU 850W')"
    >Nguồn điện</div>
    <div
      class="p-2 mb-2 bg-gray-50 border border-gray-300 cursor-grab active:cursor-grabbing text-center rounded hover:bg-gray-200"
      @mousedown="startDrag($event, 'network', 'Switch Cisco')"
    >Hệ thống Mạng</div>
  </div>
</template>

<script setup lang="ts">
import { useX6Graph } from '../composables/useX6Graph';
import { createNodeConfig } from '../utils/x6/nodeTemplates';

const { getGraph, getDnd } = useX6Graph();

const startDrag = (e: MouseEvent, type: string, labelName: string) => {
  const graph = getGraph();
  const dnd = getDnd();
  if (!graph || !dnd) return;

  const nodeConfig = createNodeConfig(type, labelName);
  const node = graph.createNode(nodeConfig);
  
  dnd.start(node, e);
};
</script>
