import { register } from "@antv/x6-vue-shape";
import CustomNode from "../../components/CustomNode.vue";
import FilterTankNode from "../../components/FilterTankNode.vue";
import DeviceNode from "../../components/DeviceNode.vue";
import MotorBlowerNode from "../../components/MotorBlowerNode.vue";
import ControlValveNode from "../../components/ControlValveNode.vue";
import DataTagNode from "../../components/DataTagNode.vue";
import IndicatorLightNode from "../../components/IndicatorLightNode.vue";
import StaticEquipmentNode from "../../components/StaticEquipmentNode.vue";

/**
 * PORT_GROUPS dùng chung cho tất cả industrial shape (top/bottom/left/right).
 * Ports ẩn mặc định, chỉ hiện khi hover vào node.
 */
const PORT_GROUPS = {
  groups: {
    top: {
      position: "top",
      attrs: {
        circle: {
          r: 4,
          magnet: true,
          stroke: "#5F95FF",
          strokeWidth: 1,
          fill: "#fff",
          visibility: "hidden",
        },
      },
    },
    bottom: {
      position: "bottom",
      attrs: {
        circle: {
          r: 4,
          magnet: true,
          stroke: "#5F95FF",
          strokeWidth: 1,
          fill: "#fff",
          visibility: "hidden",
        },
      },
    },
    left: {
      position: "left",
      attrs: {
        circle: {
          r: 4,
          magnet: true,
          stroke: "#5F95FF",
          strokeWidth: 1,
          fill: "#fff",
          visibility: "hidden",
        },
      },
    },
    right: {
      position: "right",
      attrs: {
        circle: {
          r: 4,
          magnet: true,
          stroke: "#5F95FF",
          strokeWidth: 1,
          fill: "#fff",
          visibility: "hidden",
        },
      },
    },
  },
};

/**
 * Đăng ký tất cả các Vue Shape sử dụng trong X6 Graph.
 * Idempotent — gọi nhiều lần không crash.
 */
export function registerAllVueNodes() {
  function safeRegister(config: Parameters<typeof register>[0]) {
    try {
      register(config);
    } catch {
      // Shape đã được register — bỏ qua
    }
  }
  safeRegister({
    shape: "my-vue-shape",
    width: 150,
    height: 50,
    component: CustomNode,
  });

  // Backward compat: giữ nguyên shape cũ 'filter-tank-node'
  safeRegister({
    shape: "filter-tank-node",
    width: 100,
    height: 120,
    component: FilterTankNode,
  });

  // Shape mới 'esp-filter-tank' (100×140) thay thế filter-tank-node
  safeRegister({
    shape: "esp-filter-tank",
    width: 100,
    height: 140,
    component: FilterTankNode,
    ports: PORT_GROUPS,
  });

  safeRegister({
    shape: "computer-device-node",
    width: 180,
    height: 80,
    component: DeviceNode,
    ports: {
      groups: {
        top: {
          position: "top",
          attrs: {
            circle: {
              r: 5,
              magnet: true,
              stroke: "#31d0c6",
              strokeWidth: 2,
              fill: "#fff",
            },
          },
        },
        bottom: {
          position: "bottom",
          attrs: {
            circle: {
              r: 5,
              magnet: true,
              stroke: "#31d0c6",
              strokeWidth: 2,
              fill: "#fff",
            },
          },
        },
        left: {
          position: "left",
          attrs: {
            circle: {
              r: 5,
              magnet: true,
              stroke: "#31d0c6",
              strokeWidth: 2,
              fill: "#fff",
            },
          },
        },
        right: {
          position: "right",
          attrs: {
            circle: {
              r: 5,
              magnet: true,
              stroke: "#31d0c6",
              strokeWidth: 2,
              fill: "#fff",
            },
          },
        },
      },
    },
  });

  // ── Industrial ESP shapes ──────────────────────────────────────────────

  safeRegister({
    shape: "motor-blower",
    width: 110,
    height: 92,
    component: MotorBlowerNode,
    ports: PORT_GROUPS,
  });

  safeRegister({
    shape: "control-valve",
    width: 60,
    height: 70,
    component: ControlValveNode,
    ports: PORT_GROUPS,
  });

  safeRegister({
    shape: "data-tag",
    width: 90,
    height: 44,
    component: DataTagNode,
    ports: PORT_GROUPS,
  });

  safeRegister({
    shape: "indicator-light",
    width: 60,
    height: 70,
    component: IndicatorLightNode,
    ports: PORT_GROUPS,
  });

  safeRegister({
    shape: "static-equipment",
    width: 80,
    height: 120,
    component: StaticEquipmentNode,
    ports: PORT_GROUPS,
  });

  // Chimney: shape riêng với port positions tùy chỉnh
  // SVG chimney cao 160px, khói ở trên (~25px), thân từ y=25 đến y=150, chân đế y=150-154
  // Port left/right đặt ở giữa thân (y=50%), top ở miệng ống (y=15%), bottom ở chân đế (y=95%)
  safeRegister({
    shape: "static-equipment-chimney",
    width: 60,
    height: 160,
    component: StaticEquipmentNode,
    ports: {
      groups: {
        top: {
          position: { name: "absolute", args: { x: "50%", y: "15%" } },
          attrs: {
            circle: {
              r: 4,
              magnet: true,
              stroke: "#5F95FF",
              strokeWidth: 1,
              fill: "#fff",
              visibility: "hidden",
            },
          },
        },
        bottom: {
          position: { name: "absolute", args: { x: "50%", y: "95%" } },
          attrs: {
            circle: {
              r: 4,
              magnet: true,
              stroke: "#5F95FF",
              strokeWidth: 1,
              fill: "#fff",
              visibility: "hidden",
            },
          },
        },
        left: {
          position: { name: "absolute", args: { x: "15%", y: "55%" } },
          attrs: {
            circle: {
              r: 4,
              magnet: true,
              stroke: "#5F95FF",
              strokeWidth: 1,
              fill: "#fff",
              visibility: "hidden",
            },
          },
        },
        right: {
          position: { name: "absolute", args: { x: "85%", y: "55%" } },
          attrs: {
            circle: {
              r: 4,
              magnet: true,
              stroke: "#5F95FF",
              strokeWidth: 1,
              fill: "#fff",
              visibility: "hidden",
            },
          },
        },
      },
    },
  });
}
