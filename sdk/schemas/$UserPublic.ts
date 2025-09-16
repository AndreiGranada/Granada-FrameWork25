/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $UserPublic = {
    properties: {
        id: {
            type: 'string',
            isRequired: true,
        },
        email: {
            type: 'string',
            isRequired: true,
            format: 'email',
        },
        name: {
            type: 'string',
            isNullable: true,
        },
        timezone: {
            type: 'string',
            isRequired: true,
        },
    },
} as const;
