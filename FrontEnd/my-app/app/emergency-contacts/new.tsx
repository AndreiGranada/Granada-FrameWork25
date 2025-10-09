import EmergencyContactForm, { EmergencyContactFormValues } from '@/components/EmergencyContactForm';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { Colors, Spacing } from '@/constants/theme';
import { extractFieldErrors, friendlyTopMessage } from '@/src/lib/errors';
import { EmergencyContactCreate, emergencyContactsAdapter } from '@/src/services/adapters/emergencyContactsAdapter';
import { useNotifications, useThemeStore } from '@/src/store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

export default function NewEmergencyContact() {
  const qc = useQueryClient();
  const router = useRouter();
  const { success, error: notifyError, warning } = useNotifications();
  const { mode } = useThemeStore();
  const palette = Colors[mode];
  const { data } = useQuery({ queryKey: ['emergency-contacts'], queryFn: () => emergencyContactsAdapter.list() });
  const activeCount = (data || []).filter(c => c.isActive).length;

  const [serverErrors, setServerErrors] = React.useState<Record<string, string>>({});

  const mCreate = useMutation({
  mutationFn: (values: EmergencyContactFormValues) => {
      const payload: EmergencyContactCreate = {
        ...values,
        customMessage: values.customMessage ?? undefined,
      };
      return emergencyContactsAdapter.create(payload);
    },
    onSuccess: () => {
      success('Contato criado');
      qc.invalidateQueries({ queryKey: ['emergency-contacts'] });
      router.back();
    },
    onError: (e: any) => {
      const fields = extractFieldErrors(e);
      setServerErrors(fields);
      notifyError(friendlyTopMessage(e, 'Falha ao criar'));
    },
  });

  function handleSubmit(values: EmergencyContactFormValues) {
    if (values.isActive && activeCount >= 5) {
      warning('Você já possui 5 contatos ativos.');
      return;
    }
    mCreate.mutate(values);
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <ScreenHeader title="Novo contato" />
      <View style={{ flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg }}>
        <EmergencyContactForm
          onSubmit={handleSubmit}
          submitting={mCreate.isPending}
          maxActiveReached={activeCount >= 5}
          serverErrors={serverErrors as any}
        />
      </View>
    </View>
  );
}
