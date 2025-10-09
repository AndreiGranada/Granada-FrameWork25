import Banner from '@/components/ui/Banner';
import Card from '@/components/ui/Card';
import PrimaryButton from '@/components/ui/PrimaryButton';
import ScreenHeader from '@/components/ui/ScreenHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import TextField from '@/components/ui/TextField';
import { Colors, Spacing, Typography } from '@/constants/theme';
import type { ReminderCreate } from '@/sdk-backend';
import { useRequireAuth } from '@/src/lib/useRequireAuth';
import { trackEvent } from '@/src/observability/analytics';
import { useNotifications, useRemindersStore, useThemeStore } from '@/src/store';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const formatPriceLabel = (value?: string | null) => {
  if (!value) return null;
  const normalized = Number(String(value).replace(',', '.'));
  if (Number.isNaN(normalized)) {
    return value;
  }
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(normalized);
  } catch {
    return value;
  }
};

export default function RemindersScreen() {
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();
  const { reminders, isLoading, error, loadReminders, createReminder } = useRemindersStore();
  const { mode } = useThemeStore();
  const { success, error: notifyError } = useNotifications();

  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [pricePaid, setPricePaid] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const palette = Colors[mode];

  // Carrega lembretes somente quando autenticado para evitar 401 em loop
  useEffect(() => {
    if (isAuthenticated) {
      loadReminders();
    }
  }, [isAuthenticated, loadReminders]);

  async function create() {
    if (!isAuthenticated) {
      notifyError('Você precisa estar logado para criar lembretes.');
      return;
    }
    if (!name.trim()) return;
    setCreating(true);
    try {
      const payload: ReminderCreate = {
        name: name.trim(),
        schedules: [],
      };
      if (purpose.trim()) {
        payload.purpose = purpose.trim();
      }
      if (description.trim()) {
        payload.description = description.trim();
      }
      if (pricePaid.trim()) {
        payload.pricePaid = pricePaid.trim().replace(',', '.');
      }

      await createReminder(payload);
      setName('');
      setPurpose('');
      setDescription('');
      setPricePaid('');
      success('Lembrete criado');
      // Limpa possíveis erros prévios
      (useRemindersStore.getState() as any).setError(null);
    } catch {
      notifyError('Falha ao criar lembrete');
    } finally {
      setCreating(false);
    }
  }

  // Tipo derivado dinamicamente evita conflito entre tipos de duas fontes diferentes
  const renderItem = ({ item }: { item: (typeof reminders)[number] }) => {
    const schedulesCount = item.schedules?.length || 0;
    const onPress = () => {
      trackEvent('reminder_open_detail', { id: item.id, hasSchedules: schedulesCount > 0 });
      router.push(`/reminders/${item.id}` as any);
    };
    const formattedPrice = formatPriceLabel(item.pricePaid);
    return (
      <TouchableOpacity onPress={onPress} accessibilityRole="button" accessibilityLabel={`Abrir lembrete ${item.name}`}>
        <Card elevated style={{ padding: Spacing.md, marginBottom: Spacing.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1, paddingRight: Spacing.md }}>
              <Text style={{ ...Typography.bodySemiBold, color: palette.text }} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={{ flexDirection: 'row', marginTop: 4, alignItems: 'center', gap: 8 }}>
                <StatusBadge status={item.isActive ? 'success' : 'neutral'} text={item.isActive ? 'Ativo' : 'Inativo'} size="sm" />
                <StatusBadge
                  status={schedulesCount > 0 ? 'info' : 'neutral'}
                  text={`${schedulesCount} horário${schedulesCount === 1 ? '' : 's'}`}
                  size="sm"
                />
              </View>
            </View>
          </View>
          <View style={{ marginTop: Spacing.sm }}>
            {item.purpose ? (
              <Text style={{ ...Typography.caption, color: palette.textSecondary, marginTop: Spacing.xs }} numberOfLines={2}>
                {item.purpose}
              </Text>
            ) : null}
            {formattedPrice ? (
              <Text style={{ ...Typography.caption, color: palette.textSecondary, marginTop: Spacing.xs }}>
                Preço pago: {formattedPrice}
              </Text>
            ) : null}
            {item.description ? (
              <Text style={{ ...Typography.caption, color: palette.textTertiary, marginTop: Spacing.xs }} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  if (authLoading || (isAuthenticated && isLoading)) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.background }}>
        <ActivityIndicator size="large" color={palette.primary} />
        <Text style={{ ...Typography.caption, color: palette.textSecondary, marginTop: Spacing.md }}>
          {authLoading ? 'Verificando sessão...' : 'Carregando lembretes...'}
        </Text>
      </View>
    );
  }

  const headerSubtitle = isAuthenticated
    ? `${reminders.length} lembrete${reminders.length !== 1 ? 's' : ''} cadastrado${reminders.length !== 1 ? 's' : ''}`
    : 'Faça login ou cadastre-se para começar';

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <ScreenHeader title="Lembretes" subtitle={headerSubtitle} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg, paddingTop: Spacing.lg, gap: Spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        {error && <Banner kind="error" message={error} />}

        <Card elevated>
          <Text style={{ ...Typography.h4, color: palette.text, marginBottom: Spacing.md }}>Novo Lembrete</Text>
          <View style={{ gap: Spacing.md }}>
            <TextField
              label="Nome do medicamento"
              placeholder="Ex: Vitamina D, Omeprazol..."
              value={name}
              onChangeText={setName}
              editable={isAuthenticated}
            />
            <TextField
              label="Para que serve (opcional)"
              placeholder="Ex: Tratamento de refluxo, suplementação..."
              value={purpose}
              onChangeText={setPurpose}
              editable={isAuthenticated}
            />
            <TextField
              label="Preço pago (opcional)"
              placeholder="Ex: 24,90"
              value={pricePaid}
              onChangeText={setPricePaid}
              editable={isAuthenticated}
              keyboardType={Platform.OS === 'web' ? 'numeric' : 'decimal-pad'}
            />
            <TextField
              label="Observações (opcional)"
              placeholder="Informações adicionais que você queira lembrar"
              value={description}
              onChangeText={setDescription}
              editable={isAuthenticated}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <PrimaryButton
              title={creating ? 'Criando…' : 'Criar Lembrete'}
              onPress={create}
              disabled={!name.trim() || creating || !isAuthenticated}
              loading={creating}
            />
            {!isAuthenticated && (
              <Text style={{ ...Typography.caption, color: palette.textSecondary }}>
                Entre ou cadastre-se para criar lembretes.
              </Text>
            )}
          </View>
        </Card>

        {isAuthenticated && reminders.length > 0 ? (
          <View style={{ gap: Spacing.lg }}>
            <Text style={{ ...Typography.h4, color: palette.text }}>Seus Lembretes</Text>
            <FlatList
              data={reminders as any}
              keyExtractor={(r: any) => r.id}
              renderItem={renderItem as any}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </View>
        ) : isAuthenticated ? (
          <Card>
            <View style={{ alignItems: 'center', paddingVertical: Spacing.xl }}>
              <Text style={{ ...Typography.bodySemiBold, color: palette.text, textAlign: 'center', marginBottom: Spacing.sm }}>
                Nenhum lembrete ainda
              </Text>
              <Text style={{ ...Typography.caption, color: palette.textSecondary, textAlign: 'center' }}>
                Crie seu primeiro lembrete para começar a{'\n'}gerenciar seus medicamentos
              </Text>
            </View>
          </Card>
        ) : (
          <Card>
            <View style={{ alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.md }}>
              <Text style={{ ...Typography.bodySemiBold, color: palette.text, textAlign: 'center' }}>
                Você não está autenticado
              </Text>
              <Text style={{ ...Typography.caption, color: palette.textSecondary, textAlign: 'center' }}>
                Acesse sua conta ou cadastre-se para visualizar e gerenciar seus lembretes.
              </Text>
              <PrimaryButton title="Ir para Login" onPress={() => router.push('/login' as any)} />
            </View>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}
