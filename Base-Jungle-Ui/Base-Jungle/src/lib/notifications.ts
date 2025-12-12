// Push Notification Service for Base Jungle
// Uses Web Push API + Service Worker for mobile notifications

export interface YieldNotification {
  type: 'yield' | 'points' | 'harvest' | 'milestone';
  title: string;
  body: string;
  data?: {
    usdcAmount?: number;
    pointsAmount?: number;
    action?: string;
  };
}

class NotificationService {
  private static instance: NotificationService;
  private swRegistration: ServiceWorkerRegistration | null = null;
  private isSupported: boolean = false;

  private constructor() {
    this.isSupported = 'Notification' in window && 'serviceWorker' in navigator;
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported) {
      console.log('Notifications not supported');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  async registerServiceWorker(): Promise<boolean> {
    if (!this.isSupported) return false;

    try {
      this.swRegistration = await navigator.serviceWorker.register('/sw-notifications.js');
      console.log('Service Worker registered');
      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  async sendLocalNotification(notification: YieldNotification): Promise<void> {
    if (!this.isSupported) return;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    // Format the notification
    const options: NotificationOptions = {
      body: notification.body,
      icon: '/jungle-icon.png',
      badge: '/jungle-badge.png',
      tag: notification.type,
      renotify: true,
      requireInteraction: notification.type === 'harvest',
      data: notification.data,
      actions: notification.type === 'harvest' ? [
        { action: 'harvest', title: '🌿 Harvest Now' },
        { action: 'dismiss', title: 'Later' }
      ] : undefined,
      vibrate: [200, 100, 200]
    };

    if (this.swRegistration) {
      await this.swRegistration.showNotification(notification.title, options);
    } else {
      new Notification(notification.title, options);
    }
  }

  // Send yield earned notification
  async notifyYieldEarned(usdcAmount: number, pointsAmount: number): Promise<void> {
    await this.sendLocalNotification({
      type: 'yield',
      title: '🌴 Yield Growing!',
      body: `You've earned +$${usdcAmount.toFixed(2)} USDC and +${pointsAmount.toLocaleString()} points!`,
      data: { usdcAmount, pointsAmount }
    });
  }

  // Send harvest reminder
  async notifyHarvestReady(usdcAmount: number, pointsAmount: number): Promise<void> {
    await this.sendLocalNotification({
      type: 'harvest',
      title: '🌿 Ready to Harvest!',
      body: `$${usdcAmount.toFixed(2)} USDC + ${pointsAmount.toLocaleString()} points waiting!`,
      data: { usdcAmount, pointsAmount, action: 'harvest' }
    });
  }

  // Send milestone notification
  async notifyMilestone(milestone: string, totalEarned: number): Promise<void> {
    await this.sendLocalNotification({
      type: 'milestone',
      title: '🏆 Milestone Reached!',
      body: `${milestone} - Total earned: $${totalEarned.toFixed(2)}`,
      data: { usdcAmount: totalEarned }
    });
  }

  // Check if we should send periodic notification
  shouldSendNotification(lastNotificationTime: number, minIntervalHours: number = 6): boolean {
    const hoursSinceLastNotification = (Date.now() - lastNotificationTime) / (1000 * 60 * 60);
    return hoursSinceLastNotification >= minIntervalHours;
  }

  // Schedule background notification via service worker
  async scheduleBackgroundNotification(
    address: string,
    balance: number,
    points: number,
    harvestable: number
  ): Promise<void> {
    if (!this.swRegistration?.active) return;

    this.swRegistration.active.postMessage({
      type: 'SCHEDULE_NOTIFICATION',
      address,
      balance,
      points,
      harvestable
    });
    console.log('Background notification scheduled');
  }

  // Send immediate notification via service worker
  async sendViaServiceWorker(
    title: string,
    body: string,
    usdcAmount: number,
    pointsAmount: number
  ): Promise<void> {
    if (!this.swRegistration?.active) return;

    this.swRegistration.active.postMessage({
      type: 'SEND_NOTIFICATION',
      title,
      body,
      usdcAmount,
      pointsAmount
    });
  }
}

export const notificationService = NotificationService.getInstance();
export default NotificationService;

