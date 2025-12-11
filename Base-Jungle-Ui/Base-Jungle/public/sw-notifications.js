// Service Worker for Base Jungle Push Notifications

const CACHE_NAME = 'base-jungle-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Activated');
  event.waitUntil(clients.claim());
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();

  // Handle different actions
  if (event.action === 'harvest') {
    // Open app and navigate to harvest
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // If app is already open, focus it
        for (const client of clientList) {
          if (client.url.includes('basejungle') && 'focus' in client) {
            client.focus();
            client.postMessage({ action: 'harvest' });
            return;
          }
        }
        // Otherwise open new window
        if (clients.openWindow) {
          return clients.openWindow('/?action=harvest');
        }
      })
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default: open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Handle push events (for server-sent notifications)
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');
  
  let data = {
    title: '🌴 Base Jungle',
    body: 'You have updates!',
    icon: '/jungle-icon.png'
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/jungle-icon.png',
    badge: '/jungle-badge.png',
    tag: 'base-jungle-notification',
    renotify: true,
    data: data,
    actions: [
      { action: 'harvest', title: '🌿 Harvest' },
      { action: 'dismiss', title: 'Later' }
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
    console.log('[SW] Syncing yield data...');
    // Could fetch yield data from API here
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'yield-check') {
    console.log('[SW] Periodic yield check');
    event.waitUntil(checkYieldAndNotify());
  }
});

async function checkYieldAndNotify() {
  // This would call your API to check yield
  // For now, just a placeholder
  try {
    const response = await fetch('/api/yield-status');
    const data = await response.json();
    
    if (data.harvestable > 0) {
      self.registration.showNotification('🌿 Ready to Harvest!', {
        body: `$${data.harvestable.toFixed(2)} USDC waiting for you!`,
        icon: '/jungle-icon.png',
        tag: 'harvest-ready',
        actions: [
          { action: 'harvest', title: '🌿 Harvest Now' }
        ]
      });
    }
  } catch (error) {
    console.log('[SW] Failed to check yield:', error);
  }
}

