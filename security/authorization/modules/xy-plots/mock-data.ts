/**
 * Sample XY plots data for development and testing.
 *
 * Includes a mix of private and shared XY plots owned by different users,
 * which is important for testing scoped permission logic.
 *
 * @module modules/xy-plots/mock-data
 */

import type { XYPlot } from "./types";

export const MOCK_XY_PLOTS: XYPlot[] = [
  {
    id: "xy-plot-001",
    name: "Temperature vs Pressure",
    description:
      "Private XY plot correlating reactor temperature against operating pressure. Used for personal process analysis.",
    type: "private",
    user_id: "user-1",
    x_axis: { label: "Temperature", unit: "°C", min: 0, max: 200 },
    y_axis: { label: "Pressure", unit: "bar", min: 0, max: 10 },
    data_points: [
      { x: 80, y: 3.2 },
      { x: 100, y: 4.1 },
      { x: 120, y: 5.0 },
      { x: 140, y: 6.2 },
      { x: 160, y: 7.5 },
    ],
    created_at: "2024-03-01T08:00:00.000Z",
    updated_at: "2024-04-03T06:00:00.000Z",
  },
  {
    id: "xy-plot-002",
    name: "Flow Rate vs Time",
    description:
      "Shared XY plot showing flow rate variation over time across all pump stations. Published for operations team review.",
    type: "shared",
    user_id: "user-1",
    x_axis: { label: "Time", unit: "min", min: 0, max: 60 },
    y_axis: { label: "Flow Rate", unit: "L/min", min: 0, max: 500 },
    data_points: [
      { x: 0, y: 320 },
      { x: 10, y: 335 },
      { x: 20, y: 310 },
      { x: 30, y: 345 },
      { x: 40, y: 360 },
      { x: 50, y: 350 },
      { x: 60, y: 340 },
    ],
    created_at: "2024-03-05T09:30:00.000Z",
    updated_at: "2024-04-03T07:15:00.000Z",
  },
  {
    id: "xy-plot-003",
    name: "Voltage vs Current",
    description:
      "Private I-V characteristic curve for Motor 2 drive system. Restricted to the design engineer for diagnostics.",
    type: "private",
    user_id: "user-2",
    x_axis: { label: "Voltage", unit: "V", min: 0, max: 480 },
    y_axis: { label: "Current", unit: "A", min: 0, max: 100 },
    data_points: [
      { x: 0, y: 0 },
      { x: 120, y: 25 },
      { x: 240, y: 50 },
      { x: 360, y: 75 },
      { x: 480, y: 98 },
    ],
    created_at: "2024-03-10T11:00:00.000Z",
    updated_at: "2024-04-02T14:00:00.000Z",
  },
  {
    id: "xy-plot-004",
    name: "Pump Efficiency vs Flow",
    description:
      "Shared pump efficiency curve for Pump Station B. Published for maintenance and operations teams.",
    type: "shared",
    user_id: "user-2",
    x_axis: { label: "Flow Rate", unit: "m³/h", min: 0, max: 200 },
    y_axis: { label: "Efficiency", unit: "%", min: 0, max: 100 },
    data_points: [
      { x: 20, y: 55 },
      { x: 60, y: 72 },
      { x: 100, y: 85 },
      { x: 140, y: 80 },
      { x: 180, y: 68 },
    ],
    created_at: "2024-03-12T13:45:00.000Z",
    updated_at: "2024-04-03T08:00:00.000Z",
  },
  {
    id: "xy-plot-005",
    name: "Vibration Amplitude vs Frequency",
    description:
      "Private vibration spectrum plot for Motor 3 predictive maintenance. Restricted to the maintenance engineer.",
    type: "private",
    user_id: "user-3",
    x_axis: { label: "Frequency", unit: "Hz", min: 0, max: 1000 },
    y_axis: { label: "Amplitude", unit: "mm/s", min: 0, max: 20 },
    data_points: [
      { x: 50, y: 1.2 },
      { x: 100, y: 3.5 },
      { x: 200, y: 2.1 },
      { x: 400, y: 0.8 },
      { x: 800, y: 0.3 },
    ],
    created_at: "2024-03-20T10:00:00.000Z",
    updated_at: "2024-04-03T09:30:00.000Z",
  },
  {
    id: "xy-plot-006",
    name: "pH vs Dissolved Oxygen",
    description:
      "Shared water quality correlation plot for the environmental compliance dashboard. Visible to all operators.",
    type: "shared",
    user_id: "user-3",
    x_axis: { label: "pH", unit: "pH", min: 6, max: 9 },
    y_axis: { label: "Dissolved Oxygen", unit: "mg/L", min: 0, max: 15 },
    data_points: [
      { x: 6.5, y: 7.8 },
      { x: 7.0, y: 8.2 },
      { x: 7.2, y: 8.4 },
      { x: 7.5, y: 8.9 },
      { x: 8.0, y: 9.1 },
    ],
    created_at: "2024-03-25T14:00:00.000Z",
    updated_at: "2024-04-03T10:00:00.000Z",
  },
];
