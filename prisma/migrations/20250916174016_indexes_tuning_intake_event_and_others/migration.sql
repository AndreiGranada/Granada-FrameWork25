/*
  Warnings:

  - A unique constraint covering the columns `[userId,medicationScheduleId,scheduledAt]` on the table `IntakeEvent` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `IntakeEvent_scheduledAt_idx` ON `intakeevent`;

-- DropIndex
DROP INDEX `IntakeEvent_status_idx` ON `intakeevent`;

-- CreateIndex
CREATE INDEX `Device_userId_isActive_idx` ON `Device`(`userId`, `isActive`);

-- CreateIndex
CREATE INDEX `EmergencyContact_userId_isActive_priority_idx` ON `EmergencyContact`(`userId`, `isActive`, `priority`);

-- CreateIndex
CREATE INDEX `IntakeEvent_status_scheduledAt_idx` ON `IntakeEvent`(`status`, `scheduledAt`);

-- CreateIndex
CREATE INDEX `IntakeEvent_userId_scheduledAt_idx` ON `IntakeEvent`(`userId`, `scheduledAt`);

-- CreateIndex
CREATE UNIQUE INDEX `IntakeEvent_userId_medicationScheduleId_scheduledAt_key` ON `IntakeEvent`(`userId`, `medicationScheduleId`, `scheduledAt`);
