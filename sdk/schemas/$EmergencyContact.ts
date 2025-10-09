/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $EmergencyContact = {
    properties: {
        id: {
            type: 'string',
            isRequired: true,
        },
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
            description: `Mensagem personalizada para este contato (fallback mensagem global /sos)`,
            isNullable: true,
        },
        isActive: {
            type: 'boolean',
            isRequired: true,
        },
    },
} as const;
