import { useEffect, useCallback, useRef } from 'react';
import { usePushNotifications } from './use-push-notifications';
import { notificationService } from '@/lib/notifications';
import { type Address } from 'viem';

const LAST_24H_CHECK_KEY = 'base_jungle_last_24h_check';
const YIELD_SNAPSHOT_KEY = 'base_jungle_yield_snapshot';
const CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in ms

interface YieldSnapshot {
  timestamp: number;
  usdcBalance: number;
  pointsBalance: number;
  harvestable: number;
}

export function useScheduledNotifications(
  address: Address | undefined,
  currentUSDC: number,
  currentPoints: number,
  harvestableYield: number
) {
  const { 
    notifyYield, 
    notifyHarvest, 
    notifyMilestone,
    isPermissionGranted,
    settings 
  } = usePushNotifications(address?.toString());
  
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get stored snapshot
  const getSnapshot = useCallback((): YieldSnapshot | null => {
    if (!address) return null;
    const stored = localStorage.getItem(`${YIELD_SNAPSHOT_KEY}_${address}`);
    return stored ? JSON.parse(stored) : null;
  }, [address]);

  // Save current snapshot
  const saveSnapshot = useCallback(() => {
    if (!address) return;
    const snapshot: YieldSnapshot = {
      timestamp: Date.now(),
      usdcBalance: currentUSDC,
      pointsBalance: currentPoints,
      harvestable: harvestableYield
    };
    localStorage.setItem(`${YIELD_SNAPSHOT_KEY}_${address}`, JSON.stringify(snapshot));
    localStorage.setItem(`${LAST_24H_CHECK_KEY}_${address}`, Date.now().toString());
  }, [address, currentUSDC, currentPoints, harvestableYield]);

  // Check and send 24h notification
  const check24HourNotification = useCallback(async () => {
    if (!address || !isPermissionGranted || !settings.enabled) return;

    const lastCheck = localStorage.getItem(`${LAST_24H_CHECK_KEY}_${address}`);
    const lastCheckTime = lastCheck ? parseInt(lastCheck, 10) : 0;
    const timeSinceLastCheck = Date.now() - lastCheckTime;

    // Only send if 24 hours have passed
    if (timeSinceLastCheck < CHECK_INTERVAL) {
      console.log('[Notifications] Not yet 24h since last check');
      return;
    }

    const snapshot = getSnapshot();
    
    // Calculate earnings since snapshot
    const usdcEarned = snapshot 
      ? Math.max(0, currentUSDC - snapshot.usdcBalance)
      : 0;
    const pointsEarned = snapshot 
      ? Math.max(0, currentPoints - snapshot.pointsBalance)
      : 0;

    // Send notification if there are earnings
    if (usdcEarned > settings.yieldThreshold || pointsEarned > settings.pointsThreshold) {
      console.log('[Notifications] Sending 24h yield notification');
      await notifyYield(usdcEarned, pointsEarned);
    }

    // Check for harvest reminder
    if (settings.harvestReminder && harvestableYield >= settings.yieldThreshold) {
      console.log('[Notifications] Sending harvest reminder');
      await notifyHarvest(harvestableYield, pointsEarned);
    }

    // Check for milestones (every $100, $500, $1000, etc.)
    if (settings.milestoneAlerts) {
      const milestones = [100, 500, 1000, 5000, 10000, 50000, 100000];
      for (const milestone of milestones) {
        const wasBelow = snapshot ? snapshot.usdcBalance < milestone : true;
        const isAbove = currentUSDC >= milestone;
        if (wasBelow && isAbove) {
          await notifyMilestone(`$${milestone.toLocaleString()} Total Value!`, currentUSDC);
          break;
        }
      }
    }

    // Save new snapshot
    saveSnapshot();
  }, [
    address, isPermissionGranted, settings, currentUSDC, currentPoints, 
    harvestableYield, getSnapshot, saveSnapshot, notifyYield, notifyHarvest, notifyMilestone
  ]);

  // Register for periodic background sync (when available)
  const registerPeriodicSync = useCallback(async () => {
    if ('serviceWorker' in navigator && 'periodicSync' in ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        // @ts-ignore - periodicSync is experimental
        const status = await navigator.permissions.query({
          name: 'periodic-background-sync' as PermissionName,
        });
        
        if (status.state === 'granted') {
          // @ts-ignore - periodicSync is experimental
          await registration.periodicSync.register('yield-check', {
            minInterval: CHECK_INTERVAL,
          });
          console.log('[Notifications] Periodic sync registered for 24h checks');
        }
      } catch (error) {
        console.log('[Notifications] Periodic sync not available:', error);
      }
    }
  }, []);

  // Setup effects
  useEffect(() => {
    if (!address || !isPermissionGranted) return;

    // Initial check
    check24HourNotification();

    // Set up periodic check (as fallback when app is open)
    checkIntervalRef.current = setInterval(() => {
      check24HourNotification();
    }, 60 * 60 * 1000); // Check every hour when app is open

    // Try to register for background sync
    registerPeriodicSync();

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [address, isPermissionGranted, check24HourNotification, registerPeriodicSync]);

  // Save snapshot on significant changes
  useEffect(() => {
    if (!address) return;
    
    const snapshot = getSnapshot();
    if (!snapshot) {
      // First time - save initial snapshot
      saveSnapshot();
    }
  }, [address, getSnapshot, saveSnapshot]);

  // Schedule background notification via service worker
  useEffect(() => {
    if (!address || !isPermissionGranted) return;

    // Send data to service worker for 24h background check
    notificationService.scheduleBackgroundNotification(
      address.toString(),
      currentUSDC,
      currentPoints,
      harvestableYield
    );
  }, [address, currentUSDC, currentPoints, harvestableYield, isPermissionGranted]);

  return {
    check24HourNotification,
    saveSnapshot,
    getSnapshot
  };
}

export default useScheduledNotifications;

