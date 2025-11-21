import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { eden } from "../api/eden";
import type { LoginStatus, SessionStatus } from "../reddit/auth-status-utils";

// Login to Reddit
export const useRedditLoginMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId?: string) => {
      const response = await eden.api["reddit-automation"].login.post({
        userId,
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate both login and session status queries
      queryClient.invalidateQueries({ queryKey: ["reddit", "login-status"] });
      queryClient.invalidateQueries({ queryKey: ["reddit", "session-status"] });
    },
  });
};

// Check login status
export const useRedditLoginStatusQuery = (userId?: string) => {
  return useQuery({
    queryKey: ["reddit", "login-status", userId],
    queryFn: async (): Promise<LoginStatus> => {
      const response = await eden.api["reddit-automation"]["check-login"].post({
        userId,
      });
      return response.data as LoginStatus;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Check session status on server
export const useRedditSessionStatusQuery = (userId?: string) => {
  return useQuery({
    queryKey: ["reddit", "session-status", userId],
    queryFn: async (): Promise<SessionStatus> => {
      const response = await eden.api["reddit-automation"].session.status.post({
        userId,
      });
      return response.data as SessionStatus;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Clear session from server
export const useClearRedditSessionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId?: string) => {
      const response = await eden.api["reddit-automation"].session.delete({
        userId,
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate both login and session status queries
      queryClient.invalidateQueries({ queryKey: ["reddit", "login-status"] });
      queryClient.invalidateQueries({ queryKey: ["reddit", "session-status"] });
    },
  });
};

