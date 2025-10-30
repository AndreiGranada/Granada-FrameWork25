import { useRemindersStore } from '@/src/store/remindersStore';
import { __setRemindersSdkMock } from '@/src/services/adapters/remindersAdapter';
import { DefaultService as remindersServiceMock } from '../test/__mocks__/sdk-backend';

describe('remindersStore via SDK adapter', () => {
    beforeEach(() => {
        const { setState } = useRemindersStore as any;
        setState({ reminders: [], isLoading: false, error: null });
        // injeta mock diretamente
        __setRemindersSdkMock(remindersServiceMock);
    });

    it('carrega lista vazia via SDK mock', async () => {
        await useRemindersStore.getState().loadReminders();
        expect(useRemindersStore.getState().reminders).toHaveLength(0);
    });

    it('cria reminder via SDK mock', async () => {
        const r = await useRemindersStore.getState().createReminder({ name: 'Teste', schedules: [] } as any);
        expect(r.id).toBe('r1');
        expect(useRemindersStore.getState().reminders[0].name).toBe('Teste');
    });
});
