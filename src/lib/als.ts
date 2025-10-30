import { AsyncLocalStorage } from 'async_hooks';

export type RequestContext = {
    correlationId: string;
};

const storage = new AsyncLocalStorage<RequestContext>();

export function runWithContext(ctx: RequestContext, fn: () => void) {
    storage.run(ctx, fn);
}

export function getContext(): RequestContext | undefined {
    return storage.getStore();
}

export function getCorrelationId(): string | undefined {
    return storage.getStore()?.correlationId;
}
