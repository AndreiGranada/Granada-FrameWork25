import DaysOfWeekSelector from '@/components/ui/DaysOfWeekSelector';
import PrimaryButton from '@/components/ui/PrimaryButton';
import ScreenHeader from '@/components/ui/ScreenHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import TimePicker from '@/components/ui/TimePicker';
import TextField from '@/components/ui/TextField';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { daysOfWeekFromBitmask, minutesToHHMM } from '@/src/lib/format';
import { trackEvent, withScreen } from '@/src/observability/analytics';
import { useNotifications, useRemindersStore, useThemeStore } from '@/src/store';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View, Platform } from 'react-native';

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
  const { reminders, loadReminders, addSchedule, updateSchedule, deleteSchedule, updateReminder } = useRemindersStore();
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

  // Estado de edição dos campos opcionais (deve vir antes de quaisquer returns)
  const [editingInfo, setEditingInfo] = useState(false);
  const [purpose, setPurpose] = useState<string>(reminders.find(r => r.id === id)?.purpose ?? '');
  const [pricePaid, setPricePaid] = useState<string>(
    (() => {
      const r = reminders.find(r => r.id === id);
      if (!r || r.pricePaid == null) return '';
      return typeof r.pricePaid === 'number' ? String(r.pricePaid) : String(r.pricePaid);
    })()
  );
  const [description, setDescription] = useState<string>(reminders.find(r => r.id === id)?.description ?? '');

  // Sincroniza valores locais quando o lembrete mudar externamente
  useEffect(() => {
    if (!reminder) return;
    setPurpose(reminder.purpose ?? '');
    setPricePaid(
      reminder.pricePaid == null
        ? ''
        : typeof reminder.pricePaid === 'number'
          ? String(reminder.pricePaid)
          : String(reminder.pricePaid)
    );
    setDescription(reminder.description ?? '');
  }, [reminder]);

  async function handleSaveInfo() {
    try {
      await updateReminder(id, {
        purpose: purpose.trim() || null,
        pricePaid: pricePaid.trim() ? pricePaid.trim() : null as any,
        description: description.trim() || null,
      } as any);
      success('Informações atualizadas');
      setEditingInfo(false);
    } catch {
      notifyError('Falha ao atualizar informações');
    }
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

        {(hasAdditionalInfo || editingInfo) ? (
          <View style={{ backgroundColor: palette.surface, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: palette.border, marginBottom: Spacing.lg, gap: Spacing.md }}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
              <Text style={{ ...Typography.captionMedium, color: palette.textSecondary }}>Informações opcionais</Text>
              {!editingInfo ? (
                <TouchableOpacity onPress={() => setEditingInfo(true)}>
                  <Text style={{ ...Typography.smallMedium, color: palette.primary }}>Editar</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {!editingInfo ? (
              <>
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
              </>
            ) : (
              <>
                <TextField
                  label="Para que serve"
                  value={purpose}
                  onChangeText={setPurpose}
                  placeholder="Ex.: Dor de estômago"
                />
                <TextField
                  label="Preço pago"
                  value={pricePaid}
                  onChangeText={setPricePaid}
                  placeholder="Ex.: 25,90"
                  keyboardType={Platform.OS === 'web' ? 'decimal' as any : 'numeric'}
                />
                <TextField
                  label="Observações"
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Comentários adicionais"
                  multiline
                  numberOfLines={3}
                />
                <View style={{ flexDirection:'row', gap: Spacing.sm, justifyContent:'flex-end' }}>
                  <TouchableOpacity
                    onPress={() => { setEditingInfo(false); setPurpose(reminder.purpose ?? ''); setPricePaid(reminder.pricePaid == null ? '' : typeof reminder.pricePaid === 'number' ? String(reminder.pricePaid) : String(reminder.pricePaid)); setDescription(reminder.description ?? ''); }}
                    style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: BorderRadius.md, borderWidth:1, borderColor: palette.border }}
                  >
                    <Text style={{ ...Typography.smallMedium, color: palette.text }}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSaveInfo}
                    style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: BorderRadius.md, backgroundColor: Colors.light.primary }}
                  >
                    <Text style={{ ...Typography.smallMedium, color: '#fff' }}>Salvar</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
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
            <ScheduleCard
              key={s.id}
              s={s}
              palette={palette}
              onSave={(patch) => handleUpdateSchedule(s, patch)}
              onDelete={() => handleDeleteSchedule(s)}
            />
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

function ScheduleCard({ s, palette, onSave, onDelete }: { s: any; palette: any; onSave: (patch: any) => Promise<void> | void; onDelete: () => void }) {
  const [localMinutes, setLocalMinutes] = useState<number>(s.ingestionTimeMinutes);
  const [saving, setSaving] = useState(false);

  // Sincroniza quando o valor salvo muda externamente
  useEffect(() => {
    setLocalMinutes(s.ingestionTimeMinutes);
  }, [s.ingestionTimeMinutes, s.id]);

  const dirty = localMinutes !== s.ingestionTimeMinutes;

  async function handleSave() {
    if (!dirty) return;
    try {
      setSaving(true);
      await onSave({ ingestionTimeMinutes: localMinutes });
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ backgroundColor: palette.surface, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth:1, borderColor: palette.border }}>
      <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: Spacing.sm }}>
        <Text style={{ ...Typography.bodyMedium, color: palette.text }}>{minutesToHHMM(s.ingestionTimeMinutes)} • {daysOfWeekFromBitmask(s.daysOfWeekBitmask)}</Text>
        <TouchableOpacity onPress={onDelete}>
          <Text style={{ ...Typography.small, color: palette.error }}>Remover</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection:'row', alignItems:'center', gap: Spacing.md, marginBottom: Spacing.sm }}>
        <Text style={{ ...Typography.captionMedium, color: palette.text, minWidth:60 }}>Horário</Text>
        <TimePicker minutes={localMinutes} onChange={setLocalMinutes} />
        <TouchableOpacity
          onPress={handleSave}
          disabled={!dirty || saving}
          style={{
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: BorderRadius.md,
            backgroundColor: (!dirty || saving) ? '#888' : Colors.light.primary,
            borderWidth: 1,
            borderColor: (!dirty || saving) ? '#777' : Colors.light.primaryDark,
          }}
        >
          <Text style={{ ...Typography.smallMedium, color: '#fff' }}>{saving ? 'Salvando...' : 'Salvar'}</Text>
        </TouchableOpacity>
      </View>

      <View style={{ gap: Spacing.xs, marginBottom: Spacing.sm }}>
        <Text style={{ ...Typography.captionMedium, color: palette.text }}>Dias da Semana</Text>
        <DaysOfWeekSelector value={s.daysOfWeekBitmask} onChange={(mask) => onSave({ daysOfWeekBitmask: mask })} />
      </View>
      <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
        <Text style={{ ...Typography.captionMedium, color: palette.text }}>Ativo</Text>
        <TouchableOpacity onPress={() => onSave({ isActive: !s.isActive })}>
          <StatusBadge status={s.isActive ? 'success' : 'neutral'} text={s.isActive ? 'Sim' : 'Não'} size="sm" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
