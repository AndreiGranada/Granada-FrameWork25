import { wrap, mutationBreadcrumb } from './adapterError';
import { logger } from '@/src/lib/logger';
import { trackEvent } from '@/src/observability/analytics';
// Tipos de criação/atualização extraídos localmente até migração completa para tipos do SDK
export interface EmergencyContactCreate { name: string; phone: string; customMessage?: string; isActive: boolean; }
export interface EmergencyContactUpdate { name?: string; phone?: string; customMessage?: string | null; isActive?: boolean; }

// Tipagem mínima (poderia vir de api/types se existir centralizado)
export interface EmergencyContact {
    id: string;
    name: string;
    phone: string;
    customMessage?: string | null;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

let DefaultServiceRef: any | null = null;
let loadingPromise: Promise<void> | null = null;

async function ensureSdk(): Promise<void> {
    if (DefaultServiceRef) return;
    if (loadingPromise) { await loadingPromise; return; }
    loadingPromise = import('@/sdk-backend')
        .then(mod => { DefaultServiceRef = (mod as any).DefaultService; })
        .catch(() => { /* silencioso */ })
        .finally(() => { loadingPromise = null; });
    await loadingPromise;
}


export const emergencyContactsAdapter = {
    async list(): Promise<EmergencyContact[]> {
        await ensureSdk();
        if (!DefaultServiceRef?.listEmergencyContacts) throw new Error('SDK não carregado: gere o SDK (npm run sdk:update) ou verifique import');
        logger.debug('[emergencyContactsAdapter] list:start');
        const res = await DefaultServiceRef.listEmergencyContacts();
        logger.debug('[emergencyContactsAdapter] list:done', { count: res?.length });
        trackEvent('emergency_contacts_list', { count: res?.length });
        // Ordenação agora somente por criação preservada no backend; manter retorno como vem
        return res;
    },
    async create(data: EmergencyContactCreate): Promise<EmergencyContact> {
        await ensureSdk();
        return wrap(
            (async () => {
                if (!DefaultServiceRef?.createEmergencyContact) throw new Error('SDK não carregado (createEmergencyContact ausente)');
                logger.debug('[emergencyContactsAdapter] create:start');
                const resp = await DefaultServiceRef.createEmergencyContact({ requestBody: data });
                mutationBreadcrumb('create', 'emergencyContact', { id: resp.id });
                logger.debug('[emergencyContactsAdapter] create:done', { id: resp.id });
                trackEvent('emergency_contact_created', { id: resp.id });
                return resp;
            })(),
            'Falha ao criar contato de emergência'
        );
    },
    async update(id: string, data: EmergencyContactUpdate): Promise<EmergencyContact> {
        await ensureSdk();
        return wrap(
            (async () => {
                if (!DefaultServiceRef?.updateEmergencyContact) throw new Error('SDK não carregado (updateEmergencyContact ausente)');
                logger.debug('[emergencyContactsAdapter] update:start', { id });
                const resp = await DefaultServiceRef.updateEmergencyContact({ id, requestBody: data });
                mutationBreadcrumb('update', 'emergencyContact', { id });
                logger.debug('[emergencyContactsAdapter] update:done', { id });
                trackEvent('emergency_contact_updated', { id });
                return resp;
            })(),
            'Falha ao atualizar contato de emergência'
        );
    },
    async remove(id: string): Promise<void> {
        await ensureSdk();
        return wrap(
            (async () => {
                if (!DefaultServiceRef?.deleteEmergencyContact) throw new Error('SDK não carregado (deleteEmergencyContact ausente)');
                logger.debug('[emergencyContactsAdapter] remove:start', { id });
                await DefaultServiceRef.deleteEmergencyContact({ id });
                mutationBreadcrumb('delete', 'emergencyContact', { id });
                logger.debug('[emergencyContactsAdapter] remove:done', { id });
                trackEvent('emergency_contact_removed', { id });
            })(),
            'Falha ao remover contato de emergência'
        );
    }
};

// Utilitário para testes
export function __setEmergencyContactsSdkMock(mock: any) { DefaultServiceRef = mock; }
