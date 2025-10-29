/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UserPublic } from './UserPublic';
/**
 * Sessão de autenticação retornada em login/register/refresh.
 */
export type AuthSession = {
    user: UserPublic;
    /**
     * JWT de acesso (curta duração)
     */
    token: string;
    /**
     * Token opaco de refresh (rotacionado em cada uso)
     */
    refreshToken: string;
    /**
     * Data de expiração absoluta do refresh token corrente
     */
    refreshExpiresAt: string;
};

