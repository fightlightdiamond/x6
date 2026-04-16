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
 * Tạo cấu hình edge công nghiệp cho AntV X6.
 * Double-stroke pipe + flow animation luôn chạy theo hướng source→target.
 */
export const createIndustrialEdge = (
  type:
    | "gas"
    | "clean-air"
    | "clean-air-main"
    | "drain"
    | "signal"
    | "power" = "clean-air",
) => {
  if (type === "signal") {
    return {
      shape: "edge",
      router: { name: "manhattan" },
      connector: { name: "rounded", args: { radius: 4 } },
      attrs: {
        line: {
          stroke: "#d97706",
          strokeWidth: 1.5,
          strokeDasharray: "5 3",
          targetMarker: null,
          strokeLinecap: "round",
          style: "animation: signal-flow 1.5s linear infinite",
        },
      },
      data: { edgeType: type, flowActive: true },
    };
  }

  if (type === "power") {
    return {
      shape: "edge",
      router: { name: "manhattan" },
      connector: { name: "rounded", args: { radius: 4 } },
      attrs: {
        line: {
          stroke: "#dc2626",
          strokeWidth: 2,
          strokeDasharray: "6 2 2 2",
          targetMarker: null,
          strokeLinecap: "round",
        },
      },
      data: { edgeType: type, flowActive: false },
    };
  }

  // Pipe styles: outer = thân ống đậm, inner = highlight sáng
  const pipes: Record<
    string,
    {
      outer: string;
      inner: string;
      outerW: number;
      innerW: number;
      radius: number;
      speed: string;
    }
  > = {
    "clean-air-main": {
      outer: "#1e3a8a",
      inner: "#60a5fa",
      outerW: 10,
      innerW: 3,
      radius: 16,
      speed: "0.5s",
    },
    "clean-air": {
      outer: "#1d4ed8",
      inner: "#7dd3fc",
      outerW: 7,
      innerW: 2,
      radius: 10,
      speed: "0.7s",
    },
    gas: {
      outer: "#1e293b",
      inner: "#94a3b8",
      outerW: 8,
      innerW: 2,
      radius: 10,
      speed: "0.9s",
    },
    drain: {
      outer: "#0e7490",
      inner: "#67e8f9",
      outerW: 5,
      innerW: 1.5,
      radius: 6,
      speed: "1.1s",
    },
  };

  const p = pipes[type] ?? pipes["clean-air"]!;

  return {
    shape: "edge",
    router: { name: "manhattan" },
    connector: { name: "rounded", args: { radius: p.radius } },
    markup: [
      {
        tagName: "path",
        selector: "outerLine",
        attrs: { fill: "none", "pointer-events": "none" },
      },
      {
        tagName: "path",
        selector: "innerLine",
        attrs: { fill: "none", "pointer-events": "none" },
      },
    ],
    attrs: {
      outerLine: {
        connection: true,
        stroke: p.outer,
        strokeWidth: p.outerW,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        targetMarker: null,
        strokeDasharray: "16 8",
        style: `animation: pipe-flow ${p.speed} linear infinite`,
      },
      innerLine: {
        connection: true,
        stroke: p.inner,
        strokeWidth: p.innerW,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeOpacity: 0.65,
        targetMarker: null,
        strokeDasharray: "40 20",
        style: `animation: pipe-shimmer ${p.speed} linear infinite`,
      },
    },
    data: { edgeType: type, flowActive: true },
  };
};
