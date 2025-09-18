import { OpenAPI } from '../../../sdk/core/OpenAPI';
import * as SecureStore from 'expo-secure-store';

export function configureApi(baseUrl: string) {
    OpenAPI.BASE = baseUrl;
}

export function setAuthTokenFromSecureStore() {
    OpenAPI.TOKEN = async () => {
        const t = await SecureStore.getItemAsync('accessToken');
        return t ? `Bearer ${t}` : '';
    };
}

export function setStaticAuthToken(token?: string) {
    OpenAPI.TOKEN = token ? `Bearer ${token}` : undefined;
}

