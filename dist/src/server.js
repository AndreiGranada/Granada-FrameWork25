"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const intakeScheduler_1 = require("./services/intakeScheduler");
const intakeAlarms_1 = require("./services/intakeAlarms");
const logger_1 = require("./lib/logger");
const cleanup_1 = require("./services/cleanup");
const port = process.env.PORT ? Number(process.env.PORT) : 3000;
const app = (0, app_1.createApp)();
app.listen(port, () => {
    logger_1.logger.info(`API ouvindo na porta ${port}`);
    (0, logger_1.logStartupInfo)();
    (0, intakeScheduler_1.startIntakeScheduler)();
    (0, intakeAlarms_1.startAlarmProcessor)();
    (0, cleanup_1.startCleanupJob)();
});
