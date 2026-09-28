// ─── Firebase Auth & Firestore Backend ───
// Google Sign-In + Email/Password. No phone/mobile login.
// Admin = mohithintonn@gmail.com ONLY.

const FirebaseAuth = {
  _auth: null,
  _db: null,
  _initialized: false,

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
    this._listenToUsers();
  },

  _listenToUsers() {
    if (!this._db || typeof Auth === 'undefined') return;
    this._db.collection('users').onSnapshot(snap => {
      snap.forEach(doc => {
        const data = doc.data();
        const emailLower = (data.email || '').toLowerCase();
        let existingUser = Auth.users.find(u => 
          (u.email && u.email.toLowerCase() === emailLower) ||
          (u.googleEmail && u.googleEmail.toLowerCase() === emailLower)
        );
        if (existingUser) {
          existingUser.approved = data.isActive === true;
          existingUser.rejected = data.isRejected === true;
          existingUser.role = data.role || existingUser.role;
        } else {
          // If not in Auth.users but in Firestore (e.g. pending Google request)
          const name = data.name || 'User';
          const initials = (name.split(' ').map(w => w[0]).join('').slice(0, 2) || 'GU').toUpperCase();
          const newUser = {
            id: data.uid || doc.id,
            memberId: 'm_' + (data.uid || doc.id).slice(0, 6),
            loginId: data.email ? data.email.split('@')[0] : name,
            email: data.email || '',
            googleEmail: data.provider === 'google' ? data.email : '',
            name: name,
            role: data.role || 'AI Developer',
            avatar: initials,
            initials: initials,
            color: '#2563EB',
            title: data.role || 'AI Developer',
            photoURL: data.photoURL || null,
            approved: data.isActive === true,
            rejected: data.isRejected === true,
            requestDate: data.createdAt ? new Date(data.createdAt.toMillis ? data.createdAt.toMillis() : Date.now()).toISOString() : new Date().toISOString(),
            requestSource: data.provider === 'google' ? 'Google OAuth' : 'Sign Up'
          };
          Auth.users.push(newUser);
        }
      });
      Auth._saveUserDb();
      if (typeof UserApprovalsScreen !== 'undefined' && UserApprovalsScreen.refresh) {
        UserApprovalsScreen.refresh();
      }
    });
  },

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

  async sendResetEmail(email) {
    this._ensureInit();
    try {
      await this._auth.sendPasswordResetEmail(email);
    } catch (err) {
      throw this._mapAuthError(err);
    }
  },

  async signOut() {
    this._ensureInit();
    await this._auth.signOut();
  },

  getCurrentUser() {
    return this._auth ? this._auth.currentUser : null;
  },

  // ─── Firestore: Save / Update User Session ───
  async _saveOrUpdateUserSession(user, providerType) {
    if (!user) return null;
    let fallbackEmail = user.email;
    if (!fallbackEmail && user.providerData && user.providerData.length > 0) {
      fallbackEmail = user.providerData[0].email;
    }
    const defaultName = user.displayName || (fallbackEmail ? fallbackEmail.split('@')[0] : 'User');
    const emailLower = (fallbackEmail || '').toLowerCase();

    // ─── Admin check — only mohithintonn@gmail.com ───
    const ADMIN_EMAILS = ['mohithintonn@gmail.com', 'mohitsjain12104@gmail.com'];
    const PRE_APPROVED_EMAILS = ['hirvihintonn@gmail.com', 'preethintonn@gmail.com'];
    const isAdmin = ADMIN_EMAILS.includes(emailLower);
    const isPreApproved = PRE_APPROVED_EMAILS.includes(emailLower) || isAdmin;
    const initials = (defaultName.split(' ').map(w => w[0]).join('').slice(0, 2) || 'GU').toUpperCase();

    // ─── ADMIN APPROVAL GATE ───
    if (typeof Auth !== 'undefined') {
      const existingUser = Auth.users.find(u => 
        (u.email && u.email.toLowerCase() === emailLower) ||
        (u.googleEmail && u.googleEmail.toLowerCase() === emailLower)
      );
      
      // Force admin email to always be approved
      if (isAdmin && existingUser) {
        existingUser.approved = true;
        existingUser.role = 'Admin';
      } else if (isPreApproved && existingUser) {
        existingUser.approved = true;
      }
      
      if (existingUser && existingUser.approved === false && !isPreApproved) {
        // User exists locally but not approved
        // Ensure they actually exist in Firestore so the admin can see them!
        try {
          const userRef = this._db.collection('users').doc(user.uid);
          const doc = await userRef.get();
          if (!doc.exists) {
            await this._createUserDocument(user, providerType, existingUser);
          }
        } catch (err) {
          console.warn('Silent failure ensuring user document:', err);
        }

        console.warn('[Auth] Google login requires approval:', emailLower);
        return { approved: false, pending: true, user: existingUser };
      }
      
      if (!existingUser && !isPreApproved) {
        const localUser = {
          id: user.uid,
          memberId: 'm_' + user.uid.slice(0, 6),
          loginId: (fallbackEmail ? fallbackEmail.split('@')[0] : defaultName),
          email: fallbackEmail || '',
          googleEmail: fallbackEmail || '',
          name: defaultName,
          role: 'AI Developer',
          avatar: initials,
          initials: initials,
          color: '#2563EB',
          title: 'AI Developer',
          photoURL: user.photoURL || null,
          approved: false,
          requestDate: new Date().toISOString(),
          requestSource: providerType === 'google' ? 'Google OAuth' : 'Sign Up'
        };
        Auth.users.push(localUser);
        Auth._saveUserDb();
        if (typeof Auth._notifyAdminOfPendingRequest === 'function') {
          Auth._notifyAdminOfPendingRequest(localUser);
        }
        
        try {
          await this._createUserDocument(user, providerType, localUser);
        } catch (e) {}

        return { approved: false, pending: true, user: localUser };
      }
    }

    const localUser = {
      id: user.uid,
      memberId: 'm_' + user.uid.slice(0, 6),
      loginId: (fallbackEmail ? fallbackEmail.split('@')[0] : defaultName),
      email: fallbackEmail || '',
      googleEmail: fallbackEmail || '',
      name: defaultName,
      role: isAdmin ? 'Admin' : 'AI Developer',
      avatar: initials,
      initials: initials,
      color: '#2563EB',
      title: isAdmin ? 'Executive PMO & Lead' : 'AI Developer',
      photoURL: user.photoURL || null,
      approved: true
    };

    try { localStorage.setItem('hintonn-current-user', JSON.stringify(localUser)); } catch (e) {}

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

    try {
      const userRef = this._db.collection('users').doc(user.uid);
      const doc = await userRef.get();
      if (!doc.exists) {
        await userRef.set({
          uid: user.uid, name: defaultName, email: fallbackEmail, photoURL: user.photoURL || null,
          role: isAdmin ? 'Admin' : 'AI Developer', isActive: true, provider: providerType || 'password',
          createdAt: firebase.firestore.FieldValue.serverTimestamp(), lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        });
      } else {
        const existingData = doc.data() || {};
        await userRef.set({
          email: fallbackEmail, name: existingData.name || defaultName,
          photoURL: existingData.photoURL || user.photoURL || null,
          role: isAdmin ? 'Admin' : (existingData.role || 'AI Developer'),
          isActive: true, lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }
    } catch (err) {
      console.warn('Firestore user session sync warning:', err.message || err);
    }
    return { approved: true, user: localUser };
  },

  async _createUserDocument(user, providerType, extra) {
    try {
      const userRef = this._db.collection('users').doc(user.uid);
      let fallbackEmail = user.email;
      if (!fallbackEmail && user.providerData && user.providerData.length > 0) {
        fallbackEmail = user.providerData[0].email;
      }
      const name = (extra && extra.name) || user.displayName || (fallbackEmail ? fallbackEmail.split('@')[0] : 'User');
      const emailLower = (fallbackEmail || '').toLowerCase();
      const ADMIN_EMAILS = ['mohithintonn@gmail.com', 'mohitsjain12104@gmail.com'];
      const PRE_APPROVED_EMAILS = ['hirvihintonn@gmail.com', 'preethintonn@gmail.com'];
      const isAdmin = ADMIN_EMAILS.includes(emailLower);
      const isPreApproved = PRE_APPROVED_EMAILS.includes(emailLower) || isAdmin;

      await userRef.set({
        uid: user.uid, name: name, email: fallbackEmail, photoURL: user.photoURL || null,
        role: isAdmin ? 'Admin' : 'AI Developer', isActive: isPreApproved, isRejected: false, provider: providerType || 'password',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(), lastLogin: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (err) {
      console.error('Error creating user document in Firestore:', err);
    }
  },

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

  _mapGoogleError(err) {
    const code = err.code || '';
    console.error('Google sign-in error:', code, err.message, err);
    if (code === 'auth/unauthorized-domain') return new Error('This domain is not authorized for Google sign-in.');
    if (code === 'auth/operation-not-allowed') return new Error('Google sign-in is not enabled in Firebase Console.');
    if (code === 'auth/network-request-failed') return new Error('Network error. Check your connection.');
    if (code === 'auth/popup-closed-by-user') return new Error('Sign-in popup was closed. Please try again.');
    if (code === 'auth/cancelled-popup-request') return new Error('Sign-in was cancelled.');
    if (code === 'auth/invalid-api-key') return new Error('Invalid Firebase API key.');
    if (code === 'auth/api-key-not-valid') return new Error('Firebase API key is not valid.');
    const codeLabel = code ? `[${code}] ` : '';
    return new Error(`${codeLabel}Google sign-in failed. Please try again.`);
  },

  _ensureInit() {
    if (!this._auth) this.init();
  }
};

FirebaseAuth.init();

FirebaseAuth.handleRedirectResult().then(user => {
  if (user) {
    console.log('Google redirect login successful:', user.email);
    window.location.hash = '#dashboard';
    if (typeof App !== 'undefined' && App.handleRoute) App.handleRoute();
  }
}).catch(err => {
  console.error('Redirect handling error:', err);
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('[SW] Registered:', registration.scope);
      if (typeof FCM !== 'undefined') registration.ready.then(() => FCM.init());
    } catch (err) {
      console.warn('[SW] Registration failed:', err);
    }
  });
}
