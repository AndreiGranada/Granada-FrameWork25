/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $IntakeEventExpanded = {
    description: `Evento de ingestão com dados do reminder embutidos para evitar round trips.`,
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
        reminder: {
            properties: {
                id: {
                    type: 'string',
                    isRequired: true,
                },
                name: {
                    type: 'string',
                    isRequired: true,
                },
                photoUrl: {
                    type: 'string',
                    isNullable: true,
                },
            },
            isRequired: true,
        },
        schedule: {
            properties: {
                id: {
                    type: 'string',
                    isRequired: true,
                },
                ingestionTimeMinutes: {
                    type: 'number',
                    isRequired: true,
                },
            },
            isNullable: true,
        },
    },
} as const;
