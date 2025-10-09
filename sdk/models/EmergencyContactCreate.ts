/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type EmergencyContactCreate = {
    name: string;
    phone: string;
    /**
     * Mensagem personalizada opcional
     */
    customMessage?: string;
    /**
     * Quando omitido assume true
     */
    isActive?: boolean;
};

