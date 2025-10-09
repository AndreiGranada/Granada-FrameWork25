// Adapter final: usa apenas SDK gerado.
import type { Device, DeviceCreate, DeviceUpdate } from '@/sdk-backend';
import { wrap, mutationBreadcrumb } from './adapterError';

let DefaultServiceRef: any | null = null;
let loadingPromise: Promise<void> | null = null;

async function ensureSdk(): Promise<void> {
    if (DefaultServiceRef) return;
    if (loadingPromise) { await loadingPromise; return; }
    loadingPromise = import('@/sdk-backend')
        .then(mod => { DefaultServiceRef = (mod as any).DefaultService; })
        .catch(() => { /* silencioso */ })
        .finally(() => { loadingPromise = null; });
    await loadingPromise;
}

export const devicesAdapter = {
    async list(): Promise<Device[]> {
        await ensureSdk();
        if (!DefaultServiceRef?.listDevices) throw new Error('SDK não carregado');
        return await DefaultServiceRef.listDevices();
    },
    async register(data: DeviceCreate): Promise<Device> {
        await ensureSdk();
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
        await ensureSdk();
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
        await ensureSdk();
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
