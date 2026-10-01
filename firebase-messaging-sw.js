// ─── Hintonn PMO — Firebase Messaging Service Worker ───
// Required for background push notifications
// Phase 6: Real-time push delivery for BG expiry, DLP alerts, invoices

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: self.FIREBASE_API_KEY || "AIzaSyBt1yVDlgfYaCMvWjbqrHGL1kpDudjKB5A",
  authDomain: self.FIREBASE_AUTH_DOMAIN || "hintonn-pmo.firebaseapp.com",
  projectId: self.FIREBASE_PROJECT_ID || "hintonn-pmo",
  storageBucket: self.FIREBASE_STORAGE_BUCKET || "hintonn-pmo.appspot.com",
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID || "516528306945",
  appId: self.FIREBASE_APP_ID || "1:516528306945:web:9b9a88accbd424115df900"
};

try {
  if (!firebase.apps || !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
} catch (e) {
  console.warn('[SW] Firebase initializeApp warning:', e);
}

let messaging = null;
try {
  messaging = firebase.messaging();
} catch (e) {
  console.warn('[SW] firebase.messaging() init warning:', e);
}

// Handle background messages from Cloud Functions + n8n
if (messaging && typeof messaging.onBackgroundMessage === 'function') {
  messaging.onBackgroundMessage(payload => {
  console.log('[SW] Background message received:', payload);

  const { title, body, icon } = payload.notification || {};
  const data = payload.data || {};

  // Determine notification priority from data payload
  const priority = data.priority || 'normal';
  const tag = data.type || 'general';
  const url = data.url || '/#dashboard';

  // Show system notification
  self.registration.showNotification(title || 'Hintonn PMO', {
    body: body || 'You have a new notification',
    icon: icon || '/assets/hintonn-logo.png',
    badge: '/assets/hintonn-logo.png',
    tag: tag,
    requireInteraction: priority === 'critical',
    data: { ...data, url },
    actions: [
      { action: 'open', title: 'Open Dashboard' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  });

  // Broadcast to all open clients for real-time in-app update
  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'FCM_BACKGROUND_MESSAGE',
        payload: { title, body, data }
      });
    });
  });
  });
}

// Handle notification click — smart route to relevant screen
self.addEventListener('notificationclick', event => {
  event.notification.close();

  const action = event.action;
  if (action === 'dismiss') return;

  const data = event.notification.data || {};
  let url = data.url || '/#dashboard';

  // Smart routing based on notification type
  if (data.type === 'bankGuarantee' || data.type === 'bg') {
    url = '/#bank-guarantees';
  } else if (data.type === 'invoice') {
    url = '/#billing';
  } else if (data.type === 'dlp') {
    url = '/#dlp';
  } else if (data.type === 'task') {
    url = '/#tasks';
  } else if (data.type === 'milestone') {
    url = '/#milestones';
  } else if (data.type === 'project') {
    url = '/#projects';
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', event => {
  const data = event.notification.data || {};
  console.log('[SW] Notification dismissed:', data.type || 'unknown');
});