/**
 * Sample web pages data for development and testing.
 *
 * @module modules/web/mock-data
 */

import type { WebPage } from "./types";

export const MOCK_WEB_PAGES: WebPage[] = [
  {
    id: "web-001",
    title: "Home Dashboard",
    content:
      "Main dashboard overview showing system status, active devices, and recent alerts.",
    url: "/dashboard",
    created_at: "2024-01-10T08:00:00.000Z",
    updated_at: "2024-03-15T14:30:00.000Z",
  },
  {
    id: "web-002",
    title: "Device Monitoring",
    content:
      "Real-time monitoring page for all connected SCADA devices. Displays live sensor readings and device health.",
    url: "/monitoring/devices",
    created_at: "2024-01-12T09:15:00.000Z",
    updated_at: "2024-03-20T10:00:00.000Z",
  },
  {
    id: "web-003",
    title: "Alarm Management",
    content:
      "Centralized alarm management interface. View, acknowledge, and resolve active alarms across all systems.",
    url: "/alarms",
    created_at: "2024-01-15T11:00:00.000Z",
    updated_at: "2024-04-01T09:45:00.000Z",
  },
  {
    id: "web-004",
    title: "System Configuration",
    content:
      "System-wide configuration settings including network parameters, user management, and security policies.",
    url: "/config/system",
    created_at: "2024-02-01T13:00:00.000Z",
    updated_at: "2024-04-05T16:20:00.000Z",
  },
  {
    id: "web-005",
    title: "Historical Data Viewer",
    content:
      "Browse and analyze historical process data. Supports date range selection, data export, and trend visualization.",
    url: "/history",
    created_at: "2024-02-10T10:30:00.000Z",
    updated_at: "2024-04-10T11:00:00.000Z",
  },
];
