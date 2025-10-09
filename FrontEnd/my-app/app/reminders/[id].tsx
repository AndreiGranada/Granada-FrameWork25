import DaysOfWeekSelector from '@/components/ui/DaysOfWeekSelector';
import PrimaryButton from '@/components/ui/PrimaryButton';
import ScreenHeader from '@/components/ui/ScreenHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import TimePicker from '@/components/ui/TimePicker';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { daysOfWeekFromBitmask, minutesToHHMM } from '@/src/lib/format';
import { trackEvent, withScreen } from '@/src/observability/analytics';
import { useNotifications, useRemindersStore, useThemeStore } from '@/src/store';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';

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

export default function ReminderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { mode } = useThemeStore();
  const palette = Colors[mode];
  const { reminders, loadReminders, addSchedule, updateSchedule, deleteSchedule } = useRemindersStore();
  const { success, error: notifyError } = useNotifications();
  const [loading, setLoading] = useState(false);

  const reminder = reminders.find(r => r.id === id);

  useEffect(() => {
    if (!reminder) {
      setLoading(true);
      loadReminders().finally(() => setLoading(false));
    } else {
      withScreen('reminder_detail', { id });
    }
  }, [reminder, loadReminders, id]);

  async function handleAddSchedule() {
    if (!id) return;
    try {
      await addSchedule(id, { ingestionTimeMinutes: 8*60, daysOfWeekBitmask: 0, isActive: true });
      success('Horário adicionado');
      trackEvent('reminder_detail_schedule_add', { id });
    } catch { notifyError('Falha ao adicionar'); }
  }

  async function handleUpdateSchedule(s: any, patch: any) {
    try {
      await updateSchedule(s.id, {
        ingestionTimeMinutes: patch.ingestionTimeMinutes ?? s.ingestionTimeMinutes,
        daysOfWeekBitmask: patch.daysOfWeekBitmask ?? s.daysOfWeekBitmask,
        isActive: patch.isActive ?? s.isActive,
      });
      success('Horário atualizado');
      trackEvent('reminder_detail_schedule_update', { id, scheduleId: s.id });
    } catch { notifyError('Falha ao atualizar'); }
  }

  async function handleDeleteSchedule(s: any) {
    try {
      await deleteSchedule(s.id);
      success('Horário removido');
      trackEvent('reminder_detail_schedule_remove', { id, scheduleId: s.id });
    } catch { notifyError('Falha ao remover'); }
  }

  if (loading && !reminder) {
    return <View style={{ flex:1, alignItems:'center', justifyContent:'center', backgroundColor: palette.background }}><ActivityIndicator color={palette.primary} /><Text style={{ ...Typography.caption, color: palette.textSecondary, marginTop: Spacing.md }}>Carregando...</Text></View>;
  }

  if (!reminder) {
    return (
      <View style={{ flex:1, alignItems:'center', justifyContent:'center', padding:Spacing.lg, backgroundColor: palette.background }}>
        <Text style={{ ...Typography.bodySemiBold, color: palette.text }}>Lembrete não encontrado.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop:Spacing.md }}>
          <Text style={{ ...Typography.smallMedium, color: palette.primary }}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formattedPrice = formatPriceLabel(reminder.pricePaid);
  const hasAdditionalInfo = Boolean(reminder.purpose || reminder.description || formattedPrice);

  const statusSubtitle = reminder.isActive ? 'Ativo' : 'Inativo';

  return (
    <View style={{ flex:1, backgroundColor: palette.background }}>
      <ScreenHeader title={reminder.name} subtitle={statusSubtitle} />
      <View style={{ flex:1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.lg }}>
        <View style={{ flexDirection:'row', alignItems:'center', gap: Spacing.sm, marginBottom: Spacing.lg }}>
          <StatusBadge status={reminder.isActive ? 'success' : 'neutral'} text={reminder.isActive ? 'Ativo' : 'Inativo'} size="sm" />
        </View>

        {hasAdditionalInfo ? (
          <View style={{ backgroundColor: palette.surface, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: palette.border, marginBottom: Spacing.lg, gap: Spacing.md }}>
            {reminder.purpose ? (
              <View style={{ gap: Spacing.xs }}>
                <Text style={{ ...Typography.captionMedium, color: palette.textSecondary }}>Para que serve</Text>
                <Text style={{ ...Typography.body, color: palette.text }}>{reminder.purpose}</Text>
              </View>
            ) : null}
            {formattedPrice ? (
              <View style={{ gap: Spacing.xs }}>
                <Text style={{ ...Typography.captionMedium, color: palette.textSecondary }}>Preço pago</Text>
                <Text style={{ ...Typography.body, color: palette.text }}>{formattedPrice}</Text>
              </View>
            ) : null}
            {reminder.description ? (
              <View style={{ gap: Spacing.xs }}>
                <Text style={{ ...Typography.captionMedium, color: palette.textSecondary }}>Observações</Text>
                <Text style={{ ...Typography.body, color: palette.text }}>{reminder.description}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <Text style={{ ...Typography.h4, color: palette.text, marginBottom: Spacing.md }}>Horários</Text>

        {reminder.schedules?.length ? (
          <FlatList
            data={reminder.schedules}
            keyExtractor={s => s.id}
            style={{ flexGrow:0 }}
            contentContainerStyle={{ gap: Spacing.md, paddingBottom: Spacing.xl }}
            renderItem={({ item: s }) => (
            <View style={{ backgroundColor: palette.surface, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth:1, borderColor: palette.border }}>
              <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: Spacing.sm }}>
                <Text style={{ ...Typography.bodyMedium, color: palette.text }}>{minutesToHHMM(s.ingestionTimeMinutes)} • {daysOfWeekFromBitmask(s.daysOfWeekBitmask)}</Text>
                <TouchableOpacity onPress={() => handleDeleteSchedule(s)}>
                  <Text style={{ ...Typography.small, color: palette.error }}>Remover</Text>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection:'row', alignItems:'center', gap: Spacing.md, marginBottom: Spacing.sm }}>
                <Text style={{ ...Typography.captionMedium, color: palette.text, minWidth:60 }}>Horário</Text>
                <TimePicker minutes={s.ingestionTimeMinutes} onChange={(m) => handleUpdateSchedule(s, { ingestionTimeMinutes: m })} />
              </View>
              <View style={{ gap: Spacing.xs, marginBottom: Spacing.sm }}>
                <Text style={{ ...Typography.captionMedium, color: palette.text }}>Dias da Semana</Text>
                <DaysOfWeekSelector value={s.daysOfWeekBitmask} onChange={(mask) => handleUpdateSchedule(s, { daysOfWeekBitmask: mask })} />
              </View>
              <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
                <Text style={{ ...Typography.captionMedium, color: palette.text }}>Ativo</Text>
                <TouchableOpacity onPress={() => handleUpdateSchedule(s, { isActive: !s.isActive })}>
                  <StatusBadge status={s.isActive ? 'success' : 'neutral'} text={s.isActive ? 'Sim' : 'Não'} size="sm" />
                </TouchableOpacity>
              </View>
            </View>
            )}
          />
        ) : (
          <View style={{ marginBottom: Spacing.xl }}>
            <Text style={{ ...Typography.caption, color: palette.textSecondary, marginBottom: Spacing.md }}>Nenhum horário configurado.</Text>
            <PrimaryButton title="Adicionar Primeiro Horário" onPress={handleAddSchedule} />
          </View>
        )}

        {reminder.schedules?.length ? (
          <PrimaryButton title="Adicionar Horário" onPress={handleAddSchedule} />
        ) : null}
      </View>
    </View>
  );
}
