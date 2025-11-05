import type { FanslyCredentials, Settings } from '@fanslib/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../api/settings';

export const useSettingsQuery = () =>
  useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.get(),
  });

export const useSaveSettingsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: Partial<Settings>) => settingsApi.save(settings),
    onSuccess: (data) => {
      queryClient.setQueryData(['settings'], data);
    },
  });
};

export const useToggleSfwModeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => settingsApi.toggleSfwMode(),
    onSuccess: (data) => {
      queryClient.setQueryData(['settings'], data);
    },
  });
};

export const useResetDatabaseMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => settingsApi.resetDatabase(),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
};

export const useFanslyCredentialsQuery = () =>
  useQuery({
    queryKey: ['settings', 'fansly-credentials'],
    queryFn: () => settingsApi.getFanslyCredentials(),
  });

export const useSaveFanslyCredentialsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: Partial<FanslyCredentials>) =>
      settingsApi.saveFanslyCredentials(credentials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'fansly-credentials'] });
    },
  });
};

export const useClearFanslyCredentialsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => settingsApi.clearFanslyCredentials(),
    onSuccess: () => {
      queryClient.setQueryData(['settings', 'fansly-credentials'], {});
    },
  });
};

export const useImportDatabaseMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sourcePath: string) => settingsApi.importDatabase({ sourcePath }),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
};

export const useValidateDatabaseMutation = () =>
  useMutation({
    mutationFn: (libraryPath: string) => settingsApi.validateDatabase({ libraryPath }),
  });

export const useHealthCheckMutation = () =>
  useMutation({
    mutationFn: (serverUrl: string) => settingsApi.healthCheck({ serverUrl }),
  });



