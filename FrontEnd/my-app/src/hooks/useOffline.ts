import { useCallback, useEffect, useRef } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useAuthStore } from '@/src/store/authStore';
import { logger } from '@/src/lib/logger';

/**
 * Hook que expõe estado offlineWarning e executa retry automático com backoff exponencial
 * quando o app está marcado como offline. Limpa automaticamente ao detectar reconexão
 * de rede E sucesso em /me.
 */
export function useOffline() {
    const { offlineWarning, refreshMe, clearOfflineWarning, isLoading } = useAuthStore();
    const attemptRef = useRef(0);
    const timerRef = useRef<any>(null);

    const scheduleRetry = useCallback(() => {
        if (!offlineWarning) return;
        const attempt = attemptRef.current + 1;
        attemptRef.current = attempt;
        // Backoff exponencial com limite máx 30s
        const delay = Math.min(30000, 2000 * Math.pow(1.7, attempt - 1));
        logger.debug('[offline] schedule retry', { attempt, delay });
        timerRef.current = setTimeout(async () => {
            try {
                await refreshMe();
                clearOfflineWarning();
                attemptRef.current = 0;
                logger.debug('[offline] retry success');
            } catch (err: any) {
                logger.debug('[offline] retry failed', { attempt, error: err?.message });
                scheduleRetry(); // agenda próximo
            }
        }, delay);
    }, [offlineWarning, refreshMe, clearOfflineWarning]);

    // Inicia ciclo de retry ao ficar offline
    useEffect(() => {
        if (offlineWarning) {
            scheduleRetry();
        } else if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
            attemptRef.current = 0;
        }
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [offlineWarning, scheduleRetry]);

    // Observa rede: ao voltar online tenta refresh imediato
    useEffect(() => {
        const unsub = NetInfo.addEventListener((state: NetInfoState) => {
            if (!offlineWarning) return;
            if (state.isConnected) {
                logger.debug('[offline] network reconnected -> immediate retry');
                attemptRef.current = 0; // reset backoff
                // tentativa rápida
                refreshMe().then(() => {
                    clearOfflineWarning();
                }).catch(() => {
                    scheduleRetry(); // se falhar, continua backoff
                });
            }
        });
        return () => { unsub?.(); };
    }, [offlineWarning, refreshMe, clearOfflineWarning, scheduleRetry]);

    return { offlineWarning, retrying: isLoading && offlineWarning };
}
