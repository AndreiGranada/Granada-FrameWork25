import { createInMemoryAnalyticsSink, setAnalyticsProvider, trackEvent, withTiming } from '@/src/observability/analytics';

describe('analytics module', () => {
    it('registra eventos simples', () => {
        const { provider, events } = createInMemoryAnalyticsSink();
        setAnalyticsProvider(provider);
        trackEvent('test_event', { a: 1 });
        expect(events.length).toBe(1);
        expect(events[0].name).toBe('test_event');
        expect(events[0].props?.a).toBe(1);
    });

    it('withTiming sucesso e erro', async () => {
        const { provider, events } = createInMemoryAnalyticsSink();
        setAnalyticsProvider(provider);
        await withTiming('op_ok', async () => { return 42; }, { meta: 'x' });
        expect(events.find(e => e.name === 'op_ok')?.props?.status).toBe('ok');
        try {
            await withTiming('op_fail', async () => { throw new Error('boom'); });
        } catch { }
        const fail = events.find(e => e.name === 'op_fail');
        expect(fail?.props?.status).toBe('error');
        expect(fail?.props?.error).toBe('boom');
    });
});
