/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Evento de ingestão com dados do reminder embutidos para evitar round trips.
 */
export type IntakeEventExpanded = {
    id: string;
    medicationReminderId: string;
    medicationScheduleId?: string | null;
    scheduledAt: string;
    status: IntakeEventExpanded.status;
    attempts: number;
    takenAt?: string | null;
    /**
     * Data/hora limite da janela de tolerância (scheduledAt + configuração INTAKE_GRACE_PERIOD_MIN).
     */
    graceEndsAt?: string;
    reminder: {
        id: string;
        name: string;
        photoUrl?: string | null;
    };
    schedule?: {
        id: string;
        ingestionTimeMinutes: number;
    } | null;
};
export namespace IntakeEventExpanded {
    export enum status {
        PENDING = 'PENDING',
        TAKEN = 'TAKEN',
        MISSED = 'MISSED',
    }
}

