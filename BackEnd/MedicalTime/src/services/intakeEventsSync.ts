import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { generateUpcomingEventsForReminder, generateUpcomingEventsForSchedule } from './intakeScheduler';

async function deleteUpcomingEvents(where: Prisma.IntakeEventWhereInput) {
    const now = new Date();
    const { count } = await prisma.intakeEvent.deleteMany({
        where: {
            ...where,
            scheduledAt: { gte: now },
            status: { not: 'TAKEN' }
        }
    });

    return count;
}

export async function resyncUpcomingEventsForReminder(reminderId: string) {
    const reminder = await prisma.medicationReminder.findUnique({
        where: { id: reminderId },
        select: { id: true, isActive: true }
    });
    if (!reminder) return { deleted: 0, created: 0 };

    const deleted = await deleteUpcomingEvents({ medicationReminderId: reminder.id });

    if (!reminder.isActive) return { deleted, created: 0 };

    const { created } = await generateUpcomingEventsForReminder(reminder.id);
    return { deleted, created };
}

export async function resyncUpcomingEventsForSchedule(scheduleId: string) {
    const deleted = await deleteUpcomingEvents({ medicationScheduleId: scheduleId });
    const schedule = await prisma.medicationSchedule.findUnique({
        where: { id: scheduleId },
        select: {
            id: true,
            isActive: true,
            medicationReminder: { select: { id: true, isActive: true } }
        }
    });

    if (!schedule || !schedule.isActive || !schedule.medicationReminder.isActive) {
        return { deleted, created: 0 };
    }

    const { created } = await generateUpcomingEventsForSchedule(schedule.id);
    return { deleted, created };
}
