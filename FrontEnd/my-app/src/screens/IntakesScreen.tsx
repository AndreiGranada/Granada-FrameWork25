import ScreenHeader from '@/components/ui/ScreenHeader';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import type { IntakeEventExpanded } from '@/sdk-backend';
import { IntakeEvent } from '@/sdk-backend';
import { getDerivedIntakeStatus, getGraceDurationMinutes } from '@/src/lib/intakeStatus';
import { useRequireAuth } from '@/src/lib/useRequireAuth';
import { intakesAdapter } from '@/src/services/adapters/intakesAdapter';
import { useIntakesUiStore, useNotifications, useThemeStore } from '@/src/store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';

function getTodayRange(now: Date) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return {
    start,
    end,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    label: start.toLocaleDateString(undefined, {
      weekday: 'long',
      day: '2-digit',
      month: 'short',
    }),
  };
}

function IntakeRow({
  item,
  onTaken,
  palette,
  now,
  isMarking,
}: {
  item: IntakeEventExpanded;
  onTaken: (id: string) => void;
  palette: typeof Colors.light;
  now: Date;
  isMarking: boolean;
}) {
  const scheduled = new Date(item.scheduledAt);
  const hh = String(scheduled.getHours()).padStart(2, '0');
  const mm = String(scheduled.getMinutes()).padStart(2, '0');
  const derivedStatus = getDerivedIntakeStatus(item, now);
  const statusMap = useMemo(
    () => ({
      GRACE: { label: 'No prazo', color: palette.primary },
      PENDING: { label: 'Pendente', color: palette.warning },
      TAKEN: { label: 'Tomado', color: palette.success },
      MISSED: { label: 'Perdido', color: palette.error },
    }),
    [palette],
  );
  const statusInfo = statusMap[derivedStatus];
  const graceMinutes = useMemo(() => getGraceDurationMinutes(item), [item]);
  return (
    <View style={{
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: BorderRadius.md,
      marginBottom: Spacing.md,
      gap: Spacing.xs,
      backgroundColor: palette.surface,
    }}>
      <Text style={{ ...Typography.bodySemiBold, color: palette.text }}>{item.reminder?.name || '—'}</Text>
      <Text style={{ ...Typography.captionMedium, color: palette.textSecondary }}>
        {hh}:{mm} · <Text style={{ color: statusInfo.color }}>{statusInfo.label}</Text>
      </Text>
      {derivedStatus === 'GRACE' ? (
        <Text style={{ ...Typography.small, color: palette.textSecondary, marginTop: Spacing.xs }}>
          Dentro dos {graceMinutes} minutos de tolerância. Você ainda pode marcar como tomado sem atraso.
        </Text>
      ) : null}
      {item.status === 'PENDING' && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Marcar ingestão de ${item.reminder?.name || 'medicação'} como tomada`}
          onPress={() => onTaken(item.id)}
          disabled={isMarking}
          style={{
            alignSelf: 'flex-start',
            paddingVertical: Spacing.sm,
            paddingHorizontal: Spacing.md,
            borderRadius: BorderRadius.sm,
            backgroundColor: palette.primary,
            opacity: isMarking ? 0.6 : 1,
          }}
        >
          {isMarking ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={{ ...Typography.smallMedium, color: '#FFFFFF' }}>Marcar como tomado</Text>
          )}
        </Pressable>
      )}
    </View>
  );
}

export default function IntakesScreen() {
  useRequireAuth();
  const [now, setNow] = useState<Date>(() => new Date());
  const { success, error: notifyError } = useNotifications();
  const { mode } = useThemeStore();
  const palette = Colors[mode];
  const queryClient = useQueryClient();
  const setLastMarkedIntakeId = useIntakesUiStore((state) => state.setLastMarkedIntakeId);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const todayRange = useMemo(() => getTodayRange(now), [now]);
  const {
    data: upcoming = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['intakesToday', todayRange.startIso, todayRange.endIso],
    queryFn: async () => {
      try {
        return await intakesAdapter.list({ from: todayRange.startIso, to: todayRange.endIso });
      } catch (e: any) {
        notifyError(e?.response?.data?.error?.message || 'Falha ao carregar ingestões');
        throw e;
      }
    },
    staleTime: 30_000,
  });

  const todaysIntakes = useMemo(() => {
    const startMs = todayRange.start.getTime();
    const endMs = todayRange.end.getTime();
    return upcoming.filter((item) => {
      const scheduledMs = new Date(item.scheduledAt).getTime();
      return scheduledMs >= startMs && scheduledMs < endMs;
    });
  }, [upcoming, todayRange]);

  const markTakenMutation = useMutation({
    mutationFn: (id: string) => intakesAdapter.markTaken(id),
    onMutate: (id: string) => {
      setMarkingId(id);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<IntakeEventExpanded[] | undefined>(
        ['intakesToday', todayRange.startIso, todayRange.endIso],
        (current) =>
          current?.map((ev) =>
            ev.id === updated.id
              ? {
                  ...ev,
                  status: (updated.status ?? IntakeEvent.status.TAKEN) as IntakeEvent.status,
                  takenAt: updated.takenAt ?? new Date().toISOString(),
                }
              : ev,
          ) ?? current,
      );
      setLastMarkedIntakeId(updated.id);
      queryClient.invalidateQueries({ queryKey: ['intakesToday'] });
      queryClient.invalidateQueries({ queryKey: ['intakeHistory'] });
      success('Ingestão marcada como tomada');
    },
    onError: (e: any) => {
      notifyError(e?.response?.data?.error?.message || 'Não foi possível marcar como tomado');
    },
    onSettled: () => {
      setMarkingId(null);
    },
  });

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const onTaken = useCallback(
    (id: string) => {
      markTakenMutation.mutate(id);
    },
    [markTakenMutation],
  );

  const onRefresh = useCallback(() => {
    refetch().catch(() => notifyError('Falha ao carregar ingestões'));
  }, [refetch, notifyError]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.background }}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
  <ScreenHeader title="Ingestões" subtitle={`Hoje • ${todayRange.label}`} />
      <View style={{ flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.lg }}>
        <FlatList
          data={todaysIntakes}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <IntakeRow
              item={item}
              onTaken={onTaken}
              palette={palette}
              now={now}
              isMarking={markingId === item.id && markTakenMutation.isPending}
            />
          )}
          ListEmptyComponent={
            <Text style={{ ...Typography.caption, color: palette.textSecondary }}>Nenhuma ingestão agendada para hoje.</Text>
          }
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />}
        />
      </View>
    </View>
  );
}
