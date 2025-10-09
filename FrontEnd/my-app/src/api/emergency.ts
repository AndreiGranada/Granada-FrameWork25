import { api } from "./client";

export type EmergencyContact = {
    id: string;
    name: string;
    phone: string;
    customMessage?: string | null;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
};

export type EmergencyContactCreate = {
    name: string;
    phone: string;
    customMessage?: string;
    isActive?: boolean;
};

export type EmergencyContactUpdate = {
    name?: string;
    phone?: string;
    customMessage?: string | null;
    isActive?: boolean;
};

export async function listEmergencyContacts() {
    const { data } = await api.get<EmergencyContact[]>("/emergency/emergency-contacts");
    return data; // backend já retorna em ordem de criação
}

export async function createEmergencyContact(payload: EmergencyContactCreate) {
    const { data } = await api.post<EmergencyContact>(
        "/emergency/emergency-contacts",
        payload
    );
    return data;
}

export async function updateEmergencyContact(
    id: string,
    payload: EmergencyContactUpdate
) {
    const { data } = await api.patch<EmergencyContact>(
        `/emergency/emergency-contacts/${id}`,
        payload
    );
    return data;
}

export async function deleteEmergencyContact(id: string) {
    await api.delete(`/emergency/emergency-contacts/${id}`);
}
