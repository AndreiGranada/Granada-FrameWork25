// Adapter usa exclusivamente o SDK gerado; fallback manual removido.
import type { IntakeEvent, IntakeEventExpanded, IntakeHistoryPage } from '@/sdk-backend';
import { DefaultService } from '@/sdk-backend';
import { logger } from '@/src/lib/logger';
import { trackEvent } from '@/src/observability/analytics';
import { mutationBreadcrumb, wrap } from './adapterError';

let DefaultServiceRef: any | null = DefaultService;


export const intakesAdapter = {
    async list(params?: { from?: string; to?: string; hours?: string; status?: 'PENDING' | 'TAKEN' | 'MISSED'; }): Promise<IntakeEventExpanded[]> {
        // Compatibilidade: alguns mocks/SDKs antigos expõem listIntakes
        const listFn = DefaultServiceRef?.listIntakeEvents || DefaultServiceRef?.listIntakes;
        if (!listFn) throw new Error('SDK não carregado');
        logger.debug('[intakesAdapter] list:start', { params });
        const r = await (DefaultServiceRef.listIntakeEvents
            ? DefaultServiceRef.listIntakeEvents({ query: params })
            : DefaultServiceRef.listIntakes());
        logger.debug('[intakesAdapter] list:done', { count: r?.length });
        trackEvent('intakes_list', { count: r?.length });
        return r;
    },
    async history(params?: { days?: string; limit?: number; cursor?: string }): Promise<IntakeEventExpanded[] | IntakeHistoryPage> {
        if (!DefaultServiceRef?.listIntakeHistory) throw new Error('SDK não carregado');
        logger.debug('[intakesAdapter] history:start', { params });
        const h = await DefaultServiceRef.listIntakeHistory({ query: params });
        logger.debug('[intakesAdapter] history:done');
        trackEvent('intakes_history', { hasCursor: (h as any)?.nextCursor ? true : false });
        return h;
    },
    async markTaken(id: string): Promise<IntakeEvent> {
        return wrap(
            (async () => {
                if (!DefaultServiceRef?.markIntakeTaken) throw new Error('SDK não carregado');
                logger.debug('[intakesAdapter] markTaken:start', { id });
                const ev = await DefaultServiceRef.markIntakeTaken({ id });
                mutationBreadcrumb('markTaken', 'intake', { id });
                logger.debug('[intakesAdapter] markTaken:done', { id });
                trackEvent('intake_mark_taken', { id });
                return ev;
            })(),
            'Falha ao marcar tomada'
        );
    }
};

export function __setIntakesSdkMock(mock: any) { DefaultServiceRef = mock; }
