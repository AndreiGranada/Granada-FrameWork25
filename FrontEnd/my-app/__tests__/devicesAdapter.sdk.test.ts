import { Device } from '@/sdk-backend/models/Device';
import { DeviceCreate } from '@/sdk-backend/models/DeviceCreate';
import { __setDevicesSdkMock, devicesAdapter } from '@/src/services/adapters/devicesAdapter';

describe('devicesAdapter via SDK mock', () => {
    beforeEach(() => {
        __setDevicesSdkMock({
            listDevices: jest.fn(async () => [
                { id: 'd2', platform: Device.platform.ANDROID, pushToken: 't2', isActive: true },
                { id: 'd1', platform: Device.platform.IOS, pushToken: 't1', isActive: true }
            ]),
            registerDevice: jest.fn(async ({ requestBody }: any) => ({ id: 'd3', isActive: true, ...requestBody })),
            updateDevice: jest.fn(async ({ id, requestBody }: any) => ({ id, isActive: true, pushToken: 'updated', ...requestBody })),
            deleteDevice: jest.fn(async () => { })
        });
    });

    it('lista devices via mock', async () => {
        const list = await devicesAdapter.list();
        expect(list).toHaveLength(2);
    });

    it('registra device via mock', async () => {
        const created = await devicesAdapter.register({ platform: DeviceCreate.platform.ANDROID, pushToken: 'x' });
        expect(created.id).toBe('d3');
    });

    it('atualiza device via mock', async () => {
        const updated = await devicesAdapter.update('d2', { isActive: false });
        expect(updated.id).toBe('d2');
    });

    it('remove device via mock sem erro', async () => {
        await expect(devicesAdapter.remove('d1')).resolves.toBeUndefined();
    });
});
