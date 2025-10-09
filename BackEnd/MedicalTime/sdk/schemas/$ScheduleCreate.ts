/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $ScheduleCreate = {
    properties: {
        ingestionTimeMinutes: {
            type: 'number',
            isRequired: true,
            maximum: 1439,
        },
        daysOfWeekBitmask: {
            type: 'number',
            description: `Ver descrição em Schedule (0=todos).`,
            maximum: 127,
        },
        isActive: {
            type: 'boolean',
        },
    },
} as const;
