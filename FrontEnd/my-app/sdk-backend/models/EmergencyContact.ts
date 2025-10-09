/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type EmergencyContact = {
    id: string;
    name: string;
    phone: string;
    /**
     * Mensagem personalizada para este contato (fallback mensagem global /sos)
     */
    customMessage?: string | null;
    isActive: boolean;
};

