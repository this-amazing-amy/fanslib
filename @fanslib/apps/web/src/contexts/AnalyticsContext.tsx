import { createContext, useContext, useState, type ReactNode } from "react";

export type AnalyticsTimeframe = {
  startDate: Date;
  endDate: Date;
};

type AnalyticsContextType = {
  timeframe: AnalyticsTimeframe;
  setTimeframe: (timeframe: AnalyticsTimeframe) => void;
};

const defaultTimeframe: AnalyticsTimeframe = {
  startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
  endDate: new Date(),
};

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export const AnalyticsProvider = ({ children }: { children: ReactNode }) => {
  const [timeframe, setTimeframe] = useState<AnalyticsTimeframe>(defaultTimeframe);

  return (
    <AnalyticsContext.Provider value={{ timeframe, setTimeframe }}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);

  if (context === undefined) {
    throw new Error("useAnalytics must be used within an AnalyticsProvider");
  }

  return context;
};
