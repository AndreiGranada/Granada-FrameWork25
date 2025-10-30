/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EmergencyContact } from '../models/EmergencyContact';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class EmergencyService {
    /**
     * Disparar SOS
     * Dispara fluxo de notificação para contatos de emergência
     * @returns any Ok
     * @throws ApiError
     */
    public static triggerSos(): CancelablePromise<{
        sent: number;
        contacts: Array<EmergencyContact>;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/emergency/sos',
        });
    }
}
