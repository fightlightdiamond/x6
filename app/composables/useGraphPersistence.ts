import { ref } from 'vue';

const STORAGE_KEY = 'it_system_blueprint';

export const useGraphPersistence = (getGraph: () => any) => {
  const hasSavedData = ref(!!localStorage.getItem(STORAGE_KEY));

  const saveGraph = () => {
    const graph = getGraph();
    if (!graph) return;
    const json = graph.toJSON();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(json));
    hasSavedData.value = true;
    console.info('[Persistence] Đã lưu bản vẽ vào localStorage.');
  };

  const loadGraph = () => {
    const graph = getGraph();
    if (!graph) return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const json = JSON.parse(raw);
      graph.fromJSON(json);
      console.info('[Persistence] Đã tải lại bản vẽ từ localStorage.');
    } catch (e) {
      console.error('[Persistence] Không thể đọc dữ liệu đã lưu:', e);
    }
  };

  const clearGraph = () => {
    const graph = getGraph();
    if (!graph) return;
    localStorage.removeItem(STORAGE_KEY);
    graph.clearCells();
    hasSavedData.value = false;
  };

  const exportJSON = () => {
    const graph = getGraph();
    if (!graph) return;
    const json = JSON.stringify(graph.toJSON(), null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `it_blueprint_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = (file: File) => {
    const graph = getGraph();
    if (!graph) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        graph.fromJSON(json);
        hasSavedData.value = true;
      } catch (err) {
        console.error('[Persistence] File JSON không hợp lệ:', err);
      }
    };
    reader.readAsText(file);
  };

  return {
    hasSavedData,
    saveGraph,
    loadGraph,
    clearGraph,
    exportJSON,
    importJSON,
  };
};
