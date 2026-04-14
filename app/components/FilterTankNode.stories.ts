import type { Meta, StoryObj } from '@storybook/vue3';
import FilterTankNode from './FilterTankNode.vue';

const meta = {
  title: 'X6 Nodes/FilterTankNode',
  component: FilterTankNode,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['chạy', 'dừng', 'lỗi'],
      description: 'Trạng thái hoạt động của bồn lọc'
    },
    voltage: {
      control: 'number',
      description: 'Điện áp (kV)'
    },
    current: {
      control: 'number',
      description: 'Dòng điện (mA)'
    }
  },
  // Bọc vào khung có size kích thước cố định để mô phỏng hiển thị trên Node X6
  decorators: [
    (story) => ({
      components: { story },
      template: '<div style="width: 120px; height: 150px; position: relative;"><story /></div>'
    })
  ]
} satisfies Meta<typeof FilterTankNode>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Chay: Story = {
  args: {
    status: 'chạy',
    voltage: 12.5,
    current: 450,
  },
};

export const Dung: Story = {
  args: {
    status: 'dừng',
    voltage: 0,
    current: 0,
  },
};

export const Loi: Story = {
  args: {
    status: 'lỗi',
    voltage: 22.1,
    current: 850,
  },
};
