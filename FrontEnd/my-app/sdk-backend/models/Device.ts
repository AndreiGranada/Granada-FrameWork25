/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Device = {
    id: string;
    platform: Device.platform;
    pushToken: string;
    isActive: boolean;
};
export namespace Device {
    export enum platform {
        ANDROID = 'ANDROID',
        IOS = 'IOS',
    }
}

