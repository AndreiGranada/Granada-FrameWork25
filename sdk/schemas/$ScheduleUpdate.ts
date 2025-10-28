/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $ScheduleUpdate = {
    properties: {
        ingestionTimeMinutes: {
            type: 'number',
            maximum: 1439,
        },
        daysOfWeekBitmask: {
            type: 'number',
            maximum: 127,
        },
        isActive: {
            type: 'boolean',
        },
    },
} as const;
