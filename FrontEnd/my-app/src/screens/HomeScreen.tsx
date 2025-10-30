import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Platform, ScrollView } from 'react-native';
import PrimaryButton from '@/components/ui/PrimaryButton';
import Card from '@/components/ui/Card';
import Header from '@/components/ui/Header';
import { useRouter } from 'expo-router';
import { getExpoPushToken, ensureDeviceRegistered, initNotifications } from '@/src/push/registerForPush';
import { api } from '@/src/api/client';
import { useQuery } from '@tanstack/react-query';
import { emergencyContactsAdapter } from '@/src/services/adapters/emergencyContactsAdapter';
import { friendlyTopMessage, getRetryAfterSeconds } from '@/src/lib/errors';
import { useAuthStore, useThemeStore, useNotifications } from '@/src/store';
import { useRequireAuth } from '@/src/lib/useRequireAuth';
import { Colors, Spacing, Typography } from '@/constants/theme';

export default function HomeScreen() {
  const { user, logout } = useAuthStore();
  const { isAuthenticated } = useRequireAuth();
  const router = useRouter();
  const notifications = useNotifications();
  const { mode: themeMode } = useThemeStore();
  const palette = Colors[themeMode];
  const [sosing, setSosing] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { data: contacts } = useQuery({
    queryKey: ['emergency-contacts'],
    queryFn: () => emergencyContactsAdapter.list(),
    enabled: isAuthenticated,
  });
  const hasActiveContacts = useMemo(() => (contacts || []).some(c => c.isActive), [contacts]);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        // Inicializa handlers/listeners apenas quando suportado (não Expo Go)
        await initNotifications();
        const projectId = process.env.EXPO_PROJECT_ID || undefined;
        const token = await getExpoPushToken(projectId);
        if (token) {
          try {
            await ensureDeviceRegistered(token);
          } catch {
            // não bloqueia a Home
          }
        }
      }
    })();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  async function sendSOS() {
    if (retryAfter && retryAfter > 0) return;
    try {
      setSosing(true);
      const { data } = await api.post('/emergency/sos', { message: 'Preciso de ajuda agora' });
      notifications.success(`SOS enviado. Contatos notificados: ${data?.sent ?? 0}`);
    } catch (e: any) {
      const retry = getRetryAfterSeconds(e);
      if (retry > 0) {
        setRetryAfter(retry);
        notifications.warning(`Aguardando ${retry}s para reenviar (rate limit)`);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setRetryAfter((prev) => {
            if (!prev || prev <= 1) {
              if (timerRef.current) clearInterval(timerRef.current);
              timerRef.current = null;
              notifications.info('Você já pode tentar enviar o SOS novamente.');
              return null;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        notifications.error(friendlyTopMessage(e, 'Falha ao enviar SOS'));
      }
    } finally {
      setSosing(false);
    }
  }

  const menuItems = [
    {
      title: 'Contatos de Emergência',
      description: 'Gerencie seus contatos para SOS',
      onPress: () => router.push('/emergency-contacts' as any),
      variant: 'secondary' as const,
    },
    {
      title: 'Medicamentos & Horários',
      description: 'Configure medicamentos e horários',
      onPress: () => router.push('/reminders' as any),
      variant: 'secondary' as const,
    },
    {
      title: 'Próximas Ingestões do Dia',
      description: 'Medicamentos das próximas ingestões do dia',
      onPress: () => router.push('/intakes' as any),
      variant: 'secondary' as const,
    },
    {
      title: 'Histórico',
      description: 'Veja seu histórico de medicamentos',
      onPress: () => router.push('/intakes-history' as any),
      variant: 'secondary' as const,
    },
    {
      title: 'Perfil & Configurações',
      description: 'Altere suas informações pessoais',
      onPress: () => router.push('/profile' as any),
      variant: 'secondary' as const,
    },
  ];

  return (
    <View style={{
      flex: 1,
      backgroundColor: palette.background
    }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: Spacing.lg,
          gap: Spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Header
          title={`Olá, ${user?.name || user?.email?.split('@')[0] || 'Usuário'}!`}
          subtitle="Como podemos te ajudar hoje?"
          showThemeToggle={true}
        />

        {/* Quick Actions */}
        <Card elevated>
          <Text style={{
            ...Typography.h4,
            color: palette.text,
            marginBottom: Spacing.md,
          }}>
            Ações Rápidas
          </Text>

          <View style={{ gap: Spacing.md }}>
            <PrimaryButton
              title={retryAfter ? `SOS bloqueado (${retryAfter}s)` : sosing ? 'Enviando SOS…' : 'Enviar SOS 🚨'}
              onPress={sendSOS}
              disabled={!!retryAfter || sosing || !hasActiveContacts}
              variant="danger"
              size="lg"
            />

            {(!hasActiveContacts && !sosing) && (
              <Text style={{
                ...Typography.caption,
                color: palette.textSecondary,
                textAlign: 'center',
                marginTop: -Spacing.xs,
              }}>
                Configure contatos de emergência para usar o SOS
              </Text>
            )}
          </View>
        </Card>

        {/* Main Menu */}
        <Card>
          <Text style={{
            ...Typography.h4,
            color: palette.text,
            marginBottom: Spacing.md,
          }}>
            Menu Principal
          </Text>

          <View style={{ gap: Spacing.md }}>
            {menuItems.map((item, index) => (
              <View key={index}>
                <PrimaryButton
                  title={item.title}
                  onPress={item.onPress}
                  variant={item.variant}
                />
                <Text style={{
                  ...Typography.caption,
                  color: palette.textSecondary,
                  marginTop: Spacing.xs,
                  marginLeft: Spacing.lg,
                }}>
                  {item.description}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Account */}
        <Card>
          <PrimaryButton
            title="Sair da Conta"
            onPress={logout}
            variant="secondary"
          />
        </Card>
      </ScrollView>
    </View>
  );
}
