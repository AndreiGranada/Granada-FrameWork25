import { DefaultService } from '../../../sdk';
import * as SecureStore from 'expo-secure-store';

let isRefreshing = false;
let queue: Array<() => void> = [];

async function refresh() {
    if (isRefreshing) {
        await new Promise<void>((resolve) => queue.push(resolve));
        return;
    }
    isRefreshing = true;
    try {
        const rt = await SecureStore.getItemAsync('refreshToken');
        if (!rt) throw new Error('Sem refresh token');
        const data = await DefaultService.postAuthRefresh({ requestBody: { refreshToken: rt } });
        await SecureStore.setItemAsync('accessToken', data.token);
        await SecureStore.setItemAsync('refreshToken', data.refreshToken);
    } finally {
        isRefreshing = false;
        queue.forEach((r) => r());
        queue = [];
    }
}

export async function apiCall<T>(fn: () => Promise<T>): Promise<T> {
    try {
        return await fn();
    } catch (err: any) {
        if (err?.status === 401) {
            await refresh();
            return fn();
        }
        throw err;
    }
}

