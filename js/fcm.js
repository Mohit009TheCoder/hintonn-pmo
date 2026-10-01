// ─── Hintonn PMO — Firebase Cloud Messaging (FCM) Push Notifications ───
// Phase 6: Real-time push for Cloud Function events + topic subscriptions
const FCM = {
  _messaging: null,
  _token: null,
  _initialized: false,

  async init() {
    if (this._initialized) return;
    if (typeof firebase === 'undefined' || !firebase.messaging) {
      console.warn('[FCM] Firebase Messaging SDK not loaded');
      return;
    }
    try {
      this._messaging = firebase.messaging();
      this._initialized = true;

      // Listen for background messages forwarded from service worker
      this._listenServiceWorkerMessages();

      // Only request permission if user previously granted or we have a pref
      const prefs = Store.getNotificationPrefs();
      if (prefs.pushEnabled) {
        await this._requestPermission();
      }
    } catch (err) {
      console.error('[FCM] Init error:', err);
    }
  },

  async _requestPermission() {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('[FCM] Notification permission granted');
        await this._getToken();
        this._listenForeground();
        this._subscribeToTopics();
        return true;
      } else {
        console.warn('[FCM] Notification permission denied');
        return false;
      }
    } catch (err) {
      console.error('[FCM] Permission request error:', err);
      return false;
    }
  },

  async enablePush() {
    if (!this._initialized) await this.init();
    if (!this._messaging) {
      Toast.show('Push notifications are not supported in this browser', 'error');
      return false;
    }
    const granted = await this._requestPermission();
    if (granted) {
      const prefs = Store.getNotificationPrefs();
      prefs.pushEnabled = true;
      Store.saveNotificationPrefs(prefs);
      Toast.show('Push notifications enabled', 'success');
    } else {
      Toast.show('Notification permission was denied by the browser', 'error');
    }
    return granted;
  },

  async disablePush() {
    await this.revokeToken();
    const prefs = Store.getNotificationPrefs();
    prefs.pushEnabled = false;
    Store.saveNotificationPrefs(prefs);
    Toast.show('Push notifications disabled');
  },

  async _getToken() {
    try {
      const opts = {};
      if (window.FCM_VAPID_KEY && window.FCM_VAPID_KEY !== 'YOUR_VAPID_KEY') {
        opts.vapidKey = window.FCM_VAPID_KEY;
      }
      this._token = await this._messaging.getToken(opts);
      console.log('[FCM] Token obtained:', this._token ? 'yes' : 'no');
      if (this._token && typeof Store !== 'undefined' && Store._db) {
        const user = (typeof firebase !== 'undefined' && firebase.auth) ? firebase.auth().currentUser : null;
        if (user) {
          // Store token in Firestore user document
          await Store._db.collection('users').doc(user.uid).set({
            fcmToken: this._token,
            fcmTokenUpdatedAt: (typeof firebase !== 'undefined' && firebase.firestore) ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
          }, { merge: true });
        }
      }
    } catch (err) {
      console.warn('[FCM] Token acquisition notice:', err.message || err);
    }
  },

  // Subscribe to Cloud Function notification topics
  async _subscribeToTopics() {
    if (!this._messaging || !this._token) return;
    try {
      // Subscribe to all notification topics based on user preferences
      const prefs = (typeof Store !== 'undefined' && Store.getNotificationPrefs) ? Store.getNotificationPrefs() : {};
      const topics = [];

      if (prefs.bgExpiryAlerts) topics.push('bg-alerts');
      if (prefs.invoiceNotifications) topics.push('invoice-alerts');
      if (prefs.dlpAlerts) topics.push('dlp-alerts');
      if (prefs.healthScoreAlerts) topics.push('health-alerts');
      if (prefs.taskUpdates) topics.push('task-updates');
      if (prefs.milestoneUpdates) topics.push('milestone-updates');

      // Always subscribe to critical alerts
      topics.push('critical-alerts');

      // Save user topic subscription preferences to Firestore
      if (typeof Store !== 'undefined' && Store._db) {
        const user = (typeof firebase !== 'undefined' && firebase.auth) ? firebase.auth().currentUser : null;
        if (user) {
          await Store._db.collection('users').doc(user.uid).set({
            fcmTopics: topics,
            fcmTopicsUpdatedAt: (typeof firebase !== 'undefined' && firebase.firestore) ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
          }, { merge: true });
        }
      }

      // Safe topic subscription if supported by client environment
      for (const topic of topics) {
        if (typeof this._messaging.subscribeToTopic === 'function') {
          await this._messaging.subscribeToTopic(topic).catch(() => {});
        } else if (typeof this._messaging.subscribeToToken === 'function') {
          await this._messaging.subscribeToToken(this._token, topic).catch(() => {});
        }
        console.log(`[FCM] Topic preference registered: ${topic}`);
      }
    } catch (err) {
      console.warn('[FCM] Topic subscription notice:', err.message || err);
    }
  },

  // Listen for foreground messages from Cloud Functions + n8n
  _listenForeground() {
    if (!this._messaging) return;
    this._messaging.onMessage(payload => {
      console.log('[FCM] Foreground message:', payload);
      const { title, body } = payload.notification || {};
      const data = payload.data || {};

      if (title) {
        // Show toast notification
        if (typeof Toast !== 'undefined') {
          const toastType = data.priority === 'critical' ? 'error' : 'info';
          Toast.show(`${title}: ${body || ''}`, toastType, data.priority === 'critical' ? 8000 : 4000);
        }

        // Add to in-app notification store
        if (typeof Store !== 'undefined') {
          Store.addNotification({
            type: data.type || 'system',
            text: `${title} — ${body || ''}`,
            read: false
          });
        }

        // Play sound for critical alerts
        if (data.priority === 'critical') {
          this._playAlertSound();
        }
      }
    });
  },

  // Listen for messages forwarded from service worker
  _listenServiceWorkerMessages() {
    if (!navigator.serviceWorker) return;
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data?.type === 'FCM_BACKGROUND_MESSAGE') {
        const { title, body, data } = event.data.payload || {};
        console.log('[FCM] Background message from SW:', title);

        // Add to in-app notifications
        if (typeof Store !== 'undefined') {
          Store.addNotification({
            type: data?.type || 'system',
            text: `${title || 'Notification'} — ${body || ''}`,
            read: false
          });
        }

        // Show toast if app is in foreground
        if (typeof Toast !== 'undefined' && title) {
          Toast.show(`${title}: ${body || ''}`, 'info');
        }
      }
    });
  },

  // Play alert sound for critical notifications
  _playAlertSound() {
    try {
      // Generate a short beep programmatically using Web Audio API
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.frequency.value = 880;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;
      oscillator.start();
      setTimeout(() => { oscillator.stop(); ctx.close(); }, 200);
    } catch (e) {
      console.warn('[FCM] Could not play alert sound:', e);
    }
  },

  async revokeToken() {
    if (this._messaging && this._token) {
      await this._messaging.deleteToken();
      this._token = null;
      console.log('[FCM] Token revoked');
    }
  },

  isSupported() {
    return 'Notification' in window && 'serviceWorker' in navigator;
  },

  getPermissionStatus() {
    return Notification.permission;
  }
};