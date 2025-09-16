import React from 'react';
import { View, Text, Button, FlatList } from 'react-native';
import { DefaultService } from '../../../sdk';
import { apiCall } from '../api/call';

export default function RemindersList() {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiCall(() => DefaultService.getReminders());
      setItems(data?.items ?? data ?? []);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { load(); }, []);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Button title={loading ? 'Atualizando...' : 'Atualizar'} onPress={load} />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee' }}>
            <Text>{item.name}</Text>
            <Text>{item.schedules?.map((s: any) => s.ingestionTimeMinutes).join(', ')}</Text>
          </View>
        )}
      />
    </View>
  );
}
