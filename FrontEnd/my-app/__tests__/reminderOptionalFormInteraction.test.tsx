import { useRemindersStore } from '@/src/store/remindersStore';

// Mock do adapter utilizado pelo store para focar apenas na lógica de criação
jest.mock('@/src/services/adapters/remindersAdapter', () => ({
  remindersAdapter: {
    list: jest.fn(async () => []),
    create: jest.fn(async (data: any) => ({ id: 'generated', name: data.name, isActive: true, schedules: [{ id: 'auto', ingestionTimeMinutes: 480, daysOfWeekBitmask: 0, isActive: true }] })),
  }
}));

describe('Reminders store basic creation (simplified UX path)', () => {
  beforeEach(() => {
    useRemindersStore.setState({ reminders: [], isLoading: false, error: null } as any);
  });

  it('insere lembrete e preenche schedule default', async () => {
    const { createReminder } = useRemindersStore.getState();
    const newReminder = await createReminder({ name: 'Novo Lembrete', schedules: [] } as any);
    expect(newReminder.name).toBe('Novo Lembrete');
    expect(newReminder.schedules?.length).toBe(1);
    const { reminders } = useRemindersStore.getState();
    expect(reminders.find(r => r.id === 'generated')).toBeTruthy();
  });
});
