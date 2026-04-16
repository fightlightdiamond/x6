<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Graph } from '@antv/x6'
import { registerAllVueNodes } from '~/utils/x6/registerNodes'
import { useScadaLayout } from '~/composables/useScadaLayout'
import { useScadaSimulation } from '~/composables/useScadaSimulation'

definePageMeta({ layout: false })

const graphContainerRef = ref<HTMLElement | null>(null)
let graphInstance: Graph | null = null

function initScadaGraph(container: HTMLElement): Graph {
  registerAllVueNodes()
  return new Graph({
    container,
    autoResize: true,
    grid: { visible: false },
    background: { color: '#0a0e1a' },
    interacting: false,
    panning: { enabled: false },
    mousewheel: { enabled: false },
    connecting: { enabled: false },
    selecting: { enabled: false },
  })
}

const { loadDemoLayout } = useScadaLayout()
const { isMonitoring, deviceStatuses, startMonitoring, stopMonitoring } = useScadaSimulation(() => graphInstance)

onMounted(() => {
  if (graphContainerRef.value) {
    graphInstance = initScadaGraph(graphContainerRef.value)
    loadDemoLayout(graphInstance)
    startMonitoring()
  }
})

onBeforeUnmount(() => {
  stopMonitoring()
  graphInstance?.dispose()
  graphInstance = null
})
</script>

<template>
  <div class="scada-root"
    style="background: #0a0e1a; width: 100vw; height: 100vh; overflow: hidden; display: flex; flex-direction: column;">
    <ScadaToolbar :is-monitoring="isMonitoring" @start="startMonitoring" @stop="stopMonitoring" />
    <div ref="graphContainerRef" style="flex: 1; position: relative;">
      <NuxtLink to="/"
        style="position: absolute; top: 8px; left: 8px; z-index: 10; background: rgba(45,55,72,0.8); color: #94a3b8; border: 1px solid #4a5568; border-radius: 4px; padding: 4px 10px; font-size: 12px; text-decoration: none; cursor: pointer;">
        ← Thiết kế</NuxtLink>
    </div>
    <ScadaLegend :device-statuses="deviceStatuses" />
  </div>
</template>
