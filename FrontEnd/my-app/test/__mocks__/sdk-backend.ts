// Mock simplificado de DefaultService para testar caminho via SDK
export const DefaultService = {
    listReminders: jest.fn(async () => []),
    createReminder: jest.fn(async ({ requestBody }: any) => ({ id: 'r1', schedules: [], ...requestBody })),
    updateReminder: jest.fn(async ({ id, requestBody }: any) => ({ id, schedules: [], ...requestBody })),
    deleteReminder: jest.fn(async () => { }),
    addReminderSchedule: jest.fn(async ({ id, requestBody }: any) => ({ id, schedules: [{ id: 's1', ...requestBody }] })),
    updateSchedule: jest.fn(async ({ scheduleId, requestBody }: any) => ({ id: 'r1', schedules: [{ id: scheduleId, ...requestBody }] })),
    deleteSchedule: jest.fn(async () => { }),
};
