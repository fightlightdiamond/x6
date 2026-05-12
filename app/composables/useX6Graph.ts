import { shallowRef } from "vue";
import { Graph } from "@antv/x6";
import { Dnd } from "@antv/x6-plugin-dnd";
import { Transform } from "@antv/x6-plugin-transform";
import { validateConnection } from "../utils/x6/connectionRules";
import { registerAllVueNodes } from "../utils/x6/registerNodes";

// Module-level variables — intentionally NOT reactive so Vue never wraps them in a Proxy.
// X6 Graph and Node instances must remain plain class instances for their prototype
// methods (rotate, setSize, addTools, etc.) to work correctly.
let graphInstance: Graph | null = null;
let dndInstance: Dnd | null = null;
let preventDuplicateRegister = false;

export const useX6Graph = () => {
  const isGraphReady = shallowRef(false);

  const initGraph = (containerEl: HTMLElement) => {
    if (graphInstance) {
      graphInstance.dispose();
    }

    if (!preventDuplicateRegister) {
      registerAllVueNodes();
      preventDuplicateRegister = true;
    }

    graphInstance = new Graph({
      container: containerEl,
      autoResize: true,
      grid: {
        size: 20,
        visible: true,
        type: "dot",
        args: { color: "#2d3748", thickness: 1 },
      },
      background: { color: "#1a2035" },
      panning: {
        enabled: true,
        eventTypes: ["leftMouseDown", "mouseWheel"],
      },
      mousewheel: {
        enabled: true,
        modifiers: "ctrl",
        maxScale: 4,
        minScale: 0.2,
      },
      connecting: {
        snap: true,
        allowBlank: false,
        allowLoop: false,
        highlight: true,
        validateConnection: validateConnection,
        createEdge() {
          return graphInstance!.createEdge({
            shape: "edge",
            attrs: {
              line: {
                stroke: "#1890ff",
                strokeWidth: 2,
                targetMarker: { name: "block", width: 12, height: 8 },
              },
            },
            zIndex: 0,
          });
        },
      },
    });

    // Default guide node
    graphInstance.addNode({
      x: 100,
      y: 100,
      shape: "rect",
      width: 160,
      height: 60,
      label: "Kéo hình vào đây ➔",
      attrs: {
        body: { stroke: "#8b5cf6", fill: "#ede9fe", rx: 6, ry: 6 },
        label: { fill: "#4c1d95", fontWeight: "bold" },
      },
    });

    // Transform Plugin — resize + rotate handles (Design_Mode only)
    graphInstance.use(
      new Transform({
        resizing: {
          enabled: true,
          minWidth: 20,
          maxWidth: 800,
          minHeight: 20,
          maxHeight: 800,
          orthogonal: true, // show 8 handles (4 corners + 4 edges)
          preserveAspectRatio: false,
        },
        rotating: {
          enabled: true,
          grid: 15,
        },
      }),
    );

    // Dnd plugin
    dndInstance = new Dnd({
      target: graphInstance!,
      scaled: false,
      getDropNode: (node) => node.clone(),
    });

    setupNodeTools();

    isGraphReady.value = true;
    return graphInstance;
  };

  const setupNodeTools = () => {
    if (!graphInstance) return;

    // Track the currently "selected" node that shows the rotate button
    let rotateSelectedId: string | null = null;

    // ── Hover: show ports + delete button ────────────────────────────────
    graphInstance.on("node:mouseenter", ({ node }) => {
      node.getPorts().forEach((port) => {
        node.setPortProp(port.id!, "attrs/circle/visibility", "visible");
      });
      if (node.shape !== "rect") {
        node.addTools([
          {
            name: "button-remove",
            args: { x: "100%", y: 0, offset: { x: -10, y: 10 } },
          },
        ]);
      }
    });

    graphInstance.on("node:mouseleave", ({ node }) => {
      node.getPorts().forEach((port) => {
        node.setPortProp(port.id!, "attrs/circle/visibility", "hidden");
      });
      // Only remove the hover delete button — NOT the rotate button
      node.removeTool("button-remove");
    });

    // ── Click: show rotate-90° button above node ──────────────────────────
    graphInstance.on("node:click", ({ node }) => {
      if (node.shape === "rect") return;

      // Remove rotate button from previously selected node
      if (rotateSelectedId && rotateSelectedId !== node.id) {
        const prev = graphInstance!
          .getNodes()
          .find((n) => n.id === rotateSelectedId);
        if (prev) prev.removeTool("button");
      }

      rotateSelectedId = node.id;
      const nodeId = node.id;

      node.addTools([
        {
          name: "button",
          args: {
            markup: [
              {
                tagName: "circle",
                selector: "button",
                attrs: {
                  r: 12,
                  fill: "#1d4ed8",
                  stroke: "#60a5fa",
                  "stroke-width": 1.5,
                  cursor: "pointer",
                },
              },
              {
                tagName: "text",
                textContent: "↻",
                attrs: {
                  fill: "#ffffff",
                  "font-size": 14,
                  "text-anchor": "middle",
                  "dominant-baseline": "central",
                  "pointer-events": "none",
                },
              },
            ],
            x: "50%",
            y: 0,
            offset: { x: 0, y: -20 },
            onClick() {
              // Re-fetch from graphInstance (plain module variable, never Vue-proxied)
              const raw = graphInstance!
                .getNodes()
                .find((n) => n.id === nodeId);
              if (raw) {
                raw.rotate(90);
                graphInstance!.trigger("node:rotated", {
                  nodeId,
                  angle: raw.getAngle(),
                });
              }
            },
          },
        },
      ]);
    });

    // ── Blank click: remove rotate button from selected node ─────────────
    graphInstance.on("blank:click", () => {
      if (rotateSelectedId) {
        const node = graphInstance!
          .getNodes()
          .find((n) => n.id === rotateSelectedId);
        if (node) node.removeTool("button");
        rotateSelectedId = null;
      }
    });

    // ── Edge tools ────────────────────────────────────────────────────────
    graphInstance.on("edge:mouseenter", ({ edge }) => {
      edge.addTools([{ name: "button-remove", args: { distance: "50%" } }]);
    });

    graphInstance.on("edge:mouseleave", ({ edge }) => {
      edge.removeTools();
    });
  };

  const getGraph = () => graphInstance;
  const getDnd = () => dndInstance;

  return {
    initGraph,
    getGraph,
    getDnd,
    isGraphReady,
  };
};
