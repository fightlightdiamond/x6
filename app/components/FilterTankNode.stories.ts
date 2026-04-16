import type { Meta, StoryObj } from "@storybook/vue3";
import FilterTankNode from "./FilterTankNode.vue";

const meta = {
  title: "X6 Nodes/FilterTankNode",
  component: FilterTankNode,
  tags: ["autodocs"],
  argTypes: {
    status: {
      control: "select",
      options: ["chạy", "dừng", "lỗi"],
      description: "Trạng thái hoạt động của bồn lọc",
    },
    voltage: {
      control: "number",
      description: "Điện áp cao thế (kV)",
    },
    current: {
      control: "number",
      description: "Dòng điện (mA)",
    },
    label: {
      control: "text",
      description: "Tên bồn (Filtr 1, 2, 3, 4)",
    },
  },
  // Bọc vào khung kích thước cố định để mô phỏng hiển thị trên Node X6 (100×140)
  decorators: [
    (story) => ({
      components: { story },
      template:
        '<div style="width: 100px; height: 140px; position: relative;"><story /></div>',
    }),
  ],
} satisfies Meta<typeof FilterTankNode>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Chay: Story = {
  args: {
    status: "chạy",
    voltage: 80.2,
    current: 600,
    label: "Filtr 1",
  },
};

export const Dung: Story = {
  args: {
    status: "dừng",
    voltage: 80.2,
    current: 600,
    label: "Filtr 2",
  },
};

export const Loi: Story = {
  args: {
    status: "lỗi",
    voltage: 75.3,
    current: 850,
    label: "Filtr 3",
  },
};

export const Default: Story = {
  args: {
    // All defaults: status='dừng', voltage=80.2, current=600, label='Filtr'
  },
};
