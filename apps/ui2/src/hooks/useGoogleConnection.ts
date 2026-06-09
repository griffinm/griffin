import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { fetchGoogleStatus, disconnectGoogle } from '@/api/userApi';

export const useGoogleStatus = () => {
  return useQuery({
    queryKey: queryKeys.auth.googleStatus(),
    queryFn: fetchGoogleStatus,
    retry: false,
  });
};

export const useDisconnectGoogle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: disconnectGoogle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.googleStatus() });
    },
  });
};

/** Kick off the Google OAuth flow via a top-level navigation so the auth cookie
 * is sent and Google can redirect the browser through the consent screen. */
export const connectGoogle = () => {
  window.location.href = '/api/auth/google';
};
