export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    currentUser: () => [...queryKeys.auth.all, 'currentUser'] as const,
    googleStatus: () => [...queryKeys.auth.all, 'googleStatus'] as const,
  },
} as const;
