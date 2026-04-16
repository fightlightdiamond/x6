// ─── ESP shape names ────────────────────────────────────────────────────────
const ESP_SHAPES = new Set([
  "esp-filter-tank",
  "motor-blower",
  "control-valve",
  "static-equipment",
  "data-tag",
  "indicator-light",
]);

// ─── 9.1 ESP connection rules ───────────────────────────────────────────────
// Key   = source shape
// Value = allowed target shapes
const ESP_RULES: Record<string, string[]> = {
  "esp-filter-tank": [
    "control-valve",
    "motor-blower",
    "data-tag",
    "static-equipment",
  ],
  "motor-blower": ["static-equipment", "control-valve", "data-tag"],
  "control-valve": ["esp-filter-tank", "static-equipment", "data-tag"],
  "static-equipment": ["data-tag"],
  // 9.4 data-tag can connect to ANY node — handled explicitly below
  "data-tag": [
    "esp-filter-tank",
    "motor-blower",
    "control-valve",
    "static-equipment",
    "data-tag",
  ],
  // 9.5 indicator-light has no outputs
  "indicator-light": [],
};

// ─── Legacy IT rules (unchanged — 9.3 no regression) ────────────────────────
export const validateITConnection = ({ sourceView, targetView }: any) => {
  if (!sourceView || !targetView) return false;

  const sourceNode = sourceView.cell;
  const targetNode = targetView.cell;

  // Không cho phép nối vào chính nó
  if (sourceNode.id === targetNode.id) return false;

  const getDeviceType = (node: any) => {
    const type = node.getData()?.deviceType;
    if (type) return type;
    return node.shape === "filter-tank-node" ? "filter-tank" : "unknown";
  };

  const sourceType = getDeviceType(sourceNode);
  const targetType = getDeviceType(targetNode);

  // 1. Phím/Chuột chỉ xuất tín hiệu (kết nối) vào Máy tính (Case)
  if (sourceType === "mouse" || sourceType === "keyboard") {
    return targetType === "case";
  }

  // 2. Nguồn điện (PSU) cấp nguồn cho Case, Màn hình, Mạng, Bồn lọc
  if (sourceType === "power") {
    return ["case", "monitor", "network", "filter-tank"].includes(targetType);
  }

  // 3. Máy tính (Case) xuất tín hiệu tới Màn hình và Mạng
  if (sourceType === "case") {
    return ["monitor", "network"].includes(targetType);
  }

  // 4. Mạng/Router nối vào Máy tính hoặc Router khác
  if (sourceType === "network") {
    return ["case", "network"].includes(targetType);
  }

  // 5. Màn hình mặc định không xuất đầu ra đi thiết bị khác
  if (sourceType === "monitor") {
    return false;
  }

  return true;
};

// ─── 9.2 Unified validateConnection (ESP + IT) ──────────────────────────────
export const validateConnection = ({
  sourceView,
  targetView,
}: any): boolean => {
  if (!sourceView || !targetView) return false;

  const sourceNode = sourceView.cell;
  const targetNode = targetView.cell;

  // Không cho phép nối vào chính nó
  if (sourceNode.id === targetNode.id) return false;

  const sourceShape: string = sourceNode.shape ?? "";
  const targetShape: string = targetNode.shape ?? "";

  const sourceIsESP = ESP_SHAPES.has(sourceShape);
  const targetIsESP = ESP_SHAPES.has(targetShape);

  // ── ESP source node ────────────────────────────────────────────────────────
  if (sourceIsESP) {
    // 9.5 indicator-light has no outputs
    if (sourceShape === "indicator-light") return false;

    // 9.4 data-tag can connect to ANY node (ESP or IT)
    if (sourceShape === "data-tag") return true;

    // For other ESP sources, look up allowed targets in ESP_RULES
    const allowed = ESP_RULES[sourceShape] ?? [];
    return allowed.includes(targetShape);
  }

  // ── Non-ESP source → fall through to IT rules (9.3 no regression) ─────────
  return validateITConnection({ sourceView, targetView });
};
