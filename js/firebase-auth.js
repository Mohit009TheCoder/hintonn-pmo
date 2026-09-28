// ─── Firebase Auth & Firestore Backend ───
// Google Sign-In uses REDIRECT (not popup) — works on all browsers, no popup blockers.

const FirebaseAuth = {
  _auth: null,
  _db: null,
  _initialized: false,

  // ── Initialize Firebase ──
  init() {
    if (this._initialized) return;
    const firebaseConfig = {
      apiKey: "AIzaSyBt1yVDlgfYaCMvWjbqrHGL1kpDudjKB5A",
      authDomain: "hintonn-pmo.firebaseapp.com",
      projectId: "hintonn-pmo",
      storageBucket: "hintonn-pmo.firebasestorage.app",
      messagingSenderId: "516528306945",
      appId: "1:516528306945:web:9b9a88accbd424115df900",
      measurementId: "G-KZ4HC6C5VN"
    };

    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    this._auth = firebase.auth();
    this._db = firebase.firestore();
    this._initialized = true;
  },

  // ── Auth State Observer ──
  onAuthStateChanged(callback) {
    this._ensureInit();
    return this._auth.onAuthStateChanged(callback);
  },

  // ── Email / Password Sign-In ──
  async signInEmail(email, password) {
    this._ensureInit();
    try {
      const userCredential = await this._auth.signInWithEmailAndPassword(email, password);
      const savedUser = await this._saveOrUpdateUserSession(userCredential.user, 'password');
      return savedUser || null;
    } catch (err) {
      throw this._mapAuthError(err);
    }
  },

  // ── Email / Password Sign-Up ──
  async signUpEmail(name, email, password) {
    this._ensureInit();
    try {
      const userCredential = await this._auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      await user.updateProfile({ displayName: name });
      await this._createUserDocument(user, 'password', { name });
      return user;
    } catch (err) {
      throw this._mapAuthError(err);
    }
  },

  // ── Google Sign-In (Popup preferred, redirect fallback) ──
  async signInGoogle() {
    this._ensureInit();
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const result = await this._auth.signInWithPopup(provider);
      if (result && result.user) {
        const savedUser = await this._saveOrUpdateUserSession(result.user, 'google');
        // If _saveOrUpdateUserSession returns null, user is blocked (pending approval)
        return savedUser || null;
      }
    } catch (err) {
      if (err.code === 'auth/popup-blocked') {
        console.warn('Google sign-in popup blocked; falling back to redirect...');
        await this._auth.signInWithRedirect(provider);
        return null;
      }
      throw this._mapGoogleError(err);
    }
  },

  // ── Handle redirect result (call once on every page load) ──
  async handleRedirectResult() {
    this._ensureInit();
    try {
      const result = await this._auth.getRedirectResult();
      if (result && result.user) {
        const savedUser = await this._saveOrUpdateUserSession(result.user, 'google');
        return savedUser || null;
      }
    } catch (err) {
      console.error('Google redirect error:', err.code, err.message);
    }
    return null;
  },

  // ── Send Password Reset Email ──
  async sendResetEmail(email) {
    this._ensureInit();
    try {
      await this._auth.sendPasswordResetEmail(email);
    } catch (err) {
      throw this._mapAuthError(err);
    }
  },

  // ── Sign Out ──
  async signOut() {
    this._ensureInit();
    await this._auth.signOut();
  },

  // ── Get Current User ──
  getCurrentUser() {
    return this._auth ? this._auth.currentUser : null;
  },

  // ─── Firestore: Save / Update User Session & Sync with Local Auth ───
  async _saveOrUpdateUserSession(user, providerType) {
    if (!user) return null;
    const defaultName = user.displayName || (user.email ? user.email.split('@')[0] : 'User');
    const emailLower = (user.email || '').toLowerCase();
    const isAdminEmail = emailLower === 'mohithintonn@gmail.com' || emailLower === 'mohitsjain12104@gmail.com';
    const isAdminName = defaultName.toLowerCase().includes('mohit') && defaultName.toLowerCase().includes('jain');
    const isAdmin = isAdminEmail || isAdminName;
    const initials = (defaultName.split(' ').map(w => w[0]).join('').slice(0, 2) || 'GU').toUpperCase();

    // ─── ADMIN APPROVAL GATE: Check if user is approved ───
    if (typeof Auth !== 'undefined') {
      const existingUser = Auth.users.find(u => 
        (u.email && u.email.toLowerCase() === emailLower) ||
        (u.googleEmail && u.googleEmail.toLowerCase() === emailLower)
      );
      
      if (existingUser && existingUser.approved === false && !isAdmin) {
        // User exists but not approved — block login
        console.warn('[Auth] Google login blocked: user not approved:', emailLower);
        return null;
      }
      
      if (!existingUser && !isAdmin) {
        // New Google user — create as PENDING (requires admin approval)
        const localUser = {
          id: user.uid,
          memberId: 'm_' + user.uid.slice(0, 6),
          loginId: (user.email ? user.email.split('@')[0] : defaultName),
          email: user.email || '',
          googleEmail: user.email || '',
          name: defaultName,
          role: 'AI Developer',
          avatar: initials,
          initials: initials,
          color: '#2563EB',
          title: 'AI Developer',
          photoURL: user.photoURL || null,
          approved: false,
          requestDate: new Date().toISOString(),
          requestSource: 'Google OAuth'
        };
        Auth.users.push(localUser);
        Auth._saveUserDb();
        Auth._notifyAdminOfPendingRequest(localUser);
        return null; // Block — user needs approval
      }
    }

    // 1. Immediately sync session to localStorage so UI and route guards recognize user
    const localUser = {
      id: user.uid,
      memberId: 'm_' + user.uid.slice(0, 6),
      loginId: (user.email ? user.email.split('@')[0] : defaultName),
      email: user.email || '',
      googleEmail: user.email || '',
      name: defaultName,
      role: isAdmin ? 'Admin' : 'AI Developer',
      avatar: initials,
      initials: initials,
      color: '#2563EB',
      title: isAdminEmail ? 'Executive PMO & Lead' : 'AI Developer',
      photoURL: user.photoURL || null,
      approved: true // Approved users pass through
    };

    try {
      localStorage.setItem('hintonn-current-user', JSON.stringify(localUser));
    } catch (e) {}

    if (typeof Auth !== 'undefined') {
      Auth.currentUser = localUser;
      if (Array.isArray(Auth.users) && !Auth.users.some(u => u.id === localUser.id || (u.email && u.email.toLowerCase() === (localUser.email || '').toLowerCase()))) {
        Auth.users.push(localUser);
      }
    }

    if (typeof Store !== 'undefined' && Store._data && Store._data.settings) {
      Store._data.settings.currentUser = localUser.memberId;
      if (typeof Store._save === 'function') Store._save();
    }

    // 2. Persist to Firestore
    try {
      const userRef = this._db.collection('users').doc(user.uid);
      const doc = await userRef.get();

      if (!doc.exists) {
        await userRef.set({
          uid: user.uid,
          name: defaultName,
          email: user.email,
          photoURL: user.photoURL || null,
          role: isAdmin ? 'Admin' : 'AI Developer',
          isActive: true,
          provider: providerType || 'password',
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('New user document created in Firestore for:', user.email);
      } else {
        const existingData = doc.data() || {};
        await userRef.set({
          email: user.email,
          name: existingData.name || defaultName,
          photoURL: user.photoURL || existingData.photoURL || null,
          role: isAdmin ? 'Admin' : (existingData.role || 'AI Developer'),
          isActive: true,
          lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        console.log('Existing user session updated in Firestore for:', user.email);
      }
    } catch (err) {
      console.warn('Firestore user session sync warning:', err.message || err);
    }
  },

  // ─── Firestore: Create User Document ───
  async _createUserDocument(user, providerType, extra) {
    try {
      const userRef = this._db.collection('users').doc(user.uid);
      const name = (extra && extra.name) || user.displayName || (user.email ? user.email.split('@')[0] : 'User');
      const emailLower = (user.email || '').toLowerCase();
      const isAdmin = emailLower === 'mohithintonn@gmail.com' || emailLower === 'mohitsjain12104@gmail.com' || (name.toLowerCase().includes('mohit') && name.toLowerCase().includes('jain'));

      await userRef.set({
        uid: user.uid,
        name: name,
        email: user.email,
        photoURL: user.photoURL || null,
        role: isAdmin ? 'Admin' : 'AI Developer',
        isActive: true,
        provider: providerType || 'password',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log('User document created in Firestore for:', user.email);
    } catch (err) {
      console.error('Error creating user document in Firestore:', err);
    }
  },

  // ─── Error Mapping: Firebase Auth ───
  _mapAuthError(err) {
    const code = err.code || '';
    let message = 'Login failed. Please try again.';

    if (code === 'auth/user-not-found') message = 'No account found with this email.';
    else if (code === 'auth/wrong-password') message = 'Incorrect password. Please try again.';
    else if (code === 'auth/invalid-email') message = 'Please enter a valid email address.';
    else if (code === 'auth/too-many-requests') message = 'Too many attempts. Please try again later.';
    else if (code === 'auth/invalid-credential') message = 'Invalid email or password.';
    else if (code === 'auth/network-request-failed') message = 'Network error. Check your connection.';
    else if (code === 'auth/email-already-in-use') message = 'An account with this email already exists.';
    else if (code === 'auth/weak-password') message = 'Password is too weak. Use at least 6 characters.';

    console.error('Firebase Auth error:', code, err.message);
    return new Error(message);
  },

  // ─── Error Mapping: Google OAuth ───
  _mapGoogleError(err) {
    const code = err.code || '';
    console.error('Google sign-in error:', code, err.message, err);

    if (code === 'auth/unauthorized-domain') {
      return new Error('This domain is not authorized for Google sign-in. Go to Firebase Console → Authentication → Settings → Authorized domains and add your domain.');
    }
    if (code === 'auth/operation-not-allowed') {
      return new Error('Google sign-in is not enabled in Firebase Console. Go to Authentication → Sign-in method → Google → Enable it.');
    }
    if (code === 'auth/network-request-failed') {
      return new Error('Network error. Check your internet connection and try again.');
    }
    if (code === 'auth/popup-closed-by-user') {
      return new Error('Sign-in popup was closed. Please try again and complete the sign-in.');
    }
    if (code === 'auth/cancelled-popup-request') {
      return new Error('Sign-in was cancelled. Please try again.');
    }
    if (code === 'auth/invalid-api-key') {
      return new Error('Invalid Firebase API key. Check your Firebase config.');
    }
    if (code === 'auth/api-key-not-valid') {
      return new Error('Firebase API key is not valid for this project. Check Firebase config.');
    }
    // Show actual error code for unknown errors
    const codeLabel = code ? `[${code}] ` : '';
    return new Error(`${codeLabel}Google sign-in failed. Please try again.`);
  },

  // ── Ensure Firebase is initialized before use ──
  _ensureInit() {
    if (!this._auth) this.init();
  }
};

// Auto-initialize on load
FirebaseAuth.init();

// Handle Google redirect result when page loads after OAuth redirect
FirebaseAuth.handleRedirectResult().then(user => {
  if (user) {
    console.log('Google redirect login successful:', user.email);
    window.location.hash = '#dashboard';
    if (typeof App !== 'undefined' && App.handleRoute) {
      App.handleRoute();
    }
  }
}).catch(err => {
  console.error('Redirect handling error:', err);
});

// ── Phase 6: Register Service Worker + Init FCM ──
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('[SW] Registered:', registration.scope);
      // Init FCM after service worker is ready
      if (typeof FCM !== 'undefined') {
        registration.ready.then(() => FCM.init());
      }
    } catch (err) {
      console.warn('[SW] Registration failed:', err);
    }
  });
}
