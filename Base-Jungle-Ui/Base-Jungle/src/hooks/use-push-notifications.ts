import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '@/lib/notifications';

interface NotificationSettings {
  enabled: boolean;
  yieldThreshold: number;      // Min USDC to trigger notification
  pointsThreshold: number;     // Min points to trigger notification
  harvestReminder: boolean;    // Remind when harvest is available
  milestoneAlerts: boolean;    // Alert on milestones
  intervalHours: number;       // Min hours between notifications
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  yieldThreshold: 1,        // $1 minimum
  pointsThreshold: 100,     // 100 points minimum
  harvestReminder: true,
  milestoneAlerts: true,
  intervalHours: 6
};

const STORAGE_KEY = 'base_jungle_notification_settings';
const LAST_NOTIFICATION_KEY = 'base_jungle_last_notification';

export function usePushNotifications(address?: string) {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [lastNotificationTime, setLastNotificationTime] = useState(0);
  const [isSupported, setIsSupported] = useState(false);

  // Load settings and check permission on mount
  useEffect(() => {
    setIsSupported('Notification' in window);

    // Load settings
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSettings(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load notification settings');
      }
    }

    // Load last notification time
    const lastTime = localStorage.getItem(LAST_NOTIFICATION_KEY);
    if (lastTime) {
      setLastNotificationTime(parseInt(lastTime, 10));
    }

    // Check current permission
    if ('Notification' in window) {
      setIsPermissionGranted(Notification.permission === 'granted');
    }

    // Register service worker
    notificationService.registerServiceWorker();
  }, []);

  // Save settings
  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Request permission
  const requestPermission = useCallback(async () => {
    const granted = await notificationService.requestPermission();
    setIsPermissionGranted(granted);
    return granted;
  }, []);

  // Check if we should send a notification
  const shouldNotify = useCallback(() => {
    if (!settings.enabled || !isPermissionGranted) return false;
    return notificationService.shouldSendNotification(lastNotificationTime, settings.intervalHours);
  }, [settings, isPermissionGranted, lastNotificationTime]);

  // Send yield notification
  const notifyYield = useCallback(async (usdcAmount: number, pointsAmount: number) => {
    if (!shouldNotify()) return;
    if (usdcAmount < settings.yieldThreshold && pointsAmount < settings.pointsThreshold) return;

    await notificationService.notifyYieldEarned(usdcAmount, pointsAmount);
    
    const now = Date.now();
    setLastNotificationTime(now);
    localStorage.setItem(LAST_NOTIFICATION_KEY, now.toString());
  }, [shouldNotify, settings]);

  // Send harvest reminder
  const notifyHarvest = useCallback(async (usdcAmount: number, pointsAmount: number) => {
    if (!settings.enabled || !settings.harvestReminder || !isPermissionGranted) return;
    if (usdcAmount < settings.yieldThreshold) return;

    await notificationService.notifyHarvestReady(usdcAmount, pointsAmount);
    
    const now = Date.now();
    setLastNotificationTime(now);
    localStorage.setItem(LAST_NOTIFICATION_KEY, now.toString());
  }, [settings, isPermissionGranted]);

  // Send milestone notification
  const notifyMilestone = useCallback(async (milestone: string, totalEarned: number) => {
    if (!settings.enabled || !settings.milestoneAlerts || !isPermissionGranted) return;

    await notificationService.notifyMilestone(milestone, totalEarned);
  }, [settings, isPermissionGranted]);

  return {
    settings,
    updateSettings,
    isPermissionGranted,
    isSupported,
    requestPermission,
    notifyYield,
    notifyHarvest,
    notifyMilestone,
    shouldNotify
  };
}

export default usePushNotifications;

