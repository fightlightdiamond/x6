import type { Meta, StoryObj } from '@storybook/vue3';
import DeviceNode from './DeviceNode.vue';

const meta = {
  title: 'X6 Thiết bị IT/Device Node Đa Năng',
  component: DeviceNode,
  tags: ['autodocs'],
  argTypes: {
    deviceType: {
      control: 'select',
      options: ['case', 'monitor', 'mouse', 'keyboard', 'power', 'network', 'unknown'],
      description: 'Loại thiết bị để đổi icon tương ứng'
    },
    status: {
      control: 'select',
      options: ['online', 'offline', 'warning'],
      description: 'Trạng thái hoạt động (đổi màu viền và hiệu ứng nhấp nháy)'
    },
    deviceName: {
      control: 'text',
      description: 'Tên hiển thị của thiết bị'
    }
  },
  decorators: [
    (story) => ({
      components: { story },
      template: '<div style="padding: 2rem;"><story /></div>'
    })
  ]
} satisfies Meta<typeof DeviceNode>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Case: Story = {
  args: {
    deviceType: 'case',
    deviceName: 'Server Alpha',
    status: 'online',
    metrics: [
      { label: 'CPU Temp', value: 45, unit: '°C' },
      { label: 'RAM Usage', value: 64, unit: '%' },
      { label: 'Fan RPM', value: 1200, unit: 'RPM' }
    ]
  }
};

export const Monitor: Story = {
  args: {
    deviceType: 'monitor',
    deviceName: 'LG UltraGear',
    status: 'warning',
    metrics: [
      { label: 'Refresh Rate', value: 144, unit: 'Hz' },
      { label: 'HDR', value: 'Bật', unit: '' }
    ]
  }
};

export const Network_Router: Story = {
  args: {
    deviceType: 'network',
    deviceName: 'Cisco Router',
    status: 'online',
    metrics: [
      { label: 'Ping', value: 12, unit: 'ms' },
      { label: 'Băng thông', value: 850, unit: 'Mbps' }
    ]
  }
};

export const PowerSupply: Story = {
  args: {
    deviceType: 'power',
    deviceName: 'Corsair RM850x',
    status: 'offline', // Sẽ tô màu xám
    metrics: [
      { label: 'Công suất', value: 0, unit: 'W' },
      { label: 'Hiệu suất', value: '--', unit: '%' }
    ]
  }
};

export const Mouse_Keyboard: Story = {
  args: {
    deviceType: 'keyboard',
    deviceName: 'Keychron K8',
    status: 'warning', // Cảnh báo sắp hết pin
    metrics: [
      { label: 'Pin', value: 15, unit: '%' },
      { label: 'Kết nối', value: 'Bluetooth', unit: '' }
    ]
  }
};
