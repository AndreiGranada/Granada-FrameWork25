import React from 'react';
import { View, Text, Button, FlatList } from 'react-native';
import { DefaultService } from '../../../sdk';
import { apiCall } from '../api/call';

export default function TodayIntakes() {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
      const data = await apiCall(() => DefaultService.getIntakes({ from: start, to: end }));
      setItems(data?.items ?? data ?? []);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    load();
  }, []);

  const markTaken = async (id: string) => {
    await apiCall(() => DefaultService.postIntakesTaken({ id }));
    await load();
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Button title={loading ? 'Atualizando...' : 'Atualizar'} onPress={load} />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee' }}>
            <Text>{item?.medicationReminder?.name || 'Medicação'}</Text>
            <Text>{new Date(item.scheduledAt).toLocaleTimeString()}</Text>
            {item.status === 'PENDING' && (
              <Button title="Marcar como tomado" onPress={() => markTaken(item.id)} />
            )}
          </View>
        )}
      />
    </View>
  );
}
