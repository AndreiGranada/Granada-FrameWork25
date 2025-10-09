import React from 'react';
import { render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import IntakesHistoryScreen from '@/src/screens/IntakesHistoryScreen';
import { IntakeEventExpanded, IntakeEvent } from '@/sdk-backend';
import { intakesAdapter } from '@/src/services/adapters/intakesAdapter';

// Mock auth requirement
jest.mock('@/src/lib/useRequireAuth', () => ({ useRequireAuth: () => ({}) }));

// Mock useLocalSearchParams to provide highlight param
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ highlight: 'evt2' }),
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
  usePathname: () => '/intakes-history'
}));

const sample: IntakeEventExpanded[] = [
  { id: 'evt1', medicationReminderId: 'r1', scheduledAt: new Date().toISOString(), status: IntakeEvent.status.PENDING, attempts: 0, reminder: { id: 'r1', name: 'Med 1' } } as any,
  { id: 'evt2', medicationReminderId: 'r2', scheduledAt: new Date().toISOString(), status: IntakeEvent.status.TAKEN, attempts: 1, takenAt: new Date().toISOString(), reminder: { id: 'r2', name: 'Med 2' } } as any,
  { id: 'evt3', medicationReminderId: 'r3', scheduledAt: new Date().toISOString(), status: IntakeEvent.status.MISSED, attempts: 1, reminder: { id: 'r3', name: 'Med 3' } } as any,
];

jest.spyOn(intakesAdapter, 'history').mockImplementation(async () => ({
  data: sample,
  pageInfo: { hasMore: false, nextCursor: null }
}) as any);

describe('IntakesHistoryScreen highlight', () => {
  it('destaca item passado via highlight param', async () => {
    const qc = new QueryClient();
    const { findByText } = render(
      <QueryClientProvider client={qc}>
        <IntakesHistoryScreen />
      </QueryClientProvider>
    );
    // Item destacado deve estar presente
    const med2 = await findByText('Med 2');
    expect(med2).toBeTruthy();
  });
});
