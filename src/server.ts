import { createApp } from './app';
import { startIntakeScheduler } from './services/intakeScheduler';
import { startAlarmProcessor } from './services/intakeAlarms';
import { logger, logStartupInfo } from './lib/logger';
import { startCleanupJob } from './services/cleanup';

const port = process.env.PORT ? Number(process.env.PORT) : 3000;
const app = createApp();

app.listen(port, () => {
    logger.info(`API ouvindo na porta ${port}`);
    logStartupInfo();
    startIntakeScheduler();
    startAlarmProcessor();
    startCleanupJob();
});
