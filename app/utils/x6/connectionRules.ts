export const validateITConnection = ({ sourceView, targetView }: any) => {
  if (!sourceView || !targetView) return false;
  
  const sourceNode = sourceView.cell;
  const targetNode = targetView.cell;
  
  // Không cho phép nối vào chính nó
  if (sourceNode.id === targetNode.id) return false;

  const getDeviceType = (node: any) => {
    const type = node.getData()?.deviceType;
    if (type) return type;
    return node.shape === 'filter-tank-node' ? 'filter-tank' : 'unknown';
  };

  const sourceType = getDeviceType(sourceNode);
  const targetType = getDeviceType(targetNode);

  // 1. Phím/Chuột chỉ xuất tín hiệu (kết nối) vào Máy tính (Case)
  if (sourceType === 'mouse' || sourceType === 'keyboard') {
    return targetType === 'case';
  }
  
  // 2. Nguồn điện (PSU) cấp nguồn cho Case, Màn hình, Mạng, Bồn lọc
  if (sourceType === 'power') {
    return ['case', 'monitor', 'network', 'filter-tank'].includes(targetType); 
  }

  // 3. Máy tính (Case) xuất tín hiệu tới Màn hình và Mạng
  if (sourceType === 'case') {
    return ['monitor', 'network'].includes(targetType);
  }

  // 4. Mạng/Router nối vào Máy tính hoặc Router khác
  if (sourceType === 'network') {
    return ['case', 'network'].includes(targetType);
  }

  // 5. Màn hình mặc định không xuất đầu ra đi thiết bị khác
  if (sourceType === 'monitor') {
    return false;
  }

  return true; 
};
