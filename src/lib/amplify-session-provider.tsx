'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getCurrentUser, signOut as amplifySignOut } from 'aws-amplify/auth';
import { configureAmplify } from '@/lib/amplify-config';

configureAmplify();

export interface AuthUser {
  userId: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AmplifySessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then((u) =>
        setUser({
          userId: u.userId,
          username: u.username,
          email: u.signInDetails?.loginId ?? '',
        }),
      )
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const signOut = async () => {
    await amplifySignOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAmplifySession = () => useContext(AuthContext);
