// Adapter agora depende exclusivamente do SDK gerado em `sdk-backend`.
// Fallback para APIs manuais foi removido como parte da finalização de migração.
import type { Reminder, ReminderCreate, ReminderUpdate, ScheduleCreate, ScheduleUpdate } from '@/sdk-backend';
import { wrap, mutationBreadcrumb } from './adapterError';
import { logger } from '@/src/lib/logger';
import { trackEvent } from '@/src/observability/analytics';

let DefaultServiceRef: any | null = null;
let loadingPromise: Promise<void> | null = null;

async function ensureSdk(): Promise<void> {
    if (DefaultServiceRef) return;
    if (loadingPromise) { await loadingPromise; return; }
    // Usar sempre alias '@/sdk-backend' para garantir cache único do módulo (evita duplicar OpenAPI sem TOKEN)
    loadingPromise = import('@/sdk-backend')
        .then(mod => { DefaultServiceRef = (mod as any).DefaultService; })
        .catch(() => { /* silencioso */ })
        .finally(() => { loadingPromise = null; });
    await loadingPromise;
}

// Utilitário somente para testes: permite injetar mock direto
export function __setRemindersSdkMock(mock: any) {
    DefaultServiceRef = mock;
}


export const remindersAdapter = {
    async list(): Promise<Reminder[]> {
        await ensureSdk();
        if (!DefaultServiceRef?.listReminders) throw new Error('SDK não carregado: gere o SDK (npm run sdk:update)');
        logger.debug('[remindersAdapter] list:start');
        const list = await DefaultServiceRef.listReminders();
        logger.debug('[remindersAdapter] list:done', { count: list?.length });
        trackEvent('reminders_list', { count: list?.length });
        return list;
    },
    async create(data: ReminderCreate): Promise<Reminder> {
        await ensureSdk();
        return wrap(
            (async () => {
                if (!DefaultServiceRef?.createReminder) throw new Error('SDK não carregado');
                logger.debug('[remindersAdapter] create:start');
                let payload: any = { ...data };
                if (!payload.schedules || payload.schedules.length === 0) {
                    payload = {
                        ...payload,
                        schedules: [{ ingestionTimeMinutes: 8 * 60, daysOfWeekBitmask: 0, isActive: true }],
                        __autoDefaultSchedule: true,
                    };
                }
                const r = await DefaultServiceRef.createReminder({ requestBody: payload });
                mutationBreadcrumb('create', 'reminder', { id: r.id });
                logger.debug('[remindersAdapter] create:done', { id: r.id });
                trackEvent('reminder_created', { id: r.id, autoSchedule: (payload as any).__autoDefaultSchedule ? true : false });
                return r;
            })(),
            'Falha ao criar lembrete'
        );
    },
    async update(id: string, data: ReminderUpdate): Promise<Reminder> {
        await ensureSdk();
        if ((data as any)?.pricePaid && typeof (data as any).pricePaid === 'string') {
            (data as any).pricePaid = (data as any).pricePaid.replace(',', '.');
        }
        return wrap(
            (async () => {
                if (!DefaultServiceRef?.updateReminder) throw new Error('SDK não carregado');
                logger.debug('[remindersAdapter] update:start', { id });
                const r = await DefaultServiceRef.updateReminder({ id, requestBody: data });
                mutationBreadcrumb('update', 'reminder', { id });
                logger.debug('[remindersAdapter] update:done', { id });
                trackEvent('reminder_updated', { id });
                return r;
            })(),
            'Falha ao atualizar lembrete'
        );
    },
    async remove(id: string): Promise<void> {
        await ensureSdk();
        return wrap(
            (async () => {
                if (!DefaultServiceRef?.deleteReminder) throw new Error('SDK não carregado');
                logger.debug('[remindersAdapter] remove:start', { id });
                await DefaultServiceRef.deleteReminder({ id });
                mutationBreadcrumb('delete', 'reminder', { id });
                logger.debug('[remindersAdapter] remove:done', { id });
                trackEvent('reminder_removed', { id });
            })(),
            'Falha ao desativar lembrete'
        );
    },
    async addSchedule(reminderId: string, data: ScheduleCreate): Promise<Reminder> {
        await ensureSdk();
        return wrap(
            (async () => {
                if (!DefaultServiceRef?.addReminderSchedule) throw new Error('SDK não carregado');
                logger.debug('[remindersAdapter] addSchedule:start', { reminderId });
                const r = await DefaultServiceRef.addReminderSchedule({ id: reminderId, requestBody: data });
                mutationBreadcrumb('addSchedule', 'reminder', { reminderId });
                logger.debug('[remindersAdapter] addSchedule:done', { reminderId });
                trackEvent('reminder_schedule_added', { reminderId });
                return r;
            })(),
            'Falha ao adicionar horário'
        );
    },
    async updateSchedule(scheduleId: string, data: ScheduleUpdate): Promise<Reminder> {
        await ensureSdk();
        return wrap(
            (async () => {
                if (!DefaultServiceRef?.updateSchedule) throw new Error('SDK não carregado');
                logger.debug('[remindersAdapter] updateSchedule:start', { scheduleId });
                const r = await DefaultServiceRef.updateSchedule({ scheduleId, requestBody: data });
                mutationBreadcrumb('updateSchedule', 'reminder', { scheduleId });
                logger.debug('[remindersAdapter] updateSchedule:done', { scheduleId });
                trackEvent('reminder_schedule_updated', { scheduleId });
                return r;
            })(),
            'Falha ao atualizar horário'
        );
    },
    async deleteSchedule(scheduleId: string): Promise<void> {
        await ensureSdk();
        return wrap(
            (async () => {
                if (!DefaultServiceRef?.deleteSchedule) throw new Error('SDK não carregado');
                logger.debug('[remindersAdapter] deleteSchedule:start', { scheduleId });
                await DefaultServiceRef.deleteSchedule({ scheduleId });
                mutationBreadcrumb('deleteSchedule', 'reminder', { scheduleId });
                logger.debug('[remindersAdapter] deleteSchedule:done', { scheduleId });
                trackEvent('reminder_schedule_removed', { scheduleId });
            })(),
            'Falha ao remover horário'
        );
    }
};
