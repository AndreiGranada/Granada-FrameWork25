/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type IntakeEvent = {
    id: string;
    medicationReminderId: string;
    medicationScheduleId?: string | null;
    scheduledAt: string;
    status: IntakeEvent.status;
    attempts: number;
    takenAt?: string | null;
    /**
     * Data/hora limite da janela de tolerância (scheduledAt + configuração INTAKE_GRACE_PERIOD_MIN).
     */
    graceEndsAt?: string;
};
export namespace IntakeEvent {
    export enum status {
        PENDING = 'PENDING',
        TAKEN = 'TAKEN',
        MISSED = 'MISSED',
    }
}

