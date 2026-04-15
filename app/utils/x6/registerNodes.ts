import { register } from '@antv/x6-vue-shape';
import CustomNode from '../../components/CustomNode.vue';
import FilterTankNode from '../../components/FilterTankNode.vue';
import DeviceNode from '../../components/DeviceNode.vue';

/**
 * Đăng ký tất cả các Vue Shape sử dụng trong X6 Graph.
 * Gọi hàm này 1 lần duy nhất ngay khi khởi tạo Graph thành công lần đầu.
 */
export function registerAllVueNodes() {
  register({
    shape: 'my-vue-shape',
    width: 150,
    height: 50,
    component: CustomNode,
  });

  register({
    shape: 'filter-tank-node',
    width: 100,
    height: 120,
    component: FilterTankNode,
  });

  register({
    shape: 'computer-device-node',
    width: 180,
    height: 80,
    component: DeviceNode,
    ports: {
      groups: {
        top: { position: 'top', attrs: { circle: { r: 5, magnet: true, stroke: '#31d0c6', strokeWidth: 2, fill: '#fff' } } },
        bottom: { position: 'bottom', attrs: { circle: { r: 5, magnet: true, stroke: '#31d0c6', strokeWidth: 2, fill: '#fff' } } },
        left: { position: 'left', attrs: { circle: { r: 5, magnet: true, stroke: '#31d0c6', strokeWidth: 2, fill: '#fff' } } },
        right: { position: 'right', attrs: { circle: { r: 5, magnet: true, stroke: '#31d0c6', strokeWidth: 2, fill: '#fff' } } },
      },
    },
  });
}
