import { User } from '@prisma/client';
import { createContext, useContext, useEffect, useState } from 'react';
import { fetchCurrentUser } from '../../utils/api';
import { CircularProgress } from '@mui/material';

interface Props {
  children: React.ReactNode;
}

interface UserContextProps {
  user?: User;
  loading: boolean;
}

const UserContext = createContext<UserContextProps>({
  user: undefined,
  loading: false,
});

export function UserProvider({ children }: Props) {
  const [user, setUser] = useState<User | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) return;

    setLoading(true)
    fetchCurrentUser().then((response) => {
      setUser(response.data);
      setLoading(false);
    });
  }, []);

  return (
    <UserContext.Provider value={{ user, loading }}>
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
