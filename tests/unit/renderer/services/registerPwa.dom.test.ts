import { afterEach, describe, expect, it, vi } from 'vitest';
import { registerPwa } from '@renderer/services/registerPwa';

afterEach(() => {
  Reflect.deleteProperty(navigator, 'serviceWorker');
});

describe('registerPwa', () => {
  it('registers the service worker on supported secure browser origins', async () => {
    const registration = { scope: './' } as ServiceWorkerRegistration;
    const register = vi.fn().mockResolvedValue(registration);

    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { register },
    });

    await expect(registerPwa()).resolves.toBe(registration);
    expect(register).toHaveBeenCalledWith('./sw.js', { scope: './' });
  });

  it('skips registration when serviceWorker is unavailable', async () => {
    Reflect.deleteProperty(navigator, 'serviceWorker');
    await expect(registerPwa()).resolves.toBeUndefined();
  });

  it('returns undefined when registration fails', async () => {
    const register = vi.fn().mockRejectedValue(new Error('Security error'));

    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { register },
    });

    await expect(registerPwa()).resolves.toBeUndefined();
    expect(register).toHaveBeenCalled();
  });
});
