# Implementation Plan: Node Configuration Panel

## Overview

Thêm side panel cấu hình node vào trang thiết kế (`/`). Panel mở khi click node trên canvas X6, cho phép chỉnh sửa label, unit, thresholds và các thuộc tính đặc thù theo loại node. Thay đổi áp dụng ngay qua `node.setData()`.

## Tasks

- [x] 1. Tạo NodeConfigStore (Pinia)
  - Tạo file `app/stores/nodeConfigStore.ts`
  - State: `selectedNodeId: string | null = null`
  - Computed: `isPanelOpen` = `selectedNodeId !== null`
  - Actions: `openPanel(nodeId: string)`, `closePanel()`
  - `openPanel` với cùng id không reset state (idempotent)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]\* 1.1 Viết property test cho NodeConfigStore (Property 7)
    - **Property 7: NodeConfigStore state invariants**
    - **Validates: Requirements 6.2, 6.5**

- [x] 2. Tạo validation utils
  - Tạo file `app/utils/nodeConfigValidation.ts`
  - `validateLabel(value: string): string | null` — reject nếu empty sau trim hoặc > 32 ký tự
  - `validateThreshold(entry: ThresholdEntry): string | null` — reject nếu `min >= max`
  - `validateOpenPercent(value: number): string | null` — reject nếu ngoài [0, 100]
  - `canAddThreshold(count: number): boolean` — true nếu count < 5
  - `canRemoveThreshold(count: number): boolean` — true nếu count > 1
  - `buildFormData(nodeShape: string, nodeData: Record<string, any>): NodeFormData` — map đúng fields theo node type
  - `applyFormDataToNode(node: any, formData: NodeFormData): void` — gọi `node.setData()`
  - Export type `NodeFormData`, `ThresholdEntry`
  - _Requirements: 2.3, 2.4, 3.4, 3.5, 3.6, 3.7, 4.2_

  - [ ]\* 2.1 Viết property test cho validateLabel (Property 1)
    - **Property 1: Label validation rejects invalid inputs**
    - **Validates: Requirements 2.3, 2.4**

  - [ ]\* 2.2 Viết property test cho validateThreshold (Property 2)
    - **Property 2: Threshold min < max invariant**
    - **Validates: Requirements 3.4, 3.5**

  - [ ]\* 2.3 Viết property test cho threshold count bounds (Property 3)
    - **Property 3: Threshold count bounds**
    - **Validates: Requirements 3.6, 3.7**

  - [ ]\* 2.4 Viết property test cho validateOpenPercent (Property 4)
    - **Property 4: openPercent range invariant**
    - **Validates: Requirements 4.2**

  - [ ]\* 2.5 Viết property test cho buildFormData round-trip (Property 5)
    - **Property 5: Form data round-trip**
    - **Validates: Requirements 1.5, 5.3**

  - [ ]\* 2.6 Viết property test cho applyFormDataToNode (Property 6)
    - **Property 6: setData reflects in node**
    - **Validates: Requirements 5.1**

- [x] 3. Checkpoint — Chạy tests validation utils
  - Đảm bảo tất cả tests pass, hỏi nếu có vấn đề.

- [x] 4. Tạo NodeConfigPanel.vue
  - Tạo file `app/components/NodeConfigPanel.vue`
  - Props: `getGraph: () => Graph | null`
  - Đọc `selectedNodeId` từ `useNodeConfigStore`
  - Khi `selectedNodeId` thay đổi: lấy node từ graph, gọi `buildFormData()` để populate `formData`
  - Watch node bị xóa: nếu node không còn tồn tại thì `closePanel()`
  - _Requirements: 1.4, 1.5, 8.1, 8.2, 8.5_

  - [x] 4.1 Render header và close button
    - Hiện node type label (đọc từ `node.shape`, map sang tên tiếng Việt)
    - Nút × gọi `closePanel()`
    - Fixed right-0, w-320px, h-full, bg-gray-900, text-white, z-50
    - _Requirements: 1.4, 8.1, 8.4, 8.5_

  - [x] 4.2 Render section Label & Unit
    - Input text cho `label` (luôn hiện với mọi node type)
    - Input text cho `unit` (chỉ hiện với data-tag)
    - Hiện inline error nếu validation fail
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 4.3 Render section Thresholds
    - Chỉ hiện với: esp-filter-tank, motor-blower, data-tag, control-valve
    - Danh sách threshold entries: min input, max input, color picker, label input
    - Nút "Thêm ngưỡng" (disabled khi count = 5)
    - Nút xóa trên mỗi entry (disabled khi count = 1)
    - Default thresholds khi node chưa có: [{0,50,'#22c55e','Bình thường'}, {50,80,'#f59e0b','Cảnh báo'}, {80,100,'#ef4444','Nguy hiểm'}]
    - Hiện inline error nếu min >= max
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x] 4.4 Render section Type-specific fields
    - control-valve: dropdown `mode` (AUTO/MANUAL), number input `openPercent` [0-100]
    - indicator-light: dropdown `color` (green/yellow/red/blue), dropdown `state` (on/off)
    - esp-filter-tank: number inputs `voltage` (kV), `current` (mA)
    - motor-blower: number inputs `current` (A), `statorTemp` (°C), `bearingTemp` (°C)
    - data-tag: number input `value`, dropdown `status` (normal/warning/alarm)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [x] 4.5 Render section Actions + success toast
    - Nút "Lưu": validate toàn bộ form, nếu pass gọi `applyFormDataToNode()`, hiện success toast 2s
    - Nút "Hủy": reset `formData` về giá trị ban đầu khi panel mở
    - Catch lỗi từ `setData()`, hiện error toast thay vì success
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 5. Cập nhật GraphCanvas.vue
  - Import `useNodeConfigStore`
  - Sau khi `initGraph()`: đăng ký `node:click` → `nodeConfigStore.openPanel(node.id)`
  - Đăng ký `blank:click` → `nodeConfigStore.closePanel()`
  - Không mở panel khi click edge
  - Trong `onUnmounted` (hoặc cleanup): off các event listeners
  - Thêm `<NodeConfigPanel :get-graph="getGraph" />` vào template
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 8.3_

- [x] 6. Checkpoint cuối — Kiểm tra tích hợp
  - Đảm bảo tất cả tests pass, hỏi nếu có vấn đề.

## Notes

- Tasks đánh dấu `*` là optional, có thể bỏ qua để implement nhanh hơn
- Validation utils tách riêng để dễ test độc lập với Vue
- `buildFormData` và `applyFormDataToNode` là pure functions (không phụ thuộc Vue reactivity)
- Panel không dùng teleport, render bên ngoài canvas để tránh xung đột X6
