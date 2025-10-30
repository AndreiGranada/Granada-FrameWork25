import { useRemindersStore } from '@/src/store/remindersStore';
import { __setRemindersSdkMock } from '@/src/services/adapters/remindersAdapter';

// Injeta mock do SDK
beforeAll(() => {
    __setRemindersSdkMock({
        listReminders: jest.fn(async () => [
            { id: 'r1', name: 'Vitamina D', isActive: true, schedules: [] }
        ]),
        createReminder: jest.fn(async ({ requestBody }: any) => ({ id: 'r2', isActive: true, schedules: [], ...requestBody })),
        updateReminder: jest.fn(async ({ id, requestBody }: any) => ({ id, name: 'Vitamina D', isActive: true, schedules: [], ...requestBody })),
        deleteReminder: jest.fn(async () => { }),
        addReminderSchedule: jest.fn(async ({ id, requestBody }: any) => ({ id, name: 'Vitamina D', isActive: true, schedules: [{ id: 's1', ingestionTimeMinutes: requestBody.ingestionTimeMinutes, daysOfWeekBitmask: 0, isActive: true }] })),
        updateSchedule: jest.fn(async () => ({ id: 'r1', name: 'Vitamina D', isActive: true, schedules: [{ id: 's1', ingestionTimeMinutes: 600, daysOfWeekBitmask: 0, isActive: true }] })),
        deleteSchedule: jest.fn(async () => { })
    });
});

describe('remindersStore', () => {
    it('carrega lembretes', async () => {
        await useRemindersStore.getState().loadReminders();
        expect(useRemindersStore.getState().reminders.length).toBe(1);
    });

    it('cria lembrete', async () => {
        const r = await useRemindersStore.getState().createReminder({ name: 'Novo', schedules: [] });
        expect(r.id).toBe('r2');
    });
});
