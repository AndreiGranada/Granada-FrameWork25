import * as SecureStore from 'expo-secure-store';
import { DefaultService } from '../../../sdk';

export async function login(email: string, password: string) {
    const data = await DefaultService.postAuthLogin({ requestBody: { email, password } });
    await SecureStore.setItemAsync('accessToken', data.token);
    await SecureStore.setItemAsync('refreshToken', data.refreshToken);
    return data;
}

export async function logout() {
    try { await DefaultService.postAuthLogout(); } catch { }
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
}

