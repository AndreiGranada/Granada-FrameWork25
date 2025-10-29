import { api } from './client';
import type { IntakeEvent, IntakeEventExpanded, IntakeHistoryPage } from './types';

export const intakesApi = {
    async list(params?: {
        from?: string;
        to?: string;
        hours?: string;
        status?: 'PENDING' | 'TAKEN' | 'MISSED';
    }): Promise<IntakeEventExpanded[]> {
        const { data } = await api.get<IntakeEventExpanded[]>('/intakes', { params });
        return data;
    },

    async history(params?: { days?: string; limit?: number; cursor?: string }): Promise<
        IntakeEventExpanded[] | IntakeHistoryPage
    > {
        const { data } = await api.get('/intakes/history', { params });
        return data as any;
    },

    async markTaken(id: string): Promise<IntakeEvent> {
        const { data } = await api.post<IntakeEvent>(`/intakes/${id}/taken`);
        return data;
    },
};
