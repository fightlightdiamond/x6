import { register } from "@antv/x6-vue-shape";
import FilterTankNode from "../../components/FilterTankNode.vue";
import MotorBlowerNode from "../../components/MotorBlowerNode.vue";
import ControlValveNode from "../../components/ControlValveNode.vue";
import DataTagNode from "../../components/DataTagNode.vue";
import IndicatorLightNode from "../../components/IndicatorLightNode.vue";
import StaticEquipmentNode from "../../components/StaticEquipmentNode.vue";

/** Shared port groups for all ESP shapes (top/bottom/left/right). Hidden by default, shown on hover. */
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

/** Register all ESP Vue shapes. Idempotent — safe to call multiple times. */
export function registerAllVueNodes() {
  function safeRegister(config: Parameters<typeof register>[0]) {
    try {
      register(config);
    } catch {
      /* already registered */
    }
  }

  safeRegister({
    shape: "esp-filter-tank",
    width: 100,
    height: 140,
    component: FilterTankNode,
    ports: PORT_GROUPS,
  });
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

  // Chimney uses custom port positions to match the tall SVG shape
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
