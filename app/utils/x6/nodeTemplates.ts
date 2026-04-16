export const createNodeConfig = (type: string, labelName: string) => {
  if (type === "filter-tank") {
    return {
      shape: "filter-tank-node",
      width: 100,
      height: 120,
      data: {
        deviceType: "filter-tank",
        status: "chạy",
        voltage: 12.5,
        current: 450,
      },
    };
  }

  // ── Industrial ESP nodes ──────────────────────────────────────────────

  if (type === "esp-filter-tank") {
    return {
      shape: "esp-filter-tank",
      width: 100,
      height: 140,
      ports: {
        items: [
          { id: "port_top", group: "top" },
          { id: "port_bottom", group: "bottom" },
          { id: "port_left", group: "left" },
          { id: "port_right", group: "right" },
        ],
      },
      data: {
        label: "Filtr 1",
        status: "chạy",
        voltage: 80.2,
        current: 600,
      },
    };
  }

  if (type === "motor-blower") {
    return {
      shape: "motor-blower",
      width: 110,
      height: 92,
      ports: {
        items: [
          { id: "port_top", group: "top" },
          { id: "port_bottom", group: "bottom" },
          { id: "port_left", group: "left" },
          { id: "port_right", group: "right" },
        ],
      },
      data: {
        label: "Ventilátor 1",
        status: "stopped",
        current: 50.5,
        statorTemp: 65,
        bearingTemp: 45,
        size: "large",
      },
    };
  }

  if (type === "control-valve") {
    return {
      shape: "control-valve",
      width: 60,
      height: 70,
      ports: {
        items: [
          { id: "port_top", group: "top" },
          { id: "port_bottom", group: "bottom" },
          { id: "port_left", group: "left" },
          { id: "port_right", group: "right" },
        ],
      },
      data: {
        label: "Van 1",
        mode: "AUTO",
        openPercent: 75,
      },
    };
  }

  if (type === "data-tag") {
    return {
      shape: "data-tag",
      width: 90,
      height: 44,
      ports: {
        items: [
          { id: "port_top", group: "top" },
          { id: "port_bottom", group: "bottom" },
          { id: "port_left", group: "left" },
          { id: "port_right", group: "right" },
        ],
      },
      data: {
        label: "TEMP-01",
        value: 123,
        unit: "°C",
        status: "normal",
        size: "normal",
      },
    };
  }

  if (type === "data-tag-mini") {
    return {
      shape: "data-tag",
      width: 60,
      height: 24,
      ports: {
        items: [
          { id: "port_top", group: "top" },
          { id: "port_bottom", group: "bottom" },
          { id: "port_left", group: "left" },
          { id: "port_right", group: "right" },
        ],
      },
      data: {
        label: "T",
        value: 65,
        unit: "°C",
        status: "normal",
        size: "mini",
      },
    };
  }

  if (type === "indicator-light") {
    return {
      shape: "indicator-light",
      width: 60,
      height: 70,
      ports: {
        items: [
          { id: "port_top", group: "top" },
          { id: "port_bottom", group: "bottom" },
          { id: "port_left", group: "left" },
          { id: "port_right", group: "right" },
        ],
      },
      data: {
        label: "RUN",
        state: "off",
        color: "green",
      },
    };
  }

  if (type === "static-equipment") {
    return {
      shape: "static-equipment",
      width: 80,
      height: 120,
      ports: {
        items: [
          { id: "port_top", group: "top" },
          { id: "port_bottom", group: "bottom" },
          { id: "port_left", group: "left" },
          { id: "port_right", group: "right" },
        ],
      },
      data: {
        equipmentType: "cyclone",
        label: "Cyclone 1",
      },
    };
  }

  if (type === "static-equipment-chimney") {
    return {
      shape: "static-equipment",
      width: 60,
      height: 160,
      ports: {
        items: [
          { id: "port_top", group: "top" },
          { id: "port_bottom", group: "bottom" },
          { id: "port_left", group: "left" },
          { id: "port_right", group: "right" },
        ],
      },
      data: {
        equipmentType: "chimney",
        label: "Chimney 1",
      },
    };
  }

  // ── IT / Computer device nodes ────────────────────────────────────────

  if (
    ["case", "monitor", "mouse", "keyboard", "power", "network"].includes(type)
  ) {
    let defaultMetrics: any[] = [];
    if (type === "case")
      defaultMetrics = [
        { label: "CPU Temp", value: 45, unit: "°C" },
        { label: "RAM Usage", value: 64, unit: "%" },
      ];
    if (type === "monitor")
      defaultMetrics = [{ label: "Refresh", value: 144, unit: "Hz" }];
    if (type === "mouse" || type === "keyboard")
      defaultMetrics = [{ label: "Battery", value: 85, unit: "%" }];
    if (type === "power")
      defaultMetrics = [{ label: "Load", value: 350, unit: "W" }];
    if (type === "network")
      defaultMetrics = [{ label: "Ping", value: 12, unit: "ms" }];

    return {
      shape: "computer-device-node",
      width: 180,
      height: 80,
      ports: {
        items: [
          { id: "port_top", group: "top" },
          { id: "port_bottom", group: "bottom" },
          { id: "port_left", group: "left" },
          { id: "port_right", group: "right" },
        ],
      },
      data: {
        deviceType: type,
        deviceName: labelName,
        status: "online",
        metrics: defaultMetrics,
      },
    };
  }

  return {
    shape: "my-vue-shape",
    width: 150,
    height: 50,
    data: {
      label: labelName,
    },
  };
};

/**
 * Tạo cấu hình edge công nghiệp (đường ống / tín hiệu) cho AntV X6.
 *
 * @param type - Loại đường:
 *   - `'gas'`       — Ống khí chính (xám đậm, stroke-width 4, dash 8 4)
 *   - `'clean-air'` — Ống khí sạch (xanh dương, stroke-width 3, dash 6 3)
 *   - `'signal'`    — Đường tín hiệu điều khiển (vàng, stroke-width 2, dash 4 4)
 */
export const createIndustrialEdge = (
  type: "gas" | "clean-air" | "signal" = "gas",
) => {
  const styles = {
    gas: { stroke: "#475569", strokeWidth: 5, dasharray: "0" },
    "clean-air": { stroke: "#2563eb", strokeWidth: 4, dasharray: "0" },
    signal: { stroke: "#d97706", strokeWidth: 2, dasharray: "4 3" },
  };
  const s = styles[type];
  return {
    shape: "edge",
    router: { name: "manhattan" },
    connector: { name: "rounded", args: { radius: 8 } },
    attrs: {
      line: {
        stroke: s.stroke,
        strokeWidth: s.strokeWidth,
        strokeDasharray: s.dasharray,
        targetMarker: null,
      },
    },
    data: { edgeType: type, flowActive: false },
  };
};
