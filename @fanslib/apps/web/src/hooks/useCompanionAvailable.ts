import { useQuery } from '@tanstack/react-query';
import { checkCompanionHealth } from '~/lib/companion-bridge';

export const useCompanionAvailable = () => {
  return useQuery({
    queryKey: ['companion', 'health'],
    queryFn: checkCompanionHealth,
    refetchInterval: 5000, // Check every 5 seconds
    retry: false,
    staleTime: 2000, // Consider data stale after 2 seconds
  });
};

