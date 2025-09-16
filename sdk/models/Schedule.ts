/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Schedule = {
    id: string;
    ingestionTimeMinutes: number;
    /**
     * 1=Dom,2=Seg,4=Ter,8=Qua,16=Qui,32=Sex,64=Sáb; 0=todos
     */
    daysOfWeekBitmask: number;
    isActive: boolean;
};

