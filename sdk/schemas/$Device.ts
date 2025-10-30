/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $Device = {
    properties: {
        id: {
            type: 'string',
            isRequired: true,
        },
        platform: {
            type: 'Enum',
            isRequired: true,
        },
        pushToken: {
            type: 'string',
            isRequired: true,
        },
        isActive: {
            type: 'boolean',
            isRequired: true,
        },
    },
} as const;
