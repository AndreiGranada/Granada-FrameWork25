import PrimaryButton from '@/components/ui/PrimaryButton';
import ScreenHeader from '@/components/ui/ScreenHeader';
import TextField from '@/components/ui/TextField';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { extractFieldErrors, friendlyTopMessage, getRetryAfterSeconds } from '@/src/lib/errors';
import { useAuthStore, useNotifications, useThemeStore } from '@/src/store';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();
  const { resetPassword } = useAuthStore();
  const { mode } = useThemeStore();
  const { success, error: notifyError } = useNotifications();
  
  const [token, setToken] = useState(params.token || '');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const palette = Colors[mode];

  const errors = useMemo(() => {
    const errs: Record<string, string> = {};
    if (!token) errs.token = 'Cole o token recebido por e-mail.';
    if (!password) errs.password = 'Informe a nova senha.';
    else if (password.length < 6) errs.password = 'Mínimo de 6 caracteres.';
    return errs;
  }, [token, password]);

  const disabled = busy || Object.keys(errors).length > 0 || !!retryAfter;

  const apiErrorMessage = (e: any) => friendlyTopMessage(e, 'Falha ao redefinir');

  function handleRateLimit(e: any) {
    const retry = getRetryAfterSeconds(e);
    if (retry > 0) {
      setRetryAfter(retry);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setRetryAfter((prev) => {
          if (!prev || prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = null;
            return null;
          }
          return prev - 1;
        });
      }, 1000);
      return true;
    }
    return false;
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const handleReset = async () => {
    try {
      setBusy(true);
      await resetPassword(token, password);
      success('Senha redefinida. Faça login com a nova senha.');
      router.replace('/login');
    } catch (e: any) {
      if (!handleRateLimit(e)) {
        const fieldErrs = extractFieldErrors(e);
        const msg = fieldErrs.token || fieldErrs.password || apiErrorMessage(e);
        notifyError(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <ScreenHeader title="Redefinir senha" />
      <View style={{ flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, gap: Spacing.md }}>
        <TextField
          value={token}
          onChangeText={setToken}
          placeholder="token do e-mail"
          autoCapitalize="none"
          editable={!busy}
          error={errors.token}
        />
        {errors.token ? <Text style={{ ...Typography.small, color: palette.error }}>{errors.token}</Text> : null}

        <TextField
          value={password}
          onChangeText={setPassword}
          placeholder="nova senha"
          secureTextEntry={!showPass}
          editable={!busy}
          onSubmitEditing={handleReset}
          error={errors.password}
        />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: -8 }}>
          <Pressable onPress={() => setShowPass((v) => !v)}>
            <Text style={{ ...Typography.smallMedium, color: palette.primary }}>
              {showPass ? 'Ocultar senha' : 'Mostrar senha'}
            </Text>
          </Pressable>
          <Pressable onPress={() => router.replace('/login')}>
            <Text style={{ ...Typography.smallMedium, color: palette.primary }}>Voltar ao login</Text>
          </Pressable>
        </View>
        {errors.password ? <Text style={{ ...Typography.small, color: palette.error }}>{errors.password}</Text> : null}

        <PrimaryButton
          title={retryAfter ? `AGUARDE ${retryAfter}s` : 'REDEFINIR'}
          loading={busy}
          disabled={disabled}
          onPress={handleReset}
        />
      </View>
    </View>
  );
}
