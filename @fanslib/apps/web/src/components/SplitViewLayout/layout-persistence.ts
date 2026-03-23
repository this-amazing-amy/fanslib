export const saveLayoutToLocalStorage = (id: string, layout: number[]) => {
  localStorage.setItem(`resizable-layout-${id}`, JSON.stringify(layout));
};

export const getLayoutFromLocalStorage = (id: string): number[] | null => {
  const layout = localStorage.getItem(`resizable-layout-${id}`);
  return layout ? JSON.parse(layout) : null;
};
