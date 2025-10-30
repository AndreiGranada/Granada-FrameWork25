import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useAuthStore } from '@/src/store/authStore';
import { useOffline } from '@/src/hooks/useOffline';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const OfflineBanner: React.FC = () => {
  const { offlineWarning, clearOfflineWarning, refreshMe, isLoading } = useAuthStore();
  const { retrying } = useOffline();
  const insets = useSafeAreaInsets();
  if (!offlineWarning) return null;
  const retry = async () => {
    try {
      await refreshMe();
      clearOfflineWarning();
    } catch {
      // permanece
    }
  };
  return (
    <View style={[styles.container, { paddingTop: insets.top + 4 }]}>      
      <Text style={styles.text}>
        {retrying ? 'Reconectando...' : 'Sem conexão ou servidor indisponível.'}
      </Text>
      <TouchableOpacity style={styles.btn} onPress={retry} disabled={isLoading}>
        <Text style={styles.btnText}>{isLoading ? '...' : 'Tentar novamente'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.close} onPress={clearOfflineWarning}>
        <Text style={styles.closeText}>×</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#B00020',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
    zIndex: 1000,
    gap: 12,
  },
  text: { color: '#fff', flex: 1, fontSize: 13, fontWeight: '500' },
  btn: { backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: Platform.OS === 'web' ? 6 : 4, borderRadius: 4 },
  btnText: { color: '#B00020', fontSize: 12, fontWeight: '600' },
  close: { padding: 4 },
  closeText: { color: '#fff', fontSize: 18, lineHeight: 18 },
});
