// Tipos compartilhados conforme OpenAPI do backend (simplificados onde possível)

export type UserPublic = {
    id: string;
    email: string;
    name?: string | null;
    timezone: string;
};

export type Schedule = {
    id: string;
    ingestionTimeMinutes: number;
    daysOfWeekBitmask: number; // 0=todos, soma de bits 1..64
    isActive: boolean;
};

export type ScheduleCreate = {
    ingestionTimeMinutes: number;
    daysOfWeekBitmask?: number;
    isActive?: boolean;
};

export type ScheduleUpdate = Partial<
    Pick<Schedule, 'ingestionTimeMinutes' | 'daysOfWeekBitmask' | 'isActive'>
>;

export type Reminder = {
    id: string;
    name: string;
    purpose?: string | null;
    description?: string | null;
    pricePaid?: string | null; // decimal string
    photoUrl?: string | null;
    isActive: boolean;
    schedules: Schedule[];
};

export type ReminderCreate = {
    name: string;
    purpose?: string;
    description?: string;
    pricePaid?: string; // decimal string
    photoUrl?: string;
    schedules: ScheduleCreate[];
};

export type ReminderUpdate = Partial<
    Pick<Reminder, 'name' | 'purpose' | 'description' | 'pricePaid' | 'photoUrl' | 'isActive'>
>;

export type IntakeEvent = {
    id: string;
    medicationReminderId: string;
    medicationScheduleId?: string | null;
    scheduledAt: string; // ISO
    status: 'PENDING' | 'TAKEN' | 'MISSED';
    attempts: number;
    takenAt?: string | null;
};

export type IntakeEventExpanded = IntakeEvent & {
    reminder: { id: string; name: string; photoUrl?: string | null };
    schedule?: { id: string; ingestionTimeMinutes: number } | null;
};

export type IntakeHistoryPage = {
    data: IntakeEventExpanded[];
    pageInfo: { hasMore: boolean; nextCursor: string | null };
};

// Devices (conforme OpenAPI)
export type Device = {
    id: string;
    platform: 'ANDROID' | 'IOS';
    pushToken: string;
    isActive: boolean;
};

export type DeviceCreate = {
    platform: 'ANDROID' | 'IOS';
    pushToken: string;
};

export type DeviceUpdate = {
    isActive?: boolean;
    pushToken?: string;
};
