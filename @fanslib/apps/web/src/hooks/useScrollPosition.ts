import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "calendar:scroll:position";

export const useScrollPosition = <T extends HTMLElement>(
  setCondition: boolean
): React.RefObject<T | null> => {
  const elementRef = useRef<T>(null);
  const [element, setElement] = useState<T | null>(null);
  const [scrollYStorage, setScrollYStorage] = useState(() => {
    if (typeof window === "undefined") return 0;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? parseInt(stored, 10) : 0;
  });

  // Track when element becomes available
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (elementRef.current !== element) {
      setElement(elementRef.current);
    }
  });

  useEffect(() => {
    if (setCondition && element) {
      element.scrollTop = scrollYStorage;
    }
  }, [setCondition, scrollYStorage, element]);

  useEffect(() => {
    if (!element) return () => {};

    // eslint-disable-next-line functional/no-let
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        if (typeof window === "undefined") return;
        const newScrollY = element.scrollTop;
        setScrollYStorage(newScrollY);
        window.localStorage.setItem(STORAGE_KEY, newScrollY.toString());
      }, 150);
    };

    element.addEventListener("scroll", handleScroll);

    return () => {
      clearTimeout(scrollTimeout);
      element.removeEventListener("scroll", handleScroll);
    };
  }, [element]);

  return elementRef;
};
