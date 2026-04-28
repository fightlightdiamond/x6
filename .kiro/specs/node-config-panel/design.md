# Design Document: Node Configuration Panel

## Overview

Node Configuration Panel là một side panel cố định bên phải canvas, cho phép người dùng click vào bất kỳ node nào trên canvas AntV X6 để xem và chỉnh sửa cấu hình của node đó. Thay đổi được áp dụng ngay lập tức lên canvas thông qua `node.setData()` mà không cần reload.

**Phạm vi:** Tính năng này bổ sung vào trang thiết kế hiện có (route `/`, component `GraphCanvas.vue`). Không ảnh hưởng đến trang SCADA monitor (`/scada`).

**Nguyên tắc thiết kế:**

- Đơn giản, ít file mới nhất có thể
- Tận dụng pattern `inject('getNode')` đã có trong các node component
- Pinia store nhỏ gọn, chỉ lưu `selectedNodeId`
- Panel render bên ngoài canvas (không dùng teleport), tránh xung đột với X6

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  index.vue (trang thiết kế)                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐ │
│  │  AppSidebar  │  │ GraphCanvas  │  │ NodeConfigPanel   │ │
│  │  (drag&drop) │  │ (X6 canvas)  │  │ (side panel 320px)│ │
│  └──────────────┘  └──────┬───────┘  └────────┬──────────┘ │
│                            │ node:click         │            │
│                            ▼                   │            │
│                    ┌───────────────┐           │            │
│                    │NodeConfigStore│◄──────────┘            │
│                    │  (Pinia)      │                        │
│                    └───────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

**Luồng dữ liệu:**

1. User click node → `GraphCanvas` nhận `node:click` event từ X6
2. `GraphCanvas` gọi `nodeConfigStore.openPanel(node.id)`
3. `NodeConfigPanel` đọc `selectedNodeId` từ store, lấy node data từ X6 graph
4. User chỉnh sửa form → click "Lưu" → `node.setData(newData)`
5. X6 emit `change:data` → node Vue component tự re-render

---

## Components and Interfaces

### 1. `NodeConfigStore` (Pinia) — `stores/nodeConfigStore.ts`

Store nhỏ gọn, chỉ quản lý trạng thái mở/đóng panel:

```typescript
interface NodeConfigState {
  selectedNodeId: string | null
}

// Actions
openPanel(nodeId: string): void
closePanel(): void

// Computed
isPanelOpen: boolean  // = selectedNodeId !== null
```

### 2. `NodeConfigPanel.vue` — `components/NodeConfigPanel.vue`

Component chính của panel. Nhận `getGraph` từ prop hoặc composable để truy cập X6 node.

**Props:**

```typescript
interface Props {
  getGraph: () => Graph | null;
}
```

**Internal state:**

- `formData`: reactive object chứa các field đang chỉnh sửa (copy từ node data)
- `errors`: object chứa validation errors
- `isSaved`: boolean để hiện success notification

**Template structure:**

```
NodeConfigPanel (fixed right-0, w-320px, h-full, bg-gray-900)
├── Header (node type label + close button)
├── ScrollArea
│   ├── Section: Label & Unit (luôn hiện)
│   ├── Section: Thresholds (conditional — node hỗ trợ threshold)
│   ├── Section: Type-specific fields (conditional theo node type)
│   └── Section: Actions (Lưu / Hủy buttons)
└── Success Toast (v-if isSaved)
```

### 3. Cập nhật `GraphCanvas.vue`

Thêm 3 thứ:

1. Import và dùng `useNodeConfigStore`
2. Đăng ký `node:click` và `blank:click` event listeners sau khi graph init
3. Render `<NodeConfigPanel :get-graph="getGraph" />` trong template

### 4. Cập nhật `useX6Graph.ts`

Không cần thay đổi — `getGraph()` đã export sẵn.

---

## Data Models

### NodeConfigStore State

```typescript
// stores/nodeConfigStore.ts
interface NodeConfigState {
  selectedNodeId: string | null;
}
```

### Form Data per Node Type

Panel dùng một `formData` object duy nhất, các field được populate tùy theo node type:

```typescript
interface NodeFormData {
  // Common (tất cả node)
  label: string;

  // Conditional: node có unit
  unit?: string;

  // Conditional: control-valve
  mode?: "AUTO" | "MANUAL";
  openPercent?: number;

  // Conditional: indicator-light
  color?: "green" | "yellow" | "red" | "blue";
  state?: "on" | "off";

  // Conditional: esp-filter-tank
  voltage?: number;
  current?: number;

  // Conditional: motor-blower
  statorTemp?: number;
  bearingTemp?: number;

  // Conditional: data-tag
  value?: number;
  status?: "normal" | "warning" | "alarm";

  // Conditional: node hỗ trợ threshold
  thresholds?: ThresholdEntry[];
}

interface ThresholdEntry {
  min: number;
  max: number;
  color: string; // hex color, e.g. '#22c55e'
  label: string; // e.g. 'Bình thường'
}
```

### Node Type → Fields Mapping

| Node Type              | label | unit | thresholds | type-specific fields             |
| ---------------------- | ----- | ---- | ---------- | -------------------------------- |
| `esp-filter-tank`      | ✓     | —    | ✓          | voltage, current                 |
| `motor-blower`         | ✓     | —    | ✓          | current, statorTemp, bearingTemp |
| `control-valve`        | ✓     | —    | ✓          | mode, openPercent                |
| `data-tag`             | ✓     | ✓    | ✓          | value, status                    |
| `indicator-light`      | ✓     | —    | —          | color, state                     |
| `static-equipment`     | ✓     | —    | —          | —                                |
| `computer-device-node` | ✓     | —    | —          | —                                |
| `my-vue-shape`         | ✓     | —    | —          | —                                |

### Default Thresholds

```typescript
const DEFAULT_THRESHOLDS: ThresholdEntry[] = [
  { min: 0, max: 50, color: "#22c55e", label: "Bình thường" },
  { min: 50, max: 80, color: "#f59e0b", label: "Cảnh báo" },
  { min: 80, max: 100, color: "#ef4444", label: "Nguy hiểm" },
];
```

---

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Label validation rejects invalid inputs

_For any_ string input for the `label` field, the validation function SHALL return an error if and only if the string is empty (after trim) or exceeds 32 characters.

**Validates: Requirements 2.3, 2.4**

### Property 2: Threshold min < max invariant

_For any_ threshold entry, the validation function SHALL return an error if and only if `min >= max`.

**Validates: Requirements 3.4, 3.5**

### Property 3: Threshold count bounds

_For any_ threshold count `n` in [1, 5], the "add" action SHALL be enabled if and only if `n < 5`, and the "remove" action SHALL be enabled if and only if `n > 1`.

**Validates: Requirements 3.6, 3.7**

### Property 4: openPercent range invariant

_For any_ numeric input for `openPercent`, the validation function SHALL accept values in [0, 100] and reject values outside this range.

**Validates: Requirements 4.2**

### Property 5: Form data round-trip

_For any_ node with existing data, opening the panel SHALL populate `formData` with values equal to the node's current data, and cancelling SHALL restore `formData` to those same values without modifying the node.

**Validates: Requirements 1.5, 5.3**

### Property 6: setData reflects in node

_For any_ valid `formData` object, calling `applyFormDataToNode(node, formData)` SHALL result in `node.getData()` returning an object that matches all fields of `formData`.

**Validates: Requirements 5.1**

### Property 7: NodeConfigStore state invariants

_For any_ sequence of `openPanel(nodeId)` and `closePanel()` calls: `isPanelOpen` SHALL be `true` if and only if `selectedNodeId` is not `null`; and calling `openPanel(id)` twice with the same `id` SHALL leave `selectedNodeId` unchanged (idempotent).

**Validates: Requirements 6.2, 6.5**

---

## Error Handling

| Tình huống                                  | Xử lý                                                                 |
| ------------------------------------------- | --------------------------------------------------------------------- |
| `selectedNodeId` không tìm thấy trong graph | `closePanel()` tự động, không crash                                   |
| `getGraph()` trả về `null`                  | Panel không render (v-if guard)                                       |
| Validation lỗi khi submit                   | Hiện inline error, block submit                                       |
| `node.setData()` throw                      | Catch, hiện error toast thay vì success                               |
| Node bị xóa khi panel đang mở               | Watch `selectedNodeId`, nếu node không còn tồn tại thì `closePanel()` |

---

## Testing Strategy

### Unit Tests (Vitest)

Tập trung vào các pure functions:

- `validateLabel(value: string): string | null` — kiểm tra empty, whitespace, max 32 chars
- `validateThreshold(entry: ThresholdEntry): string | null` — kiểm tra min < max
- `validateOpenPercent(value: number): string | null` — kiểm tra range [0, 100]
- `buildFormData(nodeShape: string, nodeData: Record<string, any>): NodeFormData` — kiểm tra mapping đúng field theo node type
- `NodeConfigStore` actions: `openPanel`, `closePanel`, `isPanelOpen`

### Property-Based Tests (fast-check, Vitest)

Dùng [fast-check](https://github.com/dubzzz/fast-check) — thư viện PBT cho TypeScript/JavaScript.

Mỗi property test chạy tối thiểu **100 iterations**.

**Property 1 — Label validation:**

```
// Feature: node-config-panel, Property 1: label validation rejects invalid inputs
fc.assert(fc.property(fc.string(), (s) => {
  const trimmed = s.trim()
  const result = validateLabel(s)
  if (trimmed.length === 0 || trimmed.length > 32) {
    expect(result).not.toBeNull()
  } else {
    expect(result).toBeNull()
  }
}))
```

**Property 2 — Threshold min < max:**

```
// Feature: node-config-panel, Property 2: threshold min < max invariant
fc.assert(fc.property(fc.float(), fc.float(), (min, max) => {
  const result = validateThreshold({ min, max, color: '#fff', label: 'x' })
  if (min >= max) expect(result).not.toBeNull()
  else expect(result).toBeNull()
}))
```

**Property 3 — Threshold count bounds:**

```
// Feature: node-config-panel, Property 3: threshold count bounds
fc.assert(fc.property(fc.integer({ min: 1, max: 5 }), (count) => {
  expect(canAddThreshold(count)).toBe(count < 5)
  expect(canRemoveThreshold(count)).toBe(count > 1)
}))
```

**Property 4 — openPercent range:**

```
// Feature: node-config-panel, Property 4: openPercent range invariant
fc.assert(fc.property(fc.float({ min: -200, max: 200 }), (v) => {
  const result = validateOpenPercent(v)
  if (v < 0 || v > 100) expect(result).not.toBeNull()
  else expect(result).toBeNull()
}))
```

**Property 5 — Form data round-trip:**

```
// Feature: node-config-panel, Property 5: form data round-trip
fc.assert(fc.property(arbitraryNodeData(), (nodeData) => {
  const form = buildFormData('data-tag', nodeData)
  expect(form.label).toBe(nodeData.label)
  expect(form.value).toBe(nodeData.value)
  expect(form.unit).toBe(nodeData.unit)
}))
```

**Property 6 — setData reflects in node** (dùng mock X6 node):

```
// Feature: node-config-panel, Property 6: setData reflects in node
fc.assert(fc.property(arbitraryFormData(), (formData) => {
  const mockNode = createMockNode()
  applyFormDataToNode(mockNode, formData)
  expect(mockNode.getData()).toMatchObject(formData)
}))
```

**Property 7 — NodeConfigStore state invariants:**

```
// Feature: node-config-panel, Property 7: NodeConfigStore state invariants
fc.assert(fc.property(fc.string({ minLength: 1 }), (nodeId) => {
  const store = useNodeConfigStore()
  store.openPanel(nodeId)
  expect(store.isPanelOpen).toBe(true)
  expect(store.selectedNodeId).toBe(nodeId)
  // Idempotence: calling openPanel again with same id
  store.openPanel(nodeId)
  expect(store.selectedNodeId).toBe(nodeId)
  store.closePanel()
  expect(store.isPanelOpen).toBe(false)
  expect(store.selectedNodeId).toBeNull()
}))
```

### Integration Tests

- Mở panel khi click node → form hiện đúng giá trị
- Lưu → node data thay đổi → component re-render
- Hủy → node data không thay đổi
- Click blank → panel đóng
- Click node khác khi panel đang mở → panel cập nhật

### Không dùng PBT cho:

- UI rendering (snapshot test nếu cần)
- Event wiring (GraphCanvas `node:click` → store) — dùng example-based test với mock graph
