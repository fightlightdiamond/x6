<template>
  <div
    v-if="isPanelOpen"
    class="fixed right-0 top-0 w-80 h-full bg-gray-900 text-white z-[60] flex flex-col shadow-2xl border-l border-gray-700"
  >
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-gray-700 flex-shrink-0">
      <span class="font-semibold text-sm">{{ nodeTypeLabel }}</span>
      <button
        @click="closePanel"
        class="text-gray-400 hover:text-white text-lg leading-none w-7 h-7 flex items-center justify-center rounded hover:bg-gray-700 transition-colors"
        aria-label="Đóng panel"
      >×</button>
    </div>

    <!-- Scrollable content -->
    <div class="overflow-y-auto flex-1 px-4 py-4">

      <!-- Section: Label & Unit -->
      <div>
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Nhãn & Đơn Vị</p>

        <!-- Label input -->
        <div class="mb-3">
          <label class="block text-xs text-gray-400 mb-1">Nhãn</label>
          <input
            v-model="formData.label"
            type="text"
            class="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm w-full focus:outline-none focus:border-blue-500"
            :class="{ 'border-red-500': errors.label }"
            placeholder="Nhập nhãn..."
          />
          <p v-if="errors.label" class="text-red-400 text-xs mt-1">{{ errors.label }}</p>
        </div>

        <!-- Unit input — only for data-tag -->
        <div v-if="currentShape === 'data-tag'" class="mb-3">
          <label class="block text-xs text-gray-400 mb-1">Đơn vị</label>
          <input
            v-model="formData.unit"
            type="text"
            class="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm w-full focus:outline-none focus:border-blue-500"
            placeholder="VD: kPa, °C, ..."
          />
        </div>
      </div>

      <!-- Section: Thresholds -->
      <div
        v-if="supportsThresholds"
        class="border-t border-gray-700 pt-4 mt-4"
      >
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Ngưỡng Cảnh Báo</p>

        <div
          v-for="(entry, idx) in formData.thresholds"
          :key="idx"
          class="mb-3 p-2 bg-gray-800 rounded border border-gray-700"
        >
          <div class="flex items-center gap-2 mb-2">
            <div class="flex-1">
              <label class="block text-xs text-gray-400 mb-1">Min</label>
              <input
                v-model.number="entry.min"
                type="number"
                class="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm w-full focus:outline-none focus:border-blue-500"
                :class="{ 'border-red-500': thresholdErrors[idx] }"
              />
            </div>
            <div class="flex-1">
              <label class="block text-xs text-gray-400 mb-1">Max</label>
              <input
                v-model.number="entry.max"
                type="number"
                class="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm w-full focus:outline-none focus:border-blue-500"
                :class="{ 'border-red-500': thresholdErrors[idx] }"
              />
            </div>
            <div>
              <label class="block text-xs text-gray-400 mb-1">Màu</label>
              <input
                v-model="entry.color"
                type="color"
                class="w-8 h-8 rounded cursor-pointer border border-gray-600 bg-gray-700"
              />
            </div>
            <div class="pt-4">
              <button
                @click="removeThreshold(idx)"
                :disabled="!canRemoveThreshold(formData.thresholds!.length)"
                class="text-red-400 hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed text-sm w-6 h-6 flex items-center justify-center"
                aria-label="Xóa ngưỡng"
              >✕</button>
            </div>
          </div>
          <div>
            <label class="block text-xs text-gray-400 mb-1">Nhãn ngưỡng</label>
            <input
              v-model="entry.label"
              type="text"
              class="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm w-full focus:outline-none focus:border-blue-500"
              placeholder="VD: Bình thường"
            />
          </div>
          <p v-if="thresholdErrors[idx]" class="text-red-400 text-xs mt-1">{{ thresholdErrors[idx] }}</p>
        </div>

        <button
          @click="addThreshold"
          :disabled="!canAddThreshold(formData.thresholds?.length ?? 0)"
          class="w-full py-1.5 text-sm rounded border border-dashed border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >+ Thêm ngưỡng</button>
      </div>

      <!-- Section: Type-specific fields -->
      <div
        v-if="hasTypeSpecificFields"
        class="border-t border-gray-700 pt-4 mt-4"
      >
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Thuộc Tính Đặc Thù</p>

        <!-- control-valve -->
        <template v-if="currentShape === 'control-valve'">
          <div class="mb-3">
            <label class="block text-xs text-gray-400 mb-1">Chế độ</label>
            <select
              v-model="formData.mode"
              class="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm w-full focus:outline-none focus:border-blue-500"
            >
              <option value="AUTO">AUTO</option>
              <option value="MANUAL">MANUAL</option>
            </select>
          </div>
          <div class="mb-3">
            <label class="block text-xs text-gray-400 mb-1">Độ mở (%)</label>
            <input
              v-model.number="formData.openPercent"
              type="number"
              min="0"
              max="100"
              class="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm w-full focus:outline-none focus:border-blue-500"
              :class="{ 'border-red-500': errors.openPercent }"
            />
            <p v-if="errors.openPercent" class="text-red-400 text-xs mt-1">{{ errors.openPercent }}</p>
          </div>
        </template>

        <!-- indicator-light -->
        <template v-if="currentShape === 'indicator-light'">
          <div class="mb-3">
            <label class="block text-xs text-gray-400 mb-1">Màu đèn</label>
            <select
              v-model="formData.color"
              class="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm w-full focus:outline-none focus:border-blue-500"
            >
              <option value="green">Xanh lá</option>
              <option value="yellow">Vàng</option>
              <option value="red">Đỏ</option>
              <option value="blue">Xanh dương</option>
            </select>
          </div>
          <div class="mb-3">
            <label class="block text-xs text-gray-400 mb-1">Trạng thái</label>
            <select
              v-model="formData.state"
              class="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm w-full focus:outline-none focus:border-blue-500"
            >
              <option value="on">Bật</option>
              <option value="off">Tắt</option>
            </select>
          </div>
        </template>

        <!-- esp-filter-tank -->
        <template v-if="currentShape === 'esp-filter-tank'">
          <div class="mb-3">
            <label class="block text-xs text-gray-400 mb-1">Điện áp (kV)</label>
            <input
              v-model.number="formData.voltage"
              type="number"
              class="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm w-full focus:outline-none focus:border-blue-500"
            />
          </div>
          <div class="mb-3">
            <label class="block text-xs text-gray-400 mb-1">Dòng điện (mA)</label>
            <input
              v-model.number="formData.current"
              type="number"
              class="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm w-full focus:outline-none focus:border-blue-500"
            />
          </div>
        </template>

        <!-- motor-blower -->
        <template v-if="currentShape === 'motor-blower'">
          <div class="mb-3">
            <label class="block text-xs text-gray-400 mb-1">Dòng điện (A)</label>
            <input
              v-model.number="formData.current"
              type="number"
              class="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm w-full focus:outline-none focus:border-blue-500"
            />
          </div>
          <div class="mb-3">
            <label class="block text-xs text-gray-400 mb-1">Nhiệt độ stator (°C)</label>
            <input
              v-model.number="formData.statorTemp"
              type="number"
              class="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm w-full focus:outline-none focus:border-blue-500"
            />
          </div>
          <div class="mb-3">
            <label class="block text-xs text-gray-400 mb-1">Nhiệt độ ổ bi (°C)</label>
            <input
              v-model.number="formData.bearingTemp"
              type="number"
              class="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm w-full focus:outline-none focus:border-blue-500"
            />
          </div>
        </template>

        <!-- data-tag -->
        <template v-if="currentShape === 'data-tag'">
          <div class="mb-3">
            <label class="block text-xs text-gray-400 mb-1">Giá trị</label>
            <input
              v-model.number="formData.value"
              type="number"
              class="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm w-full focus:outline-none focus:border-blue-500"
            />
          </div>
          <div class="mb-3">
            <label class="block text-xs text-gray-400 mb-1">Trạng thái</label>
            <select
              v-model="formData.status"
              class="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm w-full focus:outline-none focus:border-blue-500"
            >
              <option value="normal">Bình thường</option>
              <option value="warning">Cảnh báo</option>
              <option value="alarm">Nguy hiểm</option>
            </select>
          </div>
        </template>
      </div>

    </div>

    <!-- Actions -->
    <div class="flex gap-2 px-4 py-3 border-t border-gray-700 flex-shrink-0">
      <button
        @click="handleSave"
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm flex-1 transition-colors"
      >Lưu</button>
      <button
        @click="handleCancel"
        class="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm flex-1 transition-colors"
      >Hủy</button>
    </div>

    <!-- Success toast -->
    <div
      v-if="isSaved"
      class="absolute bottom-16 left-4 right-4 bg-green-600 text-white text-sm px-3 py-2 rounded shadow-lg"
    >✓ Đã lưu thành công</div>

    <!-- Error toast -->
    <div
      v-if="errorToast"
      class="absolute bottom-16 left-4 right-4 bg-red-600 text-white text-sm px-3 py-2 rounded shadow-lg flex items-center justify-between"
    >
      <span>{{ errorToast }}</span>
      <button @click="errorToast = null" class="ml-2 text-white hover:text-gray-200">×</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import type { Graph } from '@antv/x6';
import { useNodeConfigStore } from '~/stores/nodeConfigStore';
import {
  buildFormData,
  applyFormDataToNode,
  validateLabel,
  validateThreshold,
  validateOpenPercent,
  canAddThreshold,
  canRemoveThreshold,
  type NodeFormData,
  type ThresholdEntry,
} from '~/utils/nodeConfigValidation';

// ── Props ──────────────────────────────────────────────────────────────────
const props = defineProps<{
  getGraph: () => Graph | null;
}>();

// ── Store ──────────────────────────────────────────────────────────────────
const store = useNodeConfigStore();
const { isPanelOpen, selectedNodeId } = storeToRefs(store);

// ── Internal state ─────────────────────────────────────────────────────────
const formData = reactive<NodeFormData>({ label: '' });
const initialFormData = ref<NodeFormData>({ label: '' });
const errors = reactive<Record<string, string | null>>({});
const thresholdErrors = ref<(string | null)[]>([]);
const isSaved = ref(false);
const errorToast = ref<string | null>(null);
const currentShape = ref<string>('');

// ── Computed ───────────────────────────────────────────────────────────────
const NODE_TYPE_LABELS: Record<string, string> = {
  'esp-filter-tank': 'Bồn Lọc ESP',
  'motor-blower': 'Động Cơ / Quạt',
  'control-valve': 'Van Điều Khiển',
  'data-tag': 'Thẻ Dữ Liệu',
  'indicator-light': 'Đèn Chỉ Thị',
  'static-equipment': 'Thiết Bị Tĩnh',
  'computer-device-node': 'Máy Tính',
  'my-vue-shape': 'Node Tùy Chỉnh',
};

const nodeTypeLabel = computed(() => NODE_TYPE_LABELS[currentShape.value] ?? currentShape.value);

const THRESHOLD_SHAPES = new Set(['esp-filter-tank', 'motor-blower', 'data-tag', 'control-valve']);
const supportsThresholds = computed(() => THRESHOLD_SHAPES.has(currentShape.value));

const TYPE_SPECIFIC_SHAPES = new Set([
  'control-valve', 'indicator-light', 'esp-filter-tank', 'motor-blower', 'data-tag',
]);
const hasTypeSpecificFields = computed(() => TYPE_SPECIFIC_SHAPES.has(currentShape.value));

// ── Helpers ────────────────────────────────────────────────────────────────
function deepCopy<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function populateForm(nodeId: string) {
  const graph = props.getGraph();
  if (!graph) return;

  const node = graph.getCellById(nodeId);
  if (!node || !node.isNode()) {
    store.closePanel();
    return;
  }

  const shape = (node as any).shape as string;
  const data = (node as any).getData() ?? {};

  currentShape.value = shape;

  const built = buildFormData(shape, data);

  // Reset formData fields
  Object.keys(formData).forEach((k) => delete (formData as any)[k]);
  Object.assign(formData, deepCopy(built));

  initialFormData.value = deepCopy(built);

  // Clear errors
  Object.keys(errors).forEach((k) => delete errors[k]);
  thresholdErrors.value = [];
}

// ── Watch selectedNodeId ───────────────────────────────────────────────────
watch(
  selectedNodeId,
  (newId) => {
    if (!newId) return;
    populateForm(newId);
  },
  { immediate: true },
);

// ── Watch for node deletion ────────────────────────────────────────────────
watch(
  isPanelOpen,
  (open) => {
    if (!open) return;
    const graph = props.getGraph();
    if (!graph || !selectedNodeId.value) return;
    const node = graph.getCellById(selectedNodeId.value);
    if (!node) store.closePanel();
  },
);

// ── Actions ────────────────────────────────────────────────────────────────
function closePanel() {
  store.closePanel();
}

function addThreshold() {
  if (!formData.thresholds) formData.thresholds = [];
  if (!canAddThreshold(formData.thresholds.length)) return;
  formData.thresholds.push({ min: 0, max: 100, color: '#6b7280', label: 'Ngưỡng mới' });
}

function removeThreshold(idx: number) {
  if (!formData.thresholds) return;
  if (!canRemoveThreshold(formData.thresholds.length)) return;
  formData.thresholds.splice(idx, 1);
  thresholdErrors.value.splice(idx, 1);
}

function validateAll(): boolean {
  let valid = true;

  // Label
  const labelErr = validateLabel(formData.label);
  errors.label = labelErr;
  if (labelErr) valid = false;

  // openPercent
  if (currentShape.value === 'control-valve' && formData.openPercent !== undefined) {
    const opErr = validateOpenPercent(formData.openPercent);
    errors.openPercent = opErr;
    if (opErr) valid = false;
  }

  // Thresholds
  if (formData.thresholds) {
    thresholdErrors.value = formData.thresholds.map((t) => validateThreshold(t));
    if (thresholdErrors.value.some((e) => e !== null)) valid = false;
  }

  return valid;
}

function handleSave() {
  if (!validateAll()) return;

  const graph = props.getGraph();
  if (!graph || !selectedNodeId.value) return;

  const node = graph.getCellById(selectedNodeId.value);
  if (!node || !node.isNode()) return;

  try {
    applyFormDataToNode(node, formData);
    initialFormData.value = deepCopy(formData);
    isSaved.value = true;
    errorToast.value = null;
    setTimeout(() => { isSaved.value = false; }, 2000);
  } catch (err: any) {
    errorToast.value = err?.message ?? 'Lỗi khi lưu cấu hình';
  }
}

function handleCancel() {
  const snapshot = deepCopy(initialFormData.value);
  Object.keys(formData).forEach((k) => delete (formData as any)[k]);
  Object.assign(formData, snapshot);
  Object.keys(errors).forEach((k) => delete errors[k]);
  thresholdErrors.value = [];
  store.closePanel();
}
</script>
