import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createApp } from "vue";
import * as fc from "fast-check";
import type { ScadaFrame } from "../types/socket-monitor";

// ─── Mock socket ──────────────────────────────────────────────────────────────

const mockSocket = {
  connected: false,
  connect: vi.fn(),
  disconnect: vi.fn(),
  emit: vi.fn(),
  on: vi.fn(),
  once: vi.fn(),
};

vi.mock("socket.io-client", () => ({
  io: vi.fn(() => mockSocket),
}));

// ─── withSetup helper ─────────────────────────────────────────────────────────

function withSetup(composable: () => any) {
  let result: any;
  const app = createApp({
    setup() {
      result = composable();
      return () => {};
    },
  });
  const div = document.createElement("div");
  app.mount(div);
  return { result, app, unmount: () => app.unmount() };
}

// ─── Import composable AFTER mock is set up ───────────────────────────────────

const { useSocketMonitor } = await import("./useSocketMonitor");

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("useSocketMonitor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket.connected = false;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // 8.2 — startMonitoring emits monitor:start
  it("startMonitoring emits monitor:start", () => {
    const { result } = withSetup(() => useSocketMonitor(() => null));
    result.startMonitoring();
    expect(mockSocket.emit).toHaveBeenCalledWith("monitor:start");
  });

  // 8.3 — stopMonitoring emits monitor:stop and sets isMonitoring = false on scada:stopped
  it("stopMonitoring emits monitor:stop and sets isMonitoring false when scada:stopped received", () => {
    const { result } = withSetup(() => useSocketMonitor(() => null));

    // Set up monitoring first
    result.startMonitoring();
    expect(result.isMonitoring.value).toBe(true);

    // Call stopMonitoring
    result.stopMonitoring();
    expect(mockSocket.emit).toHaveBeenCalledWith("monitor:stop");

    // Capture the once('scada:stopped') callback and invoke it
    const onceCall = mockSocket.once.mock.calls.find(
      ([event]) => event === "scada:stopped",
    );
    expect(onceCall).toBeDefined();
    const scadaStoppedCallback = onceCall![1];
    scadaStoppedCallback();

    expect(result.isMonitoring.value).toBe(false);
  });

  // 8.4 — Connection timeout 5 seconds sets isMonitoring = false
  it("connection timeout after 5 seconds sets isMonitoring to false", () => {
    vi.useFakeTimers();

    const { result } = withSetup(() => useSocketMonitor(() => null));
    result.startMonitoring();

    // isMonitoring is true right after startMonitoring
    expect(result.isMonitoring.value).toBe(true);

    // Advance past the 5-second timeout (socket.connected stays false)
    vi.advanceTimersByTime(5001);

    expect(result.isMonitoring.value).toBe(false);
  });

  // 8.5 — onUnmounted calls socket.disconnect()
  it("onUnmounted calls socket.disconnect", () => {
    const { unmount } = withSetup(() => useSocketMonitor(() => null));
    unmount();
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  // 8.6 — Property 8: Monitor_Client frame application
  // Feature: nestjs-socket-monitor, Property 8: Monitor_Client frame application
  it("calls node.setData for each device in frame", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 10 }),
            type: fc.constantFrom(
              "esp-filter-tank",
              "motor-blower",
              "control-valve",
              "data-tag",
            ),
            data: fc.record({ label: fc.string(), status: fc.string() }),
          }),
          { minLength: 1, maxLength: 5 },
        ),
        (devices) => {
          vi.clearAllMocks();
          mockSocket.connected = false;

          const frame: ScadaFrame = { timestamp: Date.now(), devices };

          // Mock graph with nodes for all device IDs
          const mockSetData = vi.fn();
          const mockGraph = {
            getCellById: (id: string) =>
              devices.find((d) => d.id === id)
                ? { setData: mockSetData }
                : null,
          };

          const { result } = withSetup(() =>
            useSocketMonitor(() => mockGraph as any),
          );

          // Simulate receiving scada:frame by finding the registered handler
          const frameHandler = mockSocket.on.mock.calls.find(
            ([event]) => event === "scada:frame",
          )?.[1];
          if (frameHandler) frameHandler(frame);

          expect(mockSetData).toHaveBeenCalledTimes(devices.length);
          devices.forEach((device, i) => {
            expect(mockSetData).toHaveBeenNthCalledWith(i + 1, device.data);
          });

          mockSetData.mockClear();
          return true;
        },
      ),
      { numRuns: 100 },
    );
  });
});
