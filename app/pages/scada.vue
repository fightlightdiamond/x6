<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Graph } from '@antv/x6'
import { registerAllVueNodes } from '~/utils/x6/registerNodes'
import { useScadaLayout } from '~/composables/useScadaLayout'
import { useSocketMonitor } from '~/composables/useSocketMonitor'

definePageMeta({ layout: false })

const graphContainerRef = ref<HTMLElement | null>(null)
let graphInstance: Graph | null = null

const { loadDemoLayout } = useScadaLayout()
const { isMonitoring, deviceStatuses, startMonitoring, stopMonitoring } = useSocketMonitor(() => graphInstance)

onMounted(() => {
  if (!graphContainerRef.value) return
  graphInstance = new Graph({
    container: graphContainerRef.value,
    autoResize: true,
    grid: { visible: false },
    background: { color: '#0a0e1a' },
    interacting: false,
    panning: { enabled: false },
    mousewheel: { enabled: false },
  })
  registerAllVueNodes()
  loadDemoLayout(graphInstance)
  startMonitoring()
})

onBeforeUnmount(() => {
  stopMonitoring()
  graphInstance?.dispose()
  graphInstance = null
})
</script>

<template>
  <div style="background:#0a0e1a;width:100vw;height:100vh;overflow:hidden;display:flex;flex-direction:column;">
    <ScadaToolbar :is-monitoring="isMonitoring" @start="startMonitoring" @stop="stopMonitoring" />
    <div ref="graphContainerRef" style="flex:1;position:relative;">
      <NuxtLink to="/"
        style="position:absolute;top:8px;left:8px;z-index:10;background:rgba(45,55,72,0.8);color:#94a3b8;border:1px solid #4a5568;border-radius:4px;padding:4px 10px;font-size:12px;text-decoration:none;">
        ← Thiết kế
      </NuxtLink>
    </div>
    <ScadaLegend :device-statuses="deviceStatuses" />
  </div>
</template>
