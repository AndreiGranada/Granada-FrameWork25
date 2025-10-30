import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/src/store';

/**
 * Em desenvolvimento, tenta autenticar automaticamente usando credenciais de DEV.
 * Variáveis suportadas (opcionais):
 * - EXPO_PUBLIC_DEV_AUTO_AUTH=1
 * - EXPO_PUBLIC_DEV_LOGIN_EMAIL
 * - EXPO_PUBLIC_DEV_LOGIN_PASSWORD
 * Fallback (se não fornecer): seed.user@medicaltime.local / secret123
 */
export function useDevAutoAuth() {
  const { isAuthenticated, isLoading, login, register } = useAuthStore();
  const triedRef = useRef(false);

  useEffect(() => {
    const DEV = process.env.NODE_ENV !== 'production';
    // Em dev, habilita por padrão. Para desativar explicitamente, defina EXPO_PUBLIC_DEV_AUTO_AUTH=0
    const autoEnv = process.env.EXPO_PUBLIC_DEV_AUTO_AUTH;
    const enabled = DEV && autoEnv !== '0';
    if (!enabled) return;
    if (triedRef.current) return;
    if (isAuthenticated || isLoading) return;
    triedRef.current = true;

    const email = process.env.EXPO_PUBLIC_DEV_LOGIN_EMAIL || 'seed.user@medicaltime.local';
    const password = process.env.EXPO_PUBLIC_DEV_LOGIN_PASSWORD || 'secret123';

    (async () => {
      try {
        await login(email, password);
      } catch {
        // Se login falhar, tenta registrar e logar
        try {
          await register(email, password, 'Dev Auto');
        } catch {
          // ignora
        }
      }
    })();
  }, [isAuthenticated, isLoading, login, register]);
}
