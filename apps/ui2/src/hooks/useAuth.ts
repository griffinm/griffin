import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { fetchCurrentUser, loginUser, signUpUser, logoutUser, LoginCredentials, SignUpCredentials } from '@/api/userApi';
import { TIMES } from '@/constants/globals';

export const useCurrentUser = () => {
  return useQuery({
    queryKey: queryKeys.auth.currentUser(),
    queryFn: fetchCurrentUser,
    retry: false,
    staleTime: TIMES.SIXTY_SECONDS,
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      // Update cache with new user data
      queryClient.setQueryData(queryKeys.auth.currentUser(), data.user);
      // Invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.currentUser() });
    },
  });
};

export const useSignUp = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: signUpUser,
    onSuccess: (data) => {
      // Update cache with new user data
      queryClient.setQueryData(queryKeys.auth.currentUser(), data.user);
      // Invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.currentUser() });
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      // Clear user data from cache
      queryClient.setQueryData(queryKeys.auth.currentUser(), null);
      // Invalidate all auth queries
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
    },
  });
};
