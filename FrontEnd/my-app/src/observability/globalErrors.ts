import { logger } from '@/src/lib/logger';

let nativeHandlerInstalled = false;
let domHandlersInstalled = false;

function logUnhandled(source: string, error: unknown, isFatal?: boolean) {
    if (error instanceof Error) {
        logger.error(error, { source, isFatal: !!isFatal });
    } else {
        logger.error('[global-error] Unhandled exception', {
            source,
            isFatal: !!isFatal,
            value: error,
        });
    }
}

function installReactNativeHandler() {
    if (nativeHandlerInstalled) return;
    const globalAny = globalThis as unknown as {
        ErrorUtils?: {
            setGlobalHandler?: (handler: (error: unknown, isFatal?: boolean) => void) => void;
            getGlobalHandler?: () => ((error: unknown, isFatal?: boolean) => void) | undefined;
        };
    };

    const errorUtils = globalAny?.ErrorUtils;
    if (!errorUtils?.setGlobalHandler) return;

    const previous = typeof errorUtils.getGlobalHandler === 'function'
        ? errorUtils.getGlobalHandler()
        : undefined;

    const handler = (error: unknown, isFatal?: boolean) => {
        logUnhandled('ErrorUtils', error, isFatal);
        if (previous) {
            try {
                previous(error, isFatal);
            } catch (prevErr) {
                logger.error('[global-error] Previous handler threw', { source: 'ErrorUtils', value: prevErr });
            }
        }
    };

    errorUtils.setGlobalHandler(handler);
    nativeHandlerInstalled = true;
}

function installDomHandlers() {
    if (domHandlersInstalled) return;
    const target: any = typeof window !== 'undefined' ? window : undefined;
    if (!target?.addEventListener) return;

    const onError = (event: any) => {
        const error = event?.error ?? event?.message ?? event;
        logUnhandled('window.error', error, event?.error?.fatal ?? false);
    };

    const onUnhandledRejection = (event: any) => {
        const reason = event?.reason ?? event;
        logUnhandled('unhandledrejection', reason, false);
    };

    target.addEventListener('error', onError);
    target.addEventListener('unhandledrejection', onUnhandledRejection);
    domHandlersInstalled = true;
}

export function installGlobalErrorHandler(): void {
    installReactNativeHandler();
    installDomHandlers();
}
