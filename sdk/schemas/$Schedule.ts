/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $Schedule = {
    properties: {
        id: {
            type: 'string',
            isRequired: true,
        },
        ingestionTimeMinutes: {
            type: 'number',
            isRequired: true,
            maximum: 1439,
        },
        daysOfWeekBitmask: {
            type: 'number',
            description: `Bitmask de dias. 1=Dom,2=Seg,4=Ter,8=Qua,16=Qui,32=Sex,64=Sáb. 0=todos. Exemplos: Diário=0; Dias úteis=62; Fim de semana=65; Seg/Qua/Sex=42; Ter/Qui=20`,
            isRequired: true,
            maximum: 127,
        },
        isActive: {
            type: 'boolean',
            isRequired: true,
        },
    },
} as const;
