export const createNodeConfig = (type: string, labelName: string) => {
  if (type === 'filter-tank') {
    return {
      shape: 'filter-tank-node',
      width: 100,
      height: 120,
      data: {
        deviceType: 'filter-tank',
        status: 'chạy',
        voltage: 12.5,
        current: 450,
      },
    };
  } 
  
  if (['case', 'monitor', 'mouse', 'keyboard', 'power', 'network'].includes(type)) {
    let defaultMetrics: any[] = [];
    if (type === 'case') defaultMetrics = [{label: 'CPU Temp', value: 45, unit: '°C'}, {label: 'RAM Usage', value: 64, unit: '%'}];
    if (type === 'monitor') defaultMetrics = [{label: 'Refresh', value: 144, unit: 'Hz'}];
    if (type === 'mouse' || type === 'keyboard') defaultMetrics = [{label: 'Battery', value: 85, unit: '%'}];
    if (type === 'power') defaultMetrics = [{label: 'Load', value: 350, unit: 'W'}];
    if (type === 'network') defaultMetrics = [{label: 'Ping', value: 12, unit: 'ms'}];
    
    return {
      shape: 'computer-device-node',
      width: 180,
      height: 80,
      ports: {
        items: [
          { id: 'port_top', group: 'top' },
          { id: 'port_bottom', group: 'bottom' },
          { id: 'port_left', group: 'left' },
          { id: 'port_right', group: 'right' }
        ]
      },
      data: {
        deviceType: type,
        deviceName: labelName,
        status: 'online',
        metrics: defaultMetrics
      },
    };
  } 

  return {
    shape: 'my-vue-shape',
    width: 150,
    height: 50,
    data: {
      label: labelName,
    },
  };
};
