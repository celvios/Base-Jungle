// Service Worker for Base Jungle Push Notifications
// Handles background notifications every 24 hours

const CACHE_NAME = 'base-jungle-v1';
const CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Base Jungle Notification Service...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] 🌴 Base Jungle Notification Service Activated');
  event.waitUntil(clients.claim());
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();

  const urlToOpen = new URL(self.location.origin);

  // Handle different actions
  if (event.action === 'harvest') {
    urlToOpen.searchParams.set('action', 'harvest');
  } else if (event.action === 'view') {
    urlToOpen.pathname = '/dashboard';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it and send message
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if (event.action === 'harvest') {
            client.postMessage({ type: 'OPEN_HARVEST_MODAL' });
          }
          return;
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen.toString());
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed');
});

// Handle push events (for server-sent notifications)
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');
  
  let data = {
    title: '🌴 Base Jungle',
    body: 'You have updates!',
    icon: '/jungle-icon.png',
    badge: '/jungle-badge.png',
    tag: 'base-jungle-update'
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    renotify: true,
    requireInteraction: data.requireInteraction || false,
    data: data,
    actions: [
      { action: 'harvest', title: '🌿 Harvest Now' },
      { action: 'view', title: '👀 View' }
    ],
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Background sync for checking yield
self.addEventListener('sync', (event) => {
  if (event.tag === 'check-yield') {
    console.log('[SW] Background sync: checking yield...');
    event.waitUntil(checkYieldAndNotify());
  }
});

// Periodic background sync (24-hour check)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'yield-check') {
    console.log('[SW] Periodic sync (24h): checking yield...');
    event.waitUntil(checkYieldAndNotify());
  }
});

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'SCHEDULE_NOTIFICATION') {
    // Store user data for 24h check
    const { address, balance, points, harvestable } = event.data;
    storeUserData(address, balance, points, harvestable);
  }
  
  if (event.data.type === 'SEND_NOTIFICATION') {
    const { title, body, usdcAmount, pointsAmount } = event.data;
    sendYieldNotification(title, body, usdcAmount, pointsAmount);
  }
});

// Store user data in IndexedDB for background checks
async function storeUserData(address, balance, points, harvestable) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const data = {
      address,
      balance,
      points,
      harvestable,
      timestamp: Date.now()
    };
    await cache.put('user-data', new Response(JSON.stringify(data)));
    console.log('[SW] User data stored for background check');
  } catch (error) {
    console.log('[SW] Failed to store user data:', error);
  }
}

// Get stored user data
async function getStoredUserData() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match('user-data');
    if (response) {
      return await response.json();
    }
  } catch (error) {
    console.log('[SW] Failed to get user data:', error);
  }
  return null;
}

// Check yield and send notification
async function checkYieldAndNotify() {
  try {
    const userData = await getStoredUserData();
    
    if (!userData) {
      console.log('[SW] No user data stored');
      return;
    }

    const { address, balance, points, harvestable, timestamp } = userData;
    
    // Check if 24 hours have passed
    const hoursSinceLastCheck = (Date.now() - timestamp) / (1000 * 60 * 60);
    if (hoursSinceLastCheck < 24) {
      console.log('[SW] Not yet 24h, skipping notification');
      return;
    }

    // Send notification about harvestable yield
    if (harvestable > 0) {
      await sendYieldNotification(
        '🌿 Ready to Harvest!',
        `$${harvestable.toFixed(2)} USDC + ${points.toLocaleString()} points waiting for you!`,
        harvestable,
        points
      );
    } else if (balance > 0) {
      await sendYieldNotification(
        '🌴 Your Jungle is Growing!',
        `Balance: $${balance.toFixed(2)} USDC | Check your yield!`,
        balance,
        points
      );
    }

  } catch (error) {
    console.log('[SW] Failed to check yield:', error);
  }
}

// Send yield notification
async function sendYieldNotification(title, body, usdcAmount, pointsAmount) {
  const options = {
    body,
    icon: '/jungle-icon.png',
    badge: '/jungle-badge.png',
    tag: 'yield-notification',
    renotify: true,
    requireInteraction: true,
    data: {
      usdcAmount,
      pointsAmount,
      action: 'harvest',
      url: '/?action=harvest'
    },
    actions: [
      { action: 'harvest', title: '🌿 Harvest Now' },
      { action: 'view', title: '👀 View Dashboard' }
    ],
    vibrate: [200, 100, 200, 100, 200]
  };

  await self.registration.showNotification(title, options);
  console.log('[SW] 📲 Notification sent:', title);
}
