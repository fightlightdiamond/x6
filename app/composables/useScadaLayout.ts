import {
  createNodeConfig,
  createIndustrialEdge,
} from "~/utils/x6/nodeTemplates";

export function useScadaLayout() {
  function loadDemoLayout(graph: any): void {
    // Idempotent: clear all cells before adding
    graph.clearCells();

    // ── Stage II nodes (y ≈ 80) ──────────────────────────────────────────

    graph.addNode({
      id: "filtr-1",
      ...createNodeConfig("esp-filter-tank", "Filtr 1"),
      x: 300,
      y: 80,
      data: { label: "Filtr 1", status: "dừng", voltage: 80.2, current: 600 },
    });

    graph.addNode({
      id: "filtr-2",
      ...createNodeConfig("esp-filter-tank", "Filtr 2"),
      x: 450,
      y: 80,
      data: { label: "Filtr 2", status: "dừng", voltage: 80.2, current: 600 },
    });

    graph.addNode({
      id: "filtr-3",
      ...createNodeConfig("esp-filter-tank", "Filtr 3"),
      x: 600,
      y: 80,
      data: { label: "Filtr 3", status: "dừng", voltage: 80.2, current: 600 },
    });

    graph.addNode({
      id: "filtr-4",
      ...createNodeConfig("esp-filter-tank", "Filtr 4"),
      x: 750,
      y: 80,
      data: { label: "Filtr 4", status: "dừng", voltage: 80.2, current: 600 },
    });

    graph.addNode({
      id: "hopper-1",
      ...createNodeConfig("static-equipment", "Hopper 1"),
      x: 920,
      y: 80,
      width: 80,
      height: 120,
      data: { equipmentType: "hopper", label: "Hopper 1" },
    });

    // ── Stage I nodes (y ≈ 360–390) ──────────────────────────────────────

    graph.addNode({
      id: "cyclone-1",
      ...createNodeConfig("static-equipment", "Cyclone 1"),
      x: 80,
      y: 380,
      width: 80,
      height: 120,
      data: { equipmentType: "cyclone", label: "Cyclone 1" },
    });

    graph.addNode({
      id: "vent-1",
      ...createNodeConfig("motor-blower", "Ventilátor 1"),
      x: 280,
      y: 360,
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
      id: "vent-2",
      ...createNodeConfig("motor-blower", "Ventilátor 2"),
      x: 500,
      y: 360,
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
      id: "valve-1",
      ...createNodeConfig("control-valve", "Van 1"),
      x: 200,
      y: 390,
      data: { label: "Van 1", mode: "AUTO", openPercent: 100 },
    });

    graph.addNode({
      id: "valve-2",
      ...createNodeConfig("control-valve", "Van 2"),
      x: 420,
      y: 390,
      data: { label: "Van 2", mode: "AUTO", openPercent: 100 },
    });

    graph.addNode({
      id: "tag-temp",
      ...createNodeConfig("data-tag", "TEMP-01"),
      x: 680,
      y: 370,
      data: { label: "TEMP-01", value: 65.0, unit: "°C", status: "normal" },
    });

    graph.addNode({
      id: "tag-pres",
      ...createNodeConfig("data-tag", "PRES-01"),
      x: 680,
      y: 450,
      data: { label: "PRES-01", value: 101.3, unit: "kPa", status: "normal" },
    });

    // ── Chimney ───────────────────────────────────────────────────────────

    graph.addNode({
      id: "chimney-1",
      ...createNodeConfig("static-equipment-chimney", "Chimney 1"),
      x: 1100,
      y: 200,
      width: 60,
      height: 160,
      data: { equipmentType: "chimney", label: "Chimney 1" },
    });

    // ── Clean-air edges (ESP airflow) ─────────────────────────────────────

    // Stage II: Filtr chain → Hopper
    graph.addEdge({
      ...createIndustrialEdge("clean-air"),
      source: { cell: "filtr-1", port: "port_right" },
      target: { cell: "filtr-2", port: "port_left" },
    });

    graph.addEdge({
      ...createIndustrialEdge("clean-air"),
      source: { cell: "filtr-2", port: "port_right" },
      target: { cell: "filtr-3", port: "port_left" },
    });

    graph.addEdge({
      ...createIndustrialEdge("clean-air"),
      source: { cell: "filtr-3", port: "port_right" },
      target: { cell: "filtr-4", port: "port_left" },
    });

    graph.addEdge({
      ...createIndustrialEdge("clean-air"),
      source: { cell: "filtr-4", port: "port_right" },
      target: { cell: "hopper-1", port: "port_left" },
    });

    // Stage I: Cyclone → Valve 1 → Vent 1 → Valve 2 → Vent 2
    graph.addEdge({
      ...createIndustrialEdge("clean-air"),
      source: { cell: "cyclone-1", port: "port_right" },
      target: { cell: "valve-1", port: "port_left" },
    });

    graph.addEdge({
      ...createIndustrialEdge("clean-air"),
      source: { cell: "valve-1", port: "port_right" },
      target: { cell: "vent-1", port: "port_left" },
    });

    graph.addEdge({
      ...createIndustrialEdge("clean-air"),
      source: { cell: "vent-1", port: "port_right" },
      target: { cell: "valve-2", port: "port_left" },
    });

    graph.addEdge({
      ...createIndustrialEdge("clean-air"),
      source: { cell: "valve-2", port: "port_right" },
      target: { cell: "vent-2", port: "port_left" },
    });

    // Stage I → Stage II connection
    graph.addEdge({
      ...createIndustrialEdge("clean-air"),
      source: { cell: "vent-2", port: "port_top" },
      target: { cell: "filtr-1", port: "port_bottom" },
    });

    // Vent 2 → Chimney
    graph.addEdge({
      ...createIndustrialEdge("clean-air"),
      source: { cell: "vent-2", port: "port_right" },
      target: { cell: "chimney-1", port: "port_left" },
    });

    // ── Stage label nodes ─────────────────────────────────────────────────

    graph.addNode({
      shape: "rect",
      x: 300,
      y: 30,
      width: 200,
      height: 24,
      label: "Odprášení II.stupeň",
      attrs: {
        body: { fill: "transparent", stroke: "none" },
        label: { fill: "#94a3b8", fontSize: 12, fontWeight: 600 },
      },
      data: { isLabel: true },
    });

    graph.addNode({
      shape: "rect",
      x: 80,
      y: 330,
      width: 200,
      height: 24,
      label: "Odprášení I.stupeň",
      attrs: {
        body: { fill: "transparent", stroke: "none" },
        label: { fill: "#94a3b8", fontSize: 12, fontWeight: 600 },
      },
      data: { isLabel: true },
    });
  }

  return { loadDemoLayout };
}
