import React from 'react';
import { render, waitFor, fireEvent, act } from '@testing-library/react-native';
import ReminderDetailScreen from '@/app/reminders/[id]';
import { useRemindersStore } from '@/src/store/remindersStore';
import { createInMemoryAnalyticsSink, setAnalyticsProvider } from '@/src/observability/analytics';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'r1' }),
  useRouter: () => ({ back: jest.fn() })
}));

jest.mock('@/src/store', () => {
  const real = jest.requireActual('@/src/store');
  return {
    ...real,
    useThemeStore: () => ({ mode: 'dark' }),
    useNotifications: () => ({ success: jest.fn(), error: jest.fn() })
  };
});

// Mock adapter via store injection pattern
jest.mock('@/src/services/adapters/remindersAdapter', () => ({
  remindersAdapter: {
    list: jest.fn(async () => [{ id: 'r1', name: 'Vit D', isActive: true, schedules: [] }]),
    addSchedule: jest.fn(async () => ({ id: 'r1', name: 'Vit D', isActive: true, schedules: [{ id: 's1', ingestionTimeMinutes: 480, daysOfWeekBitmask: 0, isActive: true }] })),
    updateSchedule: jest.fn(async () => ({ id: 'r1', name: 'Vit D', isActive: true, schedules: [{ id: 's1', ingestionTimeMinutes: 480, daysOfWeekBitmask: 0, isActive: true }] })),
    deleteSchedule: jest.fn(async () => ({})),
  }
}));

describe('ReminderDetailScreen analytics', () => {
  beforeEach(async () => {
    const sink = createInMemoryAnalyticsSink();
    setAnalyticsProvider(sink.provider);
    useRemindersStore.setState({
      reminders: [{ id: 'r1', name: 'Vit D', isActive: true, schedules: [] }],
      isLoading: false,
      error: null
    } as any);
  });

  it('dispara screen_view e adiciona horário', async () => {
    const { getByText } = render(<ReminderDetailScreen />);

    await waitFor(() => getByText('Vit D'));
    // Botão quando não há horários
    const addFirst = getByText('Adicionar Primeiro Horário');
    await act(async () => { fireEvent.press(addFirst); });

    await waitFor(() => getByText('08:00', { exact: false }));
  });
});
