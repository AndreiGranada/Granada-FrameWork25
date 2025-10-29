import { create } from 'zustand';

interface IntakesUiState {
    lastMarkedIntakeId?: string;
    setLastMarkedIntakeId: (id?: string | null) => void;
    consumeLastMarkedIntakeId: () => string | undefined;
}

export const useIntakesUiStore = create<IntakesUiState>((set, get) => ({
    lastMarkedIntakeId: undefined,
    setLastMarkedIntakeId: (id) => {
        set({ lastMarkedIntakeId: id ?? undefined });
    },
    consumeLastMarkedIntakeId: () => {
        const id = get().lastMarkedIntakeId;
        if (id) {
            set({ lastMarkedIntakeId: undefined });
        }
        return id;
    },
}));
