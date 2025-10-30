/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Schedule } from './Schedule';
export type Reminder = {
    id: string;
    name: string;
    purpose?: string | null;
    description?: string | null;
    /**
     * Decimal como string
     */
    pricePaid?: string | null;
    photoUrl?: string | null;
    isActive: boolean;
    schedules?: Array<Schedule>;
};

