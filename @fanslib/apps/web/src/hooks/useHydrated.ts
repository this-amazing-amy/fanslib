import { useEffect, useState } from "react";

// Track whether the app has hydrated (transitioned from SSR to client)
export const useHydrated = (): boolean => {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated;
};
