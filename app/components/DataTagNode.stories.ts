import type { Meta, StoryObj } from "@storybook/vue3";
import DataTagNode from "./DataTagNode.vue";

const meta = {
  title: "X6 Nodes/DataTagNode",
  component: DataTagNode,
  tags: ["autodocs"],
  argTypes: {
    label: {
      control: "text",
      description: "Tên tag (TEMP-01, PRES-01...)",
    },
    value: {
      control: "number",
      description: "Giá trị hiển thị",
    },
    unit: {
      control: "text",
      description: "Đơn vị (°C, kPa, A, kV...)",
    },
    status: {
      control: "select",
      options: ["normal", "high", "low", "alarm"],
      description: "Trạng thái — ảnh hưởng màu nền",
    },
    size: {
      control: "select",
      options: ["normal", "mini"],
      description:
        "Kích thước: normal (120×60) hoặc mini (sensor nhỏ trên đường ống)",
    },
  },
  decorators: [
    (story) => ({
      components: { story },
      template:
        '<div style="padding: 2rem; background: #0f172a; display: inline-block;"><story /></div>',
    }),
  ],
} satisfies Meta<typeof DataTagNode>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Normal size ────────────────────────────────────────────────────────────

export const Temperature: Story = {
  args: {
    label: "TEMP-01",
    value: 65.0,
    unit: "°C",
    status: "normal",
    size: "normal",
  },
};

export const Pressure: Story = {
  args: {
    label: "PRES-01",
    value: 101.3,
    unit: "kPa",
    status: "normal",
    size: "normal",
  },
};

export const Current: Story = {
  args: {
    label: "CURR-01",
    value: 120.0,
    unit: "A",
    status: "normal",
    size: "normal",
  },
};

export const Voltage: Story = {
  args: {
    label: "VOLT-01",
    value: 80.2,
    unit: "kV",
    status: "normal",
    size: "normal",
  },
};

export const HighAlarm: Story = {
  args: {
    label: "TEMP-02",
    value: 142.5,
    unit: "°C",
    status: "alarm",
    size: "normal",
  },
};

// ── Mini size ──────────────────────────────────────────────────────────────

export const MiniTemp: Story = {
  args: {
    label: "T",
    value: 54,
    unit: "°C",
    status: "normal",
    size: "mini",
  },
};

export const MiniAlarm: Story = {
  args: {
    label: "T",
    value: 123,
    unit: "°C",
    status: "alarm",
    size: "mini",
  },
};

// ── Mini row (giống hình SCADA — nhiều sensor nhỏ dưới Ventilátor) ─────────

export const MiniSensorRow: Story = {
  render: () => ({
    components: { DataTagNode },
    template: `
      <div style="display: flex; gap: 4px; padding: 1rem; background: #0f172a; align-items: center;">
        <DataTagNode size="mini" label="T1" :value="54" unit="°C" status="normal" />
        <DataTagNode size="mini" label="T2" :value="53" unit="°C" status="normal" />
        <DataTagNode size="mini" label="T3" :value="55" unit="°C" status="normal" />
        <DataTagNode size="mini" label="T4" :value="55" unit="°C" status="normal" />
      </div>
    `,
  }),
};

export const NormalVsMini: Story = {
  render: () => ({
    components: { DataTagNode },
    template: `
      <div style="display: flex; gap: 1.5rem; padding: 2rem; background: #0f172a; align-items: flex-start;">
        <div>
          <p style="color:#94a3b8; font-size:11px; margin-bottom:6px;">Normal (120×60)</p>
          <DataTagNode size="normal" label="TEMP-01" :value="65.0" unit="°C" status="normal" />
        </div>
        <div>
          <p style="color:#94a3b8; font-size:11px; margin-bottom:6px;">Mini (60×24)</p>
          <DataTagNode size="mini" label="T" :value="65" unit="°C" status="normal" />
        </div>
        <div>
          <p style="color:#94a3b8; font-size:11px; margin-bottom:6px;">Mini alarm</p>
          <DataTagNode size="mini" label="T" :value="123" unit="°C" status="alarm" />
        </div>
      </div>
    `,
  }),
};
