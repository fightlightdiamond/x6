<template>
  <div class="flex-1 h-full" ref="graphContainer"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Graph } from '@antv/x6'

// Khai báo sự kiện emit ra ngoài
const emit = defineEmits<{
  ready: [graph: Graph]
}>()

const graphContainer = ref<HTMLElement | null>(null)
let graph: Graph | null = null

onMounted(() => {
  if (!graphContainer.value) return

  // Khởi tạo đồ thị X6
  graph = new Graph({
    container: graphContainer.value,
    autoResize: true,
    background: {
      color: '#f8f9fa',
    },
    grid: {
      size: 10,
      visible: true,
      type: 'dot',
      args: {
        color: '#a0aabb',
        thickness: 1,
      },
    },
    panning: {
      enabled: true,
      eventTypes: ['leftMouseDown', 'mouseWheel'],
    },
    mousewheel: {
      enabled: true,
      modifiers: 'ctrl',
      maxScale: 4,
      minScale: 0.2,
    },
  })

  // Render một node mặc định ban đầu làm hướng dẫn
  graph.addNode({
    x: 100,
    y: 100,
    shape: 'rect',
    width: 160,
    height: 60,
    label: 'Kéo hình vào đây ➔',
    attrs: {
      body: { stroke: '#8b5cf6', fill: '#ede9fe', rx: 6, ry: 6 },
      label: { fill: '#4c1d95', fontWeight: 'bold' }
    }
  })

  // Báo cho component cha biết Graph đã sẵn sàng
  emit('ready', graph)
})

onBeforeUnmount(() => {
  if (graph) {
    graph.dispose()
    graph = null
  }
})
</script>
