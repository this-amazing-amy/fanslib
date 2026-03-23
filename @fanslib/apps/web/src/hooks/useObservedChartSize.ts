import { useLayoutEffect, useRef, useState } from "react";

type Size = { width: number; height: number };

export const useObservedChartSize = (defaultWidth: number, heightPx: number) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size>({ width: defaultWidth, height: heightPx });

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const nextWidth = rect.width > 0 ? rect.width : defaultWidth;
      setSize({ width: nextWidth, height: heightPx });
    };

    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
  }, [defaultWidth, heightPx]);

  return { containerRef, width: size.width, height: size.height };
};
