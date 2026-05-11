/**
 * Sample trends data for development and testing.
 *
 * Includes a mix of private and shared trends owned by different users,
 * which is important for testing scoped permission logic.
 *
 * @module modules/trends/mock-data
 */

import type { Trend } from "./types";

export const MOCK_TRENDS: Trend[] = [
  {
    id: "trend-001",
    name: "Temperature Sensor A — Daily",
    description:
      "Daily temperature readings from Sensor A in the main processing unit. Private trend for personal analysis.",
    type: "private",
    user_id: "user-1",
    data: [
      { timestamp: "2024-04-01T00:00:00Z", value: 72.4 },
      { timestamp: "2024-04-02T00:00:00Z", value: 73.1 },
      { timestamp: "2024-04-03T00:00:00Z", value: 71.8 },
    ],
    created_at: "2024-03-01T08:00:00.000Z",
    updated_at: "2024-04-03T06:00:00.000Z",
  },
  {
    id: "trend-002",
    name: "Pressure Overview — Shared",
    description:
      "Shared pressure trend across all pump stations. Visible to the entire operations team.",
    type: "shared",
    user_id: "user-1",
    data: [
      { timestamp: "2024-04-01T00:00:00Z", value: 4.2 },
      { timestamp: "2024-04-02T00:00:00Z", value: 4.5 },
      { timestamp: "2024-04-03T00:00:00Z", value: 4.3 },
    ],
    created_at: "2024-03-05T09:30:00.000Z",
    updated_at: "2024-04-03T07:15:00.000Z",
  },
  {
    id: "trend-003",
    name: "Flow Rate — Reactor B",
    description:
      "Private flow rate trend for Reactor B. Used for personal troubleshooting by the design engineer.",
    type: "private",
    user_id: "user-2",
    data: [
      { timestamp: "2024-04-01T00:00:00Z", value: 120.5 },
      { timestamp: "2024-04-02T00:00:00Z", value: 118.9 },
      { timestamp: "2024-04-03T00:00:00Z", value: 122.0 },
    ],
    created_at: "2024-03-10T11:00:00.000Z",
    updated_at: "2024-04-02T14:00:00.000Z",
  },
  {
    id: "trend-004",
    name: "Energy Consumption — Plant Wide",
    description:
      "Shared energy consumption trend aggregated across all plant sections. Published for management review.",
    type: "shared",
    user_id: "user-2",
    data: [
      { timestamp: "2024-04-01T00:00:00Z", value: 5420 },
      { timestamp: "2024-04-02T00:00:00Z", value: 5380 },
      { timestamp: "2024-04-03T00:00:00Z", value: 5510 },
    ],
    created_at: "2024-03-12T13:45:00.000Z",
    updated_at: "2024-04-03T08:00:00.000Z",
  },
  {
    id: "trend-005",
    name: "Vibration Analysis — Motor 3",
    description:
      "Private vibration trend for Motor 3 predictive maintenance. Restricted to the maintenance engineer.",
    type: "private",
    user_id: "user-3",
    data: [
      { timestamp: "2024-04-01T00:00:00Z", value: 0.82 },
      { timestamp: "2024-04-02T00:00:00Z", value: 0.85 },
      { timestamp: "2024-04-03T00:00:00Z", value: 0.91 },
    ],
    created_at: "2024-03-20T10:00:00.000Z",
    updated_at: "2024-04-03T09:30:00.000Z",
  },
  {
    id: "trend-006",
    name: "Water Quality — Shared Dashboard",
    description:
      "Shared water quality metrics (pH, turbidity, dissolved oxygen) for the environmental compliance dashboard.",
    type: "shared",
    user_id: "user-3",
    data: [
      { timestamp: "2024-04-01T00:00:00Z", ph: 7.2, turbidity: 1.1, do: 8.4 },
      { timestamp: "2024-04-02T00:00:00Z", ph: 7.1, turbidity: 1.3, do: 8.2 },
      { timestamp: "2024-04-03T00:00:00Z", ph: 7.3, turbidity: 1.0, do: 8.5 },
    ],
    created_at: "2024-03-25T14:00:00.000Z",
    updated_at: "2024-04-03T10:00:00.000Z",
  },
];
