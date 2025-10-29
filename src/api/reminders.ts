import { api } from './client';
import type {
    Reminder,
    ReminderCreate,
    ReminderUpdate,
    ScheduleCreate,
    ScheduleUpdate,
} from './types';

export const remindersApi = {
    async list(): Promise<Reminder[]> {
        const { data } = await api.get<Reminder[]>('/reminders');
        return data;
    },

    async create(body: ReminderCreate): Promise<Reminder> {
        const { data } = await api.post<Reminder>('/reminders', body);
        return data;
    },

    async get(id: string): Promise<Reminder> {
        const { data } = await api.get<Reminder>(`/reminders/${id}`);
        return data;
    },

    async update(id: string, body: ReminderUpdate): Promise<Reminder> {
        const { data } = await api.patch<Reminder>(`/reminders/${id}`, body);
        return data;
    },

    async remove(id: string): Promise<void> {
        await api.delete(`/reminders/${id}`);
    },

    async addSchedule(reminderId: string, body: ScheduleCreate): Promise<Reminder> {
        const { data } = await api.post<Reminder>(`/reminders/${reminderId}/schedules`, body);
        return data;
    },

    async updateSchedule(scheduleId: string, body: ScheduleUpdate): Promise<Reminder> {
        const { data } = await api.patch<Reminder>(`/reminders/schedules/${scheduleId}`, body);
        return data;
    },

    async deleteSchedule(scheduleId: string): Promise<void> {
        await api.delete(`/reminders/schedules/${scheduleId}`);
    },
};
