import '@testing-library/jest-dom/vitest';

if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

// Recharts ResponsiveContainer measures via ResizeObserver; fire a stable size so charts mount in tests.
globalThis.ResizeObserver = class ResizeObserver {
  constructor(private readonly callback: ResizeObserverCallback) {}

  observe(element: Element) {
    const rect = element.getBoundingClientRect();
    const width = rect.width > 0 ? rect.width : 400;
    const height = rect.height > 0 ? rect.height : 200;
    this.callback(
      [
        {
          contentRect: { width, height, top: 0, left: 0, bottom: height, right: width, x: 0, y: 0 },
          borderBoxSize: undefined,
          contentBoxSize: undefined,
          devicePixelContentBoxSize: undefined,
          target: element,
        } as ResizeObserverEntry,
      ],
      this,
    );
  }

  unobserve() {}

  disconnect() {}
};
