/* eslint-disable */
// Tentativa de carregar jest-native; ignora se indisponível (ambiente minimalista)
try { require('@testing-library/jest-native/extend-expect'); } catch { }
import { TextDecoder, TextEncoder } from 'util';
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

// Polyfill simplificado de TransformStream / TextDecoderStream usado por expo web no ambiente JSDOM
if (!(global as any).TransformStream) {
    (global as any).TransformStream = class {
        readable: any; writable: any;
        constructor() {
            const chunks: any[] = [];
            this.readable = {
                getReader: () => ({
                    read: async () => ({ done: true, value: undefined }),
                    releaseLock: () => { }
                })
            };
            this.writable = {
                getWriter: () => ({
                    write: (c: any) => { chunks.push(c); },
                    close: () => { },
                    releaseLock: () => { }
                })
            };
        }
    } as any;
}

if (!(global as any).TextDecoderStream) {
    (global as any).TextDecoderStream = class {
        readable: any; writable: any;
        constructor() { const t = new (global as any).TransformStream(); this.readable = t.readable; this.writable = t.writable; }
    } as any;
}

// Mock básico de expo-modules-core antes de expo-secure-store
jest.mock('expo-modules-core', () => ({
    NativeModulesProxy: {},
    EventEmitter: function () { return { addListener: () => { }, removeAllListeners: () => { } }; },
    requireNativeModule: () => ({
        getLoadedFonts: () => [],
        loadAsync: async () => { },
        unloadAllAsync: async () => { },
        unloadAsync: async () => { },
        isLoaded: () => true,
        getServerResources: () => [],
        resetServerContext: () => { },
    }),
    requireOptionalNativeModule: () => null,
}));

// Mock global de expo-secure-store (caso ainda não aplicado)
jest.mock('expo-secure-store', () => ({
    getItemAsync: async () => null,
    setItemAsync: async () => { },
    deleteItemAsync: async () => { },
}));

jest.mock('@expo/vector-icons', () => {
    const React = require('react');
    const MockIcon = (props: any) => React.createElement('svg', { ...props });
    return {
        Ionicons: MockIcon,
        MaterialIcons: MockIcon,
        FontAwesome: MockIcon,
    };
});

jest.mock('react-native-safe-area-context', () => ({
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
    SafeAreaProvider: ({ children }: any) => children,
    SafeAreaView: ({ children }: any) => children,
    initialWindowMetrics: {
        frame: { x: 0, y: 0, width: 0, height: 0 },
        insets: { top: 0, right: 0, bottom: 0, left: 0 },
    },
}));

// Acesso seguro ao objeto jest quando disponível
const j: any = (global as any).jest;
if (j) {
    j.mock('expo-router', () => ({
        useLocalSearchParams: j.fn(() => ({})),
        useRouter: () => ({ replace: j.fn(), push: j.fn() }),
        usePathname: () => '/',
        router: { push: j.fn(), replace: j.fn(), back: j.fn() },
    }));
    j.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => ({}));
    // (já mockado acima)
}

// Forçar axios a usar adapter node no ambiente de testes evitando XHR/jsdom
const axios = require('axios');
try {
    // Axios v1 estrutura diferente; tentar http, depois xhr fallback
    // @ts-ignore
    const httpAdapter = require('axios/lib/adapters/http.js');
    axios.defaults.adapter = httpAdapter;
} catch {
    try {
        // fallback antigo
        // @ts-ignore
        axios.defaults.adapter = require('axios/lib/adapters/xhr.js');
    } catch { }
}
