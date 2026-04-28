# Implementation Plan: SCADA Layer Management

## Overview

Triển khai hệ thống Layer Management cho SCADA canvas theo kiến trúc đã thiết kế:
Pinia store (`useLayerStore`) là single source of truth, `useLayerManager` composable xử lý side effects lên X6 graph, `LayerPanel.vue` là floating UI panel, và `useGraphPersistence` được mở rộng để serialize/deserialize layer data.

## Tasks

- [x] 1. Tạo `useLayerStore` — Pinia store quản lý trạng thái layer
  - [x] 1.1 Định nghĩa types và interfaces cho Layer system
    - Tạo file `x6/app/types/layer.ts` với interfaces: `Layer`, `LayerState`, `LayerExportData`, `DeleteLayerResult`
    - Định nghĩa constant `LAYER_COLORS` palette (8 màu)
    - _Requirements: 1.1, 1.8, 8.1_

  - [x] 1.2 Implement `useLayerStore` với state và actions cơ bản
    - Tạo file `x6/app/stores/layerStore.ts`
    - State: `layers: Layer[]`, `activeLayerId: string`, `nodeLayerMap: Record<string, string>`
    - Actions: `initDefault()`, `addLayer()`, `renameLayer(id, name)`, `setActiveLayer(id)`
    - Actions: `setVisible(id, visible)`, `setLocked(id, locked)`, `setColor(id, color)`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 3.1, 3.4, 5.1, 5.2_

  - [x] 1.3 Implement delete layer actions với validation
    - Action `deleteLayer(id)` trả về `DeleteLayerResult`
    - Guard: reject nếu chỉ còn 1 layer (trả về `{ ok: false, error: 'LAST_LAYER' }`)
    - Guard: nếu layer có nodes → trả về `{ ok: false, error: 'HAS_NODES', nodeIds }` để UI xử lý confirm
    - Action `deleteLayerConfirmed(id)` — move nodes sang activeLayer rồi xóa
    - _Requirements: 1.5, 1.6, 1.7_

  - [x] 1.4 Implement node assignment và reorder actions
    - Actions: `assignNode(nodeId, layerId)`, `assignNodes(nodeIds, layerId)`, `getLayerOfNode(nodeId)`
    - Action `reorderLayers(fromIndex, toIndex)` — cập nhật thứ tự và `order` field
    - _Requirements: 4.1, 5.3, 6.2_

  - [x] 1.5 Implement serialization actions
    - Action `exportLayerData()` → trả về `LayerExportData`
    - Action `importLayerData(data)` → restore state, fallback `initDefault()` nếu data invalid
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [ ]\* 1.6 Viết property tests cho `useLayerStore`
    - **Property 1: Auto-increment layer name uniqueness** — `addLayer()` tạo tên chưa tồn tại
    - **Validates: Requirements 1.2**
    - **Property 2: Layer rename updates name** — `renameLayer(id, newName)` → `layer.name === newName`
    - **Validates: Requirements 1.4**
    - **Property 3: Deleting an empty layer removes it** — layer không có nodes bị xóa, length giảm 1
    - **Validates: Requirements 1.5**
    - **Property 4: Deleting a non-empty layer moves nodes to active layer**
    - **Validates: Requirements 1.6**
    - **Property 5: At least one layer always exists** — xóa layer duy nhất bị reject
    - **Validates: Requirements 1.7**
    - **Property 6: Visibility round-trip** — `setVisible(false)` → `setVisible(true)` → `visible === true`
    - **Validates: Requirements 2.1, 2.2**
    - **Property 8: Lock round-trip** — `setLocked(true)` → `setLocked(false)` → `locked === false`
    - **Validates: Requirements 3.1, 3.4**
    - **Property 9: Lock doesn't block visibility** — layer locked vẫn toggle visible được
    - **Validates: Requirements 3.5**
    - **Property 10: Reorder correctness** — layer tại index `i` sau reorder nằm tại index `j`
    - **Validates: Requirements 4.1**
    - **Property 12: Exactly one active layer at all times**
    - **Validates: Requirements 5.1**
    - **Property 13: Node drop assigns to active layer**
    - **Validates: Requirements 5.3**
    - **Property 14: Blocked active layer prevents node assignment**
    - **Validates: Requirements 5.4, 5.5**
    - **Property 15: Bulk node reassignment** — `assignNodes(S, targetId)` → mọi node trong S có đúng layerId
    - **Validates: Requirements 6.2**
    - **Property 16: Layer data serialization round-trip** — `exportLayerData()` → `importLayerData()` → state khớp
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**
    - Tạo file `x6/app/stores/layerStore.pbt.spec.ts` dùng `fast-check` + `vitest`

- [x] 2. Checkpoint — Đảm bảo store logic hoạt động đúng
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Implement `useLayerManager` — composable cầu nối store và X6 graph
  - [x] 3.1 Tạo skeleton và watcher visibility/lock
    - Tạo file `x6/app/composables/useLayerManager.ts`
    - Nhận `getGraph: () => Graph | null` làm tham số
    - Watcher `layers` → `applyVisibilityToCanvas()`: gọi `node.setVisible()` và set `pointerEvents`
    - Watcher `layers` → `applyLockToCanvas()`: set `interacting` per-node dựa trên `locked`
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.4_

  - [x] 3.2 Implement z-order sync
    - Watcher `layers` → `applyZOrderToCanvas()`: tính `zIndex` từ `layer.order` và gán cho từng node
    - Layers có `order` cao hơn → nodes có `zIndex` cao hơn
    - _Requirements: 4.2_

  - [x] 3.3 Implement node assignment handlers
    - `onNodeAdded(node)` — gọi `layerStore.assignNode(node.id, activeLayerId)` khi `node:added` event
    - `onNodeDropped(node)` — kiểm tra active layer locked/hidden, trả về `false` nếu bị block
    - Hiển thị warning toast khi bị block (dùng `console.warn` hoặc toast utility)
    - _Requirements: 5.3, 5.4, 5.5_

  - [ ]\* 3.4 Viết property tests cho `useLayerManager` canvas sync
    - **Property 7: Hidden layer blocks node interaction** — nodes của hidden layer có `isVisible() === false`
    - **Validates: Requirements 2.3**
    - **Property 11: Z-order invariant after reorder** — nodes của layer index `i` có zIndex cao hơn layer index `i+1`
    - **Validates: Requirements 4.2**
    - Tạo file `x6/app/composables/useLayerManager.spec.ts` với mock X6 graph

- [x] 4. Tạo `LayerPanel.vue` — Floating panel UI
  - [x] 4.1 Tạo skeleton component với draggable header
    - Tạo file `x6/app/components/LayerPanel.vue`
    - Floating panel với `position: fixed`, initial position top-right
    - Draggable header dùng `mousedown` + `mousemove` + `mouseup`, clamp trong viewport bounds
    - Collapse/expand toggle button
    - _Requirements: 7.1, 7.2, 7.5, 7.6_

  - [x] 4.2 Implement layer list với controls per row
    - `v-for` qua `layerStore.layers`
    - Mỗi row: ColorDot, VisibilityToggle (eye icon), LockToggle (lock icon), LayerName, DeleteButton
    - Visual indicator khi layer hidden (dimmed/strikethrough) và locked (lock icon)
    - Click row → `layerStore.setActiveLayer(id)`, highlight active row
    - _Requirements: 7.3, 2.4, 3.3, 5.2_

  - [x] 4.3 Implement inline rename và Add Layer button
    - Double-click layer name → `<input>` inline edit, confirm on Enter/blur, cancel on Escape
    - Validate: reject nếu tên rỗng sau trim
    - "Add Layer" button ở cuối list → `layerStore.addLayer()`
    - _Requirements: 1.2, 1.3, 1.4, 7.4_

  - [x] 4.4 Implement delete với ConfirmDialog
    - Click delete → kiểm tra `deleteLayer(id)` result
    - Nếu `error === 'LAST_LAYER'` → hiển thị error toast
    - Nếu `error === 'HAS_NODES'` → hiển thị `<ConfirmDialog>` inline, confirm → `deleteLayerConfirmed(id)`
    - _Requirements: 1.5, 1.6, 1.7_

  - [x] 4.5 Implement drag-to-reorder layer rows
    - HTML5 Drag and Drop API: `draggable`, `dragover`, `drop` trên layer rows
    - Gọi `layerStore.reorderLayers(fromIndex, toIndex)` khi drop
    - Visual feedback khi đang drag (highlight drop target)
    - _Requirements: 4.1, 4.3_

  - [ ]\* 4.6 Viết unit tests cho LayerPanel rendering
    - **Property 17: Layer row renders all required controls** — mỗi row có đủ 5 controls
    - **Validates: Requirements 7.3**
    - Tạo file `x6/app/components/LayerPanel.spec.ts` dùng `@vue/test-utils` + `vitest`

- [x] 5. Mở rộng `useGraphPersistence` để serialize/deserialize layer data
  - [x] 5.1 Inject layer data vào save/export
    - Import `useLayerStore` trong `useGraphPersistence.ts`
    - `saveGraph()`: merge `layerStore.exportLayerData()` vào JSON trước khi lưu localStorage
    - `exportJSON()`: include layer data trong file JSON export
    - _Requirements: 8.1, 8.3_

  - [x] 5.2 Extract và restore layer data khi load/import
    - `loadGraph()`: sau `graph.fromJSON()`, gọi `layerStore.importLayerData(json.layers)` hoặc `initDefault()`
    - `importJSON()`: tương tự, xử lý cả trường hợp không có layer data (backward compat)
    - `clearGraph()`: reset layer store về default
    - _Requirements: 8.2, 8.4, 8.5, 8.6_

- [x] 6. Tích hợp context menu "Move to Layer" vào `GraphCanvas.vue`
  - [x] 6.1 Thêm context menu component
    - Thêm reactive state `contextMenu: { visible, x, y, nodeIds }` trong `GraphCanvas.vue`
    - Lắng nghe X6 event `node:contextmenu` → populate context menu với danh sách layers từ store
    - Render `<div>` absolute positioned với list layer options
    - Click outside → đóng menu
    - _Requirements: 6.1_

  - [x] 6.2 Xử lý "Move to Layer" action
    - Khi user chọn layer từ context menu → `layerStore.assignNodes(selectedNodeIds, targetLayerId)`
    - Sau khi reassign → trigger `applyVisibilityToCanvas()` và `applyZOrderToCanvas()` để sync canvas
    - _Requirements: 6.2_

  - [x] 6.3 Highlight layer khi click node
    - Lắng nghe X6 event `node:click` → `layerStore.getLayerOfNode(nodeId)` → `layerStore.setActiveLayer(layerId)`
    - Layer panel tự động highlight layer tương ứng (reactive qua store)
    - _Requirements: 6.3, 6.4_

- [x] 7. Wire tất cả components vào `GraphCanvas.vue` và `index.vue`
  - [x] 7.1 Khởi tạo `useLayerManager` trong `GraphCanvas.vue`
    - Import và gọi `useLayerManager(getGraph)` trong `onMounted`
    - Đăng ký X6 event `node:added` → `onNodeAdded`
    - Đảm bảo `layerStore.initDefault()` được gọi khi graph khởi tạo lần đầu
    - _Requirements: 1.1, 5.3_

  - [x] 7.2 Mount `LayerPanel.vue` vào `GraphCanvas.vue`
    - Thêm `<LayerPanel />` vào template của `GraphCanvas.vue`
    - Đảm bảo z-index cao hơn canvas elements
    - _Requirements: 7.1, 7.6_

  - [x] 7.3 Kiểm tra backward compatibility
    - Load một graph JSON cũ (không có layer data) → verify không throw error
    - Verify tất cả nodes được assign vào default layer
    - _Requirements: 8.5, 8.6_

- [x] 8. Checkpoint cuối — Đảm bảo toàn bộ tính năng hoạt động đúng
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks đánh dấu `*` là optional, có thể bỏ qua để triển khai MVP nhanh hơn
- Mỗi task tham chiếu requirements cụ thể để đảm bảo traceability
- Property tests dùng `fast-check` (đã có trong ecosystem Vitest/Nuxt)
- Checkpoints tại task 2 và 8 để validate incremental progress
- `useLayerStore` là pure state logic (không phụ thuộc DOM/X6) → dễ test nhất, làm trước
- `useLayerManager` cần mock X6 graph instance trong tests
