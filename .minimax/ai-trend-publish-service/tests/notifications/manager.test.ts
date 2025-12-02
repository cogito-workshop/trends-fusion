import { NotificationManager } from '../../src/notifications/manager.js';

describe('NotificationManager', () => {
  let manager: NotificationManager;

  beforeAll(() => {
    manager = NotificationManager.getInstance();
  });

  it('should be a singleton', () => {
    const instance2 = NotificationManager.getInstance();
    expect(manager).toBe(instance2);
  });

  it('should get provider list', () => {
    const providers = manager.getProviders();
    expect(Array.isArray(providers)).toBe(true);
  });

  it('should send info notification', async () => {
    await expect(manager.sendInfo('Test', 'Test message')).resolves.not.toThrow();
  });

  it('should send success notification', async () => {
    await expect(manager.sendSuccess('Test Success', 'Success message')).resolves.not.toThrow();
  });

  it('should send warning notification', async () => {
    await expect(manager.sendWarning('Test Warning', 'Warning message')).resolves.not.toThrow();
  });

  it('should send error notification', async () => {
    await expect(manager.sendError('Test Error', 'Error message')).resolves.not.toThrow();
  });
});
