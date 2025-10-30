/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $AuthSession = {
    description: `Sessão de autenticação retornada em login/register/refresh.`,
    properties: {
        user: {
            type: 'UserPublic',
            isRequired: true,
        },
        token: {
            type: 'string',
            description: `JWT de acesso (curta duração)`,
            isRequired: true,
        },
        refreshToken: {
            type: 'string',
            description: `Token opaco de refresh (rotacionado em cada uso)`,
            isRequired: true,
        },
        refreshExpiresAt: {
            type: 'string',
            description: `Data de expiração absoluta do refresh token corrente`,
            isRequired: true,
            format: 'date-time',
        },
    },
} as const;
