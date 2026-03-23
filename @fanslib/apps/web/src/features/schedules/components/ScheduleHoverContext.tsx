import { createContext, useContext, useState, type ReactNode } from "react";

type ScheduleHoverContextValue = {
  hoveredScheduleId: string | null;
  setHoveredScheduleId: (id: string | null) => void;
};

const ScheduleHoverContext = createContext<ScheduleHoverContextValue>({
  hoveredScheduleId: null,
  setHoveredScheduleId: () => {},
});

export const ScheduleHoverProvider = ({ children }: { children: ReactNode }) => {
  const [hoveredScheduleId, setHoveredScheduleId] = useState<string | null>(null);

  return (
    <ScheduleHoverContext.Provider value={{ hoveredScheduleId, setHoveredScheduleId }}>
      {children}
    </ScheduleHoverContext.Provider>
  );
};

export const useScheduleHover = () => useContext(ScheduleHoverContext);
