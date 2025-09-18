/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { IntakeEventExpanded } from './IntakeEventExpanded';
/**
 * Página de histórico de intakes (modo paginado experimental). Retornada somente quando `limit` é fornecido.
 */
export type IntakeHistoryPage = {
    data: Array<IntakeEventExpanded>;
    pageInfo: {
        hasMore: boolean;
        /**
         * Cursor para próxima página (usar como `cursor` na próxima chamada). Null/ausente se não houver mais páginas.
         */
        nextCursor: string | null;
    };
};

