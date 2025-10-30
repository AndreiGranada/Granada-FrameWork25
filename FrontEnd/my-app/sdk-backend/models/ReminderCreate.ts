/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ScheduleCreate } from './ScheduleCreate';
export type ReminderCreate = {
    name: string;
    purpose?: string;
    description?: string;
    /**
     * Decimal como string
     */
    pricePaid?: string;
    photoUrl?: string;
    schedules: Array<ScheduleCreate>;
};

