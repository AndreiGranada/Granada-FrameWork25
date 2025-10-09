/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $IntakeHistoryPage = {
    description: `Página de histórico de intakes (modo paginado experimental). Retornada somente quando \`limit\` é fornecido.`,
    properties: {
        data: {
            type: 'array',
            contains: {
                type: 'IntakeEventExpanded',
            },
            isRequired: true,
        },
        pageInfo: {
            properties: {
                hasMore: {
                    type: 'boolean',
                    isRequired: true,
                },
                nextCursor: {
                    type: 'string',
                    description: `Cursor para próxima página (usar como \`cursor\` na próxima chamada). Null/ausente se não houver mais páginas.`,
                    isRequired: true,
                    isNullable: true,
                    format: 'date-time',
                },
            },
            isRequired: true,
        },
    },
} as const;
