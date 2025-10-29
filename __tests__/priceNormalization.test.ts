import { useRemindersStore } from '@/src/store/remindersStore';
import { __setRemindersSdkMock } from '@/src/services/adapters/remindersAdapter';

beforeAll(() => {
    __setRemindersSdkMock({
        listReminders: jest.fn(async () => []),
        updateReminder: jest.fn(async ({ id, requestBody }: any) => ({
            id,
            name: 'Vit D',
            purpose: requestBody.purpose ?? null,
            description: requestBody.description ?? null,
            pricePaid: requestBody.pricePaid ?? null,
            photoUrl: requestBody.photoUrl ?? null,
            isActive: true,
            schedules: [],
        })),
        createReminder: jest.fn(),
        deleteReminder: jest.fn(),
        addReminderSchedule: jest.fn(),
        updateSchedule: jest.fn(),
        deleteSchedule: jest.fn(),
    });
});

describe('Price normalization', () => {
    beforeEach(() => {
        const { setError } = useRemindersStore.getState() as any;
        setError(null);
        useRemindersStore.setState({ reminders: [{ id: 'r1', name: 'Vit D', purpose: null, description: null, pricePaid: null, photoUrl: null, isActive: true, schedules: [] }] });
    });

    it('normaliza vírgula para ponto antes de atualizar', async () => {
        const { updateReminder } = useRemindersStore.getState();
        const updated = await updateReminder('r1', { pricePaid: '10,50' } as any);
        expect(updated.pricePaid).toBe('10.50');
    });
});
