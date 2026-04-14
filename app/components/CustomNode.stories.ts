import type { Meta, StoryObj } from '@storybook/vue3';
import CustomNode from './CustomNode.vue';

const meta = {
  title: 'X6 Nodes/CustomNode',
  component: CustomNode,
  tags: ['autodocs'],
  // CustomNode không có props vì nó dùng inject('getNode'), 
  // nhưng để test độc lập ta có thể hiển thị nó giao diện mặc định.
  decorators: [
    (story) => ({
      components: { story },
      template: '<div style="width: 150px; height: 50px; position: relative;"><story /></div>'
    })
  ]
} satisfies Meta<typeof CustomNode>;

export default meta;
type Story = StoryObj<typeof meta>;

// Trạng thái mặc định (sẽ hiển thị text 'Node' vì không có X6 Graph data)
export const Default: Story = {};
