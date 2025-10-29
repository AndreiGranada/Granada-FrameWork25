/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $ReminderCreate = {
    properties: {
        name: {
            type: 'string',
            isRequired: true,
        },
        purpose: {
            type: 'string',
        },
        description: {
            type: 'string',
        },
        pricePaid: {
            type: 'string',
            description: `Decimal como string`,
        },
        photoUrl: {
            type: 'string',
            format: 'uri',
        },
        schedules: {
            type: 'array',
            contains: {
                type: 'ScheduleCreate',
            },
            isRequired: true,
        },
    },
} as const;
