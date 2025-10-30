import ConfirmModal from '@/components/ui/ConfirmModal';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useRequireAuth } from '@/src/lib/useRequireAuth';
import { emergencyContactsAdapter, type EmergencyContact } from '@/src/services/adapters/emergencyContactsAdapter';
import { useNotifications, useThemeStore } from '@/src/store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Switch, Text, TouchableOpacity, View } from 'react-native';

export default function EmergencyContactsScreen() {
  const { isAuthenticated } = useRequireAuth();
  const qc = useQueryClient();
  const router = useRouter();
  const { success, error: notifyError, warning } = useNotifications();
  const [toDelete, setToDelete] = useState<EmergencyContact | null>(null);
  const { mode } = useThemeStore();
  const palette = Colors[mode];

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['emergency-contacts'],
    queryFn: () => emergencyContactsAdapter.list(),
    enabled: isAuthenticated,
  });

  const activeCount = useMemo(() => (data || []).filter(c => c.isActive).length, [data]);

  const mToggle = useMutation({
    mutationFn: async (contact: EmergencyContact) => {
      const desired = !contact.isActive;
      // Bloqueia o 6º ativo
      if (desired && activeCount >= 5) {
        throw new Error('Você já possui 5 contatos ativos. Desative um para ativar outro.');
      }
      return emergencyContactsAdapter.update(contact.id, { isActive: desired });
    },
    onMutate: async (contact) => {
      await qc.cancelQueries({ queryKey: ['emergency-contacts'] });
      const prev = qc.getQueryData<EmergencyContact[]>(['emergency-contacts']);
      if (prev) {
        const desired = !contact.isActive;
        const next = prev.map(c => c.id === contact.id ? { ...c, isActive: desired } : c);
        qc.setQueryData(['emergency-contacts'], next);
      }
      return { prev };
    },
    onError: (err: any, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['emergency-contacts'], ctx.prev);
      warning(err?.message || 'Falha ao atualizar');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['emergency-contacts'] });
    }
  });

  const mDelete = useMutation({
    mutationFn: async (id: string) => emergencyContactsAdapter.remove(id),
    onSuccess: () => {
      success('Contato removido');
      qc.invalidateQueries({ queryKey: ['emergency-contacts'] });
    },
    onError: (e: any) => notifyError(e?.response?.data?.error?.message || 'Falha ao remover')
  });

  function renderItem({ item }: { item: EmergencyContact }) {
    return (
      <View style={{
        padding: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        backgroundColor: palette.surface,
      }}>
        <View style={{ flex: 1 }}>
          <Text style={{ ...Typography.bodySemiBold, color: palette.text }}>{item.name}</Text>
          <Text style={{ ...Typography.captionMedium, color: palette.textSecondary }}>{item.phone}</Text>
          {item.customMessage ? (
            <Text style={{ ...Typography.caption, color: palette.textSecondary }}>Msg: {item.customMessage}</Text>
          ) : (
            <Text style={{ ...Typography.caption, color: palette.textTertiary }}>Sem mensagem personalizada</Text>
          )}
        </View>
        <Switch
          value={item.isActive}
          onValueChange={() => mToggle.mutate(item)}
          trackColor={{ false: palette.textTertiary, true: palette.primary }}
          thumbColor={'#FFFFFF'}
        />
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Editar contato ${item.name}`}
          onPress={() => router.push({ pathname: '/emergency-contacts/edit', params: { id: item.id } } as any)}>
          <Text style={{ ...Typography.smallMedium, color: palette.primary }}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Remover contato ${item.name}`}
          onPress={() => setToDelete(item)}>
          <Text style={{ ...Typography.smallMedium, color: palette.error, fontWeight: '700' }}>Remover</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const newButton = (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Adicionar novo contato de emergência"
      onPress={() => router.push('/emergency-contacts/new' as any)}
    >
      <Text style={{ ...Typography.smallMedium, color: palette.primary, fontWeight: '700' }}>Novo</Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <ScreenHeader
        title="Contatos de Emergência"
        subtitle={`Ativos: ${activeCount}/5`}
        rightComponent={newButton}
      />
      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={palette.primary} />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          refreshing={isRefetching}
          onRefresh={refetch}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg, paddingTop: Spacing.lg }}
          ListEmptyComponent={
            <View style={{ paddingVertical: Spacing.lg }}>
              <Text style={{ ...Typography.caption, color: palette.textSecondary }}>
                Nenhum contato. Toque em &quot;Novo&quot; para adicionar até 5 contatos.
              </Text>
            </View>
          }
        />
      )}

      <ConfirmModal
        visible={!!toDelete}
        title="Remover contato?"
        message={`Deseja remover ${toDelete?.name}?`}
        confirmText="Remover"
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) mDelete.mutate(toDelete.id);
          setToDelete(null);
        }}
      />
    </View>
  );
}
