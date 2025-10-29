import { useNotificationsStore } from '@/src/store/notificationsStore';
import { useThemeStore } from '@/src/store/themeStore';

describe('Notifications & Theme persistence', () => {
    beforeEach(() => {
        // limpa notificações
        useNotificationsStore.setState({ notifications: [] });
    });

    it('adiciona e remove notificação automaticamente após duração', async () => {
        jest.useFakeTimers();
        useNotificationsStore.getState().show({ kind: 'success', message: 'Olá', duration: 1000 });
        expect(useNotificationsStore.getState().notifications.length).toBe(1);
        jest.advanceTimersByTime(1100);
        expect(useNotificationsStore.getState().notifications.length).toBe(0);
        jest.useRealTimers();
    });

    it('remove notificação manualmente', () => {
        useNotificationsStore.getState().show({ kind: 'error', message: 'Erro', duration: 0 });
        const first = useNotificationsStore.getState().notifications[0];
        useNotificationsStore.getState().hide(first.id);
        expect(useNotificationsStore.getState().notifications.length).toBe(0);
    });

    it('alterna tema e persiste em memória', () => {
        const before = useThemeStore.getState().mode;
        useThemeStore.getState().toggle();
        const after = useThemeStore.getState().mode;
        expect(after).not.toBe(before);
        // toggla de volta
        useThemeStore.getState().toggle();
        expect(useThemeStore.getState().mode).toBe(before);
    });
});
