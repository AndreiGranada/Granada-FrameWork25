import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export type NotificationKind = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
    id: string;
    kind: NotificationKind;
    message: string;
    duration?: number;
    timestamp: number;
}

interface NotificationsState {
    // State
    notifications: Notification[];

    // Actions
    show: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
    hide: (id: string) => void;
    clear: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useNotificationsStore = create<NotificationsState>()(
    immer((set) => ({
        // Initial state
        notifications: [],

        // Actions
        show: (notification) => {
            const id = generateId();
            const newNotification: Notification = {
                ...notification,
                id,
                timestamp: Date.now(),
                duration: notification.duration ?? 4000, // Default 4 seconds
            };

            set((state) => {
                state.notifications.push(newNotification);
            });

            // Auto-hide after duration
            if (newNotification.duration && newNotification.duration > 0) {
                setTimeout(() => {
                    set((state) => {
                        state.notifications = state.notifications.filter(n => n.id !== id);
                    });
                }, newNotification.duration);
            }
        },

        hide: (id: string) => {
            set((state) => {
                state.notifications = state.notifications.filter(n => n.id !== id);
            });
        },

        clear: () => {
            set((state) => {
                state.notifications = [];
            });
        },
    }))
);

// Hook simplificado para mostrar notificações
export const useNotifications = () => {
    const store = useNotificationsStore();

    return {
        notifications: store.notifications,
        show: store.show,
        hide: store.hide,
        clear: store.clear,
        // Métodos de conveniência
        success: (message: string, duration?: number) =>
            store.show({ kind: 'success', message, duration }),
        error: (message: string, duration?: number) =>
            store.show({ kind: 'error', message, duration }),
        warning: (message: string, duration?: number) =>
            store.show({ kind: 'warning', message, duration }),
        info: (message: string, duration?: number) =>
            store.show({ kind: 'info', message, duration }),
    };
};