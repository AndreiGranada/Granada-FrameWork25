// Adapter final: usa apenas SDK gerado.
import type { Device, DeviceCreate, DeviceUpdate } from '@/sdk-backend';
import { DefaultService } from '@/sdk-backend';
import { wrap, mutationBreadcrumb } from './adapterError';

let DefaultServiceRef: any | null = DefaultService;

export const devicesAdapter = {
    async list(): Promise<Device[]> {
        if (!DefaultServiceRef?.listDevices) throw new Error('SDK não carregado');
        return await DefaultServiceRef.listDevices();
    },
    async register(data: DeviceCreate): Promise<Device> {
        return wrap(
            (async () => {
                if (!DefaultServiceRef?.registerDevice) throw new Error('SDK não carregado');
                const d = await DefaultServiceRef.registerDevice({ requestBody: data });
                mutationBreadcrumb('register', 'device', { id: d.id });
                return d;
            })(),
            'Falha ao registrar dispositivo'
        );
    },
    async update(id: string, data: DeviceUpdate): Promise<Device> {
        return wrap(
            (async () => {
                if (!DefaultServiceRef?.updateDevice) throw new Error('SDK não carregado');
                const d = await DefaultServiceRef.updateDevice({ id, requestBody: data });
                mutationBreadcrumb('update', 'device', { id });
                return d;
            })(),
            'Falha ao atualizar dispositivo'
        );
    },
    async remove(id: string): Promise<void> {
        return wrap(
            (async () => {
                if (!DefaultServiceRef?.deleteDevice) throw new Error('SDK não carregado');
                await DefaultServiceRef.deleteDevice({ id });
                mutationBreadcrumb('delete', 'device', { id });
            })(),
            'Falha ao remover dispositivo'
        );
    }
};

export function __setDevicesSdkMock(mock: any) { DefaultServiceRef = mock; }
