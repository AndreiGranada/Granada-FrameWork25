/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $EmergencyContactCreate = {
    properties: {
        name: {
            type: 'string',
            isRequired: true,
        },
        phone: {
            type: 'string',
            isRequired: true,
        },
        customMessage: {
            type: 'string',
            description: `Mensagem personalizada opcional`,
        },
        isActive: {
            type: 'boolean',
            description: `Quando omitido assume true`,
        },
    },
} as const;
