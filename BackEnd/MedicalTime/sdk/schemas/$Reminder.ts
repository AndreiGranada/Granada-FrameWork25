/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $Reminder = {
    properties: {
        id: {
            type: 'string',
            isRequired: true,
        },
        name: {
            type: 'string',
            isRequired: true,
        },
        purpose: {
            type: 'string',
            isNullable: true,
        },
        description: {
            type: 'string',
            isNullable: true,
        },
        pricePaid: {
            type: 'string',
            description: `Decimal como string`,
            isNullable: true,
        },
        photoUrl: {
            type: 'string',
            isNullable: true,
        },
        isActive: {
            type: 'boolean',
            isRequired: true,
        },
        schedules: {
            type: 'array',
            contains: {
                type: 'Schedule',
            },
        },
    },
} as const;
