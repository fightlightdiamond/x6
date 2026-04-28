# Requirements Document

## Introduction

Tính năng Layer Management cho phép người dùng tổ chức các node và edge trên SCADA canvas thành nhiều layer riêng biệt, tương tự như hệ thống layer trong Photoshop/Figma. Người dùng có thể tạo, đặt tên, tô màu, ẩn/hiện, khóa, xóa và sắp xếp thứ tự (z-order) các layer. Mỗi node/edge được gán vào một layer cụ thể; khi kéo thả node mới vào canvas, node đó tự động thuộc về layer đang active. Layer data được lưu cùng với graph data trong localStorage và file JSON export/import.

## Glossary

- **Layer_Manager**: Hệ thống quản lý layer, bao gồm store, composable và UI panel.
- **Layer**: Một nhóm logic chứa tập hợp các node và edge trên canvas. Mỗi layer có id, tên, màu nhãn, trạng thái visible và locked.
- **Active_Layer**: Layer đang được chọn để làm việc. Node mới kéo thả vào canvas sẽ tự động thuộc layer này.
- **Layer_Panel**: Floating panel hiển thị danh sách layer, có thể kéo di chuyển trên canvas.
- **Layer_Store**: Pinia store quản lý trạng thái toàn bộ layer (danh sách layer, active layer, mapping node→layer).
- **Graph_Canvas**: Canvas chính của ứng dụng SCADA, được render bởi AntV X6 trong `GraphCanvas.vue`.
- **Node**: Phần tử đồ họa trên canvas (DeviceNode, ControlValveNode, FilterTankNode, MotorBlowerNode, StaticEquipmentNode, DataTagNode, IndicatorLightNode).
- **Edge**: Đường kết nối giữa các node trên canvas.
- **Z_Order**: Thứ tự hiển thị theo chiều sâu (z-index) của các layer trên canvas.
- **Persistence_Service**: Dịch vụ lưu trữ dữ liệu graph và layer vào localStorage và file JSON.

## Requirements

### Requirement 1: Tạo và quản lý layer

**User Story:** As a SCADA designer, I want to create and manage multiple layers, so that I can organize nodes into logical groups for easier editing.

#### Acceptance Criteria

1. THE Layer_Manager SHALL provide a default layer named "Layer 1" when a new canvas is initialized.
2. WHEN the user clicks "Add Layer" in the Layer_Panel, THE Layer_Manager SHALL create a new layer with a unique auto-incremented name (e.g., "Layer 2", "Layer 3").
3. WHEN the user double-clicks a layer name in the Layer_Panel, THE Layer_Panel SHALL allow the user to rename the layer inline.
4. WHEN the user confirms a layer rename, THE Layer_Manager SHALL update the layer name and THE Layer_Panel SHALL reflect the new name immediately.
5. WHEN the user clicks "Delete Layer" for a layer that contains no nodes, THE Layer_Manager SHALL remove that layer.
6. IF the user attempts to delete a layer that contains nodes, THEN THE Layer_Manager SHALL display a confirmation dialog before deleting, and SHALL move all nodes in that layer to the Active_Layer.
7. IF the user attempts to delete the last remaining layer, THEN THE Layer_Manager SHALL reject the deletion and display an error message.
8. THE Layer_Manager SHALL support assigning a color label to each layer from a predefined palette of at least 8 colors.

---

### Requirement 2: Ẩn/hiện layer

**User Story:** As a SCADA designer, I want to toggle layer visibility, so that I can focus on specific parts of the diagram without deleting elements.

#### Acceptance Criteria

1. WHEN the user clicks the visibility toggle icon for a layer, THE Layer_Manager SHALL set that layer's visible property to false and THE Graph_Canvas SHALL hide all nodes and edges belonging to that layer.
2. WHEN the user clicks the visibility toggle icon for a hidden layer, THE Layer_Manager SHALL set that layer's visible property to true and THE Graph_Canvas SHALL show all nodes and edges belonging to that layer.
3. WHILE a layer is hidden, THE Layer_Manager SHALL prevent the user from selecting or interacting with nodes belonging to that layer on the Graph_Canvas.
4. WHILE a layer is hidden, THE Layer_Panel SHALL display the layer with a visual indicator (e.g., strikethrough name or dimmed icon) to distinguish it from visible layers.

---

### Requirement 3: Khóa layer

**User Story:** As a SCADA designer, I want to lock a layer, so that I can prevent accidental modification of finalized elements.

#### Acceptance Criteria

1. WHEN the user clicks the lock icon for a layer, THE Layer_Manager SHALL set that layer's locked property to true.
2. WHILE a layer is locked, THE Graph_Canvas SHALL prevent moving, resizing, and deleting any node belonging to that layer.
3. WHILE a layer is locked, THE Layer_Panel SHALL display a lock icon indicator on that layer row.
4. WHEN the user clicks the lock icon for a locked layer, THE Layer_Manager SHALL set that layer's locked property to false and restore full interactivity for nodes in that layer.
5. WHILE a layer is locked, THE Layer_Manager SHALL still allow the user to change the layer's visibility.

---

### Requirement 4: Sắp xếp thứ tự layer (Z-Order)

**User Story:** As a SCADA designer, I want to reorder layers by drag-and-drop, so that I can control which elements appear on top of others.

#### Acceptance Criteria

1. WHEN the user drags a layer row in the Layer_Panel to a new position, THE Layer_Manager SHALL update the layer order accordingly.
2. WHEN the layer order changes, THE Graph_Canvas SHALL update the z-index of all nodes and edges in each layer to reflect the new order, with layers higher in the list rendered on top.
3. THE Layer_Panel SHALL display layers in order from top (highest z-order) to bottom (lowest z-order).

---

### Requirement 5: Active Layer và gán node tự động

**User Story:** As a SCADA designer, I want newly dropped nodes to automatically belong to the active layer, so that I don't have to manually assign each node.

#### Acceptance Criteria

1. THE Layer_Manager SHALL maintain exactly one Active_Layer at all times.
2. WHEN the user clicks a layer row in the Layer_Panel, THE Layer_Manager SHALL set that layer as the Active_Layer and THE Layer_Panel SHALL highlight it visually.
3. WHEN a node is dropped onto the Graph_Canvas via drag-and-drop from the sidebar, THE Layer_Manager SHALL assign that node to the current Active_Layer.
4. WHILE the Active_Layer is locked, THE Layer_Manager SHALL prevent adding new nodes to it and SHALL display a warning message to the user.
5. WHILE the Active_Layer is hidden, THE Layer_Manager SHALL prevent adding new nodes to it and SHALL display a warning message to the user.

---

### Requirement 6: Gán node vào layer thủ công

**User Story:** As a SCADA designer, I want to select nodes on the canvas and assign them to a specific layer, so that I can reorganize existing elements.

#### Acceptance Criteria

1. WHEN the user selects one or more nodes on the Graph_Canvas and right-clicks, THE Graph_Canvas SHALL display a context menu with a "Move to Layer" option listing all available layers.
2. WHEN the user selects a target layer from the "Move to Layer" menu, THE Layer_Manager SHALL reassign all selected nodes to that target layer.
3. WHEN the user clicks a single node on the Graph_Canvas, THE Layer_Panel SHALL highlight the layer that the node belongs to.
4. THE Layer_Panel SHALL display the layer name of the currently selected node as a tooltip or status indicator.

---

### Requirement 7: Floating Layer Panel UI

**User Story:** As a SCADA designer, I want a floating layer panel that I can move around the canvas, so that it doesn't obstruct my work area.

#### Acceptance Criteria

1. THE Layer_Panel SHALL be rendered as a floating panel overlaid on the Graph_Canvas with a fixed initial position.
2. WHEN the user drags the Layer_Panel header, THE Layer_Panel SHALL follow the mouse and reposition accordingly within the viewport bounds.
3. THE Layer_Panel SHALL display a list of all layers with the following controls per row: visibility toggle icon, lock icon, color label indicator, layer name, and delete button.
4. THE Layer_Panel SHALL provide an "Add Layer" button at the bottom of the layer list.
5. WHEN the Layer_Panel is collapsed by the user, THE Layer_Panel SHALL minimize to a small icon/button that can re-expand the panel.
6. THE Layer_Panel SHALL remain visible and accessible above all other canvas elements (z-index priority).

---

### Requirement 8: Lưu trữ và khôi phục layer data

**User Story:** As a SCADA designer, I want layer configurations to be saved and restored automatically, so that my work is preserved across sessions.

#### Acceptance Criteria

1. WHEN the user saves the graph (via the "Lưu" button), THE Persistence_Service SHALL serialize all layer definitions (id, name, color, visible, locked, order) and the node-to-layer mapping into the saved data structure alongside existing graph data.
2. WHEN the user loads a saved graph (via the "Tải" button), THE Persistence_Service SHALL restore all layer definitions and node-to-layer assignments, and THE Layer_Manager SHALL apply visibility and lock states to the Graph_Canvas.
3. WHEN the user exports the graph to JSON, THE Persistence_Service SHALL include layer data in the exported JSON file.
4. WHEN the user imports a JSON file that contains layer data, THE Persistence_Service SHALL restore all layers and node assignments from the imported data.
5. IF the user imports a JSON file that does not contain layer data, THEN THE Persistence_Service SHALL assign all imported nodes to the default layer and SHALL NOT throw an error.
6. THE Persistence_Service SHALL maintain backward compatibility: graphs saved without layer data SHALL load correctly with all nodes assigned to a default layer.
