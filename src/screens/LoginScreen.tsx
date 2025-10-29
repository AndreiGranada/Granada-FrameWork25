import Card from '@/components/ui/Card';
import Header from '@/components/ui/Header';
import PrimaryButton from '@/components/ui/PrimaryButton';
import TextField from '@/components/ui/TextField';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { extractFieldErrors, friendlyTopMessage, getRetryAfterSeconds } from '@/src/lib/errors';
import { useAuthStore, useNotifications, useThemeStore } from '@/src/store';
import { getLastCorrelationId } from '@/src/api/client';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const { login, register, forgotPassword } = useAuthStore();
  const { mode: themeMode } = useThemeStore();
  const notifications = useNotifications();
  const palette = Colors[themeMode];

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const errors = useMemo(() => {
    const errs: Record<string, string> = {};
    if (!email) errs.email = 'Informe o e-mail.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'E-mail inválido.';
    if (!password) errs.password = 'Informe a senha.';
    else if (password.length < 6) errs.password = 'Mínimo de 6 caracteres.';
    if (authMode === 'register') {
      if (!name) errs.name = 'Informe seu nome.';
    }
    return errs;
  }, [email, password, name, authMode]);

  // Agora permitimos o clique mesmo com erros para fornecer feedback explícito
  const hasErrors = Object.keys(errors).length > 0;
  const primaryDisabled = busy || !!retryAfter; // deixa o usuário clicar para ver mensagens de erro

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  function apiErrorMessage(e: any) {
    return friendlyTopMessage(e, 'Falha na operação');
  }

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

  async function handleSubmit() {
    if (hasErrors) {
      // Mostramos a primeira mensagem de erro relevante
      notifications.warning(
        errors.email || errors.password || errors.name || 'Corrija os campos antes de continuar.'
      );
      return;
    }
    try {
      setBusy(true);
      if (authMode === 'login') {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password, name.trim());
      }
      router.replace('/home');
    } catch (e: any) {
      if (!handleRateLimit(e)) {
        const fieldErrs = extractFieldErrors(e);
        const msg = fieldErrs.email || fieldErrs.password || apiErrorMessage(e);
        notifications.error(msg);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleForgotPassword() {
    try {
      if (!email) {
        notifications.warning('Digite seu e-mail para receber as instruções.');
        return;
      }
      setBusy(true);
      await forgotPassword(email);
      const corrId = getLastCorrelationId();
      notifications.success(
        process.env.NODE_ENV === 'development' && corrId
          ? `Se o e-mail existir, enviaremos as instruções. (corrId: ${corrId})`
          : 'Se o e-mail existir, enviaremos as instruções.'
      );
      if (corrId) console.info('[auth/forgot] X-Correlation-Id:', corrId);
    } catch (e: any) {
      if (!handleRateLimit(e)) {
        const fieldErrs = extractFieldErrors(e);
        const msg = fieldErrs.email || apiErrorMessage(e);
        const corrId = getLastCorrelationId();
        notifications.error(
          process.env.NODE_ENV === 'development' && corrId
            ? `${msg} (corrId: ${corrId})`
            : msg
        );
        if (corrId) console.warn('[auth/forgot][error] X-Correlation-Id:', corrId, e);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: palette.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: Spacing.lg,
          paddingTop: Platform.OS === 'ios' ? 60 : Spacing.xl,
          gap: Spacing.xl,
          minHeight: '100%',
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Header showThemeToggle={true} title="" />
        <View style={{ alignItems: 'center', marginBottom: Spacing.xl }}>
          <Text style={{
            ...Typography.h1,
            color: palette.primary,
            textAlign: 'center',
            marginBottom: Spacing.xs,
          }}>
            MedicalTime
          </Text>
          <Text style={{
            ...Typography.body,
            color: palette.textSecondary,
            textAlign: 'center',
          }}>
            Seu assistente para medicamentos
          </Text>
        </View>

        <Card elevated>
          {/* Mode Toggle */}
          <View style={{
            flexDirection: 'row',
            backgroundColor: palette.surface,
            borderRadius: BorderRadius.md,
            padding: Spacing.xs,
            marginBottom: Spacing.lg,
          }}>
            <Pressable
              onPress={() => setAuthMode('login')}
              accessibilityRole="tab"
              accessibilityLabel="Entrar"
              accessibilityState={{ selected: authMode === 'login' }}
              focusable
              style={(state) => {
                const pressed = state.pressed;
                const focused = (state as any).focused as boolean | undefined;
                return [{
                  flex: 1,
                  paddingVertical: Spacing.md,
                  borderRadius: BorderRadius.sm,
                  backgroundColor: authMode === 'login' ? palette.primary : 'transparent',
                  borderWidth: focused ? 2 : 0,
                  borderColor: focused ? palette.borderFocused : 'transparent',
                }, pressed ? { opacity: 0.85 } : null];
              }}
            >
              <Text style={{
                ...Typography.bodyMedium,
                textAlign: 'center',
                color: authMode === 'login' ? '#FFFFFF' : palette.textSecondary,
              }}>
                Entrar
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setAuthMode('register')}
              accessibilityRole="tab"
              accessibilityLabel="Cadastrar"
              accessibilityState={{ selected: authMode === 'register' }}
              focusable
              style={(state) => {
                const pressed = state.pressed;
                const focused = (state as any).focused as boolean | undefined;
                return [{
                  flex: 1,
                  paddingVertical: Spacing.md,
                  borderRadius: BorderRadius.sm,
                  backgroundColor: authMode === 'register' ? palette.primary : 'transparent',
                  borderWidth: focused ? 2 : 0,
                  borderColor: focused ? palette.borderFocused : 'transparent',
                }, pressed ? { opacity: 0.85 } : null];
              }}
            >
              <Text style={{
                ...Typography.bodyMedium,
                textAlign: 'center',
                color: authMode === 'register' ? '#FFFFFF' : palette.textSecondary,
              }}>
                Cadastrar
              </Text>
            </Pressable>
          </View>

          {/* Form Fields */}
          <View style={{ gap: Spacing.lg }}>
            <TextField
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              placeholder="seu@email.com"
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!busy}
              error={errors.email}
            />

            {authMode === 'register' && (
              <TextField
                label="Nome completo"
                value={name}
                onChangeText={setName}
                placeholder="Seu nome"
                editable={!busy}
                error={errors.name}
              />
            )}

            <TextField
              label="Senha"
              value={password}
              onChangeText={setPassword}
              placeholder="Mínimo 6 caracteres"
              secureTextEntry={!showPass}
              editable={!busy}
              error={errors.password}
              onSubmitEditing={handleSubmit}
            />

            {/* Show/Hide Password */}
            <Pressable
              onPress={() => setShowPass((v) => !v)}
              style={{ alignSelf: 'flex-start' }}
              accessibilityRole="button"
              accessibilityLabel={showPass ? 'Ocultar senha' : 'Mostrar senha'}
              focusable
            >
              <Text style={{
                ...Typography.captionMedium,
                color: palette.primary
              }}>
                {showPass ? 'Ocultar senha' : 'Mostrar senha'}
              </Text>
            </Pressable>
          </View>

          {/* Action Buttons */}
          <View style={{ gap: Spacing.lg, marginTop: Spacing.xl }}>
            <PrimaryButton
              disabled={primaryDisabled}
              onPress={handleSubmit}
              title={
                retryAfter
                  ? `AGUARDE ${retryAfter}s`
                  : authMode === 'login'
                    ? hasErrors ? 'Verificar Campos' : 'ENTRAR'
                    : hasErrors ? 'Verificar Campos' : 'CADASTRAR'
              }
              loading={busy}
              size="lg"
            />

            <PrimaryButton
              disabled={busy || !!retryAfter}
              onPress={handleForgotPassword}
              title="ESQUECI MINHA SENHA"
              variant="secondary"
            />
            {hasErrors && !retryAfter && (
              <Text
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
                style={{
                  ...Typography.small,
                  color: palette.error,
                  textAlign: 'center'
                }}
              >
                Corrija os campos destacados antes de continuar.
              </Text>
            )}
          </View>
        </Card>

        {/* Reset Token */}
        <Card>
          <Text style={{
            ...Typography.captionMedium,
            color: palette.text,
            textAlign: 'center',
            marginBottom: Spacing.md,
          }}>
            Já tem um token de reset?
          </Text>
          <PrimaryButton
            onPress={() => router.push('/reset')}
            title="USAR TOKEN DE RESET"
            variant="secondary"
          />
        </Card>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

