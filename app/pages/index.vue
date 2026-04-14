<template>
  <Graph />
</template>

<script setup lang="ts">
import { shallowRef } from 'vue'
import type { Graph } from '@antv/x6'

// State lưu trữ instance
const graph = shallowRef<Graph | null>(null)

// Kích hoạt khi Component Hình vẽ (<GraphCanvas />) mount xong
const handleGraphReady = (graphInstance: Graph) => {
  graph.value = graphInstance
}
</script>
