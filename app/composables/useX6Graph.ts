import { shallowRef } from 'vue';
import { Graph } from '@antv/x6';
import { Dnd } from '@antv/x6-plugin-dnd';
import { validateITConnection } from '../utils/x6/connectionRules';
import { registerAllVueNodes } from '../utils/x6/registerNodes';

// Để đảm bảo proxy của Vue không làm hỏng X6 Graph Class, ta dùng biến cục bộ hoặc shallowRef
let graphInstance: Graph | null = null;
let dndInstance: Dnd | null = null;
let preventDuplicateRegister = false;

export const useX6Graph = () => {
  const isGraphReady = shallowRef(false);

  const initGraph = (containerEl: HTMLElement) => {
    if (graphInstance) {
      graphInstance.dispose();
    }

    if (!preventDuplicateRegister) {
      registerAllVueNodes();
      preventDuplicateRegister = true;
    }

    graphInstance = new Graph({
      container: containerEl,
      autoResize: true,
      grid: {
        size: 10,
        visible: true,
        type: 'dot',
        args: { color: '#a0aabb', thickness: 1 },
      },
      background: { color: '#fafafa' },
      panning: {
        enabled: true,
        eventTypes: ['leftMouseDown', 'mouseWheel'],
      },
      mousewheel: {
        enabled: true,
        modifiers: 'ctrl',
        maxScale: 4,
        minScale: 0.2,
      },
      connecting: {
        snap: true,          
        allowBlank: false,   
        allowLoop: false,    
        highlight: true,     
        validateConnection: validateITConnection,
        createEdge() {
          return graphInstance!.createEdge({
            shape: 'edge',
            attrs: {
              line: {
                stroke: '#1890ff',
                strokeWidth: 2,
                targetMarker: { name: 'block', width: 12, height: 8 },
              },
            },
            zIndex: 0,
          });
        },
      },
    });

    // Node mặc định làm hướng dẫn
    graphInstance.addNode({
      x: 100,
      y: 100,
      shape: 'rect',
      width: 160,
      height: 60,
      label: 'Kéo hình vào đây ➔',
      attrs: {
        body: { stroke: '#8b5cf6', fill: '#ede9fe', rx: 6, ry: 6 },
        label: { fill: '#4c1d95', fontWeight: 'bold' }
      }
    });

    // Khởi tạo plugin Dnd
    dndInstance = new Dnd({
      target: graphInstance!,
      scaled: false,
      getDropNode: (node) => node.clone()
    });

    // Thêm plugin công cụ xóa Node/Edge
    setupRemovalTools();

    isGraphReady.value = true;
    return graphInstance;
  };

  const setupRemovalTools = () => {
    if (!graphInstance) return;

    graphInstance!.on('edge:mouseenter', ({ edge }) => {
      edge.addTools([{ name: 'button-remove', args: { distance: '50%' } }]);
    });
    
    graphInstance!.on('edge:mouseleave', ({ edge }) => {
      edge.removeTools();
    });

    graphInstance!.on('node:mouseenter', ({ node }) => {
      if (node.shape !== 'rect') {
        node.addTools([{
          name: 'button-remove',
          args: { x: '100%', y: 0, offset: { x: -10, y: 10 } },
        }]);
      }
    });
    
    graphInstance!.on('node:mouseleave', ({ node }) => {
      node.removeTools();
    });
  };

  const getGraph = () => graphInstance;
  const getDnd = () => dndInstance;

  return {
    initGraph,
    getGraph,
    getDnd,
    isGraphReady
  };
};
