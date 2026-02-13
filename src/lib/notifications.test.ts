import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  requestNotificationPermission,
  sendBrowserNotification,
  getNotificationPermissionState,
} from './notifications';

describe('notifications', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getNotificationPermissionState', () => {
    it('returns "unsupported" when Notification is not in window', () => {
      const origNotification = globalThis.Notification;
      // @ts-expect-error - removing Notification for test
      delete globalThis.Notification;
      expect(getNotificationPermissionState()).toBe('unsupported');
      globalThis.Notification = origNotification;
    });

    it('returns current permission when Notification exists', () => {
      Object.defineProperty(globalThis, 'Notification', {
        value: { permission: 'granted', requestPermission: vi.fn() },
        writable: true,
        configurable: true,
      });
      expect(getNotificationPermissionState()).toBe('granted');
    });
  });

  describe('requestNotificationPermission', () => {
    it('returns true immediately when already granted', async () => {
      Object.defineProperty(globalThis, 'Notification', {
        value: { permission: 'granted', requestPermission: vi.fn() },
        writable: true,
        configurable: true,
      });
      expect(await requestNotificationPermission()).toBe(true);
    });

    it('returns false when permission is denied', async () => {
      Object.defineProperty(globalThis, 'Notification', {
        value: { permission: 'denied', requestPermission: vi.fn() },
        writable: true,
        configurable: true,
      });
      expect(await requestNotificationPermission()).toBe(false);
    });

    it('requests permission when state is default', async () => {
      const requestPermission = vi.fn().mockResolvedValue('granted');
      Object.defineProperty(globalThis, 'Notification', {
        value: { permission: 'default', requestPermission },
        writable: true,
        configurable: true,
      });
      expect(await requestNotificationPermission()).toBe(true);
      expect(requestPermission).toHaveBeenCalled();
    });

    it('returns false when Notification is unsupported', async () => {
      const origNotification = globalThis.Notification;
      // @ts-expect-error - removing Notification for test
      delete globalThis.Notification;
      expect(await requestNotificationPermission()).toBe(false);
      globalThis.Notification = origNotification;
    });
  });

  describe('sendBrowserNotification', () => {
    it('creates a Notification when permission is granted', () => {
      const NotifConstructor = vi.fn();
      Object.defineProperty(globalThis, 'Notification', {
        value: Object.assign(NotifConstructor, { permission: 'granted' }),
        writable: true,
        configurable: true,
      });
      sendBrowserNotification('Title', 'Body');
      expect(NotifConstructor).toHaveBeenCalledWith('Title', {
        body: 'Body',
        icon: '/favicon.ico',
      });
    });

    it('does nothing when permission is not granted', () => {
      const NotifConstructor = vi.fn();
      Object.defineProperty(globalThis, 'Notification', {
        value: Object.assign(NotifConstructor, { permission: 'denied' }),
        writable: true,
        configurable: true,
      });
      sendBrowserNotification('Title', 'Body');
      expect(NotifConstructor).not.toHaveBeenCalled();
    });
  });
});
