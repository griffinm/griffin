import { User } from '@prisma/client';
import { createContext, useContext, useEffect, useState } from 'react';
import { fetchCurrentUser } from '../../utils/api';
import { CircularProgress } from '@mui/material';
import { 
  signIn as signInApi,
  createUser as createUserApi,
} from '../../utils/api';
import cookies from 'universal-cookie';
import { urls } from '../../utils/urls';
import { useNavigate } from 'react-router-dom';
interface Props {
  children: React.ReactNode;
}

interface UserContextProps {
  user?: User;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  errors: string[];
  createUser: (email: string, password: string, firstName: string) => Promise<void>;
}

const UserContext = createContext<UserContextProps>({
  user: undefined,
  loading: false,
  signIn: () => Promise.resolve(),
  signOut: () => Promise.resolve(),
  errors: [],
  createUser: () => Promise.resolve(),
});

export function UserProvider({ children }: Props) {
  const [user, setUser] = useState<User | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [jwt, setJwt] = useState<string | undefined>(undefined);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (user) return;
    if (window.location.pathname === urls.signIn) {
      setLoading(false);
      return;
    }
    setLoading(true)
    fetchCurrentUser().then((response) => {
      setUser(response.data);
    })
    .catch(() => {
      setUser(undefined);
    })
    .finally(() => {
      setLoading(false);
    });
  }, [user]);

  // When the JWT changes load the new user
  useEffect(() => {
    if (!jwt) return;
    fetchCurrentUser().then((response) => {
      setUser(response.data);
    })
    .catch(() => {
      setUser(undefined);
    })
    .finally(() => {
      setLoading(false);
    });
  }, [jwt]);

  const signIn = async (email: string, password: string) => {
    setErrors([]);
    signInApi(email, password)
      .then(response => {
        const { jwt } = response.data;
        const cookie = new cookies();
        cookie.set('jwt', jwt);
        setJwt(jwt);
        navigate(urls.home);
      })
      .catch(error => {
        setErrors([error.response.data.message]);
      });
  }

  const createUser = async (email: string, password: string, firstName: string) => {
    setErrors([]);
    createUserApi(email, password, firstName)
      .then(response => {
        const { jwt } = response.data;
        const cookie = new cookies();
        cookie.set('jwt', jwt);
        setJwt(jwt);
        navigate(urls.home);
      })
      .catch(error => {
        setErrors([error.response.data.message]);
      });
  }

  const signOut = async () => {
    setUser(undefined);
    const cookie = new cookies();
    cookie.remove('jwt');
    setJwt(undefined);
    navigate(urls.signIn);
  }

  return (
    <UserContext.Provider value={{ user,
      loading,
      signIn,
      signOut,
      errors,
      createUser,
    }}>
      {loading ? (
        <div className="flex items-center justify-center h-screen">
          <CircularProgress />
        </div>
      ) : (
        children
      )}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
