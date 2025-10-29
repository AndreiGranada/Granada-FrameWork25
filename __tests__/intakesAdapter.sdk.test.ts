import { __setIntakesSdkMock, intakesAdapter } from '@/src/services/adapters/intakesAdapter';

describe('intakesAdapter via SDK mock', () => {
    beforeEach(() => {
        __setIntakesSdkMock({
            listIntakes: jest.fn(async () => [{ id: 'i1', at: new Date().toISOString(), status: 'PENDING' }]),
            markIntakeTaken: jest.fn(async ({ id }: any) => ({ id, at: new Date().toISOString(), status: 'TAKEN' })),
        });
    });

    it('lista intakes via mock', async () => {
        const list = await intakesAdapter.list();
        expect(list[0].id).toBe('i1');
    });

    it('marca intake como taken via mock', async () => {
        const taken = await intakesAdapter.markTaken('i1');
        expect(taken.status).toBe('TAKEN');
    });
});
