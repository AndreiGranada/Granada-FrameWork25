import Card from '@/components/ui/Card';
import PrimaryButton from '@/components/ui/PrimaryButton';
import ScreenHeader from '@/components/ui/ScreenHeader';
import TextField from '@/components/ui/TextField';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { api } from '@/src/api/client';
import { extractFieldErrors, friendlyTopMessage, getRetryAfterSeconds } from '@/src/lib/errors';
import { useRequireAuth } from '@/src/lib/useRequireAuth';
import { useAuthStore, useNotifications, useThemeStore } from '@/src/store';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

export default function ProfileScreen() {
  useRequireAuth();
  const { user, refreshMe } = useAuthStore();
  const { mode } = useThemeStore();
  const { success, error: notifyError, info } = useNotifications();
  
  const [name, setName] = useState(user?.name || '');
  const [timezone, setTimezone] = useState(user?.timezone || '');
  const [passwordCurrent, setPasswordCurrent] = useState('');
  const [passwordNew, setPasswordNew] = useState('');
  const [busy, setBusy] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const palette = Colors[mode];

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // sincronia caso o usuário venha a ser atualizado em outro lugar
    setName(user?.name || '');
    setTimezone(user?.timezone || '');
  }, [user?.name, user?.timezone]);

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

  const canSaveProfile = useMemo(() => {
    const nOk = typeof name === 'string' && name.trim().length > 0;
    const tzOk = typeof timezone === 'string' && timezone.trim().length > 0;
    return nOk || tzOk; // pode salvar se ao menos um campo estiver preenchido
  }, [name, timezone]);

  async function saveProfile() {
    if (!canSaveProfile) return;
    try {
      setBusy(true);
      const body: any = {};
      if (name && name !== user?.name) body.name = name.trim();
      if (timezone && timezone !== user?.timezone) body.timezone = timezone.trim();
      if (Object.keys(body).length === 0) {
        info('Nada para atualizar.');
        return;
      }
      await api.patch('/me', body);
      await refreshMe();
      success('Perfil atualizado.');
    } catch (e: any) {
      if (!handleRateLimit(e)) {
        const fieldErrs = extractFieldErrors(e);
        const msg = fieldErrs.name || fieldErrs.timezone || friendlyTopMessage(e, 'Falha ao atualizar perfil');
        notifyError(msg);
      }
    } finally {
      setBusy(false);
    }
  }

  const canChangePassword = useMemo(() => {
    return passwordCurrent.length >= 6 && passwordNew.length >= 6;
  }, [passwordCurrent, passwordNew]);

  async function changePassword() {
    if (!canChangePassword) return;
    try {
      setBusy(true);
      await api.patch('/me', { passwordCurrent, passwordNew });
      setPasswordCurrent('');
      setPasswordNew('');
      success('Senha alterada com sucesso.');
    } catch (e: any) {
      if (!handleRateLimit(e)) {
        const fieldErrs = extractFieldErrors(e);
        const msg = fieldErrs.passwordCurrent || fieldErrs.passwordNew || friendlyTopMessage(e, 'Falha ao trocar a senha');
        notifyError(msg);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ 
      flex: 1, 
      backgroundColor: palette.background 
    }}>
      <ScreenHeader title="Perfil" subtitle="Gerencie suas informações pessoais" />
      <View style={{ 
        flex: 1,
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.lg,
        gap: Spacing.lg,
      }}>

        {/* Seção de Perfil */}
        <Card elevated>
          <Text style={{
            ...Typography.h4,
            color: palette.text,
            marginBottom: Spacing.md,
          }}>
            Informações Pessoais
          </Text>
          
          <View style={{ gap: Spacing.md }}>
            <TextField
              label="Nome"
              value={name}
              onChangeText={setName}
              editable={!busy && !retryAfter}
              placeholder="Seu nome"
            />
            
            <TextField
              label="Fuso Horário"
              value={timezone}
              onChangeText={setTimezone}
              editable={!busy && !retryAfter}
              placeholder="Ex.: America/Sao_Paulo"
            />

            <PrimaryButton
              title={retryAfter ? `AGUARDE ${retryAfter}s` : 'Salvar Perfil'}
              disabled={!canSaveProfile || !!retryAfter || busy}
              loading={busy}
              onPress={saveProfile}
            />
          </View>
        </Card>

        {/* Seção de Senha */}
        <Card elevated>
          <Text style={{
            ...Typography.h4,
            color: palette.text,
            marginBottom: Spacing.md,
          }}>
            Alterar Senha
          </Text>
          
          <View style={{ gap: Spacing.md }}>
            <TextField
              label="Senha atual"
              value={passwordCurrent}
              onChangeText={setPasswordCurrent}
              secureTextEntry
              editable={!busy && !retryAfter}
              placeholder="••••••"
            />
            
            <TextField
              label="Nova senha"
              value={passwordNew}
              onChangeText={setPasswordNew}
              secureTextEntry
              editable={!busy && !retryAfter}
              placeholder="••••••"
            />

            <PrimaryButton
              title={retryAfter ? `AGUARDE ${retryAfter}s` : 'Alterar Senha'}
              disabled={!canChangePassword || !!retryAfter || busy}
              loading={busy}
              onPress={changePassword}
              variant="secondary"
            />
          </View>
        </Card>

        {/* Reset Button */}
        <Pressable
          disabled={!!retryAfter || busy}
          onPress={() => {
            setName(user?.name || '');
            setTimezone(user?.timezone || '');
            setPasswordCurrent('');
            setPasswordNew('');
          }}
          style={{
            paddingVertical: Spacing.md,
            alignItems: 'center',
            opacity: (!!retryAfter || busy) ? 0.5 : 1,
          }}
        >
          <Text style={{
            ...Typography.caption,
            color: palette.primary,
            textDecorationLine: 'underline',
          }}>
            Reverter alterações locais
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
