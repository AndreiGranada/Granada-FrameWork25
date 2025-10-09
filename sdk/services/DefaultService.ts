/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AuthSession } from '../models/AuthSession';
import type { Device } from '../models/Device';
import type { DeviceCreate } from '../models/DeviceCreate';
import type { DeviceUpdate } from '../models/DeviceUpdate';
import type { EmergencyContact } from '../models/EmergencyContact';
import type { EmergencyContactCreate } from '../models/EmergencyContactCreate';
import type { EmergencyContactUpdate } from '../models/EmergencyContactUpdate';
import type { IntakeEvent } from '../models/IntakeEvent';
import type { IntakeEventExpanded } from '../models/IntakeEventExpanded';
import type { IntakeHistoryPage } from '../models/IntakeHistoryPage';
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
    public static getHealth(): CancelablePromise<{
        status?: string;
        /**
         * Horário ISO do servidor
         */
        time?: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/health',
        });
    }
    /**
     * Registrar usuário
     * @returns AuthSession Registrado
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
    }): CancelablePromise<AuthSession> {
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
     * @returns AuthSession Autenticado
     * @throws ApiError
     */
    public static authLogin({
        requestBody,
    }: {
        requestBody: {
            email: string;
            password: string;
        },
    }): CancelablePromise<AuthSession> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/login',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Requisição inválida`,
                401: `Não autenticado`,
                429: `Rate limit`,
                500: `Erro interno`,
            },
        });
    }
    /**
     * Solicitar reset de senha
     * @returns any Se existir, enviaremos as instruções
     * @throws ApiError
     */
    public static authForgotPassword({
        requestBody,
    }: {
        requestBody: {
            email: string;
        },
    }): CancelablePromise<{
        message: string;
    }> {
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
    }): CancelablePromise<{
        message: string;
    }> {
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
     * @returns AuthSession Novo token emitido
     * @throws ApiError
     */
    public static authRefreshToken({
        requestBody,
    }: {
        requestBody: {
            refreshToken: string;
        },
    }): CancelablePromise<AuthSession> {
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
    public static authLogout(): CancelablePromise<{
        message: string;
    }> {
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
     * @returns Reminder Criado
     * @throws ApiError
     */
    public static createReminder({
        requestBody,
    }: {
        requestBody: ReminderCreate,
    }): CancelablePromise<Reminder> {
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
     * @returns Reminder Ok
     * @throws ApiError
     */
    public static getReminder({
        id,
    }: {
        id: string,
    }): CancelablePromise<Reminder> {
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
     * @returns Reminder Atualizado
     * @throws ApiError
     */
    public static updateReminder({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: ReminderUpdate,
    }): CancelablePromise<Reminder> {
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
     * @returns Reminder Criado
     * @throws ApiError
     */
    public static addReminderSchedule({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: ScheduleCreate,
    }): CancelablePromise<Reminder> {
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
     * @returns Reminder Atualizado
     * @throws ApiError
     */
    public static updateSchedule({
        scheduleId,
        requestBody,
    }: {
        scheduleId: string,
        requestBody: ScheduleUpdate,
    }): CancelablePromise<Reminder> {
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
     * @returns any Histórico de eventos (array simples legado OU página paginada experimental)
     * @throws ApiError
     */
    public static listIntakeHistory({
        days,
        limit,
        cursor,
    }: {
        /**
         * Modo legado: quantidade de dias passados a retornar (array simples). Não combinar com limit.
         */
        days?: string,
        /**
         * Ativa modo paginado (experimental). Número máximo de eventos retornados. Não combinar com `days`.
         */
        limit?: number,
        /**
         * Cursor (ISO date-time) retornado em `pageInfo.nextCursor` da página anterior.
         */
        cursor?: string,
    }): CancelablePromise<(Array<IntakeEventExpanded> | IntakeHistoryPage)> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/intakes/history',
            query: {
                'days': days,
                'limit': limit,
                'cursor': cursor,
            },
            errors: {
                400: `Requisição inválida`,
                500: `Erro interno`,
            },
        });
    }
    /**
     * Marcar evento como tomado
     * @returns IntakeEvent Evento atualizado
     * @throws ApiError
     */
    public static markIntakeTaken({
        id,
    }: {
        id: string,
    }): CancelablePromise<IntakeEvent> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/intakes/{id}/taken',
            path: {
                'id': id,
            },
            errors: {
                400: `Requisição inválida`,
                404: `Não encontrado`,
                409: `Conflito`,
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
     * @returns EmergencyContact Criado
     * @throws ApiError
     */
    public static createEmergencyContact({
        requestBody,
    }: {
        requestBody: EmergencyContactCreate,
    }): CancelablePromise<EmergencyContact> {
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
     * @returns EmergencyContact Ok
     * @throws ApiError
     */
    public static updateEmergencyContact({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: EmergencyContactUpdate,
    }): CancelablePromise<EmergencyContact> {
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
     * @returns Device Dispositivo já existia para o usuário e foi reativado/atualizado
     * @throws ApiError
     */
    public static registerDevice({
        requestBody,
    }: {
        requestBody: DeviceCreate,
    }): CancelablePromise<Device> {
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
     * @returns Device Ok
     * @throws ApiError
     */
    public static updateDevice({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: DeviceUpdate,
    }): CancelablePromise<Device> {
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
