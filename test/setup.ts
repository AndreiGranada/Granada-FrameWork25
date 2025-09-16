import { prisma } from '../src/lib/prisma';

beforeEach(async () => {
    // Ordem importa por FK
    await prisma.refreshToken.deleteMany();
    await prisma.passwordResetToken.deleteMany();
    await prisma.intakeEvent.deleteMany();
    await prisma.medicationSchedule.deleteMany();
    await prisma.medicationReminder.deleteMany();
    await prisma.emergencyContact.deleteMany();
    await prisma.device.deleteMany();
    await prisma.user.deleteMany();
});

afterAll(async () => {
    await prisma.$disconnect();
});
