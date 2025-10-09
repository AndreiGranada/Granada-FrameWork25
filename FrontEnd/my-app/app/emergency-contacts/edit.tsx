import EmergencyContactForm, { EmergencyContactFormValues } from '@/components/EmergencyContactForm';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { Colors, Spacing } from '@/constants/theme';
import { extractFieldErrors, friendlyTopMessage } from '@/src/lib/errors';
import { emergencyContactsAdapter, type EmergencyContact } from '@/src/services/adapters/emergencyContactsAdapter';
import { useNotifications, useThemeStore } from '@/src/store';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { View } from 'react-native';

export default function EditEmergencyContact() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();
  const { success, error: notifyError, warning } = useNotifications();
  const router = useRouter();
  const { mode } = useThemeStore();
  const palette = Colors[mode];

  const contacts = qc.getQueryData<EmergencyContact[]>(['emergency-contacts']);
  const contact = useMemo(() => contacts?.find(c => c.id === id), [contacts, id]);
  const activeCount = useMemo(() => (contacts || []).filter(c => c.isActive).length, [contacts]);

  const [serverErrors, setServerErrors] = React.useState<Record<string, string>>({});

  const mUpdate = useMutation({
  mutationFn: async (values: EmergencyContactFormValues) => emergencyContactsAdapter.update(id, values),
    onSuccess: () => {
      success('Contato atualizado');
      qc.invalidateQueries({ queryKey: ['emergency-contacts'] });
      router.back();
    },
    onError: (e: any) => {
      const fields = extractFieldErrors(e);
      setServerErrors(fields);
      notifyError(friendlyTopMessage(e, 'Falha ao atualizar'));
    },
  });

  function handleSubmit(values: EmergencyContactFormValues) {
    if (values.isActive && !contact?.isActive && activeCount >= 5) {
      warning('Você já possui 5 contatos ativos.');
      return;
    }
    mUpdate.mutate(values);
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <ScreenHeader title="Editar contato" />
      <View style={{ flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg }}>
        <EmergencyContactForm
          initial={contact}
          onSubmit={handleSubmit}
          submitting={mUpdate.isPending}
          maxActiveReached={activeCount >= 5}
          serverErrors={serverErrors as any}
        />
      </View>
    </View>
  );
}
