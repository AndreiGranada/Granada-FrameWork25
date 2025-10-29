import { trackEvent, setAnalyticsProvider, createInMemoryAnalyticsSink, getPendingAnalyticsQueue } from '@/src/observability/analytics';

describe('analytics queue flush', () => {
    it('enfileira eventos sem provider e faz flush ao definir provider', async () => {
        // Gera 3 eventos sem provider
        trackEvent('e1', { email: 'user@example.com', nested: { token: 'abc' } });
        trackEvent('e2');
        trackEvent('e3', { password: 'secret' });
        expect(getPendingAnalyticsQueue().length).toBe(3);

        const { provider, events } = createInMemoryAnalyticsSink();
        setAnalyticsProvider(provider);
        // flush é assíncrono, aguarda microtask
        await new Promise(r => setTimeout(r, 10));

        expect(getPendingAnalyticsQueue().length).toBe(0);
        expect(events.map(e => e.name)).toEqual(['e1', 'e2', 'e3']);
        // props sensíveis redigidas
        const e1 = events[0];
        expect(e1.props?.email).toBe('[redacted]');
        expect(e1.props?.nested?.token).toBe('[redacted]');
        const e3 = events.find(e => e.name === 'e3');
        expect(e3?.props?.password).toBe('[redacted]');
    });
});
