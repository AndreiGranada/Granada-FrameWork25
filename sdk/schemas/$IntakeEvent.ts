/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $IntakeEvent = {
    properties: {
        id: {
            type: 'string',
            isRequired: true,
        },
        medicationReminderId: {
            type: 'string',
            isRequired: true,
        },
        medicationScheduleId: {
            type: 'string',
            isNullable: true,
        },
        scheduledAt: {
            type: 'string',
            isRequired: true,
            format: 'date-time',
        },
        status: {
            type: 'Enum',
            isRequired: true,
        },
        attempts: {
            type: 'number',
            isRequired: true,
        },
        takenAt: {
            type: 'string',
            isNullable: true,
            format: 'date-time',
        },
    },
} as const;
