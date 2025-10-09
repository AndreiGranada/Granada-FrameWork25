import { IntakeEvent, type IntakeEventExpanded } from '@/sdk-backend';

export type DerivedIntakeStatus = 'GRACE' | 'PENDING' | 'TAKEN' | 'MISSED';

export const INTAKE_GRACE_PERIOD_MINUTES = 15;
export const INTAKE_GRACE_PERIOD_MS = INTAKE_GRACE_PERIOD_MINUTES * 60 * 1000;

export function getDerivedIntakeStatus(event: IntakeEventExpanded, now: Date): DerivedIntakeStatus {
    if (event.status === IntakeEvent.status.TAKEN) return 'TAKEN';
    if (event.status === IntakeEvent.status.MISSED) return 'MISSED';

    const scheduledAt = new Date(event.scheduledAt);
    const graceEndsAt = getGraceEndsAt(event, scheduledAt);
    if (event.status === IntakeEvent.status.PENDING) {
        if (now.getTime() >= graceEndsAt.getTime()) return 'PENDING';
        return 'GRACE';
    }

    return 'PENDING';
}

export function isWithinGracePeriod(event: IntakeEventExpanded, now: Date): boolean {
    return getDerivedIntakeStatus(event, now) === 'GRACE';
}

export function getGraceEndsAt(event: IntakeEventExpanded, scheduledAtDate?: Date): Date {
    const scheduledAt = scheduledAtDate ?? new Date(event.scheduledAt);
    const { graceEndsAt } = event;
    if (graceEndsAt) {
        return new Date(graceEndsAt);
    }
    return new Date(scheduledAt.getTime() + INTAKE_GRACE_PERIOD_MS);
}

export function getGraceDurationMinutes(event: IntakeEventExpanded): number {
    const scheduledAt = new Date(event.scheduledAt);
    const graceEndsAt = getGraceEndsAt(event, scheduledAt);
    const diffMs = graceEndsAt.getTime() - scheduledAt.getTime();
    return Math.max(0, Math.round(diffMs / 60000));
}
