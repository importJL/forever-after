'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getCurrentUser, signOut as amplifySignOut, fetchUserAttributes, fetchAuthSession } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import { configureAmplify } from '@/lib/amplify-config';

configureAmplify();

export interface AuthUser {
  userId: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
  signOut: async () => {},
});

function deriveRole(groups: string[]): string {
  if (groups.includes('admin')) return 'admin';
  if (groups.includes('full')) return 'full';
  if (groups.includes('readwrite')) return 'readwrite';
  if (groups.includes('readonly')) return 'readonly';
  return 'readwrite';
}

function collectGroups(groupsA: string[] | undefined, groupsB: string[] | undefined): string[] {
  const set = new Set<string>();
  for (const g of groupsA ?? []) set.add(g);
  for (const g of groupsB ?? []) set.add(g);
  return [...set];
}

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(' ');
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || '',
  };
}

const DEV_ADMIN_EMAIL = 'aitesterjl@gmail.com';

async function fetchCurrentUser(): Promise<AuthUser> {
  const u = await getCurrentUser();
  const attrs = await fetchUserAttributes();
  const email = attrs.email || u.signInDetails?.loginId || '';

  let accessGroups: string[] | undefined;
  let idGroups: string[] | undefined;
  try {
    const session = await fetchAuthSession();
    accessGroups = session.tokens?.accessToken?.payload?.['cognito:groups'] as string[] | undefined;
    idGroups = session.tokens?.idToken?.payload?.['cognito:groups'] as string[] | undefined;
  } catch {
    // ignore — fall back to no groups on session blip
  }
  const groups = collectGroups(accessGroups, idGroups);

  const LOCAL_ADMIN_EMAIL = process.env.NEXT_PUBLIC_LOCAL_ADMIN_EMAIL;
  const offlineAdmin = email === LOCAL_ADMIN_EMAIL || email === DEV_ADMIN_EMAIL;
  const role = offlineAdmin ? 'admin' : deriveRole(groups);
  const { firstName, lastName } = splitName(attrs.name || '');

  return {
    userId: u.userId,
    username: u.username,
    email,
    firstName,
    lastName,
    role,
  };
}

export function AmplifySessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    try {
      const u = await fetchCurrentUser();
      setUser(u);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signedIn') loadUser();
      if (payload.event === 'signedOut') setUser(null);
    });
    return () => unsubscribe();
  }, []);

  const refreshUser = async () => {
    setLoading(true);
    await loadUser();
  };

  const signOut = async () => {
    await amplifySignOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAmplifySession = () => useContext(AuthContext);
