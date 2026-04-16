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
        },
      },
    },
  },
};

/**
 * Đăng ký tất cả các Vue Shape sử dụng trong X6 Graph.
 * Gọi hàm này 1 lần duy nhất ngay khi khởi tạo Graph thành công lần đầu.
 */
export function registerAllVueNodes() {
  register({
    shape: "my-vue-shape",
    width: 150,
    height: 50,
    component: CustomNode,
  });

  // Backward compat: giữ nguyên shape cũ 'filter-tank-node'
  register({
    shape: "filter-tank-node",
    width: 100,
    height: 120,
    component: FilterTankNode,
  });

  // Shape mới 'esp-filter-tank' (100×140) thay thế filter-tank-node
  register({
    shape: "esp-filter-tank",
    width: 100,
    height: 140,
    component: FilterTankNode,
    ports: PORT_GROUPS,
  });

  register({
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

  register({
    shape: "motor-blower",
    width: 110,
    height: 92,
    component: MotorBlowerNode,
    ports: PORT_GROUPS,
  });

  register({
    shape: "control-valve",
    width: 60,
    height: 70,
    component: ControlValveNode,
    ports: PORT_GROUPS,
  });

  register({
    shape: "data-tag",
    width: 90,
    height: 44,
    component: DataTagNode,
    ports: PORT_GROUPS,
  });

  register({
    shape: "indicator-light",
    width: 60,
    height: 70,
    component: IndicatorLightNode,
    ports: PORT_GROUPS,
  });

  register({
    shape: "static-equipment",
    width: 80,
    height: 120,
    component: StaticEquipmentNode,
    ports: PORT_GROUPS,
  });
}
