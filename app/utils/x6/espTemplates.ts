/**
 * ESP System Layout Templates
 *
 * Mỗi template là một hàm nhận `graph` và load sẵn một sơ đồ P&ID cụ thể.
 * Chỉnh sửa tọa độ, số lượng node, hoặc data mặc định theo nhu cầu.
 *
 * Cách dùng:
 *   import { ESP_TEMPLATES } from '~/utils/x6/espTemplates'
 *   ESP_TEMPLATES['2-stage-full'].load(graph)
 */

import { createNodeConfig, createIndustrialEdge } from "./nodeTemplates";

export interface EspTemplate {
  id: string;
  name: string;
  description: string;
  load: (graph: any) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────────────────

function stageLabel(graph: any, text: string, x: number, y: number) {
  graph.addNode({
    shape: "rect",
    x,
    y,
    width: 220,
    height: 24,
    label: text,
    attrs: {
      body: { fill: "transparent", stroke: "none" },
      label: { fill: "#94a3b8", fontSize: 12, fontWeight: 600 },
    },
    data: { isLabel: true },
  });
}

function edge(
  graph: any,
  sourceCell: string,
  sourcePort: string,
  targetCell: string,
  targetPort: string,
  type: "clean-air" | "gas" | "signal" = "clean-air",
) {
  graph.addEdge({
    ...createIndustrialEdge(type),
    source: { cell: sourceCell, port: sourcePort },
    target: { cell: targetCell, port: targetPort },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Template 1: Hệ thống ESP 2 tầng đầy đủ (Odprášení — bản gốc)
// ─────────────────────────────────────────────────────────────────────────────

function loadTwoStageFull(graph: any) {
  graph.clearCells();

  // Stage II — 4 bồn lọc + hopper
  for (let i = 1; i <= 4; i++) {
    graph.addNode({
      id: `filtr-${i}`,
      ...createNodeConfig("esp-filter-tank", `Filtr ${i}`),
      x: 150 + (i - 1) * 160,
      y: 80,
      data: {
        label: `Filtr ${i}`,
        status: "dừng",
        voltage: 80.2,
        current: 600,
      },
    });
  }
  graph.addNode({
    id: "hopper-1",
    ...createNodeConfig("static-equipment", "Hopper 1"),
    x: 810,
    y: 80,
    width: 80,
    height: 120,
    data: { equipmentType: "hopper", label: "Hopper 1" },
  });

  // Stage I — cyclone, 2 vent, 2 valve, 2 data tag
  graph.addNode({
    id: "cyclone-1",
    ...createNodeConfig("static-equipment", "Cyclone 1"),
    x: 60,
    y: 360,
    width: 80,
    height: 120,
    data: { equipmentType: "cyclone", label: "Cyclone 1" },
  });
  graph.addNode({
    id: "valve-1",
    ...createNodeConfig("control-valve", "Van 1"),
    x: 190,
    y: 380,
    data: { label: "Van 1", mode: "AUTO", openPercent: 100 },
  });
  graph.addNode({
    id: "vent-1",
    ...createNodeConfig("motor-blower", "Ventilátor 1"),
    x: 310,
    y: 340,
    data: {
      label: "Ventilátor 1",
      status: "stopped",
      current: 120,
      statorTemp: 65,
      bearingTemp: 45,
      size: "large",
    },
  });
  graph.addNode({
    id: "valve-2",
    ...createNodeConfig("control-valve", "Van 2"),
    x: 490,
    y: 380,
    data: { label: "Van 2", mode: "AUTO", openPercent: 100 },
  });
  graph.addNode({
    id: "vent-2",
    ...createNodeConfig("motor-blower", "Ventilátor 2"),
    x: 610,
    y: 340,
    data: {
      label: "Ventilátor 2",
      status: "stopped",
      current: 120,
      statorTemp: 65,
      bearingTemp: 45,
      size: "large",
    },
  });
  graph.addNode({
    id: "tag-temp",
    ...createNodeConfig("data-tag", "TEMP-01"),
    x: 800,
    y: 350,
    data: { label: "TEMP-01", value: 65.0, unit: "°C", status: "normal" },
  });
  graph.addNode({
    id: "tag-pres",
    ...createNodeConfig("data-tag", "PRES-01"),
    x: 800,
    y: 430,
    data: { label: "PRES-01", value: 101.3, unit: "kPa", status: "normal" },
  });

  // Chimney
  graph.addNode({
    id: "chimney-1",
    ...createNodeConfig("static-equipment-chimney", "Chimney 1"),
    x: 1000,
    y: 180,
    width: 60,
    height: 160,
    data: { equipmentType: "chimney", label: "Chimney 1" },
  });

  // Edges — Stage II chain
  edge(graph, "filtr-1", "port_right", "filtr-2", "port_left");
  edge(graph, "filtr-2", "port_right", "filtr-3", "port_left");
  edge(graph, "filtr-3", "port_right", "filtr-4", "port_left");
  edge(graph, "filtr-4", "port_right", "hopper-1", "port_left");

  // Edges — Stage I chain
  edge(graph, "cyclone-1", "port_right", "valve-1", "port_left");
  edge(graph, "valve-1", "port_right", "vent-1", "port_left");
  edge(graph, "vent-1", "port_right", "valve-2", "port_left");
  edge(graph, "valve-2", "port_right", "vent-2", "port_left");

  // Stage I → Stage II
  edge(graph, "vent-2", "port_top", "filtr-1", "port_bottom");

  // Vent 2 → Chimney
  edge(graph, "vent-2", "port_right", "chimney-1", "port_left");

  // Labels
  stageLabel(graph, "Odprášení II.stupeň", 150, 30);
  stageLabel(graph, "Odprášení I.stupeň", 60, 300);
}

// ─────────────────────────────────────────────────────────────────────────────
// Template 2: Hệ thống ESP 1 tầng đơn giản (nhà máy nhỏ)
// ─────────────────────────────────────────────────────────────────────────────

function loadSingleStage(graph: any) {
  graph.clearCells();

  // 2 bồn lọc
  graph.addNode({
    id: "filtr-1",
    ...createNodeConfig("esp-filter-tank", "Filtr 1"),
    x: 200,
    y: 150,
    data: { label: "Filtr 1", status: "dừng", voltage: 80.2, current: 600 },
  });
  graph.addNode({
    id: "filtr-2",
    ...createNodeConfig("esp-filter-tank", "Filtr 2"),
    x: 380,
    y: 150,
    data: { label: "Filtr 2", status: "dừng", voltage: 80.2, current: 600 },
  });

  // Cyclone đầu vào
  graph.addNode({
    id: "cyclone-1",
    ...createNodeConfig("static-equipment", "Cyclone 1"),
    x: 60,
    y: 160,
    width: 80,
    height: 120,
    data: { equipmentType: "cyclone", label: "Cyclone 1" },
  });

  // 1 vent
  graph.addNode({
    id: "vent-1",
    ...createNodeConfig("motor-blower", "Ventilátor 1"),
    x: 560,
    y: 140,
    data: {
      label: "Ventilátor 1",
      status: "stopped",
      current: 120,
      statorTemp: 65,
      bearingTemp: 45,
      size: "large",
    },
  });

  // Van + data tag
  graph.addNode({
    id: "valve-1",
    ...createNodeConfig("control-valve", "Van 1"),
    x: 140,
    y: 175,
    data: { label: "Van 1", mode: "AUTO", openPercent: 100 },
  });
  graph.addNode({
    id: "tag-temp",
    ...createNodeConfig("data-tag", "TEMP-01"),
    x: 560,
    y: 320,
    data: { label: "TEMP-01", value: 65.0, unit: "°C", status: "normal" },
  });

  // Chimney
  graph.addNode({
    id: "chimney-1",
    ...createNodeConfig("static-equipment-chimney", "Chimney 1"),
    x: 760,
    y: 120,
    width: 60,
    height: 160,
    data: { equipmentType: "chimney", label: "Chimney 1" },
  });

  // Edges
  edge(graph, "cyclone-1", "port_right", "valve-1", "port_left");
  edge(graph, "valve-1", "port_right", "filtr-1", "port_left");
  edge(graph, "filtr-1", "port_right", "filtr-2", "port_left");
  edge(graph, "filtr-2", "port_right", "vent-1", "port_left");
  edge(graph, "vent-1", "port_right", "chimney-1", "port_left");

  stageLabel(graph, "Hệ thống ESP 1 tầng", 60, 80);
}

// ─────────────────────────────────────────────────────────────────────────────
// Template 3: Hệ thống ESP song song (2 dây chuyền độc lập)
// ─────────────────────────────────────────────────────────────────────────────

function loadParallelLines(graph: any) {
  graph.clearCells();

  // Dây chuyền A (trên)
  for (let i = 1; i <= 3; i++) {
    graph.addNode({
      id: `line-a-filtr-${i}`,
      ...createNodeConfig("esp-filter-tank", `Filtr A${i}`),
      x: 200 + (i - 1) * 160,
      y: 80,
      data: {
        label: `Filtr A${i}`,
        status: "dừng",
        voltage: 80.2,
        current: 600,
      },
    });
  }
  graph.addNode({
    id: "line-a-cyclone",
    ...createNodeConfig("static-equipment", "Cyclone A"),
    x: 60,
    y: 90,
    width: 80,
    height: 120,
    data: { equipmentType: "cyclone", label: "Cyclone A" },
  });
  graph.addNode({
    id: "line-a-vent",
    ...createNodeConfig("motor-blower", "Vent A"),
    x: 700,
    y: 70,
    data: {
      label: "Vent A",
      status: "stopped",
      current: 120,
      statorTemp: 65,
      bearingTemp: 45,
      size: "large",
    },
  });

  // Dây chuyền B (dưới)
  for (let i = 1; i <= 3; i++) {
    graph.addNode({
      id: `line-b-filtr-${i}`,
      ...createNodeConfig("esp-filter-tank", `Filtr B${i}`),
      x: 200 + (i - 1) * 160,
      y: 320,
      data: {
        label: `Filtr B${i}`,
        status: "dừng",
        voltage: 80.2,
        current: 600,
      },
    });
  }
  graph.addNode({
    id: "line-b-cyclone",
    ...createNodeConfig("static-equipment", "Cyclone B"),
    x: 60,
    y: 330,
    width: 80,
    height: 120,
    data: { equipmentType: "cyclone", label: "Cyclone B" },
  });
  graph.addNode({
    id: "line-b-vent",
    ...createNodeConfig("motor-blower", "Vent B"),
    x: 700,
    y: 310,
    data: {
      label: "Vent B",
      status: "stopped",
      current: 120,
      statorTemp: 65,
      bearingTemp: 45,
      size: "large",
    },
  });

  // Chimney chung
  graph.addNode({
    id: "chimney-main",
    ...createNodeConfig("static-equipment-chimney", "Chimney"),
    x: 920,
    y: 160,
    width: 60,
    height: 160,
    data: { equipmentType: "chimney", label: "Chimney" },
  });

  // Indicator lights trạng thái từng dây
  graph.addNode({
    id: "light-a",
    ...createNodeConfig("indicator-light", "Line A"),
    x: 870,
    y: 80,
    data: { label: "Line A", state: "off", color: "green" },
  });
  graph.addNode({
    id: "light-b",
    ...createNodeConfig("indicator-light", "Line B"),
    x: 870,
    y: 320,
    data: { label: "Line B", state: "off", color: "green" },
  });

  // Edges — Line A
  edge(graph, "line-a-cyclone", "port_right", "line-a-filtr-1", "port_left");
  edge(graph, "line-a-filtr-1", "port_right", "line-a-filtr-2", "port_left");
  edge(graph, "line-a-filtr-2", "port_right", "line-a-filtr-3", "port_left");
  edge(graph, "line-a-filtr-3", "port_right", "line-a-vent", "port_left");
  edge(graph, "line-a-vent", "port_right", "chimney-main", "port_top");

  // Edges — Line B
  edge(graph, "line-b-cyclone", "port_right", "line-b-filtr-1", "port_left");
  edge(graph, "line-b-filtr-1", "port_right", "line-b-filtr-2", "port_left");
  edge(graph, "line-b-filtr-2", "port_right", "line-b-filtr-3", "port_left");
  edge(graph, "line-b-filtr-3", "port_right", "line-b-vent", "port_left");
  edge(graph, "line-b-vent", "port_right", "chimney-main", "port_bottom");

  stageLabel(graph, "Dây chuyền A", 60, 30);
  stageLabel(graph, "Dây chuyền B", 60, 270);
}

// ─────────────────────────────────────────────────────────────────────────────
// Template 4: Trạm giám sát đơn giản (chỉ data tags + indicators)
// ─────────────────────────────────────────────────────────────────────────────

function loadMonitoringStation(graph: any) {
  graph.clearCells();

  const tags = [
    {
      id: "tag-temp-1",
      label: "TEMP-01",
      value: 65.0,
      unit: "°C",
      x: 80,
      y: 80,
    },
    {
      id: "tag-temp-2",
      label: "TEMP-02",
      value: 72.5,
      unit: "°C",
      x: 80,
      y: 180,
    },
    {
      id: "tag-pres-1",
      label: "PRES-01",
      value: 101.3,
      unit: "kPa",
      x: 80,
      y: 280,
    },
    {
      id: "tag-pres-2",
      label: "PRES-02",
      value: 98.7,
      unit: "kPa",
      x: 80,
      y: 380,
    },
    {
      id: "tag-curr-1",
      label: "CURR-01",
      value: 120.0,
      unit: "A",
      x: 80,
      y: 480,
    },
    {
      id: "tag-volt-1",
      label: "VOLT-01",
      value: 80.2,
      unit: "kV",
      x: 80,
      y: 580,
    },
  ];

  const lights = [
    {
      id: "light-run",
      label: "RUN",
      state: "on",
      color: "green",
      x: 280,
      y: 80,
    },
    {
      id: "light-fault",
      label: "FAULT",
      state: "off",
      color: "red",
      x: 280,
      y: 180,
    },
    {
      id: "light-warn",
      label: "WARN",
      state: "off",
      color: "yellow",
      x: 280,
      y: 280,
    },
    {
      id: "light-stop",
      label: "STOP",
      state: "off",
      color: "red",
      x: 280,
      y: 380,
    },
  ];

  tags.forEach((t) => {
    graph.addNode({
      id: t.id,
      ...createNodeConfig("data-tag", t.label),
      x: t.x,
      y: t.y,
      data: { label: t.label, value: t.value, unit: t.unit, status: "normal" },
    });
  });

  lights.forEach((l) => {
    graph.addNode({
      id: l.id,
      ...createNodeConfig("indicator-light", l.label),
      x: l.x,
      y: l.y,
      data: { label: l.label, state: l.state, color: l.color },
    });
  });

  // Signal edges: tags → lights
  edge(graph, "tag-temp-1", "port_right", "light-run", "port_left", "signal");
  edge(graph, "tag-temp-2", "port_right", "light-fault", "port_left", "signal");
  edge(graph, "tag-pres-1", "port_right", "light-warn", "port_left", "signal");
  edge(graph, "tag-curr-1", "port_right", "light-stop", "port_left", "signal");

  stageLabel(graph, "Trạm giám sát thông số", 80, 30);
}

// ─────────────────────────────────────────────────────────────────────────────
// Template 5: Odprášení chi tiết — sát với hình P&ID gốc
// Canvas 1400×750. Tọa độ đo từ hình gốc (tỉ lệ ~1.4:1)
// ─────────────────────────────────────────────────────────────────────────────

function addNode(
  graph: any,
  id: string,
  type: string,
  label: string,
  x: number,
  y: number,
  data: Record<string, any>,
  w?: number,
  h?: number,
) {
  const cfg = createNodeConfig(type, label);
  graph.addNode({
    id,
    ...cfg,
    x,
    y,
    ...(w ? { width: w } : {}),
    ...(h ? { height: h } : {}),
    data: { ...cfg.data, ...data },
  });
}

function addMini(
  graph: any,
  id: string,
  value: number,
  unit: string,
  x: number,
  y: number,
) {
  graph.addNode({
    id,
    shape: "data-tag",
    x,
    y,
    width: 58,
    height: 22,
    ports: {
      items: [
        { id: "port_left", group: "left" },
        { id: "port_right", group: "right" },
        { id: "port_top", group: "top" },
        { id: "port_bottom", group: "bottom" },
      ],
    },
    data: { label: "", value, unit, status: "normal", size: "mini" },
  });
}

function addLabel(
  graph: any,
  text: string,
  x: number,
  y: number,
  w = 260,
  color = "#1a1a2e",
  size = 14,
) {
  graph.addNode({
    shape: "rect",
    x,
    y,
    width: w,
    height: 26,
    label: text,
    attrs: {
      body: { fill: "transparent", stroke: "none" },
      label: {
        fill: color,
        fontSize: size,
        fontWeight: 700,
        textAnchor: "middle",
      },
    },
    data: { isLabel: true },
  });
}

function e(
  graph: any,
  s: string,
  sp: string,
  t: string,
  tp: string,
  type: "clean-air" | "gas" | "signal" = "clean-air",
) {
  graph.addEdge({
    ...createIndustrialEdge(type),
    source: { cell: s, port: sp },
    target: { cell: t, port: tp },
  });
}

function loadOdpraseniDetail(graph: any) {
  graph.clearCells();

  // ── Stage label ────────────────────────────────────────────────────────────
  addLabel(graph, "Odprášení II.stupeň", 280, 42, 300, "#1a1a2e", 15);
  addLabel(graph, "Odprášení I.stupeň", 280, 330, 280, "#1a1a2e", 15);

  // ── Stage II: 4 Filtr (x: 130,270,410,550 | y: 80) ────────────────────────
  const filtrX = [130, 270, 410, 550];
  for (let i = 1; i <= 4; i++) {
    addNode(
      graph,
      `filtr-${i}`,
      "esp-filter-tank",
      `Filtr ${i}`,
      filtrX[i - 1],
      80,
      {
        label: `Filtr ${i}`,
        status: "dừng",
        voltage: 80.2,
        current: 600,
      },
    );
  }

  // ── Stage II: Water tank (x:730, y:80) ────────────────────────────────────
  addNode(
    graph,
    "water-tank",
    "static-equipment",
    "Water Tank",
    730,
    80,
    {
      equipmentType: "hopper",
      label: "Water Tank",
    },
    80,
    120,
  );

  // ── Stage II: Van trên mỗi Filtr (nhỏ, y:62) ──────────────────────────────
  // 4 van trên đường ống ngang Stage II
  for (let i = 1; i <= 4; i++) {
    addNode(
      graph,
      `valve-top-${i}`,
      "control-valve",
      `V${i}`,
      filtrX[i - 1] + 10,
      52,
      {
        label: `V${i}`,
        mode: "AUTO",
        openPercent: 100,
      },
      60,
      60,
    );
  }
  // Van trước water tank
  addNode(
    graph,
    "valve-top-5",
    "control-valve",
    "V5",
    720,
    52,
    {
      label: "V5",
      mode: "AUTO",
      openPercent: 100,
    },
    60,
    60,
  );

  // ── Stage II: Data tags bên phải (current + rpm) ───────────────────────────
  addNode(
    graph,
    "tag-curr-ii",
    "data-tag",
    "CURR-II",
    660,
    248,
    {
      label: "CURR",
      value: 12.4,
      unit: "A",
      status: "normal",
    },
    90,
    50,
  );
  addNode(
    graph,
    "tag-rpm-ii",
    "data-tag",
    "RPM-II",
    760,
    248,
    {
      label: "RPM",
      value: 12.0,
      unit: "rpm",
      status: "normal",
    },
    90,
    50,
  );

  // ── Stage II: Ventilátor lớn bên phải (x:720, y:290) ─────────────────────
  addNode(graph, "vent-ii", "motor-blower", "Vent II", 720, 280, {
    label: "Vent II",
    status: "stopped",
    current: 120,
    statorTemp: 65,
    bearingTemp: 45,
    size: "large",
  });

  // Mini temp tags dưới vent-ii (4 cái: 123°C 110°C 107°C 101°C)
  const ventIITemps = [123, 110, 107, 101];
  for (let i = 0; i < 4; i++) {
    addMini(
      graph,
      `mini-vent-ii-${i + 1}`,
      ventIITemps[i],
      "°C",
      700 + i * 62,
      432,
    );
  }

  // ── Chimney (x:1050, y:80) ─────────────────────────────────────────────────
  addNode(
    graph,
    "chimney-1",
    "static-equipment-chimney",
    "Chimney",
    1060,
    80,
    {
      equipmentType: "chimney",
      label: "Chimney",
    },
    60,
    400,
  );

  // ── Stage I: Cyclone/Hopper lớn (x:130, y:430) ────────────────────────────
  addNode(
    graph,
    "cyclone-1",
    "static-equipment",
    "Cyclone",
    130,
    430,
    {
      equipmentType: "cyclone",
      label: "Cyclone",
    },
    100,
    160,
  );

  // Data tags bên trái cyclone
  addNode(
    graph,
    "tag-valve-left",
    "control-valve",
    "V-L",
    30,
    370,
    {
      label: "V-L",
      mode: "AUTO",
      openPercent: 63,
    },
    70,
    70,
  );
  addNode(
    graph,
    "tag-temp-left",
    "data-tag",
    "TEMP-L",
    20,
    450,
    {
      label: "TEMP",
      value: 120,
      unit: "°C",
      status: "normal",
    },
    90,
    50,
  );
  addNode(
    graph,
    "tag-pres-left",
    "data-tag",
    "PRES-L",
    20,
    510,
    {
      label: "PRES",
      value: -0.15,
      unit: "kPa",
      status: "normal",
    },
    90,
    50,
  );
  addNode(
    graph,
    "tag-vol-left",
    "data-tag",
    "VOL-L",
    20,
    570,
    {
      label: "VOL",
      value: 120,
      unit: "m³",
      status: "normal",
    },
    90,
    50,
  );
  addNode(
    graph,
    "tag-pres2-left",
    "data-tag",
    "PRES2-L",
    20,
    620,
    {
      label: "PRES2",
      value: 3.22,
      unit: "kPa",
      status: "normal",
    },
    90,
    50,
  );
  addNode(
    graph,
    "tag-pres3-bot",
    "data-tag",
    "PRES3-B",
    130,
    680,
    {
      label: "PRES3",
      value: 120,
      unit: "kPa",
      status: "normal",
    },
    90,
    50,
  );

  // ── Stage I: Van trước Vent 1 và Vent 2 ───────────────────────────────────
  addNode(
    graph,
    "valve-i-1",
    "control-valve",
    "VI-1",
    290,
    390,
    {
      label: "VI-1",
      mode: "AUTO",
      openPercent: 100,
    },
    70,
    70,
  );
  addNode(
    graph,
    "valve-i-2",
    "control-valve",
    "VI-2",
    290,
    470,
    {
      label: "VI-2",
      mode: "AUTO",
      openPercent: 100,
    },
    70,
    70,
  );
  addNode(
    graph,
    "valve-i-3",
    "control-valve",
    "VI-3",
    530,
    390,
    {
      label: "VI-3",
      mode: "AUTO",
      openPercent: 100,
    },
    70,
    70,
  );

  // Data tags áp suất + nhiệt độ Stage I
  addNode(
    graph,
    "tag-pres-i",
    "data-tag",
    "PRES-I",
    290,
    540,
    {
      label: "PRES",
      value: 120,
      unit: "kPa",
      status: "normal",
    },
    90,
    50,
  );
  addNode(
    graph,
    "tag-temp-i",
    "data-tag",
    "TEMP-I",
    290,
    600,
    {
      label: "TEMP",
      value: 74,
      unit: "°C",
      status: "normal",
    },
    90,
    50,
  );

  // ── Stage I: Ventilátor 1 (x:390, y:450) ──────────────────────────────────
  addNode(graph, "vent-1", "motor-blower", "Ventilátor 1", 390, 450, {
    label: "Ventilátor 1",
    status: "stopped",
    current: 120,
    statorTemp: 65,
    bearingTemp: 45,
    size: "large",
  });
  // Mini temp tags dưới vent-1 (4 cái: 54°C 53°C 55°C 55°C)
  const vent1Temps = [54, 53, 55, 55];
  for (let i = 0; i < 4; i++) {
    addMini(
      graph,
      `mini-vent1-${i + 1}`,
      vent1Temps[i],
      "°C",
      370 + i * 62,
      600,
    );
  }
  // Current tag trên vent-1
  addNode(
    graph,
    "tag-curr-v1",
    "data-tag",
    "CURR-V1",
    390,
    420,
    {
      label: "CURR",
      value: 120.0,
      unit: "A",
      status: "normal",
    },
    90,
    50,
  );

  // ── Stage I: Ventilátor 2 (x:640, y:450) ──────────────────────────────────
  addNode(graph, "vent-2", "motor-blower", "Ventilátor 2", 640, 450, {
    label: "Ventilátor 2",
    status: "stopped",
    current: 120,
    statorTemp: 65,
    bearingTemp: 45,
    size: "large",
  });
  // Mini temp tags dưới vent-2 (4 cái: 59°C 56°C 55°C 53°C)
  const vent2Temps = [59, 56, 55, 53];
  for (let i = 0; i < 4; i++) {
    addMini(
      graph,
      `mini-vent2-${i + 1}`,
      vent2Temps[i],
      "°C",
      620 + i * 62,
      600,
    );
  }
  // Current tag trên vent-2
  addNode(
    graph,
    "tag-curr-v2",
    "data-tag",
    "CURR-V2",
    640,
    420,
    {
      label: "CURR",
      value: 120.0,
      unit: "A",
      status: "normal",
    },
    90,
    50,
  );

  // ── Stage I: 3 van dưới cùng (đường ống ngang đáy) ────────────────────────
  for (let i = 1; i <= 3; i++) {
    addNode(
      graph,
      `valve-bot-${i}`,
      "control-valve",
      `VB${i}`,
      230 + (i - 1) * 250,
      660,
      {
        label: `VB${i}`,
        mode: "AUTO",
        openPercent: 100,
      },
      60,
      60,
    );
  }
  // Current tags dưới đường ống đáy
  for (let i = 1; i <= 3; i++) {
    addNode(
      graph,
      `tag-curr-bot-${i}`,
      "data-tag",
      `CURR-B${i}`,
      200 + (i - 1) * 250,
      700,
      {
        label: "CURR",
        value: 60.5,
        unit: "A",
        status: "normal",
      },
      80,
      44,
    );
  }

  // ── Edges Stage II ─────────────────────────────────────────────────────────
  // Đường ống ngang trên (qua các van top)
  e(graph, "valve-top-1", "port_right", "valve-top-2", "port_left");
  e(graph, "valve-top-2", "port_right", "valve-top-3", "port_left");
  e(graph, "valve-top-3", "port_right", "valve-top-4", "port_left");
  e(graph, "valve-top-4", "port_right", "valve-top-5", "port_left");
  e(graph, "valve-top-5", "port_right", "water-tank", "port_top");

  // Van top → Filtr (xuống)
  for (let i = 1; i <= 4; i++) {
    e(graph, `valve-top-${i}`, "port_bottom", `filtr-${i}`, "port_top");
  }

  // Filtr chain ngang
  e(graph, "filtr-1", "port_right", "filtr-2", "port_left");
  e(graph, "filtr-2", "port_right", "filtr-3", "port_left");
  e(graph, "filtr-3", "port_right", "filtr-4", "port_left");
  e(graph, "filtr-4", "port_right", "tag-curr-ii", "port_left");
  e(graph, "tag-curr-ii", "port_right", "vent-ii", "port_left");
  e(graph, "vent-ii", "port_right", "chimney-1", "port_left");

  // ── Edges Stage I ──────────────────────────────────────────────────────────
  // Cyclone → valve-i-1 → vent-1
  e(graph, "cyclone-1", "port_right", "valve-i-1", "port_left");
  e(graph, "valve-i-1", "port_right", "vent-1", "port_left");

  // Cyclone → valve-i-2 → valve-i-3 → vent-2
  e(graph, "cyclone-1", "port_right", "valve-i-2", "port_left");
  e(graph, "valve-i-2", "port_right", "valve-i-3", "port_left");
  e(graph, "valve-i-3", "port_right", "vent-2", "port_left");

  // Vent 1 + Vent 2 → Stage II (lên trên)
  e(graph, "vent-1", "port_top", "filtr-1", "port_bottom");
  e(graph, "vent-2", "port_top", "filtr-3", "port_bottom");

  // Vent 2 → Chimney
  e(graph, "vent-2", "port_right", "chimney-1", "port_bottom");

  // Đường ống đáy (Stage I bottom)
  e(graph, "cyclone-1", "port_bottom", "valve-bot-1", "port_left");
  e(graph, "valve-bot-1", "port_right", "valve-bot-2", "port_left");
  e(graph, "valve-bot-2", "port_right", "valve-bot-3", "port_left");
}

// ─────────────────────────────────────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────────────────────────────────────

export const ESP_TEMPLATES: Record<string, EspTemplate> = {
  "odprašení-detail": {
    id: "odprašení-detail",
    name: "Odprášení — P&ID chi tiết",
    description:
      "Bản sao chính xác hình P&ID gốc: 4 Filtr, 2 Vent, Cyclone, Water Tank, Chimney, đầy đủ van và sensor",
    load: loadOdpraseniDetail,
  },
  "two-stage-full": {
    id: "two-stage-full",
    name: "ESP 2 tầng đầy đủ",
    description: "Odprášení I + II — 4 Filtr, 2 Ventilátor, Cyclone, Chimney",
    load: loadTwoStageFull,
  },
  "single-stage": {
    id: "single-stage",
    name: "ESP 1 tầng đơn giản",
    description:
      "2 Filtr, 1 Ventilátor, Cyclone, Chimney — phù hợp nhà máy nhỏ",
    load: loadSingleStage,
  },
  "parallel-lines": {
    id: "parallel-lines",
    name: "ESP song song 2 dây chuyền",
    description: "Dây chuyền A + B độc lập, chung Chimney — công suất cao",
    load: loadParallelLines,
  },
  "monitoring-station": {
    id: "monitoring-station",
    name: "Trạm giám sát thông số",
    description: "Data tags + đèn báo — dùng để theo dõi nhanh các thông số",
    load: loadMonitoringStation,
  },
};
