import type { Meta, StoryObj } from '@storybook/vue3';
import Graph from './Graph.vue';

const meta = {
  title: 'X6 Layouts/Bức Tranh Tổng Thể (Graph Viewer)',
  component: Graph,
  tags: ['autodocs'],
  parameters: {
    // Đảm bảo không có padding xung quanh để cho component chiếm trọn toàn màn hình (h-screen)
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Graph>;

export default meta;
type Story = StoryObj<typeof meta>;

// Bản demo chính thức của Canvas
export const Default: Story = {
  render: () => ({
    components: { Graph },
    template: '<Graph />',
  }),
};
