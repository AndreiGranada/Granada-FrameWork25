import { api } from './client';
import type { DeviceCreate, DeviceUpdate, Device } from './types';

export const devicesApi = {
    async list(): Promise<Device[]> {
        const { data } = await api.get<Device[]>('/devices');
        return data;
    },
    async register(body: DeviceCreate): Promise<Device> {
        const { data } = await api.post<Device>('/devices', body);
        return data;
    },
    async update(id: string, body: DeviceUpdate): Promise<Device> {
        const { data } = await api.patch<Device>(`/devices/${id}`, body);
        return data;
    },
    async remove(id: string): Promise<void> {
        await api.delete(`/devices/${id}`);
    }
};
