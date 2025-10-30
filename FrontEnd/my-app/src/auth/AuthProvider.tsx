import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
// AVISO: Este AuthProvider está DEPRECADO.
// Toda a aplicação migrou para Zustand (`useAuthStore`).
// Mantido apenas temporariamente para referência histórica/documentação.
// Não utilizar em novos componentes.
import { api, setSession, Session, User, onTokensRefreshed } from '../api/client';
import { loadSession, saveSession } from './session';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  forgot: (email: string) => Promise<void>;
  reset: (token: string, password: string) => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as any);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const stored = await loadSession<Session>();
      setSession(stored);
      if (stored?.token) {
        try {
          const me = await api.get('/me');
          setUser(me.data.user);
        } catch {
          await saveSession(null);
          setSession(null);
          setUser(null);
        }
      }
      setLoading(false);
    })();
    // Persist updated tokens after automatic refresh
    onTokensRefreshed((toks) => {
      // Merge into current session shape if we have a user
      setUser((current) => {
        const session: Session | null = current
          ? ({ token: toks.token, refreshToken: toks.refreshToken, refreshExpiresAt: toks.refreshExpiresAt || '', user: current } as Session)
          : null;
        // Save and set session for axios
        (async () => {
          await saveSession(session);
          setSession(session);
        })();
        return current;
      });
    });
  }, []);

  async function login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password });
    const session: Session = data;
    await saveSession(session);
    setSession(session);
    setUser(session.user);
  }

  async function register(email: string, password: string, name?: string) {
    const { data } = await api.post('/auth/register', { email, password, name });
    const session: Session = data;
    await saveSession(session);
    setSession(session);
    setUser(session.user);
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } catch {}
    await saveSession(null);
    setSession(null);
    setUser(null);
  }

  async function forgot(email: string) {
    // Assumption: backend expects { email }
    await api.post('/auth/forgot', { email });
  }

  async function reset(token: string, password: string) {
    // Assumption: backend expects { token, password }
    await api.post('/auth/reset', { token, password });
  }

  async function refreshMe() {
    try {
      const me = await api.get('/me');
      setUser(me.data.user);
    } catch {
      // se falhar, mantém o usuário atual; telas podem exibir erro localmente
    }
  }

  const value = useMemo(
    () => ({ user, loading, login, register, logout, forgot, reset, refreshMe }),
    [user, loading]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
