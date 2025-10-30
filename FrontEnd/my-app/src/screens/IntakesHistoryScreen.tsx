import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Easing,
    FlatList,
    RefreshControl,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import ScreenHeader from '@/components/ui/ScreenHeader';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { IntakeEvent, type IntakeEventExpanded, type IntakeHistoryPage } from '@/sdk-backend';
import {
    getDerivedIntakeStatus,
    getGraceDurationMinutes,
    type DerivedIntakeStatus,
} from '@/src/lib/intakeStatus';
import { useRequireAuth } from '@/src/lib/useRequireAuth';
import { intakesAdapter } from '@/src/services/adapters/intakesAdapter';
import { useIntakesUiStore, useNotifications, useThemeStore } from '@/src/store';

type StatusAppearance = {
  label: string;
  bg: string;
  fg: string;
};

function getStatusAppearance(
  status: DerivedIntakeStatus,
  palette: typeof Colors.light,
): StatusAppearance {
  switch (status) {
    case 'TAKEN':
      return { label: 'Tomado', bg: `${palette.success}20`, fg: palette.success };
    case 'MISSED':
      return { label: 'Perdido', bg: `${palette.error}20`, fg: palette.error };
    case 'PENDING':
      return { label: 'Pendente', bg: `${palette.warning}20`, fg: palette.warning };
    case 'GRACE':
    default:
      return { label: 'No prazo', bg: `${palette.primary}20`, fg: palette.primary };
  }
}

function useIntakeHistory(limit = 30, days?: number) {
  return useInfiniteQuery({
    queryKey: ['intakeHistory', limit, days],
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const params: Record<string, string | number> = {};
      if (days) {
        params.days = String(days);
      } else {
        params.limit = limit;
        if (pageParam) params.cursor = pageParam;
      }

      const data = await intakesAdapter.history(params);
      if (Array.isArray(data)) {
        const page: IntakeHistoryPage = {
          data,
          pageInfo: { hasMore: false, nextCursor: null },
        };
        return page;
      }

      return data as IntakeHistoryPage;
    },
    getNextPageParam: (last: IntakeHistoryPage) =>
      last.pageInfo?.hasMore ? last.pageInfo.nextCursor ?? undefined : undefined,
    initialPageParam: undefined,
  });
}

function StatusPill({
  appearance,
}: {
  appearance: StatusAppearance;
}) {
  const s = appearance;
  return (
    <View
      style={{
        backgroundColor: s.bg,
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.sm,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: s.fg,
      }}
    >
      <Text style={{ ...Typography.smallMedium, color: s.fg }}>{s.label}</Text>
    </View>
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);

  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

export default function IntakesHistoryScreen() {
  useRequireAuth();

  const { success, error: notifyError } = useNotifications();
  const { mode } = useThemeStore();
  const palette = Colors[mode];
  const params = useLocalSearchParams<{ highlight?: string }>();
  const highlightParam = (params?.highlight as string) || undefined;
  const lastMarkedIntakeId = useIntakesUiStore((state) => state.lastMarkedIntakeId);
  const consumeLastMarkedIntakeId = useIntakesUiStore((state) => state.consumeLastMarkedIntakeId);
  const setLastMarkedIntakeId = useIntakesUiStore((state) => state.setLastMarkedIntakeId);
  const highlightId = highlightParam || lastMarkedIntakeId || undefined;

  const [selectedDays, setSelectedDays] = useState<number>(7);
  const [pagedMode, setPagedMode] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'TAKEN' | 'MISSED'>('ALL');
  const [now, setNow] = useState<Date>(() => new Date());

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
    error,
  } = useIntakeHistory(30, pagedMode ? undefined : selectedDays);

  const historyQueryKey = useMemo(
    () => ['intakeHistory', 30, pagedMode ? undefined : selectedDays] as const,
    [pagedMode, selectedDays],
  );
  const queryClient = useQueryClient();

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const listRef = useRef<FlatList<IntakeEventExpanded>>(null);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const pulse = useRef(new Animated.Value(0)).current;
  const [markingId, setMarkingId] = useState<string | null>(null);

  const markTakenMutation = useMutation({
    mutationFn: async (id: string) => intakesAdapter.markTaken(id),
    onMutate: async (id: string) => {
      setMarkingId(id);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<InfiniteData<IntakeHistoryPage> | undefined>(historyQueryKey, (current) => {
        if (!current) return current;
        return {
          ...current,
          pages: current.pages.map((page) => ({
            ...page,
            data: page.data.map((item) =>
              item.id === updated.id
                ? {
                    ...item,
                    status: updated.status as IntakeEvent.status,
                    takenAt: updated.takenAt ?? new Date().toISOString(),
                  }
                : item,
            ),
          })),
        };
      });
      queryClient.setQueriesData<IntakeEventExpanded[]>({ queryKey: ['intakesToday'] }, (current) =>
        current?.map((item) =>
          item.id === updated.id
            ? {
                ...item,
                status: updated.status as IntakeEvent.status,
                takenAt: updated.takenAt ?? new Date().toISOString(),
              }
            : item,
        ) ?? current,
      );
      setLastMarkedIntakeId(updated.id);
      queryClient.invalidateQueries({ queryKey: ['intakesToday'] });
      queryClient.invalidateQueries({ queryKey: ['intakeHistory'] });
      success('Ingestão marcada como tomada');
    },
    onError: (err: any) => {
      notifyError(err?.response?.data?.error?.message || 'Não foi possível marcar como tomado');
    },
    onSettled: () => {
      setMarkingId(null);
    },
  });

  const flatData: IntakeEventExpanded[] = useMemo(() => {
    return (
      (data as InfiniteData<IntakeHistoryPage> | undefined)?.pages.flatMap((page: IntakeHistoryPage) => page.data) ?? []
    );
  }, [data]);

  const filteredData = useMemo(() => {
    if (statusFilter === 'ALL') return flatData;
    if (statusFilter === 'PENDING') {
      return flatData.filter((it) => getDerivedIntakeStatus(it, now) === 'PENDING');
    }
    return flatData.filter((it) => it.status === statusFilter);
  }, [flatData, statusFilter, now]);

  useEffect(() => {
    if (!highlightId || filteredData.length === 0) return;

    const index = filteredData.findIndex((item) => item.id === highlightId);
    if (index < 0) return;

    let animation: Animated.CompositeAnimation | null = null;
    const timeout = setTimeout(() => {
      try {
        listRef.current?.scrollToIndex({ index, animated: true });
      } catch {
        const approximateHeight = 96;
        listRef.current?.scrollToOffset({ offset: index * approximateHeight, animated: true });
      }

      setHighlighted(highlightId);
      pulse.setValue(0);
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: false,
          }),
          Animated.timing(pulse, {
            toValue: 0,
            duration: 600,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: false,
          }),
        ]),
        { iterations: 2 },
      );
      animation.start(() => setHighlighted(null));
      if (!highlightParam && lastMarkedIntakeId && lastMarkedIntakeId === highlightId) {
        consumeLastMarkedIntakeId();
      }
    }, 60);

    return () => {
      clearTimeout(timeout);
      animation?.stop();
    };
  }, [highlightId, filteredData, pulse, highlightParam, lastMarkedIntakeId, consumeLastMarkedIntakeId]);

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage().catch(() => notifyError('Falha ao carregar mais itens'));
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, notifyError]);

  const onRefresh = useCallback(() => {
    refetch()
      .then((result) => {
        if (result?.data) success('Histórico atualizado');
      })
      .catch(() => notifyError('Falha ao atualizar histórico'));
  }, [refetch, success, notifyError]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.background }}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  const statusSubtitle =
    statusFilter === 'ALL'
      ? 'Todos os status'
      : statusFilter === 'PENDING'
        ? 'Pendentes'
        : statusFilter === 'TAKEN'
          ? 'Tomados'
          : 'Perdidos';
  const periodSubtitle = pagedMode ? 'Modo paginado (30 itens por página)' : `Últimos ${selectedDays} dias`;
  const headerSubtitle = `${periodSubtitle} • ${statusSubtitle}`;

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <ScreenHeader title="Histórico de ingestões" subtitle={headerSubtitle} />

      <View style={{ flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.lg }}>
        <View style={{ marginBottom: Spacing.md, gap: Spacing.sm }}>
          <Text style={{ ...Typography.captionMedium, fontWeight: '600', color: palette.text }}>Período</Text>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            {[7, 30, 90].map((days) => (
              <TouchableOpacity
                key={days}
                onPress={() => {
                  setSelectedDays(days);
                  setPagedMode(false);
                }}
                style={{
                  paddingVertical: Spacing.xs + 2,
                  paddingHorizontal: Spacing.sm + 2,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: palette.border,
                  backgroundColor: !pagedMode && selectedDays === days ? palette.primary : 'transparent',
                }}
              >
                <Text style={{ color: !pagedMode && selectedDays === days ? '#FFFFFF' : palette.text, fontWeight: '600' }}>
                  {days}d
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              onPress={() => setPagedMode((value) => !value)}
              style={{
                paddingVertical: Spacing.xs + 2,
                paddingHorizontal: Spacing.sm + 2,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: palette.border,
                backgroundColor: pagedMode ? palette.primary : 'transparent',
              }}
            >
              <Text style={{ color: pagedMode ? '#FFFFFF' : palette.text, fontWeight: '600' }}>Paginado</Text>
            </TouchableOpacity>
          </View>

          <Text style={{ ...Typography.captionMedium, fontWeight: '600', marginTop: Spacing.sm, color: palette.text }}>Status</Text>
          <View style={{ flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' }}>
            {(['ALL', 'PENDING', 'TAKEN', 'MISSED'] as const).map((status) => (
              <TouchableOpacity
                key={status}
                onPress={() => setStatusFilter(status)}
                style={{
                  paddingVertical: Spacing.xs + 2,
                  paddingHorizontal: Spacing.sm + 2,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: statusFilter === status ? palette.primary : palette.border,
                  backgroundColor: statusFilter === status ? palette.primary : 'transparent',
                }}
              >
                <Text style={{ color: statusFilter === status ? '#FFFFFF' : palette.text, fontWeight: '600' }}>
                  {status === 'ALL'
                    ? 'Todos'
                    : status === 'PENDING'
                      ? 'Pendentes'
                      : status === 'TAKEN'
                        ? 'Tomados'
                        : 'Perdidos'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {error ? (
          <View
            style={{
              padding: Spacing.md,
              backgroundColor: `${palette.error}20`,
              borderRadius: BorderRadius.md,
              marginBottom: Spacing.md,
              borderWidth: 1,
              borderColor: palette.error,
            }}
          >
            <Text style={{ ...Typography.caption, color: palette.error }}>
              Erro ao carregar histórico. Toque para tentar novamente.
            </Text>
            <TouchableOpacity onPress={() => refetch()}>
              <Text style={{ ...Typography.smallMedium, color: palette.error, marginTop: Spacing.xs }}>Recarregar</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <FlatList
          ref={listRef}
          data={filteredData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const derivedStatus = getDerivedIntakeStatus(item, now);
            const graceMinutes = getGraceDurationMinutes(item);
            return (
              <View
                style={{
                  padding: Spacing.md,
                  borderWidth: 1,
                  borderColor: highlighted === item.id ? palette.primary : palette.border,
                  borderRadius: BorderRadius.md,
                  marginBottom: Spacing.md,
                  backgroundColor: highlighted === item.id ? palette.surfaceElevated : palette.surface,
                  position: 'relative',
                }}
              >
                {highlighted === item.id && (
                  <Animated.View
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      backgroundColor: palette.primary,
                      transform: [
                        {
                          scale: pulse.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.7, 1.15],
                          }),
                        },
                      ],
                      opacity: pulse.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.4, 1],
                      }),
                    }}
                  />
                )}

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ ...Typography.bodySemiBold, color: palette.text }}>
                    {item.reminder?.name || 'Lembrete'}
                  </Text>
                  <StatusPill appearance={getStatusAppearance(derivedStatus, palette)} />
                </View>

                <Text style={{ ...Typography.captionMedium, color: palette.textSecondary, marginTop: Spacing.xs }}>
                  {formatTime(item.scheduledAt)}
                </Text>
                {item.takenAt ? (
                  <Text style={{ ...Typography.caption, color: palette.textSecondary }}>
                    Tomado em: {formatTime(item.takenAt)}
                  </Text>
                ) : null}
                {derivedStatus === 'GRACE' ? (
                  <Text style={{ ...Typography.small, color: palette.textSecondary, marginTop: Spacing.xs }}>
                    Dentro dos {graceMinutes} minutos de tolerância. Você ainda pode marcar como tomado sem atraso.
                  </Text>
                ) : null}
                {item.status === IntakeEvent.status.PENDING ? (
                  <TouchableOpacity
                    onPress={() => markTakenMutation.mutate(item.id)}
                    disabled={markingId === item.id && markTakenMutation.isPending}
                    style={{
                      alignSelf: 'flex-start',
                      paddingVertical: Spacing.sm,
                      paddingHorizontal: Spacing.md,
                      borderRadius: BorderRadius.sm,
                      backgroundColor: palette.primary,
                      marginTop: Spacing.md,
                      opacity: markingId === item.id && markTakenMutation.isPending ? 0.6 : 1,
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Marcar ingestão de ${item.reminder?.name || 'medicação'} como tomada`}
                  >
                    {markingId === item.id && markTakenMutation.isPending ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={{ ...Typography.smallMedium, color: '#FFFFFF' }}>Marcar como tomado</Text>
                    )}
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          }}
          contentContainerStyle={{ paddingBottom: Spacing.xl }}
          onEndReachedThreshold={0.5}
          onEndReached={onEndReached}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={{ padding: Spacing.md }}>
                <ActivityIndicator color={palette.primary} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <Text style={{ ...Typography.caption, color: palette.textSecondary }}>Nenhum histórico ainda.</Text>
          }
        />
      </View>
    </View>
  );
}
