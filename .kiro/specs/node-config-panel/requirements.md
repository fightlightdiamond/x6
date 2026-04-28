# Requirements Document

## Introduction

Tính năng **Node Configuration Panel** cho phép người dùng click vào bất kỳ node/component nào trên canvas SCADA (Nuxt 3 + AntV X6) để mở một panel cấu hình. Panel này cho phép thiết lập các thuộc tính của node như nhãn hiển thị, đơn vị đo, ngưỡng cảnh báo (threshold) kèm màu sắc tương ứng. Sau khi lưu, node trên canvas cập nhật ngay lập tức theo cấu hình mới mà không cần reload trang.

Các loại node hiện có: `esp-filter-tank`, `motor-blower`, `control-valve`, `data-tag`, `indicator-light`, `static-equipment`, `computer-device-node`, `my-vue-shape`.

## Glossary

- **Node**: Một phần tử đồ họa trên canvas AntV X6 đại diện cho thiết bị hoặc thông số SCADA (bồn lọc, van, cảm biến, v.v.)
- **Node_Config_Panel**: Component Vue hiển thị giao diện cấu hình khi người dùng click vào một node
- **NodeConfigStore**: Pinia store quản lý trạng thái của panel cấu hình (node đang được chọn, trạng thái mở/đóng)
- **Threshold**: Ngưỡng giá trị xác định mức độ cảnh báo (bình thường, cảnh báo, nguy hiểm) kèm màu sắc hiển thị
- **NodeData**: Đối tượng dữ liệu gắn với mỗi node X6, chứa các thuộc tính như `label`, `unit`, `thresholds`, v.v.
- **Graph**: Instance AntV X6 Graph quản lý toàn bộ canvas SCADA
- **Canvas**: Vùng vẽ đồ họa SCADA nơi các node được đặt và kết nối
- **Config_Schema**: Cấu trúc định nghĩa các trường cấu hình cho từng loại node
- **useX6Graph**: Composable Vue cung cấp truy cập vào Graph instance
- **GraphCanvas**: Component Vue chứa canvas X6 và xử lý sự kiện click node

---

## Requirements

### Requirement 1: Mở Panel Cấu Hình Khi Click Node

**User Story:** As a SCADA operator, I want to click on any node on the canvas to open a configuration panel, so that I can view and edit the node's settings without leaving the canvas.

#### Acceptance Criteria

1. WHEN a user clicks on a node on the canvas, THE Node_Config_Panel SHALL open and display the configuration form for that node.
2. WHEN a user clicks on an empty area of the canvas, THE Node_Config_Panel SHALL close if it is currently open.
3. WHEN a user clicks on a different node while the panel is open, THE Node_Config_Panel SHALL update to display the configuration of the newly selected node.
4. THE Node_Config_Panel SHALL display the node type identifier (e.g., "Bồn Lọc ESP", "Van Điều Khiển") as a read-only header.
5. WHEN the Node_Config_Panel opens, THE Node_Config_Panel SHALL pre-populate all fields with the current values from the node's NodeData.

---

### Requirement 2: Cấu Hình Nhãn và Đơn Vị Đo

**User Story:** As a SCADA engineer, I want to set a custom label and measurement unit for each node, so that the canvas reflects the actual equipment naming convention used in the plant.

#### Acceptance Criteria

1. THE Node_Config_Panel SHALL provide a text input field for editing the `label` property of the selected node.
2. WHERE the node type supports a unit of measurement (data-tag, esp-filter-tank, motor-blower), THE Node_Config_Panel SHALL provide a text input field for editing the `unit` property.
3. WHEN the user submits the configuration form, THE Node_Config_Panel SHALL validate that the `label` field is not empty and contains at most 32 characters.
4. IF the `label` field is empty or exceeds 32 characters, THEN THE Node_Config_Panel SHALL display an inline validation error message and prevent form submission.

---

### Requirement 3: Cấu Hình Ngưỡng Cảnh Báo (Thresholds)

**User Story:** As a SCADA engineer, I want to define threshold ranges with associated colors for each node, so that the node visually indicates the current operational state (normal, warning, danger).

#### Acceptance Criteria

1. WHERE the node type supports threshold configuration (esp-filter-tank, motor-blower, data-tag, control-valve), THE Node_Config_Panel SHALL display a threshold configuration section with up to 5 configurable threshold entries.
2. WHEN configuring a threshold entry, THE Node_Config_Panel SHALL provide: a numeric minimum value input, a numeric maximum value input, a color picker input, and a label input (e.g., "Bình thường", "Cảnh báo", "Nguy hiểm").
3. THE Node_Config_Panel SHALL provide default threshold entries: one entry with range [0, 50] color `#22c55e` label "Bình thường", one entry with range [50, 80] color `#f59e0b` label "Cảnh báo", one entry with range [80, 100] color `#ef4444` label "Nguy hiểm".
4. WHEN the user submits the configuration form, THE Node_Config_Panel SHALL validate that each threshold entry has a minimum value strictly less than its maximum value.
5. IF a threshold entry has a minimum value greater than or equal to its maximum value, THEN THE Node_Config_Panel SHALL display an inline validation error on that entry and prevent form submission.
6. THE Node_Config_Panel SHALL allow the user to add a new threshold entry by clicking an "Thêm ngưỡng" button, up to a maximum of 5 entries.
7. THE Node_Config_Panel SHALL allow the user to remove a threshold entry by clicking a delete button on that entry, maintaining a minimum of 1 entry.

---

### Requirement 4: Cấu Hình Thuộc Tính Đặc Thù Theo Loại Node

**User Story:** As a SCADA engineer, I want to configure node-type-specific properties, so that each equipment type can be tuned to its operational parameters.

#### Acceptance Criteria

1. WHERE the selected node is of type `control-valve`, THE Node_Config_Panel SHALL display a dropdown input for the `mode` property with options "AUTO" and "MANUAL".
2. WHERE the selected node is of type `control-valve`, THE Node_Config_Panel SHALL display a numeric input for the `openPercent` property with a valid range of 0 to 100.
3. WHERE the selected node is of type `indicator-light`, THE Node_Config_Panel SHALL display a dropdown input for the `color` property with options "green", "yellow", "red", "blue".
4. WHERE the selected node is of type `indicator-light`, THE Node_Config_Panel SHALL display a dropdown input for the `state` property with options "on" and "off".
5. WHERE the selected node is of type `esp-filter-tank`, THE Node_Config_Panel SHALL display numeric inputs for `voltage` (kV) and `current` (mA) properties.
6. WHERE the selected node is of type `motor-blower`, THE Node_Config_Panel SHALL display numeric inputs for `current` (A), `statorTemp` (°C), and `bearingTemp` (°C) properties.
7. WHERE the selected node is of type `data-tag`, THE Node_Config_Panel SHALL display a numeric input for `value` and a dropdown for `status` with options "normal", "warning", "alarm".

---

### Requirement 5: Lưu Cấu Hình và Cập Nhật Node Trên Canvas

**User Story:** As a SCADA operator, I want changes I make in the configuration panel to be immediately reflected on the canvas node, so that I can verify the visual result without closing the panel.

#### Acceptance Criteria

1. WHEN the user clicks the "Lưu" button in the Node_Config_Panel, THE Node_Config_Panel SHALL call `node.setData()` on the selected X6 node with the updated configuration values.
2. WHEN `node.setData()` is called, THE Graph SHALL trigger a `change:data` event causing the node's Vue component to re-render with the new values within 100ms.
3. WHEN the user clicks the "Hủy" button or closes the panel, THE Node_Config_Panel SHALL discard all unsaved changes and restore the form to the last saved values.
4. WHEN the configuration is saved successfully, THE Node_Config_Panel SHALL display a success notification for 2 seconds then auto-dismiss.
5. THE NodeConfigStore SHALL persist the selected node's ID so that the panel can be re-opened to the same node after a canvas re-render.

---

### Requirement 6: Quản Lý Trạng Thái Panel (NodeConfigStore)

**User Story:** As a developer, I want a centralized Pinia store to manage the panel's open/close state and selected node, so that any component in the application can trigger or observe the configuration panel.

#### Acceptance Criteria

1. THE NodeConfigStore SHALL expose a `selectedNodeId` state property of type `string | null`, initialized to `null`.
2. THE NodeConfigStore SHALL expose an `isPanelOpen` computed property that returns `true` when `selectedNodeId` is not `null`.
3. THE NodeConfigStore SHALL expose an `openPanel(nodeId: string)` action that sets `selectedNodeId` to the given `nodeId`.
4. THE NodeConfigStore SHALL expose a `closePanel()` action that sets `selectedNodeId` to `null`.
5. WHEN `openPanel` is called with the same `nodeId` as the current `selectedNodeId`, THE NodeConfigStore SHALL keep the panel open without resetting the form state.

---

### Requirement 7: Tích Hợp Sự Kiện Click Node Trong GraphCanvas

**User Story:** As a developer, I want the GraphCanvas component to listen for node click events and dispatch them to the NodeConfigStore, so that the configuration panel opens automatically when a node is clicked.

#### Acceptance Criteria

1. WHEN the Graph is initialized, THE GraphCanvas SHALL register a `node:click` event listener on the Graph instance.
2. WHEN a `node:click` event fires, THE GraphCanvas SHALL call `nodeConfigStore.openPanel(node.id)`.
3. WHEN a `cell:click` event fires on a non-node cell (edge), THE GraphCanvas SHALL NOT open the Node_Config_Panel.
4. WHEN a `blank:click` event fires on the canvas, THE GraphCanvas SHALL call `nodeConfigStore.closePanel()`.
5. WHEN the GraphCanvas component is unmounted, THE GraphCanvas SHALL remove all node click event listeners from the Graph instance to prevent memory leaks.

---

### Requirement 8: Giao Diện Panel Không Che Khuất Canvas

**User Story:** As a SCADA operator, I want the configuration panel to appear as a side panel or floating panel that does not fully obscure the canvas, so that I can see the node I am configuring while editing its properties.

#### Acceptance Criteria

1. THE Node_Config_Panel SHALL render as a fixed-position side panel on the right side of the viewport with a width of 320px.
2. THE Node_Config_Panel SHALL be scrollable vertically when its content exceeds the viewport height.
3. WHEN the Node_Config_Panel is open, THE Canvas SHALL remain fully interactive (panning, zooming, clicking other nodes).
4. THE Node_Config_Panel SHALL display a close button (×) in the top-right corner that calls `nodeConfigStore.closePanel()` when clicked.
5. THE Node_Config_Panel SHALL use a dark theme consistent with the existing SCADA dark background (`bg-gray-900`, `text-white`) to maintain visual coherence.
