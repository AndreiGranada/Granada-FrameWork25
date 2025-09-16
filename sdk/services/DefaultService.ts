/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Device } from '../models/Device';
import type { DeviceCreate } from '../models/DeviceCreate';
import type { DeviceUpdate } from '../models/DeviceUpdate';
import type { EmergencyContact } from '../models/EmergencyContact';
import type { EmergencyContactCreate } from '../models/EmergencyContactCreate';
import type { EmergencyContactUpdate } from '../models/EmergencyContactUpdate';
import type { IntakeEventExpanded } from '../models/IntakeEventExpanded';
import type { Reminder } from '../models/Reminder';
import type { ReminderCreate } from '../models/ReminderCreate';
import type { ReminderUpdate } from '../models/ReminderUpdate';
import type { ScheduleCreate } from '../models/ScheduleCreate';
import type { ScheduleUpdate } from '../models/ScheduleUpdate';
import type { UserPublic } from '../models/UserPublic';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DefaultService {
    /**
     * Healthcheck
     * @returns any OK
     * @throws ApiError
     */
    public static getHealth(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/health',
        });
    }
    /**
     * Registrar usuário
     * @returns any Registrado
     * @throws ApiError
     */
    public static authRegister({
        requestBody,
    }: {
        requestBody: {
            email: string;
            password: string;
            name?: string;
        },
    }): CancelablePromise<{
        user?: UserPublic;
        token?: string;
        refreshToken?: string;
        refreshExpiresAt?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/register',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Requisição inválida`,
                409: `Conflito`,
                429: `Rate limit`,
                500: `Erro interno`,
            },
        });
    }
    /**
     * Login
     * @returns any Autenticado
     * @throws ApiError
     */
    public static authLogin({
        requestBody,
    }: {
        requestBody: {
            email: string;
            password: string;
        },
    }): CancelablePromise<{
        user?: UserPublic;
        token?: string;
        refreshToken?: string;
        refreshExpiresAt?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/login',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Solicitar reset de senha
     * @returns any Se existir
     * @throws ApiError
     */
    public static authForgotPassword({
        requestBody,
    }: {
        requestBody: {
            email: string;
        },
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/forgot',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Requisição inválida`,
                429: `Rate limit`,
                500: `Erro interno`,
            },
        });
    }
    /**
     * Redefinir senha
     * @returns any Senha redefinida
     * @throws ApiError
     */
    public static authResetPassword({
        requestBody,
    }: {
        requestBody: {
            token: string;
            password: string;
        },
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/reset',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Requisição inválida`,
                500: `Erro interno`,
            },
        });
    }
    /**
     * Renovar token de acesso
     * @returns any Novo token emitido
     * @throws ApiError
     */
    public static authRefreshToken({
        requestBody,
    }: {
        requestBody: {
            refreshToken: string;
        },
    }): CancelablePromise<{
        token?: string;
        refreshToken?: string;
        refreshExpiresAt?: string;
        user?: UserPublic;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/refresh',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Requisição inválida`,
                401: `Não autenticado`,
                500: `Erro interno`,
            },
        });
    }
    /**
     * Logout global
     * @returns any Ok
     * @throws ApiError
     */
    public static authLogout(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/logout',
            errors: {
                500: `Erro interno`,
            },
        });
    }
    /**
     * Dados do usuário autenticado
     * @returns any Ok
     * @throws ApiError
     */
    public static getCurrentUser(): CancelablePromise<{
        user?: UserPublic;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/me',
            errors: {
                400: `Requisição inválida`,
                401: `Não autenticado`,
                404: `Não encontrado`,
                500: `Erro interno`,
            },
        });
    }
    /**
     * Atualizar perfil do usuário
     * @returns any Perfil atualizado
     * @throws ApiError
     */
    public static updateCurrentUser({
        requestBody,
    }: {
        requestBody: {
            name?: string;
            timezone?: string;
            passwordCurrent?: string;
            passwordNew?: string;
        },
    }): CancelablePromise<{
        user?: UserPublic;
    }> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/me',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Requisição inválida`,
                401: `Não autenticado`,
                404: `Não encontrado`,
                409: `Conflito`,
                500: `Erro interno`,
            },
        });
    }
    /**
     * Listar lembretes (array simples)
     * @returns Reminder Lista de lembretes
     * @throws ApiError
     */
    public static listReminders(): CancelablePromise<Array<Reminder>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/reminders',
            errors: {
                500: `Erro interno`,
            },
        });
    }
    /**
     * Criar lembrete
     * @returns any Criado
     * @throws ApiError
     */
    public static createReminder({
        requestBody,
    }: {
        requestBody: ReminderCreate,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/reminders',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Requisição inválida`,
                500: `Erro interno`,
            },
        });
    }
    /**
     * Obter lembrete
     * @returns any Ok
     * @throws ApiError
     */
    public static getReminder({
        id,
    }: {
        id: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/reminders/{id}',
            path: {
                'id': id,
            },
            errors: {
                400: `Requisição inválida`,
                404: `Não encontrado`,
                500: `Erro interno`,
            },
        });
    }
    /**
     * Atualizar lembrete
     * @returns any Ok
     * @throws ApiError
     */
    public static updateReminder({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: ReminderUpdate,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/reminders/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Requisição inválida`,
                404: `Não encontrado`,
                500: `Erro interno`,
            },
        });
    }
    /**
     * Desativar (soft delete) lembrete
     * Marca o lembrete e seus schedules como inativos (isActive=false). Idempotente.
     * @returns void
     * @throws ApiError
     */
    public static deleteReminder({
        id,
    }: {
        id: string,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/reminders/{id}',
            path: {
                'id': id,
            },
            errors: {
                400: `Requisição inválida`,
                404: `Não encontrado`,
                500: `Erro interno`,
            },
        });
    }
    /**
     * Adicionar schedule a um lembrete
     * @returns any Criado
     * @throws ApiError
     */
    public static addReminderSchedule({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: ScheduleCreate,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/reminders/{id}/schedules',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Requisição inválida`,
                404: `Não encontrado`,
                500: `Erro interno`,
            },
        });
    }
    /**
     * Atualizar schedule
     * @returns any Ok
     * @throws ApiError
     */
    public static updateSchedule({
        scheduleId,
        requestBody,
    }: {
        scheduleId: string,
        requestBody: ScheduleUpdate,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/reminders/schedules/{scheduleId}',
            path: {
                'scheduleId': scheduleId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Requisição inválida`,
                404: `Não encontrado`,
                500: `Erro interno`,
            },
        });
    }
    /**
     * Remover schedule
     * @returns void
     * @throws ApiError
     */
    public static deleteSchedule({
        scheduleId,
    }: {
        scheduleId: string,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/reminders/schedules/{scheduleId}',
            path: {
                'scheduleId': scheduleId,
            },
            errors: {
                400: `Requisição inválida`,
                404: `Não encontrado`,
                500: `Erro interno`,
            },
        });
    }
    /**
     * Listar eventos de tomada no intervalo (array simples)
     * @returns IntakeEventExpanded Lista de eventos
     * @throws ApiError
     */
    public static listIntakeEvents({
        from,
        to,
        hours,
        status,
    }: {
        from?: string,
        to?: string,
        hours?: string,
        status?: 'PENDING' | 'TAKEN' | 'MISSED',
    }): CancelablePromise<Array<IntakeEventExpanded>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/intakes',
            query: {
                'from': from,
                'to': to,
                'hours': hours,
                'status': status,
            },
            errors: {
                400: `Requisição inválida`,
                500: `Erro interno`,
            },
        });
    }
    /**
     * Histórico de eventos recentes
     * @returns IntakeEventExpanded Lista de eventos
     * @throws ApiError
     */
    public static listIntakeHistory({
        days,
    }: {
        days?: string,
    }): CancelablePromise<Array<IntakeEventExpanded>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/intakes/history',
            query: {
                'days': days,
            },
            errors: {
                400: `Requisição inválida`,
                500: `Erro interno`,
            },
        });
    }
    /**
     * Marcar evento como tomado
     * @returns any Ok
     * @throws ApiError
     */
    public static markIntakeTaken({
        id,
    }: {
        id: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/intakes/{id}/taken',
            path: {
                'id': id,
            },
            errors: {
                400: `Requisição inválida`,
                404: `Não encontrado`,
                500: `Erro interno`,
            },
        });
    }
    /**
     * Listar contatos de emergência (array simples)
     * @returns EmergencyContact Lista de contatos
     * @throws ApiError
     */
    public static listEmergencyContacts(): CancelablePromise<Array<EmergencyContact>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/emergency/emergency-contacts',
            errors: {
                500: `Erro interno`,
            },
        });
    }
    /**
     * Criar contato de emergência
     * @returns any Criado
     * @throws ApiError
     */
    public static createEmergencyContact({
        requestBody,
    }: {
        requestBody: EmergencyContactCreate,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/emergency/emergency-contacts',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Requisição inválida`,
                500: `Erro interno`,
            },
        });
    }
    /**
     * Atualizar contato de emergência
     * @returns any Ok
     * @throws ApiError
     */
    public static updateEmergencyContact({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: EmergencyContactUpdate,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/emergency/emergency-contacts/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Requisição inválida`,
                404: `Não encontrado`,
                500: `Erro interno`,
            },
        });
    }
    /**
     * Remover contato de emergência
     * @returns void
     * @throws ApiError
     */
    public static deleteEmergencyContact({
        id,
    }: {
        id: string,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/emergency/emergency-contacts/{id}',
            path: {
                'id': id,
            },
            errors: {
                400: `Requisição inválida`,
                404: `Não encontrado`,
                500: `Erro interno`,
            },
        });
    }
    /**
     * Listar dispositivos (array simples)
     * @returns Device Lista de dispositivos
     * @throws ApiError
     */
    public static listDevices(): CancelablePromise<Array<Device>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/devices',
            errors: {
                500: `Erro interno`,
            },
        });
    }
    /**
     * Registrar dispositivo
     * @returns any Criado
     * @throws ApiError
     */
    public static registerDevice({
        requestBody,
    }: {
        requestBody: DeviceCreate,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/devices',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Requisição inválida`,
                500: `Erro interno`,
            },
        });
    }
    /**
     * Atualizar dispositivo
     * @returns any Ok
     * @throws ApiError
     */
    public static updateDevice({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: DeviceUpdate,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/devices/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Requisição inválida`,
                404: `Não encontrado`,
                500: `Erro interno`,
            },
        });
    }
    /**
     * Remover dispositivo
     * @returns void
     * @throws ApiError
     */
    public static deleteDevice({
        id,
    }: {
        id: string,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/devices/{id}',
            path: {
                'id': id,
            },
            errors: {
                400: `Requisição inválida`,
                404: `Não encontrado`,
                500: `Erro interno`,
            },
        });
    }
    /**
     * Disparar SOS (dev)
     * @returns any Ok
     * @throws ApiError
     */
    public static devTestSos(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/dev/test-sos',
            errors: {
                500: `Erro interno`,
            },
        });
    }
    /**
     * Disparar alarme (dev)
     * @returns any Ok
     * @throws ApiError
     */
    public static devTestAlarm(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/dev/test-alarm',
            errors: {
                500: `Erro interno`,
            },
        });
    }
}
