import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/hono-client";
import type { LoginStatus, SessionStatus } from "../reddit/auth-status-utils";

// Login to Reddit
export const useRedditLoginMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId?: string) => {
      const result = await api.api["reddit-automation"].login.$post({
        json: { userId }
      });
      return result.json();
    },
    onSuccess: () => {
      // Invalidate both login and session status queries
      queryClient.invalidateQueries({ queryKey: ["reddit", "login-status"] });
      queryClient.invalidateQueries({ queryKey: ["reddit", "session-status"] });
    },
  });
};

// Check login status
export const useRedditLoginStatusQuery = (userId?: string) => useQuery({
    queryKey: ["reddit", "login-status", userId],
    queryFn: async (): Promise<LoginStatus> => {
      const result = await api.api["reddit-automation"]["check-login"].$post({
        json: { userId }
      });
      return result.json() as Promise<LoginStatus>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

// Check session status on server
export const useRedditSessionStatusQuery = (userId?: string) => useQuery({
    queryKey: ["reddit", "session-status", userId],
    queryFn: async (): Promise<SessionStatus> => {
      const result = await api.api["reddit-automation"].session.status.$post({
        json: { userId }
      });
      return result.json() as Promise<SessionStatus>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

// Clear session from server
export const useClearRedditSessionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId?: string) => {
      const result = await api.api["reddit-automation"].session.$delete({
        json: { userId }
      });
      return result.json();
    },
    onSuccess: () => {
      // Invalidate both login and session status queries
      queryClient.invalidateQueries({ queryKey: ["reddit", "login-status"] });
      queryClient.invalidateQueries({ queryKey: ["reddit", "session-status"] });
    },
  });
};

