import type { Meta, StoryObj } from "@storybook/vue3";
import StaticEquipmentNode from "./StaticEquipmentNode.vue";

const meta = {
  title: "X6 Nodes/StaticEquipmentNode",
  component: StaticEquipmentNode,
  tags: ["autodocs"],
  argTypes: {
    equipmentType: {
      control: "select",
      options: ["cyclone", "chimney", "hopper"],
      description: "Loại thiết bị tĩnh",
    },
    label: {
      control: "text",
      description: "Nhãn hiển thị bên dưới",
    },
  },
  decorators: [
    (story) => ({
      components: { story },
      template:
        '<div style="padding: 2rem; background: #1e293b; display: inline-block;"><story /></div>',
    }),
  ],
} satisfies Meta<typeof StaticEquipmentNode>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Cyclone: Story = {
  args: {
    equipmentType: "cyclone",
    label: "Cyclone 1",
  },
};

export const Chimney: Story = {
  args: {
    equipmentType: "chimney",
    label: "Chimney 1",
  },
};

export const WaterTank: Story = {
  args: {
    equipmentType: "hopper",
    label: "Water Tank",
  },
};

export const AllThree: Story = {
  render: () => ({
    components: { StaticEquipmentNode },
    template: `
      <div style="display: flex; gap: 2rem; padding: 2rem; background: #1e293b; align-items: flex-end;">
        <div>
          <StaticEquipmentNode equipmentType="cyclone" label="Cyclone 1" />
        </div>
        <div>
          <StaticEquipmentNode equipmentType="hopper" label="Water Tank" />
        </div>
        <div>
          <StaticEquipmentNode equipmentType="chimney" label="Chimney 1" />
        </div>
      </div>
    `,
  }),
};
