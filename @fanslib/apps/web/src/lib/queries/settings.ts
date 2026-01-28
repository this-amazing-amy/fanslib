import type {
    SaveFanslyCredentialsRequestBodySchema,
    SaveSettingsRequestBodySchema,
} from '@fanslib/server/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { eden } from '../api/eden';

export const useSettingsQuery = () =>
  useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const result = await eden.api.settings.get();
      return result.data;
    },
  });

export const useSaveSettingsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: typeof SaveSettingsRequestBodySchema.static) => {
      const result = await eden.api.settings.patch(settings);
      return result.data;
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
      const result = await eden.api.settings['toggle-sfw'].post();
      return result.data;
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
      const result = await eden.api.settings['fansly-credentials'].get();
      return result.data;
    },
  });

export const useSaveFanslyCredentialsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: typeof SaveFanslyCredentialsRequestBodySchema.static) => {
      const result = await eden.api.settings['fansly-credentials'].post(credentials);
      return result.data;
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
      const result = await eden.api.settings['fansly-credentials'].delete();
      return result.data;
    },
    onSuccess: () => {
      queryClient.setQueryData(['settings', 'fansly-credentials'], null);
    },
  });
};

export const useTestBlueskyCredentialsMutation = () =>
  useMutation({
    mutationFn: async () => {
      const result = await eden.api.bluesky['test-credentials'].post();
      return result.data;
    },
  });
