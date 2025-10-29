import { useRemindersStore } from '@/src/store/remindersStore';
import { __setRemindersSdkMock } from '@/src/services/adapters/remindersAdapter';

beforeAll(() => {
    __setRemindersSdkMock({
        listReminders: jest.fn(async () => []),
        createReminder: jest.fn(async ({ requestBody }: any) => ({
            id: 'rem_mock',
            name: requestBody.name,
            purpose: requestBody.purpose ?? null,
            description: requestBody.description ?? null,
            pricePaid: requestBody.pricePaid ?? null,
            photoUrl: requestBody.photoUrl ?? null,
            isActive: true,
            schedules: (requestBody.schedules || []).map((s: any, i: number) => ({
                id: `sch_${i}`,
                ingestionTimeMinutes: s.ingestionTimeMinutes,
                daysOfWeekBitmask: s.daysOfWeekBitmask ?? 0,
                isActive: s.isActive ?? true,
            })),
        })),
        updateReminder: jest.fn(async ({ requestBody }: any) => ({
            id: 'rem_mock',
            name: requestBody.name || 'Vit D',
            purpose: requestBody.purpose === undefined ? 'Saúde' : requestBody.purpose,
            description: requestBody.description === undefined ? 'Desc' : requestBody.description,
            pricePaid: requestBody.pricePaid === undefined ? '12.50' : requestBody.pricePaid,
            photoUrl: requestBody.photoUrl === undefined ? null : requestBody.photoUrl,
            isActive: requestBody.isActive ?? true,
            schedules: [],
        })),
        deleteReminder: jest.fn(async () => { }),
        addReminderSchedule: jest.fn(async () => ({
            id: 'rem_mock',
            name: 'Vit D',
            purpose: 'Saúde',
            description: 'Desc',
            pricePaid: '12.50',
            photoUrl: null,
            isActive: true,
            schedules: [],
        })),
        updateSchedule: jest.fn(async () => ({
            id: 'rem_mock',
            name: 'Vit D',
            purpose: 'Saúde',
            description: 'Desc',
            pricePaid: '12.50',
            photoUrl: null,
            isActive: true,
            schedules: [],
        })),
        deleteSchedule: jest.fn(async () => { }),
    });
});

describe('Reminders optional fields tolerance', () => {
    beforeEach(() => {
        const { setError } = useRemindersStore.getState();
        setError(null);
        useRemindersStore.setState({ reminders: [] });
    });

    it('cria lembrete com campos opcionais e preserva valores', async () => {
        const { createReminder } = useRemindersStore.getState();
        const reminder = await createReminder({
            name: 'Ômega 3',
            purpose: 'Coração',
            description: 'Cápsulas 1000mg',
            pricePaid: '45.90',
            photoUrl: 'https://exemplo/img.png',
            schedules: [{ ingestionTimeMinutes: 480 }],
        });
        expect(reminder.purpose).toBe('Coração');
        expect(reminder.description).toContain('Cápsulas');
        expect(reminder.pricePaid).toBe('45.90');
        expect(reminder.photoUrl).toMatch(/^https:\/\//);
    });

    it('atualiza parcialmente preservando tolerância para nulos', async () => {
        const { createReminder, updateReminder } = useRemindersStore.getState();
        await createReminder({ name: 'Vit D', schedules: [{ ingestionTimeMinutes: 600 }] });
        const updated = await updateReminder('rem_mock', { description: null as any, purpose: undefined } as any);
        // description null continua permitido; purpose cai em valor default mock
        expect(updated.description).toBe(null);
        expect(updated.purpose).toBe('Saúde');
    });
});
