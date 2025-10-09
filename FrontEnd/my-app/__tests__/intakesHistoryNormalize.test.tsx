/// <reference types="jest" />
import React from 'react';
import { QueryClient, QueryClientProvider, useInfiniteQuery } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import { IntakeEventExpanded, IntakeHistoryPage, IntakeEvent } from '@/sdk-backend';
import { intakesAdapter } from '@/src/services/adapters/intakesAdapter';

// Hook replicando a lógica de normalização usada na tela, isolado para teste
function useHistoryNormalized(params: { limit?: number; days?: number; cursor?: string }) {
  const { limit, days, cursor } = params;
  const result = useInfiniteQuery({
    queryKey: ['intakeHistory', limit, days],
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const apiParams: any = {};
      if (limit) apiParams.limit = limit;
      if (days) apiParams.days = String(days);
      if (pageParam) apiParams.cursor = pageParam;
  const data = await intakesAdapter.history(apiParams);
      if (Array.isArray(data)) {
        const page: IntakeHistoryPage = { data, pageInfo: { hasMore: false, nextCursor: null } };
        return page;
      }
      return data as IntakeHistoryPage;
    },
    getNextPageParam: (last: IntakeHistoryPage) => (last.pageInfo.hasMore ? last.pageInfo.nextCursor ?? undefined : undefined),
    initialPageParam: cursor,
  });
  return result;
}

jest.mock('@/src/services/adapters/intakesAdapter');
const mocked = intakesAdapter as jest.Mocked<typeof intakesAdapter>;

const sampleEvent = (id: number): IntakeEventExpanded => ({
  id: `intk_${id}`,
  medicationReminderId: 'rem_1',
  medicationScheduleId: 'sch_1',
  scheduledAt: new Date().toISOString(),
  status: IntakeEvent.status.PENDING,
  attempts: 0,
  reminder: { id: 'rem_1', name: 'Vit D', photoUrl: null },
  schedule: { id: 'sch_1', ingestionTimeMinutes: 480 },
});

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient();
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('Intake history normalization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('normaliza modo legado (array) para página única', async () => {
    mocked.history.mockResolvedValueOnce([sampleEvent(1), sampleEvent(2)] as any);

    const { result } = renderHook(() => useHistoryNormalized({ days: 7 }), { wrapper });

    await waitFor(() => {
      const pages = (result.current.data as any)?.pages;
      expect(pages?.[0]?.data?.length).toBe(2);
      expect(pages?.[0]?.pageInfo?.hasMore).toBe(false);
    });
  });

  it('mantém modo paginado quando backend já retorna envelope', async () => {
    const page: IntakeHistoryPage = {
      data: [sampleEvent(3)],
      pageInfo: { hasMore: true, nextCursor: '2025-09-16T10:00:00.000Z' },
    };
    mocked.history.mockResolvedValueOnce(page as any);

    const { result } = renderHook(() => useHistoryNormalized({ limit: 30 }), { wrapper });

    await waitFor(() => {
      const pages = (result.current.data as any)?.pages;
      expect(pages?.[0]?.data?.length).toBe(1);
      expect(pages?.[0]?.pageInfo?.hasMore).toBe(true);
      expect(result.current.hasNextPage).toBe(true);
    });
  });
});
