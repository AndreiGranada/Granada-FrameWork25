import { __setEmergencyContactsSdkMock, emergencyContactsAdapter } from '@/src/services/adapters/emergencyContactsAdapter';

describe('emergencyContactsAdapter via SDK mock', () => {
    beforeEach(() => {
        __setEmergencyContactsSdkMock({
            listEmergencyContacts: jest.fn(async () => [
                { id: 'c1', name: 'Ana', phone: '111', customMessage: 'Msg A', isActive: true },
                { id: 'c2', name: 'Bruno', phone: '222', customMessage: 'Msg B', isActive: true }
            ]),
            createEmergencyContact: jest.fn(async ({ requestBody }: any) => ({ id: 'c3', customMessage: null, isActive: true, ...requestBody })),
            updateEmergencyContact: jest.fn(async ({ id, requestBody }: any) => ({ id, customMessage: 'Upd', isActive: true, ...requestBody })),
            deleteEmergencyContact: jest.fn(async () => { })
        });
    });

    it('lista contatos via mock', async () => {
        const list = await emergencyContactsAdapter.list();
        expect(list.map(c => c.id)).toEqual(['c1', 'c2']);
    });

    it('cria contato via mock', async () => {
        const created = await emergencyContactsAdapter.create({ name: 'Carla', phone: '333', isActive: true });
        expect(created.id).toBe('c3');
    });

    it('atualiza contato via mock', async () => {
        const updated = await emergencyContactsAdapter.update('c1', { name: 'Ana Maria' });
        expect(updated.name).toBe('Ana Maria');
    });

    it('remove contato via mock sem erro', async () => {
        await expect(emergencyContactsAdapter.remove('c1')).resolves.toBeUndefined();
    });
});
