/**
 * Sample mimics data for development and testing.
 *
 * @module modules/mimics/mock-data
 */

import type { Mimic } from "./types";

export const MOCK_MIMICS: Mimic[] = [
  {
    id: "mimic-001",
    name: "Pump Station Overview",
    description:
      "High-level overview of the main pump station. Displays pump status, flow rates, pressure readings, and valve positions across all active pumping units.",
    config: {
      refreshInterval: 2000,
      alarmEnabled: true,
      theme: "dark",
      units: {
        flow: "m³/h",
        pressure: "bar",
      },
    },
    layout: {
      width: 1920,
      height: 1080,
      grid: { columns: 24, rows: 16 },
      elements: [
        { id: "pump-1", type: "pump", x: 200, y: 300, width: 120, height: 80 },
        { id: "pump-2", type: "pump", x: 400, y: 300, width: 120, height: 80 },
        { id: "valve-1", type: "valve", x: 320, y: 200, width: 60, height: 60 },
        {
          id: "flow-meter-1",
          type: "gauge",
          x: 600,
          y: 280,
          width: 100,
          height: 100,
        },
      ],
    },
    created_at: "2024-01-08T07:00:00.000Z",
    updated_at: "2024-03-12T09:30:00.000Z",
  },
  {
    id: "mimic-002",
    name: "Reactor Control Panel",
    description:
      "Detailed control panel for the primary reactor unit. Shows temperature profiles, coolant flow, pressure vessels, and safety interlock status in real time.",
    config: {
      refreshInterval: 500,
      alarmEnabled: true,
      criticalAlarmSound: true,
      theme: "dark",
      units: {
        temperature: "°C",
        pressure: "kPa",
        flow: "L/min",
      },
    },
    layout: {
      width: 2560,
      height: 1440,
      grid: { columns: 32, rows: 20 },
      elements: [
        {
          id: "reactor-vessel",
          type: "vessel",
          x: 800,
          y: 400,
          width: 200,
          height: 300,
        },
        {
          id: "temp-sensor-1",
          type: "sensor",
          x: 750,
          y: 350,
          width: 50,
          height: 50,
        },
        {
          id: "temp-sensor-2",
          type: "sensor",
          x: 1050,
          y: 350,
          width: 50,
          height: 50,
        },
        {
          id: "coolant-pump",
          type: "pump",
          x: 500,
          y: 600,
          width: 120,
          height: 80,
        },
        {
          id: "safety-valve",
          type: "valve",
          x: 900,
          y: 200,
          width: 60,
          height: 60,
        },
      ],
    },
    created_at: "2024-01-20T10:00:00.000Z",
    updated_at: "2024-04-02T14:15:00.000Z",
  },
  {
    id: "mimic-003",
    name: "Water Treatment Plant",
    description:
      "Full process view of the water treatment facility. Covers intake screening, coagulation, sedimentation, filtration, disinfection, and distribution stages.",
    config: {
      refreshInterval: 3000,
      alarmEnabled: true,
      theme: "light",
      units: {
        flow: "m³/h",
        turbidity: "NTU",
        chlorine: "mg/L",
        pH: "pH",
      },
    },
    layout: {
      width: 3840,
      height: 1080,
      grid: { columns: 48, rows: 16 },
      elements: [
        {
          id: "intake-screen",
          type: "filter",
          x: 100,
          y: 400,
          width: 150,
          height: 200,
        },
        {
          id: "coagulation-tank",
          type: "tank",
          x: 400,
          y: 350,
          width: 200,
          height: 250,
        },
        {
          id: "sedimentation-basin",
          type: "tank",
          x: 750,
          y: 300,
          width: 300,
          height: 300,
        },
        {
          id: "sand-filter",
          type: "filter",
          x: 1200,
          y: 350,
          width: 200,
          height: 250,
        },
        {
          id: "chlorination-unit",
          type: "dosing",
          x: 1600,
          y: 400,
          width: 150,
          height: 150,
        },
        {
          id: "clear-well",
          type: "tank",
          x: 1900,
          y: 300,
          width: 250,
          height: 300,
        },
      ],
    },
    created_at: "2024-02-05T08:30:00.000Z",
    updated_at: "2024-04-08T11:45:00.000Z",
  },
  {
    id: "mimic-004",
    name: "Substation Single-Line Diagram",
    description:
      "Single-line electrical diagram for the main 110/11 kV substation. Displays breaker states, transformer loading, bus voltages, and feeder status.",
    config: {
      refreshInterval: 1000,
      alarmEnabled: true,
      theme: "dark",
      units: {
        voltage: "kV",
        current: "A",
        power: "MW",
        frequency: "Hz",
      },
    },
    layout: {
      width: 1920,
      height: 1080,
      grid: { columns: 24, rows: 16 },
      elements: [
        {
          id: "transformer-1",
          type: "transformer",
          x: 600,
          y: 300,
          width: 160,
          height: 200,
        },
        {
          id: "breaker-hv-1",
          type: "breaker",
          x: 580,
          y: 200,
          width: 40,
          height: 60,
        },
        {
          id: "breaker-lv-1",
          type: "breaker",
          x: 580,
          y: 520,
          width: 40,
          height: 60,
        },
        {
          id: "busbar-hv",
          type: "busbar",
          x: 200,
          y: 180,
          width: 800,
          height: 20,
        },
        {
          id: "busbar-lv",
          type: "busbar",
          x: 200,
          y: 600,
          width: 800,
          height: 20,
        },
        {
          id: "feeder-1",
          type: "feeder",
          x: 300,
          y: 620,
          width: 80,
          height: 120,
        },
        {
          id: "feeder-2",
          type: "feeder",
          x: 500,
          y: 620,
          width: 80,
          height: 120,
        },
      ],
    },
    created_at: "2024-02-18T13:00:00.000Z",
    updated_at: "2024-04-15T16:00:00.000Z",
  },
];
