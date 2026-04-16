# Requirements: Màn hình SCADA ESP Hoàn chỉnh (esp-scada-screen)

## Giới thiệu

Xây dựng một màn hình SCADA công nghiệp hoàn chỉnh mô phỏng hệ thống lọc bụi tĩnh điện (Electrostatic Precipitator — ESP) hai tầng kiểu "Odprášení" (tiếng Czech: Khử bụi). Màn hình tái hiện trung thực giao diện SCADA công nghiệp thực tế với toolbar điều hướng, đồng hồ thời gian thực, sơ đồ P&ID cố định hai tầng (Tầng I và Tầng II), legend trạng thái thiết bị, và simulation dữ liệu realtime cho toàn bộ thiết bị.

Tính năng này xây dựng trên nền tảng Vue 3 + Nuxt + AntV X6 đã có sẵn, tái sử dụng các node component hiện có (FilterTankNode, MotorBlowerNode, ControlValveNode, DataTagNode, IndicatorLightNode, StaticEquipmentNode) và bổ sung một trang/chế độ xem SCADA chuyên dụng.

---

## Bảng thuật ngữ (Glossary)

- **SCADA_Screen**: Màn hình giao diện giám sát và điều khiển công nghiệp (Supervisory Control And Data Acquisition).
- **ESP_System**: Hệ thống lọc bụi tĩnh điện (Electrostatic Precipitator) hai tầng.
- **Stage_I**: Tầng lọc thứ nhất — bao gồm Cyclone, hai Ventilátor lớn, các van điều khiển và data tag.
- **Stage_II**: Tầng lọc thứ hai — bao gồm 4 bồn lọc ESP (Filtr 1–4), đường ống kết nối, bồn chứa nước.
- **SCADA_Toolbar**: Thanh công cụ nằm ngang phía trên màn hình chứa các nút điều hướng và chức năng.
- **Realtime_Clock**: Đồng hồ hiển thị ngày giờ hệ thống cập nhật mỗi giây.
- **Status_Badge**: Nhãn hiển thị trạng thái vận hành (AUTO/MANUAL/STOP) của hệ thống.
- **Device_Legend**: Bảng chú thích góc phải dưới hiển thị trạng thái từng thiết bị bằng đèn màu.
- **Demo_Layout**: Bố cục cố định được tải tự động, đặt tất cả node vào đúng vị trí theo sơ đồ P&ID.
- **Simulation_Engine**: Cơ chế cập nhật dữ liệu giả lập realtime cho tất cả thiết bị trên canvas.
- **Flow_Animation**: Hiệu ứng chuyển động trên đường ống khi hệ thống đang hoạt động.
- **Filtr**: Bồn lọc bụi tĩnh điện (tiếng Czech), tương đương "ESP Filter Tank".
- **Ventilátor**: Động cơ quạt hút công nghiệp (tiếng Czech), tương đương "Motor Blower".
- **Cyclone**: Thiết bị phễu thu bụi ly tâm ở đầu vào Stage_I.
- **Chimney**: Ống khói xả khí sạch sau khi qua hai tầng lọc.

---

## Yêu cầu

### Yêu cầu 1: Trang SCADA chuyên dụng

**User Story:** Là một kỹ sư vận hành, tôi muốn có một trang SCADA riêng biệt hiển thị toàn bộ hệ thống ESP, để tôi có thể giám sát hệ thống mà không bị phân tâm bởi các công cụ thiết kế.

#### Tiêu chí chấp nhận

1. THE SCADA_Screen SHALL cung cấp một route hoặc chế độ xem riêng biệt (ví dụ: `/scada` hoặc toggle từ trang chính) để hiển thị màn hình SCADA toàn màn hình.
2. WHEN người dùng truy cập SCADA_Screen, THE SCADA_Screen SHALL ẩn hoàn toàn AppSidebar kéo thả và các công cụ thiết kế.
3. THE SCADA_Screen SHALL hiển thị nền tối (màu `#0a0e1a` hoặc tương đương dark industrial) cho toàn bộ canvas.
4. WHEN SCADA_Screen được tải, THE SCADA_Screen SHALL tự động load Demo_Layout mà không cần thao tác thủ công của người dùng.
5. THE SCADA_Screen SHALL duy trì tỷ lệ hiển thị cố định (fixed viewport) không cho phép người dùng kéo thả hay di chuyển node.

---

### Yêu cầu 2: SCADA Toolbar

**User Story:** Là một kỹ sư vận hành, tôi muốn có thanh công cụ SCADA phía trên màn hình với các nút điều hướng quen thuộc, để tôi có thể điều hướng nhanh giữa các màn hình và chức năng.

#### Tiêu chí chấp nhận

1. THE SCADA_Toolbar SHALL hiển thị cố định ở phía trên cùng màn hình với nền tối (`#1a1f2e`) và chiều cao 48px.
2. THE SCADA_Toolbar SHALL chứa các nút sau theo thứ tự từ trái sang phải: **Uživatel**, **Alarmy**, **Eventy**, **Info**, **Stop**, **AutoPanel**, **Obrazy**, **Další**, **Trendy**, **Alarm**, **Jazyk**.
3. WHEN người dùng nhấn nút **Stop**, THE SCADA_Toolbar SHALL dừng Simulation_Engine và chuyển Status_Badge sang trạng thái "STOP" màu đỏ.
4. WHEN người dùng nhấn nút **AutoPanel**, THE SCADA_Toolbar SHALL khởi động Simulation_Engine và chuyển Status_Badge sang trạng thái "AUTO" màu xanh lá.
5. THE SCADA_Toolbar SHALL hiển thị Realtime_Clock ở góc phải với định dạng `DD.MM.YYYY HH:MM:SS`.
6. THE SCADA_Toolbar SHALL hiển thị Status_Badge ở góc trái với màu xanh lá (`#22c55e`) khi AUTO và màu đỏ (`#ef4444`) khi STOP.
7. WHEN Realtime_Clock đang hiển thị, THE SCADA_Screen SHALL cập nhật giá trị đồng hồ mỗi 1000ms.

---

### Yêu cầu 3: Demo Layout — Bố cục P&ID cố định

**User Story:** Là một kỹ sư vận hành, tôi muốn nhấn một nút "Load Demo" (hoặc tự động khi vào trang SCADA) để toàn bộ thiết bị được đặt đúng vị trí theo sơ đồ P&ID, để tôi không phải kéo thả thủ công từng node.

#### Tiêu chí chấp nhận

1. THE SCADA_Screen SHALL cung cấp hàm `loadDemoLayout()` tạo và đặt tất cả node vào tọa độ cố định trên X6 canvas.
2. WHEN `loadDemoLayout()` được gọi, THE SCADA_Screen SHALL tạo đúng các node sau trong Stage_II (Tầng II — phía trên):
   - 4 node `esp-filter-tank` (Filtr 1, 2, 3, 4) đặt ngang hàng, cách đều nhau.
   - 1 node `static-equipment` loại `hopper` (bồn chứa nước / water tank) bên phải.
3. WHEN `loadDemoLayout()` được gọi, THE SCADA_Screen SHALL tạo đúng các node sau trong Stage_I (Tầng I — phía dưới):
   - 1 node `static-equipment` loại `cyclone` (Cyclone/Hopper) bên trái.
   - 2 node `motor-blower` (Ventilátor 1, Ventilátor 2) kích thước large.
   - Các node `control-valve` tại các điểm kết nối van.
   - Các node `data-tag` hiển thị nhiệt độ (°C), áp suất (kPa), dòng điện (A).
4. WHEN `loadDemoLayout()` được gọi, THE SCADA_Screen SHALL tạo 1 node `static-equipment` loại `chimney` (Ống khói) ở bên phải màn hình.
5. WHEN `loadDemoLayout()` được gọi, THE SCADA_Screen SHALL tạo các edge loại `clean-air` kết nối toàn bộ thiết bị theo đúng luồng khí của hệ thống ESP.
6. IF `loadDemoLayout()` được gọi khi canvas đã có node, THEN THE SCADA_Screen SHALL xóa toàn bộ node và edge hiện có trước khi tạo layout mới.

---

### Yêu cầu 4: Hiển thị Stage II — Tầng lọc ESP

**User Story:** Là một kỹ sư vận hành, tôi muốn thấy rõ 4 bồn lọc ESP của Tầng II với thông số điện áp và dòng điện, để tôi có thể giám sát hiệu suất lọc bụi tĩnh điện.

#### Tiêu chí chấp nhận

1. THE SCADA_Screen SHALL hiển thị 4 node FilterTankNode (Filtr 1–4) với dữ liệu mặc định: voltage = 80.2 kV, current = 600 mA.
2. WHILE Simulation_Engine đang chạy, THE SCADA_Screen SHALL cập nhật voltage và current của mỗi Filtr mỗi 1500ms với biến động ngẫu nhiên (voltage ±2 kV, current ±50 mA).
3. THE SCADA_Screen SHALL hiển thị đường ống `clean-air` màu xanh dương kết nối ngang phía trên 4 bồn Filtr.
4. WHEN voltage của một Filtr vượt ngưỡng 90 kV hoặc dưới 60 kV, THE SCADA_Screen SHALL chuyển trạng thái node đó sang `lỗi` và hiển thị màu đỏ.
5. THE SCADA_Screen SHALL hiển thị nhãn "Odprášení II.stupeň" phía trên khu vực Stage_II.

---

### Yêu cầu 5: Hiển thị Stage I — Tầng lọc sơ cấp

**User Story:** Là một kỹ sư vận hành, tôi muốn thấy rõ hai động cơ quạt Ventilátor với đầy đủ thông số nhiệt độ và dòng điện, để tôi có thể phát hiện sớm nguy cơ quá nhiệt.

#### Tiêu chí chấp nhận

1. THE SCADA_Screen SHALL hiển thị 2 node MotorBlowerNode (Ventilátor 1, Ventilátor 2) với dữ liệu mặc định: current = 120.0 A, statorTemp = 65°C, bearingTemp = 45°C.
2. WHILE Simulation_Engine đang chạy, THE SCADA_Screen SHALL cập nhật current, statorTemp, bearingTemp của mỗi Ventilátor mỗi 1500ms.
3. THE SCADA_Screen SHALL hiển thị các node ControlValveNode với badge "AUTOMAT" và giá trị mặc định openPercent = 100%.
4. THE SCADA_Screen SHALL hiển thị node StaticEquipmentNode loại `cyclone` ở đầu vào Stage_I.
5. WHEN statorTemp của một Ventilátor vượt 85°C, THE SCADA_Screen SHALL chuyển trạng thái node đó sang `fault` và hiển thị màu đỏ.
6. THE SCADA_Screen SHALL hiển thị nhãn "Odprášení I.stupeň" phía trên khu vực Stage_I.

---

### Yêu cầu 6: Đường ống và Flow Animation

**User Story:** Là một kỹ sư vận hành, tôi muốn thấy hiệu ứng dòng chảy trên đường ống khi hệ thống đang hoạt động, để tôi có thể trực quan nhận biết luồng khí đang di chuyển.

#### Tiêu chí chấp nhận

1. THE SCADA_Screen SHALL hiển thị tất cả đường ống kết nối thiết bị bằng edge loại `clean-air` (màu xanh dương `#0ea5e9`, stroke-width 3).
2. WHILE Simulation_Engine đang chạy, THE SCADA_Screen SHALL kích hoạt Flow_Animation (CSS `stroke-dashoffset` animation) trên tất cả edge loại `clean-air`.
3. WHEN Simulation_Engine dừng, THE SCADA_Screen SHALL tắt Flow_Animation trên tất cả edge.
4. THE SCADA_Screen SHALL sử dụng router `manhattan` cho tất cả edge để đường ống tự động bẻ góc vuông.
5. THE SCADA_Screen SHALL hiển thị đường ống không có mũi tên (targetMarker: null) để phù hợp với ký hiệu P&ID công nghiệp.

---

### Yêu cầu 7: Device Legend — Bảng chú thích trạng thái

**User Story:** Là một kỹ sư vận hành, tôi muốn có bảng chú thích trạng thái thiết bị ở góc phải dưới màn hình, để tôi có thể nhanh chóng kiểm tra trạng thái tổng quan của tất cả thiết bị.

#### Tiêu chí chấp nhận

1. THE Device_Legend SHALL hiển thị cố định ở góc phải dưới màn hình SCADA với nền tối bán trong suốt.
2. THE Device_Legend SHALL liệt kê trạng thái của: Filtr 1, Filtr 2, Filtr 3, Filtr 4, Ventilátor 1, Ventilátor 2.
3. WHILE Simulation_Engine đang chạy, THE Device_Legend SHALL cập nhật màu đèn chỉ thị của từng thiết bị theo trạng thái thực tế: xanh lá = đang chạy bình thường, vàng = cảnh báo, đỏ = lỗi.
4. WHEN một thiết bị chuyển sang trạng thái lỗi, THE Device_Legend SHALL hiển thị đèn đỏ nhấp nháy (`animate-pulse`) cho thiết bị đó.
5. THE Device_Legend SHALL hiển thị tên thiết bị bằng tiếng Czech (Filtr 1–4, Ventilátor 1–2) để nhất quán với giao diện SCADA gốc.

---

### Yêu cầu 8: Simulation Engine realtime

**User Story:** Là một kỹ sư vận hành, tôi muốn dữ liệu trên màn hình SCADA thay đổi liên tục như hệ thống thực, để tôi có thể trải nghiệm và kiểm thử giao diện giám sát.

#### Tiêu chí chấp nhận

1. THE Simulation_Engine SHALL cập nhật dữ liệu tất cả thiết bị mỗi 1500ms khi đang chạy.
2. THE Simulation_Engine SHALL mô phỏng dữ liệu cho tất cả node trên canvas: esp-filter-tank, motor-blower, control-valve, data-tag.
3. WHEN Simulation_Engine khởi động, THE Simulation_Engine SHALL đặt trạng thái tất cả Ventilátor sang `running` và tất cả Filtr sang `chạy`.
4. WHEN Simulation_Engine dừng, THE Simulation_Engine SHALL đặt trạng thái tất cả Ventilátor sang `stopped` và tất cả Filtr sang `dừng`.
5. THE Simulation_Engine SHALL tự động phát hiện và xử lý ngưỡng cảnh báo: voltage Filtr ngoài [60, 90] kV → trạng thái `lỗi`; statorTemp Ventilátor > 85°C → trạng thái `fault`.
6. IF Simulation_Engine gặp lỗi trong quá trình cập nhật một node, THEN THE Simulation_Engine SHALL bỏ qua node đó và tiếp tục cập nhật các node còn lại.

---

### Yêu cầu 9: Tích hợp với hệ thống hiện có

**User Story:** Là một developer, tôi muốn màn hình SCADA tích hợp liền mạch với codebase Vue 3 + Nuxt + AntV X6 hiện có, để tôi không phải viết lại các component đã có.

#### Tiêu chí chấp nhận

1. THE SCADA_Screen SHALL tái sử dụng toàn bộ 6 node component hiện có (FilterTankNode, MotorBlowerNode, ControlValveNode, DataTagNode, IndicatorLightNode, StaticEquipmentNode) mà không sửa đổi component gốc.
2. THE SCADA_Screen SHALL tái sử dụng `useGraphMonitor` composable hiện có để điều khiển Simulation_Engine.
3. THE SCADA_Screen SHALL tái sử dụng `createIndustrialEdge()` và `createNodeConfig()` từ `nodeTemplates.ts` để tạo node và edge trong Demo_Layout.
4. THE SCADA_Screen SHALL đăng ký X6 graph với cùng cấu hình `registerAllVueNodes()` hiện có.
5. WHERE người dùng muốn quay lại chế độ thiết kế kéo thả, THE SCADA_Screen SHALL cung cấp nút hoặc link điều hướng trở về trang chính (`/`).

---

### Yêu cầu 10: Hiệu năng và trải nghiệm người dùng

**User Story:** Là một kỹ sư vận hành, tôi muốn màn hình SCADA phản hồi mượt mà và không bị giật lag, để tôi có thể sử dụng liên tục trong ca trực.

#### Tiêu chí chấp nhận

1. THE SCADA_Screen SHALL render toàn bộ Demo_Layout (tất cả node và edge) trong vòng 2 giây kể từ khi trang được tải.
2. WHILE Simulation_Engine đang chạy, THE SCADA_Screen SHALL duy trì frame rate tối thiểu 30fps (không có animation giật cục rõ ràng).
3. THE SCADA_Screen SHALL giải phóng tất cả interval và event listener khi component bị unmount để tránh memory leak.
4. THE SCADA_Screen SHALL vô hiệu hóa tính năng kéo thả node (node dragging) và kéo thả edge (edge creation) trên canvas SCADA để tránh người dùng vô tình thay đổi layout.
5. THE SCADA_Screen SHALL vô hiệu hóa context menu và selection box trên canvas SCADA.

---

## Correctness Properties (Property-Based Testing)

### PROP-01: Realtime_Clock — Tính đơn điệu tăng dần

- **Bất biến:** Mỗi lần cập nhật, giá trị đồng hồ phải lớn hơn hoặc bằng giá trị trước đó (thời gian không đi ngược).
- **Test:** Ghi lại 10 giá trị timestamp liên tiếp từ Realtime_Clock, kiểm tra `t[i+1] >= t[i]` với mọi i.

### PROP-02: Simulation_Engine — Dữ liệu luôn trong khoảng hợp lệ

- **Bất biến:** Sau bất kỳ số lần cập nhật nào, voltage của Filtr phải thuộc [40, 120] kV và current thuộc [0, 1200] mA.
- **Test:** Chạy Simulation_Engine 100 tick, kiểm tra tất cả giá trị voltage và current không vượt ngưỡng vật lý hợp lệ.

### PROP-03: Demo_Layout — Idempotence

- **Bất biến:** Gọi `loadDemoLayout()` nhiều lần liên tiếp phải cho kết quả giống nhau (cùng số lượng node, cùng vị trí, cùng dữ liệu mặc định).
- **Test:** Gọi `loadDemoLayout()` 3 lần, kiểm tra số lượng node và edge sau mỗi lần gọi là như nhau.

### PROP-04: Status_Badge — Nhất quán với Simulation_Engine

- **Bất biến:** Status_Badge phải luôn phản ánh đúng trạng thái của Simulation_Engine — "AUTO" khi đang chạy, "STOP" khi dừng.
- **Test:** Toggle Simulation_Engine on/off 20 lần, kiểm tra Status_Badge luôn đồng bộ với `isMonitoring`.

### PROP-05: Device_Legend — Đồng bộ với node data

- **Bất biến:** Màu đèn trong Device_Legend phải luôn khớp với trạng thái thực tế của node tương ứng trên canvas.
- **Test:** Với mọi tổ hợp trạng thái (chạy/dừng/lỗi) của 6 thiết bị, Device_Legend hiển thị đúng màu tương ứng.

---

## Ngoài phạm vi (Out of Scope)

- Kết nối backend/API thực tế hoặc OPC-UA/Modbus
- Lưu trữ lịch sử dữ liệu và trending chart thực
- Xác thực người dùng (nút "Uživatel" chỉ là placeholder UI)
- Điều khiển thiết bị thực (nút Stop/AutoPanel chỉ điều khiển simulation)
- Đa ngôn ngữ thực sự (nút "Jazyk" chỉ là placeholder UI)
- Xuất báo cáo PDF hoặc alarm log thực
- Responsive layout cho màn hình nhỏ hơn 1280px
