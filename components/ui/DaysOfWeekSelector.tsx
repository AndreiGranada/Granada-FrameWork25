import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

type Props = {
  value: number; // 0 = todos os dias; soma de bits 1..64
  onChange: (value: number) => void;
  allowDailyOption?: boolean;
  disabled?: boolean;
};

const DAYS = [
  { bit: 1, label: 'Dom' },
  { bit: 2, label: 'Seg' },
  { bit: 4, label: 'Ter' },
  { bit: 8, label: 'Qua' },
  { bit: 16, label: 'Qui' },
  { bit: 32, label: 'Sex' },
  { bit: 64, label: 'Sáb' },
];

const FULL_MASK = DAYS.reduce((acc, d) => acc + d.bit, 0); // 127

export default function DaysOfWeekSelector({ value, onChange, allowDailyOption = true, disabled }: Props) {
  const isDaily = value === 0;

  function toggleDay(bit: number) {
    if (disabled) return;
    if (isDaily) {
      // sair de diário (0) para específico, removendo o dia clicado
      const newMask = FULL_MASK & ~bit;
      onChange(newMask);
      return;
    }
    const has = (value & bit) === bit;
    const newMask = has ? value & ~bit : value | bit;
    // se todos marcados (== FULL_MASK), voltar para diário (0)
    onChange(newMask === FULL_MASK ? 0 : newMask);
  }

  function setDaily() {
    if (disabled) return;
    onChange(0);
  }

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {DAYS.map((d) => {
          const selected = isDaily ? true : (value & d.bit) === d.bit;
          return (
            <TouchableOpacity
              key={d.bit}
              onPress={() => toggleDay(d.bit)}
              disabled={disabled}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: selected ? '#0a84ff' : '#ccc',
                backgroundColor: selected ? '#0a84ff' : '#fff',
                opacity: disabled ? 0.6 : 1,
              }}
            >
              <Text style={{ color: selected ? '#fff' : '#333' }}>{d.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {allowDailyOption && (
        <TouchableOpacity onPress={setDaily} disabled={disabled}>
          <Text style={{ color: '#0a84ff' }}>
            {isDaily ? 'Diário (selecionado)' : 'Usar diário (todos os dias)'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
