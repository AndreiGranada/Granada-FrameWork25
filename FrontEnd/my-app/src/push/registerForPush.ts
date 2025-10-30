import { api } from '@/src/api/client';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { router } from 'expo-router';
import { Platform } from 'react-native';
// Import dinâmico de expo-notifications somente quando suportado
async function getNotificationsModule() {
    if (Platform.OS === 'web') return null;
    if ((Constants as any)?.appOwnership === 'expo') return null; // Expo Go não suporta push remoto
    const mod = await import('expo-notifications');
    return mod;
}

export async function initNotifications() {
    const Notifications = await getNotificationsModule();
    if (!Notifications) return;
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
            // Tipos recentes do SDK incluem estes campos (iOS):
            shouldShowBanner: true,
            shouldShowList: true,
        } as any),
    });
    // Evita listeners duplicados em hot reload
    if (Platform.OS !== 'web' && !global.__MT_PUSH_LISTENER__) {
        global.__MT_PUSH_LISTENER__ = true;
        Notifications.addNotificationResponseReceivedListener((resp: any) => {
            const intakeEventId = (resp?.notification?.request?.content?.data as any)?.intakeEventId as string | undefined;
            if (intakeEventId) {
                try {
                    router.push(`/intakes-history?highlight=${encodeURIComponent(intakeEventId)}` as any);
                } catch {
                    // navegação não crítica; ignore
                }
            }
        });
    }
}

function resolveProjectId(explicit?: string) {
    if (explicit) return explicit;
    // 1) Env var via EAS
    const fromEnv = process.env.EXPO_PROJECT_ID as string | undefined;
    if (fromEnv) return fromEnv;
    // 2) Expo Constants em runtime (EAS build)
    const cfg: any = (Constants as any)?.expoConfig || (Constants as any)?.manifest2;
    const fromExtra = cfg?.extra?.eas?.projectId as string | undefined;
    if (fromExtra) return fromExtra;
    // 3) Alguns ambientes expõem easConfig
    const fromEasCfg = (Constants as any)?.easConfig?.projectId as string | undefined;
    return fromEasCfg;
}

export async function getExpoPushToken(projectId?: string, requestPermission = false) {
    // Evita push no Web e no Expo Go (SDK 53+ removeu push remoto no Expo Go)
    if (Platform.OS === 'web') return null;
    if ((Constants as any)?.appOwnership === 'expo') return null;
    if (!Device.isDevice) return null;
    const Notifications = await getNotificationsModule();
    if (!Notifications) return null;
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
        });
    }
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // REMOVIDO: Solicitação automática de permissões
    // Agora só solicita se explicitamente permitido via parâmetro
    if (existingStatus !== 'granted' && requestPermission) {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;
    const resolved = resolveProjectId(projectId);
    const token = (await Notifications.getExpoPushTokenAsync(resolved ? { projectId: resolved } : undefined as any)).data;
    return token;
}

export async function requestNotificationPermissions() {
    // Função para solicitar permissões manualmente quando o usuário desejar
    const Notifications = await getNotificationsModule();
    if (!Notifications) return { granted: false, canAskAgain: false };

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus === 'granted') {
        return { granted: true, canAskAgain: false };
    }

    const { status, canAskAgain } = await Notifications.requestPermissionsAsync();
    return { granted: status === 'granted', canAskAgain: canAskAgain || false };
}

export async function checkNotificationPermissions() {
    // Função para verificar o status atual das permissões sem solicitar
    const Notifications = await getNotificationsModule();
    if (!Notifications) return { granted: false, canAskAgain: false };

    const { status, canAskAgain } = await Notifications.getPermissionsAsync();
    return { granted: status === 'granted', canAskAgain: canAskAgain || false };
}

export async function ensureDeviceRegistered(pushToken: string) {
    try {
        await api.post('/devices', {
            platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
            pushToken,
        });
    } catch (e: any) {
        if (e?.response?.status !== 409) throw e;
    }
}

// Evita listeners duplicados em hot reload
declare global {
    var __MT_PUSH_LISTENER__: boolean | undefined;
}
// Listeners são registrados em initNotifications()
