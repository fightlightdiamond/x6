<template>
  <div class="w-[250px] bg-white border-l border-slate-200 flex flex-col shadow-[-4px_0_15px_rgba(0,0,0,0.03)] z-10">
    <div class="p-4 border-b border-slate-200">
      <h3 class="m-0 text-sm text-slate-700 uppercase tracking-wider">Các Hình Cơ Bản</h3>
    </div>
    <div class="p-4 grid grid-cols-2 gap-4 overflow-y-auto">
      <!-- Chữ nhật -->
      <div class="shape-item" @mousedown="startDrag('rect', $event)">
        <div class="shape-preview shape-rect"></div>
        <span class="text-xs text-slate-500 mt-2 font-medium">Chữ Nhật</span>
      </div>
      <!-- Hình tròn -->
      <div class="shape-item" @mousedown="startDrag('circle', $event)">
        <div class="shape-preview shape-circle"></div>
        <span class="text-xs text-slate-500 mt-2 font-medium">Hình Tròn</span>
      </div>
      <!-- Hình elip -->
      <div class="shape-item" @mousedown="startDrag('ellipse', $event)">
        <div class="shape-preview shape-ellipse"></div>
        <span class="text-xs text-slate-500 mt-2 font-medium">Ellipse</span>
      </div>
      <!-- Hình polygon (Tam giác) -->
      <div class="shape-item" @mousedown="startDrag('polygon', $event)">
        <div class="shape-preview shape-triangle"></div>
        <span class="text-xs text-slate-500 mt-2 font-medium">Tam Giác</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, ref, watch } from 'vue'
import type { Graph } from '@antv/x6'
import { Dnd } from '@antv/x6-plugin-dnd'

const props = defineProps<{
  graph: Graph | null
}>()

let dndInstance: Dnd | null = null

// Khởi tạo Dnd ngay khi nhận được graph từ cha truyền xuống
watch(() => props.graph, (newGraph) => {
  if (newGraph && !dndInstance) {
    dndInstance = new Dnd({
      target: newGraph,
      scaled: false,
      dndContainer: document.body,
    })
  }
}, { immediate: true })

// Định nghĩa cấu hình các đối tượng kéo thả
const createNodeConfig = (type: string) => {
  switch (type) {
    case 'rect':
      return {
        shape: 'rect',
        width: 100,
        height: 60,
        label: 'Chữ Nhật',
        attrs: {
          body: { stroke: '#5F95FF', fill: '#EFF4FF', rx: 4, ry: 4 },
        },
      }
    case 'circle':
      return {
        shape: 'circle',
        width: 80,
        height: 80,
        label: 'Hình Tròn',
        attrs: {
          body: { stroke: '#5F95FF', fill: '#EFF4FF' },
        },
      }
    case 'ellipse':
      return {
        shape: 'ellipse',
        width: 120,
        height: 60,
        label: 'Ellipse',
        attrs: {
          body: { stroke: '#5F95FF', fill: '#EFF4FF' },
        },
      }
    case 'polygon': // Tam giác
      return {
        shape: 'polygon',
        width: 80,
        height: 80,
        label: 'Tam Giác',
        attrs: {
          body: {
            fill: '#EFF4FF',
            stroke: '#5F95FF',
            refPoints: '0,10 10,0 20,10', // Tam giác cơ bản
          },
        },
      }
    default:
      return {}
  }
}

// Bắt đầu kéo thả hình
const startDrag = (type: string, e: MouseEvent) => {
  if (!props.graph || !dndInstance) return
  
  const nodeConfig = createNodeConfig(type)
  const node = props.graph.createNode(nodeConfig)
  
  dndInstance.start(node, e)
}
</script>

<style scoped>
/* Giao diện các block kéo thả - giữ lại vì cần hover effects phức tạp */
.shape-item {
  @apply flex flex-col items-center justify-center p-3 border border-slate-200 rounded-lg cursor-grab transition-all duration-200 bg-slate-50;
}

.shape-item:hover {
  @apply border-blue-500 bg-blue-50 shadow-md;
}

.shape-item:active {
  @apply cursor-grabbing;
}

/* Previews mô phỏng các hình bằng CSS - không thể thay bằng Tailwind */
.shape-preview {
  @apply w-8 h-8;
  border: 2px solid #5F95FF;
  background: #EFF4FF;
}

.shape-rect {
  @apply rounded w-10;
}

.shape-circle {
  @apply rounded-full;
}

.shape-ellipse {
  @apply rounded-full w-10;
  height: 24px;
}

.shape-triangle {
  width: 0;
  height: 0;
  border-left: 16px solid transparent;
  border-right: 16px solid transparent;
  border-bottom: 28px solid #5F95FF;
  background: transparent;
  border-top: none;
  position: relative;
}
.shape-triangle::after {
  content: '';
  position: absolute;
  top: 4px;
  left: -12px;
  border-left: 12px solid transparent;
  border-right: 12px solid transparent;
  border-bottom: 21px solid #EFF4FF;
}
</style>
