/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Schedule = {
    id: string;
    ingestionTimeMinutes: number;
    /**
     * Bitmask de dias. 1=Dom,2=Seg,4=Ter,8=Qua,16=Qui,32=Sex,64=Sáb. 0=todos. Exemplos: Diário=0; Dias úteis=62; Fim de semana=65; Seg/Qua/Sex=42; Ter/Qui=20
     */
    daysOfWeekBitmask: number;
    isActive: boolean;
};

