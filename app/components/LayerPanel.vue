<script setup lang="ts">
import { ref, nextTick, onMounted, onBeforeUnmount, computed } from 'vue'
import { useLayerStore } from '~/stores/layerStore'

const layerStore = useLayerStore()

// Error toast state
const errorMessage = ref<string | null>(null)
let errorTimer: ReturnType<typeof setTimeout> | null = null

function showError(msg: string) {
  errorMessage.value = msg
  if (errorTimer) clearTimeout(errorTimer)
  errorTimer = setTimeout(() => { errorMessage.value = null }, 2000)
}

// ConfirmDialog state
const confirmDeleteId = ref<string | null>(null)
const confirmNodeCount = ref(0)

const confirmLayerName = computed(() => {
  if (!confirmDeleteId.value) return ''
  return layerStore.layers.find(l => l.id === confirmDeleteId.value)?.name ?? ''
})

function handleDelete(id: string) {
  const result = layerStore.deleteLayer(id)
  if (result.ok) return
  if (result.error === 'LAST_LAYER') {
    showError('Cannot delete the last layer.')
  } else if (result.error === 'HAS_NODES') {
    confirmDeleteId.value = id
    confirmNodeCount.value = result.nodeIds.length
  }
}

function confirmDelete() {
  if (confirmDeleteId.value) {
    layerStore.deleteLayerConfirmed(confirmDeleteId.value)
  }
  confirmDeleteId.value = null
}

function cancelDelete() {
  confirmDeleteId.value = null
}

// Inline rename state
const editingLayerId = ref<string | null>(null)
const editingName = ref('')
const renameInputRef = ref<HTMLInputElement | null>(null)

async function startRename(id: string, currentName: string) {
  editingLayerId.value = id
  editingName.value = currentName
  await nextTick()
  renameInputRef.value?.focus()
  renameInputRef.value?.select()
}

function confirmRename(id: string) {
  if (editingName.value.trim() !== '') {
    layerStore.renameLayer(id, editingName.value.trim())
  }
  editingLayerId.value = null
}

function cancelRename() {
  editingLayerId.value = null
}

// Drag-to-reorder state
const dragFromIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

function onRowDragStart(e: DragEvent, index: number) {
  dragFromIndex.value = index
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
  }
}

function onRowDragOver(e: DragEvent, index: number) {
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
  dragOverIndex.value = index
}

function onRowDrop(e: DragEvent, index: number) {
  e.preventDefault()
  if (dragFromIndex.value !== null && dragFromIndex.value !== index) {
    layerStore.reorderLayers(dragFromIndex.value, index)
  }
  dragFromIndex.value = null
  dragOverIndex.value = null
}

function onRowDragLeave() {
  dragOverIndex.value = null
}

function onRowDragEnd() {
  dragFromIndex.value = null
  dragOverIndex.value = null
}

// Panel position
const panelX = ref(0)
const panelY = ref(80)

// Dragging state
const isDragging = ref(false)
const dragOffsetX = ref(0)
const dragOffsetY = ref(0)

// Collapsed state
const isCollapsed = ref(false)

function onMouseDown(e: MouseEvent) {
  isDragging.value = true
  dragOffsetX.value = e.clientX - panelX.value
  dragOffsetY.value = e.clientY - panelY.value
  e.preventDefault()
}

function onMouseMove(e: MouseEvent) {
  if (!isDragging.value) return
  const newX = e.clientX - dragOffsetX.value
  const newY = e.clientY - dragOffsetY.value
  panelX.value = Math.min(Math.max(newX, 0), window.innerWidth - 240)
  panelY.value = Math.min(Math.max(newY, 0), window.innerHeight - 40)
}

function onMouseUp() {
  isDragging.value = false
}

onMounted(() => {
  panelX.value = window.innerWidth - 256
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
})
</script>

<template>
  <div
    :style="{
      position: 'fixed',
      left: panelX + 'px',
      top: panelY + 'px',
      width: '240px',
      minHeight: '40px',
      background: '#1a2035',
      border: '1px solid #2d3748',
      borderRadius: '6px',
      color: '#e2e8f0',
      zIndex: 1000,
      boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
      userSelect: 'none',
    }"
  >
    <!-- Header -->
    <div
      @mousedown="onMouseDown"
      :style="{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 8px',
        height: '40px',
        background: '#1e2a45',
        borderBottom: isCollapsed ? 'none' : '1px solid #2d3748',
        borderRadius: isCollapsed ? '6px' : '6px 6px 0 0',
        cursor: 'grab',
      }"
    >
      <span :style="{ fontSize: '13px', fontWeight: '600', color: '#e2e8f0' }">Layers</span>
      <button
        @mousedown.stop
        @click="isCollapsed = !isCollapsed"
        :style="{
          background: 'none',
          border: 'none',
          color: '#94a3b8',
          cursor: 'pointer',
          fontSize: '12px',
          padding: '2px 4px',
          lineHeight: 1,
        }"
      >
        {{ isCollapsed ? '▶' : '▼' }}
      </button>
    </div>

    <!-- Panel body -->
    <div v-if="!isCollapsed">
      <!-- Layer list -->
      <div
        v-for="(layer, index) in layerStore.layers"
        :key="layer.id"
        draggable="true"
        @click="layerStore.setActiveLayer(layer.id)"
        @dragover="onRowDragOver($event, index)"
        @drop="onRowDrop($event, index)"
        @dragleave="onRowDragLeave"
        @dragend="onRowDragEnd"
        :style="{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 8px',
          cursor: 'pointer',
          background: layer.id === layerStore.activeLayerId ? '#2d3f6b' : 'transparent',
          borderBottom: '1px solid #1a2035',
          borderTop: dragOverIndex === index && dragFromIndex !== index ? '2px solid #3b82f6' : '2px solid transparent',
          opacity: (layer.visible ? 1 : 0.45) * (dragFromIndex === index ? 0.5 : 1),
          transition: 'background 0.1s, opacity 0.15s',
        }"
      >
        <!-- Drag handle -->
        <span
          @mousedown.stop
          @dragstart="onRowDragStart($event, index)"
          draggable="true"
          :style="{
            cursor: 'grab',
            color: '#475569',
            fontSize: '12px',
            lineHeight: 1,
            flexShrink: 0,
            userSelect: 'none',
          }"
          title="Drag to reorder"
        >≡</span>

        <!-- Color dot -->
        <span
          :style="{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: layer.color,
            flexShrink: 0,
          }"
        />

        <!-- Visibility toggle (eye icon) -->
        <button
          @click.stop="layerStore.setVisible(layer.id, !layer.visible)"
          :title="layer.visible ? 'Hide layer' : 'Show layer'"
          :style="{
            background: 'none',
            border: 'none',
            padding: '0',
            cursor: 'pointer',
            color: layer.visible ? '#94a3b8' : '#475569',
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
          }"
        >
          <!-- Eye open -->
          <svg v-if="layer.visible" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          <!-- Eye closed -->
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
        </button>

        <!-- Lock toggle (lock icon) -->
        <button
          @click.stop="layerStore.setLocked(layer.id, !layer.locked)"
          :title="layer.locked ? 'Unlock layer' : 'Lock layer'"
          :style="{
            background: 'none',
            border: 'none',
            padding: '0',
            cursor: 'pointer',
            color: layer.locked ? '#f59e0b' : '#475569',
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
          }"
        >
          <!-- Lock closed -->
          <svg v-if="layer.locked" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <!-- Lock open -->
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
          </svg>
        </button>

        <!-- Layer name (inline rename) -->
        <input
          v-if="editingLayerId === layer.id"
          ref="renameInputRef"
          v-model="editingName"
          @keydown.enter.prevent="confirmRename(layer.id)"
          @keydown.escape.prevent="cancelRename"
          @blur="confirmRename(layer.id)"
          @click.stop
          :style="{
            flex: 1,
            fontSize: '12px',
            background: '#0f172a',
            border: '1px solid #3b82f6',
            borderRadius: '3px',
            color: '#e2e8f0',
            padding: '1px 4px',
            outline: 'none',
            minWidth: 0,
          }"
        />
        <span
          v-else
          @dblclick.stop="startRename(layer.id, layer.name)"
          :style="{
            flex: 1,
            fontSize: '12px',
            color: layer.visible ? '#e2e8f0' : '#64748b',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textDecoration: layer.visible ? 'none' : 'line-through',
            cursor: 'text',
          }"
        >{{ layer.name }}</span>

        <!-- Delete button (stub — implemented in task 4.4) -->
        <button
          @click.stop="handleDelete(layer.id)"
          title="Delete layer"
          :style="{
            background: 'none',
            border: 'none',
            padding: '0',
            cursor: 'pointer',
            color: '#475569',
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
            opacity: 0,
          }"
          class="layer-delete-btn"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6"/>
            <path d="M14 11v6"/>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </button>
      </div>

      <!-- Confirm delete dialog (HAS_NODES) -->
      <div
        v-if="confirmDeleteId"
        :style="{
          margin: '6px 8px',
          padding: '8px',
          background: '#1e2a45',
          border: '1px solid #3b82f6',
          borderRadius: '5px',
          fontSize: '12px',
          color: '#e2e8f0',
        }"
      >
        <p :style="{ margin: '0 0 8px 0', lineHeight: '1.4' }">
          "<strong>{{ confirmLayerName }}</strong>" has {{ confirmNodeCount }} node{{ confirmNodeCount !== 1 ? 's' : '' }}.
          Move them to the active layer and delete?
        </p>
        <div :style="{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }">
          <button
            @click="cancelDelete"
            :style="{
              padding: '3px 10px',
              fontSize: '11px',
              background: 'transparent',
              border: '1px solid #475569',
              borderRadius: '3px',
              color: '#94a3b8',
              cursor: 'pointer',
            }"
          >Cancel</button>
          <button
            @click="confirmDelete"
            :style="{
              padding: '3px 10px',
              fontSize: '11px',
              background: '#ef4444',
              border: 'none',
              borderRadius: '3px',
              color: '#fff',
              cursor: 'pointer',
            }"
          >Confirm</button>
        </div>
      </div>

      <!-- Error toast (LAST_LAYER) -->
      <div
        v-if="errorMessage"
        :style="{
          margin: '4px 8px 6px',
          padding: '5px 8px',
          background: '#450a0a',
          border: '1px solid #ef4444',
          borderRadius: '4px',
          fontSize: '11px',
          color: '#fca5a5',
        }"
      >{{ errorMessage }}</div>

      <!-- Add Layer button -->
      <button
        @click="layerStore.addLayer()"
        :style="{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '5px',
          width: '100%',
          padding: '7px 8px',
          background: 'transparent',
          border: 'none',
          borderTop: '1px solid #2d3748',
          color: '#64748b',
          fontSize: '12px',
          cursor: 'pointer',
          borderRadius: '0 0 6px 6px',
          transition: 'background 0.15s, color 0.15s',
        }"
        class="add-layer-btn"
      >
        <span :style="{ fontSize: '14px', lineHeight: 1 }">+</span>
        <span>Add Layer</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.layer-delete-btn {
  opacity: 0;
  transition: opacity 0.15s, color 0.15s;
}
div:hover > .layer-delete-btn {
  opacity: 1;
}
.layer-delete-btn:hover {
  color: #ef4444 !important;
}
.add-layer-btn:hover {
  background: #1e2a45 !important;
  color: #94a3b8 !important;
}
</style>
