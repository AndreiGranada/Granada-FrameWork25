import { Toast, ToastKind } from '@/components/ui/Toast';
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Animated, View } from 'react-native';

type ToastItem = { id: number; kind: ToastKind; message: string };

type ToastContextType = {
  show: (opts: { kind?: ToastKind; message: string; durationMs?: number }) => void;
  dismissAll: () => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast deve ser usado dentro de <ToastProvider>');
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(1);
  const opacity = useRef(new Animated.Value(0)).current;

  const fadeIn = useCallback(() => {
    Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
  }, [opacity]);

  const fadeOut = useCallback((onDone?: () => void) => {
    Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => onDone && onDone());
  }, [opacity]);

  const show = useCallback(({ kind = 'info', message, durationMs = 2500 }: { kind?: ToastKind; message: string; durationMs?: number }) => {
    const id = idRef.current++;
    const item: ToastItem = { id, kind, message };
    setToasts((prev) => {
      const next = [item, ...prev].slice(0, 3);
      if (next.length > 0) {
        fadeIn();
      }
      return next;
    });
    setTimeout(() => {
      setToasts((prev) => {
        const next = prev.filter((t) => t.id !== id);
        if (next.length === 0) {
          fadeOut();
        }
        return next;
      });
    }, durationMs);
  }, [fadeIn, fadeOut]);

  const dismissAll = useCallback(() => {
    setToasts([]);
    fadeOut();
  }, [fadeOut]);

  const value = useMemo(() => ({ show, dismissAll }), [show, dismissAll]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 40,
          left: 12,
          right: 12,
          opacity,
        }}
      >
        <View>
          {toasts.map((t) => (
            <Toast key={t.id} kind={t.kind} message={t.message} onClose={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))} />
          ))}
        </View>
      </Animated.View>
    </ToastContext.Provider>
  );
}
