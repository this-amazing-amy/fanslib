import '@testing-library/jest-dom/vitest';

// Mock ResizeObserver for visx/responsive ParentSize component
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
