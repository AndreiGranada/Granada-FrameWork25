import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'expo-router';
import { useAuthStore } from '@/src/store';

/**
 * Hook utilitário para proteger telas que exigem autenticação.
 * - Redireciona para /login se não autenticado quando carregamento inicial terminar.
 * - Evita loops quando já está em /login.
 */
export function useRequireAuth(options: { redirectTo?: string; enableRedirect?: boolean } = {}) {
    const { isAuthenticated, isLoading, user } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();
    const loginPath = '/login';
    const target = options.redirectTo || loginPath;
    const redirectedRef = useRef(false);

    useEffect(() => {
        if (isLoading) return; // ainda hidratando
        if (!isAuthenticated && options.enableRedirect !== false && pathname !== loginPath) {
            if (!redirectedRef.current) {
                redirectedRef.current = true;
                router.replace(target as any);
            }
        }
    }, [isLoading, isAuthenticated, pathname, router, target, options.enableRedirect]);

    return { user, isAuthenticated, isLoading };
}
