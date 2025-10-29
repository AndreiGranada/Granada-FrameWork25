import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, width: '100%', maxWidth: 360 }}>
          <Text style={{ fontSize: 16, fontWeight: '700' }}>{title}</Text>
          {message ? <Text style={{ color: '#444', marginTop: 8 }}>{message}</Text> : null}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
            <TouchableOpacity onPress={onCancel}>
              <Text style={{ color: '#6b7280', fontWeight: '600' }}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onConfirm}>
              <Text style={{ color: '#dc2626', fontWeight: '700' }}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
