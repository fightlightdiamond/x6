/**
 * Sample reports data for development and testing.
 *
 * @module modules/reports/mock-data
 */

import type { Report } from "./types";

export const MOCK_REPORTS: Report[] = [
  {
    id: "report-001",
    title: "Monthly Production Report",
    description:
      "Comprehensive summary of production output for the current month. Includes throughput metrics, downtime analysis, OEE calculations, and comparison against monthly targets.",
    content:
      "# Monthly Production Report\n\n## Summary\nTotal production this month reached 12,450 units, achieving 98.2% of the monthly target.\n\n## Key Metrics\n- Overall Equipment Effectiveness (OEE): 87.4%\n- Planned downtime: 18 hours\n- Unplanned downtime: 4.5 hours\n- Average cycle time: 2.3 min/unit\n\n## Recommendations\nSchedule preventive maintenance for Line 3 to reduce unplanned stoppages.",
    format: "pdf",
    created_at: "2024-01-31T23:59:00.000Z",
    updated_at: "2024-02-01T06:15:00.000Z",
  },
  {
    id: "report-002",
    title: "Equipment Maintenance Log",
    description:
      "Detailed log of all maintenance activities performed on plant equipment during the quarter. Covers scheduled inspections, corrective repairs, spare parts usage, and technician hours.",
    content:
      "Equipment ID,Date,Type,Description,Technician,Duration (h),Parts Used\nPMP-001,2024-01-05,Preventive,Bearing replacement and lubrication,T. Nguyen,3.5,Bearing 6205\nVLV-012,2024-01-12,Corrective,Actuator seal replacement,L. Tran,2.0,Seal kit SK-012\nCMP-003,2024-01-20,Preventive,Filter cleaning and belt inspection,T. Nguyen,1.5,Filter element FE-003\nPMP-002,2024-02-03,Corrective,Impeller wear — replaced,H. Le,5.0,Impeller IMP-002A\nHEX-001,2024-02-14,Preventive,Tube bundle cleaning,L. Tran,4.0,Cleaning chemicals",
    format: "csv",
    created_at: "2024-03-31T23:59:00.000Z",
    updated_at: "2024-04-01T08:00:00.000Z",
  },
  {
    id: "report-003",
    title: "Energy Consumption Summary",
    description:
      "Analysis of energy consumption across all production lines and utility systems for Q1. Highlights high-consumption areas, efficiency trends, and cost-saving opportunities.",
    content:
      "# Energy Consumption Summary — Q1 2024\n\n## Total Consumption\n- Electricity: 1,245,800 kWh\n- Natural Gas: 48,200 m³\n- Compressed Air: 320,000 Nm³\n\n## Breakdown by Area\n| Area | kWh | % of Total |\n|------|-----|------------|\n| Production Line 1 | 412,000 | 33.1% |\n| Production Line 2 | 389,500 | 31.3% |\n| HVAC & Utilities | 244,300 | 19.6% |\n| Lighting & Offices | 200,000 | 16.1% |\n\n## Efficiency Trend\nEnergy intensity improved by 3.2% compared to Q1 2023 (0.098 kWh/unit vs 0.101 kWh/unit).\n\n## Recommendations\n1. Install variable-frequency drives on cooling tower fans (estimated saving: 18,000 kWh/month)\n2. Upgrade lighting in Warehouse B to LED (estimated saving: 4,500 kWh/month)",
    format: "pdf",
    created_at: "2024-04-05T10:00:00.000Z",
    updated_at: "2024-04-05T10:00:00.000Z",
  },
  {
    id: "report-004",
    title: "Quality Control Inspection Report",
    description:
      "Weekly quality control inspection results including defect rates, non-conformance records, corrective actions, and statistical process control charts for critical parameters.",
    content:
      "Week,Line,Inspected,Defects,Defect Rate (%),Major NCRs,Minor NCRs,Corrective Actions\n2024-W14,Line 1,3200,48,1.50,2,6,CA-2024-041\n2024-W14,Line 2,3050,31,1.02,1,4,CA-2024-042\n2024-W15,Line 1,3180,52,1.63,3,7,CA-2024-043\n2024-W15,Line 2,3100,28,0.90,0,5,—\n2024-W16,Line 1,3250,39,1.20,1,5,CA-2024-044\n2024-W16,Line 2,3200,33,1.03,1,4,CA-2024-045",
    format: "excel",
    created_at: "2024-04-19T16:30:00.000Z",
    updated_at: "2024-04-19T16:30:00.000Z",
  },
];
