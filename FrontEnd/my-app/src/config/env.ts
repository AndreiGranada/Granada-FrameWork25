import { Platform } from 'react-native';

// Platform-aware defaults when no env var is provided
function defaultBaseUrl() {
    if (Platform.OS === 'web') return 'http://localhost:3000'; // browser hits backend on same machine
    if (Platform.OS === 'ios') return 'http://127.0.0.1:3000'; // iOS simulator
    return 'http://10.0.2.2:3000'; // Android emulator
}

const apiBaseUrlCandidates = (process.env.EXPO_PUBLIC_API_BASE_URLS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export const API_BASE_URL =
    apiBaseUrlCandidates[0] ||
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    process.env.API_BASE_URL ||
    defaultBaseUrl();

export const API_BASE_URLS = apiBaseUrlCandidates.length > 0 ? apiBaseUrlCandidates : [API_BASE_URL];
