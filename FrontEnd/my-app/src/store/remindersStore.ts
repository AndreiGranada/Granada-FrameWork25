import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Reminder, ReminderCreate, ReminderUpdate, ScheduleCreate, ScheduleUpdate } from '@/sdk-backend';
import { remindersAdapter } from '@/src/services/adapters/remindersAdapter';

interface RemindersState {
    // State
    reminders: Reminder[];
    isLoading: boolean;
    error: string | null;

    // Actions
    loadReminders: () => Promise<void>;
    createReminder: (data: ReminderCreate) => Promise<Reminder>;
    updateReminder: (id: string, data: ReminderUpdate) => Promise<Reminder>;
    deleteReminder: (id: string) => Promise<void>;
    addSchedule: (reminderId: string, data: ScheduleCreate) => Promise<Reminder>;
    updateSchedule: (scheduleId: string, data: ScheduleUpdate) => Promise<Reminder>;
    deleteSchedule: (scheduleId: string) => Promise<void>;
    setError: (error: string | null) => void;
    clearError: () => void;
}

export const useRemindersStore = create<RemindersState>()(
    immer((set, get) => ({
        // Initial state
        reminders: [],
        isLoading: false,
        error: null,

        // Actions
        loadReminders: async () => {
            set((state) => {
                state.isLoading = true;
                state.error = null;
            });

            try {
                const reminders = await remindersAdapter.list();
                set((state) => {
                    state.reminders = reminders;
                    state.isLoading = false;
                });
            } catch (error: any) {
                set((state) => {
                    state.error = error?.response?.data?.error?.message || 'Falha ao carregar lembretes';
                    state.isLoading = false;
                });
            }
        },

        createReminder: async (data: ReminderCreate) => {
            try {
                const newReminder = await remindersAdapter.create(data);
                set((state) => {
                    state.reminders.unshift(newReminder);
                });
                return newReminder;
            } catch (error: any) {
                const errorMsg = error?.response?.data?.error?.message || 'Falha ao criar lembrete';
                set((state) => {
                    state.error = errorMsg;
                });
                throw error;
            }
        },

        updateReminder: async (id: string, data: ReminderUpdate) => {
            try {
                // Normalização de preço (vírgula -> ponto) centralizada aqui
                if ((data as any)?.pricePaid && typeof (data as any).pricePaid === 'string') {
                    (data as any).pricePaid = (data as any).pricePaid.replace(',', '.');
                }
                const updatedReminder = await remindersAdapter.update(id, data);
                set((state) => {
                    const index = state.reminders.findIndex((r: Reminder) => r.id === id);
                    if (index >= 0) {
                        state.reminders[index] = updatedReminder;
                    }
                });
                return updatedReminder;
            } catch (error: any) {
                const errorMsg = error?.response?.data?.error?.message || 'Falha ao atualizar lembrete';
                set((state) => {
                    state.error = errorMsg;
                });
                throw error;
            }
        },

        deleteReminder: async (id: string) => {
            try {
                await remindersAdapter.remove(id);
                // Refresh the list to get updated state
                await get().loadReminders();
            } catch (error: any) {
                const errorMsg = error?.response?.data?.error?.message || 'Falha ao desativar lembrete';
                set((state) => {
                    state.error = errorMsg;
                });
                throw error;
            }
        },

        addSchedule: async (reminderId: string, data: ScheduleCreate) => {
            try {
                const updatedReminder = await remindersAdapter.addSchedule(reminderId, data);
                set((state) => {
                    const index = state.reminders.findIndex((r: Reminder) => r.id === reminderId);
                    if (index >= 0) {
                        state.reminders[index] = updatedReminder;
                    }
                });
                return updatedReminder;
            } catch (error: any) {
                const errorMsg = error?.response?.data?.error?.message || 'Falha ao adicionar horário';
                set((state) => {
                    state.error = errorMsg;
                });
                throw error;
            }
        },

        updateSchedule: async (scheduleId: string, data: ScheduleUpdate) => {
            try {
                const updatedReminder = await remindersAdapter.updateSchedule(scheduleId, data);
                set((state) => {
                    const index = state.reminders.findIndex((r: Reminder) =>
                        r.schedules?.some((s: any) => s.id === scheduleId)
                    );
                    if (index >= 0) {
                        state.reminders[index] = updatedReminder;
                    }
                });
                return updatedReminder;
            } catch (error: any) {
                const errorMsg = error?.response?.data?.error?.message || 'Falha ao atualizar horário';
                set((state) => {
                    state.error = errorMsg;
                });
                throw error;
            }
        },

        deleteSchedule: async (scheduleId: string) => {
            try {
                await remindersAdapter.deleteSchedule(scheduleId);
                // Refresh the list to get updated state
                await get().loadReminders();
            } catch (error: any) {
                const errorMsg = error?.response?.data?.error?.message || 'Falha ao remover horário';
                set((state) => {
                    state.error = errorMsg;
                });
                throw error;
            }
        },

        setError: (error: string | null) => {
            set((state) => {
                state.error = error;
            });
        },

        clearError: () => {
            set((state) => {
                state.error = null;
            });
        },
    }))
);