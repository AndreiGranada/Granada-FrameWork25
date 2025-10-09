import React from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View, Text } from 'react-native';
import { useAuthStore, useThemeStore } from '@/src/store';
import { Colors } from '@/constants/theme';

export default function Index() {
  // Hooks sempre no topo
  const { user, isLoading } = useAuthStore();
  const { mode } = useThemeStore();
  const palette = Colors[mode];
  
  
  if (isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: palette.background 
      }}>
        <ActivityIndicator color={palette.primary} size="large" />
        <Text style={{ 
          color: palette.text, 
          marginTop: 16,
          fontSize: 16
        }}>
          Carregando...
        </Text>
      </View>
    );
  }
    
  if (!user) {
    return <Redirect href="/login" />;
  }
  
  return <Redirect href="/home" />;
}
