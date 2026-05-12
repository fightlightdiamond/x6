import { describe, it, expect, vi, beforeEach } from "vitest";
import { createApp } from "vue";
import { createPinia, setActivePinia } from "pinia";

// ─── Mock layerStore ──────────────────────────────────────────────────────────

const mockLayerStore = {
  exportLayerData: vi.fn(() => ({
    layers: [],
    nodeLayerMap: {},
    activeLayerId: "",
  })),
  importLayerData: vi.fn(),
  initDefault: vi.fn(),
};

vi.mock("~/stores/layerStore", () => ({
  useLayerStore: vi.fn(() => mockLayerStore),
}));

// ─── withSetup helper ─────────────────────────────────────────────────────────

function withSetup(composable: () => any) {
  let result: any;
  const pinia = createPinia();
  const app = createApp({
    setup() {
      result = composable();
      return () => {};
    },
  });
  app.use(pinia);
  setActivePinia(pinia);
  const div = document.createElement("div");
  app.mount(div);
  return { result, app, unmount: () => app.unmount() };
}

// ─── Import composable AFTER mocks ───────────────────────────────────────────

const { useGraphPersistence } = await import("./useGraphPersistence");

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("useGraphPersistence — persistence round-trip for angle and size", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  // ── 5.1 / 5.3: toJSON output includes angle, width, height at cell top-level ──

  describe("saveGraph — toJSON output structure", () => {
    it("includes angle at top-level of each cell (not inside data)", () => {
      // Requirement 5.1: Persistence_Layer SHALL include Rotation_Angle in saved JSON
      const cellWithAngle = {
        id: "node-1",
        shape: "esp-filter-tank",
        x: 100,
        y: 200,
        width: 120,
        height: 160,
        angle: 45,
        data: { label: "Bồn lọc 1" },
      };

      const mockGraph = {
        toJSON: vi.fn(() => ({ cells: [cellWithAngle] })),
        fromJSON: vi.fn(),
        clearCells: vi.fn(),
      };

      const { result } = withSetup(() =>
        useGraphPersistence(() => mockGraph as any),
      );

      result.saveGraph();

      expect(mockGraph.toJSON).toHaveBeenCalledOnce();

      const saved = JSON.parse(localStorage.getItem("it_system_blueprint")!);
      expect(saved.cells).toHaveLength(1);

      const cell = saved.cells[0];
      // angle must be at top-level
      expect(cell.angle).toBe(45);
      // angle must NOT be inside data
      expect(cell.data?.angle).toBeUndefined();
    });

    it("includes width and height at top-level of each cell (not inside data)", () => {
      // Requirement 5.1 / 5.3: Persistence_Layer SHALL include width/height in saved JSON
      const cellWithSize = {
        id: "node-2",
        shape: "motor-blower",
        x: 50,
        y: 80,
        width: 300,
        height: 250,
        angle: 0,
        data: { label: "Động cơ 1" },
      };

      const mockGraph = {
        toJSON: vi.fn(() => ({ cells: [cellWithSize] })),
        fromJSON: vi.fn(),
        clearCells: vi.fn(),
      };

      const { result } = withSetup(() =>
        useGraphPersistence(() => mockGraph as any),
      );

      result.saveGraph();

      const saved = JSON.parse(localStorage.getItem("it_system_blueprint")!);
      const cell = saved.cells[0];

      // width and height must be at top-level
      expect(cell.width).toBe(300);
      expect(cell.height).toBe(250);
      // must NOT be inside data
      expect(cell.data?.width).toBeUndefined();
      expect(cell.data?.height).toBeUndefined();
    });

    it("preserves angle and size for multiple cells", () => {
      // Requirement 5.1: all nodes in the diagram are included
      const cells = [
        {
          id: "n1",
          shape: "esp-filter-tank",
          x: 0,
          y: 0,
          width: 100,
          height: 80,
          angle: 90,
          data: { label: "A" },
        },
        {
          id: "n2",
          shape: "control-valve",
          x: 200,
          y: 0,
          width: 60,
          height: 60,
          angle: 180,
          data: { label: "B" },
        },
        {
          id: "n3",
          shape: "data-tag",
          x: 400,
          y: 0,
          width: 120,
          height: 40,
          angle: 0,
          data: { label: "C" },
        },
      ];

      const mockGraph = {
        toJSON: vi.fn(() => ({ cells })),
        fromJSON: vi.fn(),
        clearCells: vi.fn(),
      };

      const { result } = withSetup(() =>
        useGraphPersistence(() => mockGraph as any),
      );

      result.saveGraph();

      const saved = JSON.parse(localStorage.getItem("it_system_blueprint")!);
      expect(saved.cells).toHaveLength(3);

      saved.cells.forEach((cell: any, i: number) => {
        expect(cell.angle).toBe(cells[i].angle);
        expect(cell.width).toBe(cells[i].width);
        expect(cell.height).toBe(cells[i].height);
        expect(cell.data?.angle).toBeUndefined();
        expect(cell.data?.width).toBeUndefined();
        expect(cell.data?.height).toBeUndefined();
      });
    });
  });

  // ── 5.2 / 5.4: fromJSON restores nodes with correct angle and size ──────────

  describe("loadGraph — fromJSON restores angle and size", () => {
    it("calls fromJSON with data that includes angle at cell top-level", () => {
      // Requirement 5.2: Graph_Canvas SHALL restore Rotation_Angle from Persistence_Layer
      const storedData = {
        cells: [
          {
            id: "node-1",
            shape: "esp-filter-tank",
            x: 100,
            y: 200,
            width: 120,
            height: 160,
            angle: 45,
            data: { label: "Bồn lọc 1" },
          },
        ],
      };

      localStorage.setItem("it_system_blueprint", JSON.stringify(storedData));

      const mockGraph = {
        toJSON: vi.fn(),
        fromJSON: vi.fn(),
        clearCells: vi.fn(),
      };

      const { result } = withSetup(() =>
        useGraphPersistence(() => mockGraph as any),
      );

      result.loadGraph();

      expect(mockGraph.fromJSON).toHaveBeenCalledOnce();
      const restoredData = mockGraph.fromJSON.mock.calls[0][0];
      expect(restoredData.cells[0].angle).toBe(45);
    });

    it("calls fromJSON with data that includes width and height at cell top-level", () => {
      // Requirement 5.2 / 5.4: Graph_Canvas SHALL restore width and height
      const storedData = {
        cells: [
          {
            id: "node-2",
            shape: "motor-blower",
            x: 50,
            y: 80,
            width: 300,
            height: 250,
            angle: 0,
            data: { label: "Động cơ 1" },
          },
        ],
      };

      localStorage.setItem("it_system_blueprint", JSON.stringify(storedData));

      const mockGraph = {
        toJSON: vi.fn(),
        fromJSON: vi.fn(),
        clearCells: vi.fn(),
      };

      const { result } = withSetup(() =>
        useGraphPersistence(() => mockGraph as any),
      );

      result.loadGraph();

      expect(mockGraph.fromJSON).toHaveBeenCalledOnce();
      const restoredData = mockGraph.fromJSON.mock.calls[0][0];
      expect(restoredData.cells[0].width).toBe(300);
      expect(restoredData.cells[0].height).toBe(250);
    });

    it("restores correct angle and size for multiple nodes", () => {
      // Requirement 5.2 / 5.4: all nodes restored correctly
      const storedData = {
        cells: [
          {
            id: "n1",
            shape: "esp-filter-tank",
            x: 0,
            y: 0,
            width: 100,
            height: 80,
            angle: 90,
            data: { label: "A" },
          },
          {
            id: "n2",
            shape: "control-valve",
            x: 200,
            y: 0,
            width: 60,
            height: 60,
            angle: 180,
            data: { label: "B" },
          },
          {
            id: "n3",
            shape: "data-tag",
            x: 400,
            y: 0,
            width: 120,
            height: 40,
            angle: 0,
            data: { label: "C" },
          },
        ],
      };

      localStorage.setItem("it_system_blueprint", JSON.stringify(storedData));

      const mockGraph = {
        toJSON: vi.fn(),
        fromJSON: vi.fn(),
        clearCells: vi.fn(),
      };

      const { result } = withSetup(() =>
        useGraphPersistence(() => mockGraph as any),
      );

      result.loadGraph();

      const restoredData = mockGraph.fromJSON.mock.calls[0][0];
      expect(restoredData.cells).toHaveLength(3);

      restoredData.cells.forEach((cell: any, i: number) => {
        expect(cell.angle).toBe(storedData.cells[i].angle);
        expect(cell.width).toBe(storedData.cells[i].width);
        expect(cell.height).toBe(storedData.cells[i].height);
      });
    });
  });

  // ── 5.5 / 5.6: Round-trip — serialize then deserialize preserves angle and size ──

  describe("round-trip: saveGraph then loadGraph preserves angle and size", () => {
    it("round-trip preserves non-zero angle (Requirement 5.5)", () => {
      // Requirement 5.5: FOR ALL Node with Rotation_Angle != 0, round-trip preserves angle
      const originalCells = [
        {
          id: "node-1",
          shape: "esp-filter-tank",
          x: 100,
          y: 200,
          width: 120,
          height: 160,
          angle: 45,
          data: { label: "Bồn lọc 1" },
        },
      ];

      const mockGraph = {
        toJSON: vi.fn(() => ({ cells: originalCells })),
        fromJSON: vi.fn(),
        clearCells: vi.fn(),
      };

      const { result } = withSetup(() =>
        useGraphPersistence(() => mockGraph as any),
      );

      // Step 1: Save
      result.saveGraph();

      // Step 2: Load
      result.loadGraph();

      // Verify fromJSON received the same angle that toJSON produced
      const restoredData = mockGraph.fromJSON.mock.calls[0][0];
      expect(restoredData.cells[0].angle).toBe(45);
    });

    it("round-trip preserves custom size (Requirement 5.6)", () => {
      // Requirement 5.6: FOR ALL Node with custom size, round-trip preserves width/height
      const originalCells = [
        {
          id: "node-2",
          shape: "motor-blower",
          x: 50,
          y: 80,
          width: 300,
          height: 250,
          angle: 0,
          data: { label: "Động cơ 1" },
        },
      ];

      const mockGraph = {
        toJSON: vi.fn(() => ({ cells: originalCells })),
        fromJSON: vi.fn(),
        clearCells: vi.fn(),
      };

      const { result } = withSetup(() =>
        useGraphPersistence(() => mockGraph as any),
      );

      // Step 1: Save
      result.saveGraph();

      // Step 2: Load
      result.loadGraph();

      const restoredData = mockGraph.fromJSON.mock.calls[0][0];
      expect(restoredData.cells[0].width).toBe(300);
      expect(restoredData.cells[0].height).toBe(250);
    });

    it("round-trip preserves both angle and size together", () => {
      // Requirements 5.5 + 5.6: combined round-trip for angle and size
      const originalCells = [
        {
          id: "n1",
          shape: "esp-filter-tank",
          x: 0,
          y: 0,
          width: 200,
          height: 150,
          angle: 90,
          data: { label: "A" },
        },
        {
          id: "n2",
          shape: "control-valve",
          x: 300,
          y: 0,
          width: 80,
          height: 80,
          angle: 270,
          data: { label: "B" },
        },
        {
          id: "n3",
          shape: "data-tag",
          x: 600,
          y: 0,
          width: 120,
          height: 40,
          angle: 0,
          data: { label: "C" },
        },
      ];

      const mockGraph = {
        toJSON: vi.fn(() => ({ cells: originalCells })),
        fromJSON: vi.fn(),
        clearCells: vi.fn(),
      };

      const { result } = withSetup(() =>
        useGraphPersistence(() => mockGraph as any),
      );

      // Step 1: Save
      result.saveGraph();

      // Step 2: Load
      result.loadGraph();

      const restoredData = mockGraph.fromJSON.mock.calls[0][0];
      expect(restoredData.cells).toHaveLength(3);

      originalCells.forEach((original, i) => {
        const restored = restoredData.cells[i];
        expect(restored.angle).toBe(original.angle);
        expect(restored.width).toBe(original.width);
        expect(restored.height).toBe(original.height);
      });
    });

    it("exportJSON serializes angle and size at cell top-level (Requirement 5.3)", () => {
      // Requirement 5.3: export JSON includes angle/size at top-level (not inside data)
      const originalCells = [
        {
          id: "node-1",
          shape: "esp-filter-tank",
          x: 100,
          y: 200,
          width: 120,
          height: 160,
          angle: 135,
          data: { label: "Bồn lọc 1" },
        },
      ];

      const mockGraph = {
        toJSON: vi.fn(() => ({ cells: originalCells })),
        fromJSON: vi.fn(),
        clearCells: vi.fn(),
      };

      // Set up composable BEFORE mocking document.createElement
      const { result } = withSetup(() =>
        useGraphPersistence(() => mockGraph as any),
      );

      // Capture what gets written to the blob using a proper constructor
      let capturedJSON: any = null;
      const OriginalBlob = global.Blob;
      class MockBlob extends OriginalBlob {
        constructor(parts: BlobPart[], options?: BlobPropertyBag) {
          super(parts, options);
          if (parts.length > 0 && typeof parts[0] === "string") {
            capturedJSON = JSON.parse(parts[0] as string);
          }
        }
      }
      global.Blob = MockBlob as any;
      global.URL.createObjectURL = vi.fn(() => "blob:mock");
      global.URL.revokeObjectURL = vi.fn();

      // Mock anchor click — intercept AFTER Vue has finished mounting
      const mockAnchor = { href: "", download: "", click: vi.fn() };
      vi.spyOn(document, "createElement").mockReturnValueOnce(
        mockAnchor as any,
      );

      // Export
      result.exportJSON();

      // Restore globals
      global.Blob = OriginalBlob;

      expect(capturedJSON).not.toBeNull();
      expect(capturedJSON.cells[0].angle).toBe(135);
      expect(capturedJSON.cells[0].width).toBe(120);
      expect(capturedJSON.cells[0].height).toBe(160);
      expect(capturedJSON.cells[0].data?.angle).toBeUndefined();
      expect(capturedJSON.cells[0].data?.width).toBeUndefined();
      expect(capturedJSON.cells[0].data?.height).toBeUndefined();
    });
  });
});
