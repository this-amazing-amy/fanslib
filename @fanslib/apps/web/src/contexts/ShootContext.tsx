import type {
  CreateShootRequestBodySchema,
  FetchAllShootsRequestBodySchema,
  ShootSummarySchema,
  ShootFiltersSchema,
} from "@fanslib/server/schemas";
import { createContext, useCallback, useContext, useState } from "react";
import {
  useCreateShootMutation,
  useShootsQuery,
  useUpdateShootMutation,
} from "~/lib/queries/shoots";

type CreateShootRequest = typeof CreateShootRequestBodySchema.static;
type FetchAllShootsRequest = typeof FetchAllShootsRequestBodySchema.static;
type ShootFilter = typeof ShootFiltersSchema.static;
type ShootSummary = typeof ShootSummarySchema.static;

type ShootContextType = {
  shoots: ShootSummary[];
  totalItems: number;
  totalPages: number;
  isLoading: boolean;
  error: Error | null;
  filter: ShootFilter;
  updateFilter: (filter: Partial<ShootFilter>) => void;
  clearFilter: () => void;
  refetch: () => Promise<void>;
  addMediaToShoot: (shootId: string, mediaIds: string[]) => Promise<void>;
  createShoot: (params: CreateShootRequest) => Promise<void>;
};

const ShootContext = createContext<ShootContextType | null>(null);

export const useShootContext = () => {
  const context = useContext(ShootContext);
  if (!context) {
    throw new Error("useShootContext must be used within a ShootProvider");
  }
  return context;
};

type ShootProviderProps = {
  children: React.ReactNode;
  params?: Omit<FetchAllShootsRequest, "filter">;
};

export const ShootProvider = ({ children, params }: ShootProviderProps) => {
  const [filter, setFilter] = useState<ShootFilter>({});

  const requestParams: FetchAllShootsRequest = {
    ...params,
    filter,
  };

  const { data, error, isLoading, refetch } = useShootsQuery(requestParams);
  const createMutation = useCreateShootMutation();
  const updateMutation = useUpdateShootMutation();

  const updateFilter = useCallback((newFilter: Partial<ShootFilter>) => {
    setFilter((prev) => ({ ...prev, ...newFilter }));
  }, []);

  const clearFilter = useCallback(() => {
    setFilter({});
  }, []);

  const addMediaToShoot = useCallback(
    async (shootId: string, mediaIds: string[]) => {
      await updateMutation.mutateAsync({ id: shootId, updates: { mediaIds } });
      await refetch();
    },
    [updateMutation, refetch]
  );

  const createShoot = useCallback(
    async (params: CreateShootRequest) => {
      await createMutation.mutateAsync(params);
      await refetch();
    },
    [createMutation, refetch]
  );

  const value = {
    shoots: (data?.items ?? []) as ShootSummary[],
    totalItems: data?.total ?? 0,
    totalPages: data?.totalPages ?? 0,
    isLoading,
    error: error ? (error instanceof Error ? error : new Error("Failed to fetch shoots")) : null,
    filter,
    updateFilter,
    clearFilter,
    refetch: async () => {
      await refetch();
    },
    addMediaToShoot,
    createShoot,
  };

  return <ShootContext.Provider value={value}>{children}</ShootContext.Provider>;
};
