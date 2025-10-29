import { IntakeEvent } from '@/sdk-backend';
import {
    getDerivedIntakeStatus,
    getGraceDurationMinutes,
    INTAKE_GRACE_PERIOD_MS,
} from '@/src/lib/intakeStatus';

describe('getDerivedIntakeStatus', () => {
    const baseEvent = {
        id: 'evt',
        medicationReminderId: 'rem',
        medicationScheduleId: 'sch',
        scheduledAt: new Date().toISOString(),
        attempts: 0,
        reminder: undefined,
        schedule: null,
        takenAt: null,
    } as const;

    it('returns TAKEN when status is taken', () => {
        const event = {
            ...baseEvent,
            status: IntakeEvent.status.TAKEN,
        } as any;
        expect(getDerivedIntakeStatus(event, new Date())).toBe('TAKEN');
    });

    it('returns GRACE when pending and within graceEndsAt from payload', () => {
        const now = new Date();
        const scheduledAt = new Date(now.getTime() - 60_000).toISOString();
        const graceEndsAt = new Date(now.getTime() + 120_000).toISOString();
        const event = {
            ...baseEvent,
            status: IntakeEvent.status.PENDING,
            scheduledAt,
            graceEndsAt,
        } as any;
        expect(getDerivedIntakeStatus(event, now)).toBe('GRACE');
    });

    it('returns PENDING when pending and past graceEndsAt from payload', () => {
        const now = new Date();
        const scheduledAt = new Date(now.getTime() - 60_000).toISOString();
        const graceEndsAt = new Date(now.getTime() - 1_000).toISOString();
        const event = {
            ...baseEvent,
            status: IntakeEvent.status.PENDING,
            scheduledAt,
            graceEndsAt,
        } as any;
        expect(getDerivedIntakeStatus(event, now)).toBe('PENDING');
    });

    it('falls back to default grace window when field is absent', () => {
        const now = new Date();
        const scheduledAt = new Date(now.getTime() - INTAKE_GRACE_PERIOD_MS + 60_000).toISOString();
        const event = {
            ...baseEvent,
            status: IntakeEvent.status.PENDING,
            scheduledAt,
        } as any;
        expect(getDerivedIntakeStatus(event, now)).toBe('GRACE');
    });

    it('returns MISSED when status is missed', () => {
        const event = {
            ...baseEvent,
            status: IntakeEvent.status.MISSED,
        } as any;
        expect(getDerivedIntakeStatus(event, new Date())).toBe('MISSED');
    });

    it('computes grace duration in minutes', () => {
        const scheduledAtDate = new Date();
        const graceEndsAt = new Date(scheduledAtDate.getTime() + 8 * 60_000).toISOString();
        const event = {
            ...baseEvent,
            status: IntakeEvent.status.PENDING,
            scheduledAt: scheduledAtDate.toISOString(),
            graceEndsAt,
        } as any;
        expect(getGraceDurationMinutes(event)).toBe(8);
    });
});
