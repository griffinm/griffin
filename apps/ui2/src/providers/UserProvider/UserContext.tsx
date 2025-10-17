import { createContext, useState } from "react";
import { User } from '@/types';
import { LoginCredentials, SignUpCredentials } from '@/api/userApi';
import { useCurrentUser, useLogin, useSignUp, useLogout } from '@/hooks/useAuth';
import { AxiosError } from 'axios';

interface UserContextProps {
  user?: User;
  loading: boolean;
  messages: string[];
  refetch: () => void;
  /** @param credentials - Login credentials (unused in default implementation) */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
  login: (credentials: LoginCredentials) => Promise<void>;
  /** @param credentials - Sign up credentials (unused in default implementation) */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
  signUp: (credentials: SignUpCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
const defaultLogin: (credentials: LoginCredentials) => Promise<void> = async () => {
  // Default empty implementation
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
const defaultSignUp: (credentials: SignUpCredentials) => Promise<void> = async () => {
  // Default empty implementation
};

export const UserContext = createContext<UserContextProps>({
  user: undefined,
  loading: false,
  messages: [],
  refetch: () => {
    // Default empty implementation
  },
  login: defaultLogin,
  signUp: defaultSignUp,
  logout: async () => {
    // Default empty implementation
  },
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<string[]>([]);
  
  const { data: user, isLoading, refetch } = useCurrentUser();
  const loginMutation = useLogin();
  const signUpMutation = useSignUp();
  const logoutMutation = useLogout();

  const handleLogin = async (credentials: LoginCredentials) => {
    setMessages([]);
    try {
      await loginMutation.mutateAsync(credentials);
      setMessages([]);
    } catch (error: unknown) {
      const statusCode = (error as AxiosError<{ message?: string }>)?.response?.status;
      if (statusCode === 401) {
        setMessages(['Invalid credentials']);
      }
    }
  };

  const handleSignUp = async (credentials: SignUpCredentials) => {
    setMessages([]);
    try {
      await signUpMutation.mutateAsync(credentials);
      setMessages([]);
    } catch (error: unknown) {
      const statusCode = (error as AxiosError<{ message?: string }>)?.response?.status;
      if (statusCode === 409) {
        setMessages(['User with this email already exists']);
      } else {
        const errorMessage = (error as AxiosError<{ message?: string }>)?.response?.data?.message || (error as Error)?.message || 'Sign up failed';
        setMessages([errorMessage]);
      }
    }
  };

  const handleLogout = async () => {
    setMessages([]);
    try {
      await logoutMutation.mutateAsync();
      setMessages(['Logout successful']);
    } catch (error: unknown) {
      const errorMessage = (error as AxiosError<{ message?: string }>)?.response?.data?.message || (error as Error)?.message || 'Logout failed';
      setMessages([errorMessage]);
    }
  };

  return (
    <UserContext.Provider value={{ 
      user, 
      loading: isLoading || loginMutation.isPending || signUpMutation.isPending || logoutMutation.isPending, 
      messages,
      refetch,
      login: handleLogin,
      signUp: handleSignUp,
      logout: handleLogout,
    }}>
      {children}
    </UserContext.Provider>
  );
}
