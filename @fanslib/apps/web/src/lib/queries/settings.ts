import type {
    SaveFanslyCredentialsRequestBody,
    SaveSettingsRequestBody,
} from '@fanslib/server/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/hono-client';

export const useSettingsQuery = () =>
  useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const result = await api.api.settings.$get();
      return result.json();
    },
  });

export const useSaveSettingsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: SaveSettingsRequestBody) => {
      const result = await api.api.settings.$patch({ json: settings });
      return result.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['settings'], data);
    },
  });
};

export const useToggleSfwModeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await api.api.settings['toggle-sfw'].$post();
      return result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
};

export const useFanslyCredentialsQuery = () =>
  useQuery({
    queryKey: ['settings', 'fansly-credentials'],
    queryFn: async () => {
      const result = await api.api.settings['fansly-credentials'].$get();
      return result.json();
    },
  });

export const useSaveFanslyCredentialsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: SaveFanslyCredentialsRequestBody) => {
      const result = await api.api.settings['fansly-credentials'].$post({ json: credentials });
      return result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'fansly-credentials'] });
    },
  });
};

export const useClearFanslyCredentialsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await api.api.settings['fansly-credentials'].$delete();
      return result.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(['settings', 'fansly-credentials'], null);
    },
  });
};

export const useTestBlueskyCredentialsMutation = () =>
  useMutation({
    mutationFn: async () => {
      const result = await api.api.bluesky['test-credentials'].$post();
      return result.json();
    },
  });
