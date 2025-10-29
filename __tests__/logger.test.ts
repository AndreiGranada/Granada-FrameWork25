import { logger } from '@/src/lib/logger';

describe('logger', () => {
    it('exposes expected methods', () => {
        expect(typeof logger.debug).toBe('function');
        expect(typeof logger.info).toBe('function');
        expect(typeof logger.warn).toBe('function');
        expect(typeof logger.error).toBe('function');
    });
});
