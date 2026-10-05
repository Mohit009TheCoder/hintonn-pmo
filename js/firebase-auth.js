// ─── Firebase Auth & Firestore Backend ───
// Google Sign-In + Email/Password. No phone/mobile login.
// Admin = mohithintonn@gmail.com ONLY.

const FirebaseAuth = {
  _auth: null,
  _db: null,
  _initialized: false,

  init() {
    if (this._initialized) return;
    if (typeof firebase === 'undefined' || !firebase.apps) {
      console.warn('[FirebaseAuth] Firebase SDK not loaded yet');
      return;
    }
    const firebaseConfig = {
      apiKey: "AIzaSyBt1yVDlgfYaCMvWjbqrHGL1kpDudjKB5A",
      authDomain: "hintonn-pmo.firebaseapp.com",
      projectId: "hintonn-pmo",
      storageBucket: "hintonn-pmo.firebasestorage.app",
      messagingSenderId: "516528306945",
      appId: "1:516528306945:web:9b9a88accbd424115df900",
      measurementId: "G-KZ4HC6C5VN"
    };

    if (typeof window !== 'undefined') {
      window.FCM_VAPID_KEY = window.FCM_VAPID_KEY || '';
    }

    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      this._auth = firebase.auth();
      // Enforce SESSION persistence so credentials are only stored for current tab/session
      if (typeof firebase.auth.Auth !== 'undefined' && firebase.auth.Auth.Persistence) {
        this._auth.setPersistence(firebase.auth.Auth.Persistence.SESSION).catch(err => {
          console.warn('[FirebaseAuth] setPersistence notice:', err);
        });
      }
      this._db = firebase.firestore();
      this._initialized = true;

      // On fresh tab start (no active session in sessionStorage):
      // Purge any lingering Firebase background auth so user is prompted to log in!
      const hasActiveSession = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('hintonn-current-user');
      if (!hasActiveSession) {
        if (this._auth.currentUser) {
          this._auth.signOut().catch(() => {});
        } else if (typeof this._auth.onAuthStateChanged === 'function') {
          const unsubInitAuth = this._auth.onAuthStateChanged(u => {
            if (u && !(typeof sessionStorage !== 'undefined' && sessionStorage.getItem('hintonn-current-user'))) {
              if (typeof this._auth.signOut === 'function') this._auth.signOut().catch(() => {});
            }
            if (typeof unsubInitAuth === 'function') unsubInitAuth();
          });
        }
      }

      this._listenToUsers();
    } catch(err) {
      console.warn('[FirebaseAuth] Init error:', err);
    }
  },

  _listenToUsers() {
    if (!this._db || typeof Auth === 'undefined') return;
    try {
      const col = this._db.collection('users');
      if (typeof col.onSnapshot === 'function') {
        this._unsubUsers = col.onSnapshot(snap => {
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
            existingUser.revoked = data.isRevoked === true;
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
              color: data.color || '#2563EB',
              title: data.role || 'AI Developer',
              photoURL: data.photoURL || null,
              approved: data.isActive === true,
              rejected: data.isRejected === true,
              revoked: data.isRevoked === true,
              requestDate: data.createdAt ? new Date(data.createdAt.toMillis ? data.createdAt.toMillis() : Date.now()).toISOString() : new Date().toISOString(),
              requestSource: data.requestSource || (data.provider === 'google' ? 'Google OAuth' : 'Sign Up')
            };
            Auth.users.push(newUser);
          }
        });
        Auth._saveUserDb();
        if (typeof UserApprovalsScreen !== 'undefined' && typeof App !== 'undefined' && App.currentScreen === 'user-approvals' && UserApprovalsScreen.refresh) {
          UserApprovalsScreen.refresh();
        }
        if (typeof App !== 'undefined' && typeof App.updateNotifDot === 'function') {
          App.updateNotifDot();
        }
      }, err => {
        // Permission denied (e.g. before admin sign-in) — silently retry after auth change
        console.warn('[FirebaseAuth] Users listener error (will retry on auth change):', err.code || err.message || err);
        this._usersListenerFailed = true;
      });
      }
    } catch(e) {
      console.warn('[FirebaseAuth] Could not set up users listener:', e);
      this._usersListenerFailed = true;
    }
  },

  // Called after admin signs in via Google to re-initialize the users listener
  _reinitUsersListenerAfterAuth() {
    if (this._usersListenerFailed || !this._unsubUsers) {
      this._listenToUsers();
    }
  },

  onAuthStateChanged(callback) {
    this._ensureInit();
    return this._auth.onAuthStateChanged(callback);
  },

  // ── Email / Password Sign-In ──
  async signInEmail(email, password) {
    this._ensureInit();
    try {
      if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth.Auth && firebase.auth.Auth.Persistence) {
        await this._auth.setPersistence(firebase.auth.Auth.Persistence.SESSION).catch(() => {});
      }
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
      if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth.Auth && firebase.auth.Auth.Persistence) {
        await this._auth.setPersistence(firebase.auth.Auth.Persistence.SESSION).catch(() => {});
      }
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
    if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth.Auth && firebase.auth.Auth.Persistence) {
      await this._auth.setPersistence(firebase.auth.Auth.Persistence.SESSION).catch(() => {});
    }
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const result = await this._auth.signInWithPopup(provider);
      if (result && result.user) {
        const savedUser = await this._saveOrUpdateUserSession(result.user, 'google');
        // Re-init users listener now that we have proper Firebase Auth
        this._reinitUsersListenerAfterAuth();
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
        this._reinitUsersListenerAfterAuth();
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

    // ─── SuperAdmin & Company Admin check ───
    const SUPER_ADMIN_EMAILS = ['mohithintonn@gmail.com', 'admin@hintonn.com'];
    const PRE_APPROVED_EMAILS = ['hirvihintonn@gmail.com', 'preethintonn@gmail.com', 'mohitjain12104@gmail.com'];
    const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(emailLower);
    let isAdmin = isSuperAdmin;
    const isPreApproved = PRE_APPROVED_EMAILS.includes(emailLower) || isSuperAdmin;
    const initials = (defaultName.split(' ').map(w => w[0]).join('').slice(0, 2) || 'GU').toUpperCase();

    // Check if user is registered in the admins table in Firestore
    if (!isAdmin && this._db) {
      try {
        const adminDoc = await this._db.collection('admins').doc(user.uid).get();
        if (adminDoc.exists && adminDoc.data().isActive !== false) {
          isAdmin = true;
        }
      } catch (e) {}
    }

    const defaultCompanyId = 'comp_hintonn';
    const defaultCompanyName = 'Hintonn PMO';
    const defaultTeamId = isSuperAdmin ? 'team_exec' : 'team_ai';

    // ─── ADMIN APPROVAL GATE ───
    let existingUser = null;
    if (typeof Auth !== 'undefined') {
      existingUser = Auth.users.find(u => 
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

      // ── BLOCK revoked users from Google login ──
      if (existingUser && existingUser.revoked === true) {
        return { approved: false, revoked: true, user: existingUser };
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
        // ── FIX: Check Firestore first for existing approval status ──
        // Prevents already-approved users from being stuck as "pending"
        // on new devices / cleared localStorage.
        let firestoreApproved = false;
        let firestoreRevoked = false;
        try {
          const checkRef = this._db.collection('users').doc(user.uid);
          const checkDoc = await checkRef.get();
          if (checkDoc.exists) {
            const fData = checkDoc.data();
            firestoreApproved = fData.isActive === true;
            firestoreRevoked = fData.isRevoked === true;
          }
        } catch (e) {}

        if (firestoreRevoked) {
          // User was revoked in Firestore — block login and sync locally
          const localUser = {
            id: user.uid,
            memberId: 'm_' + user.uid.slice(0, 6),
            loginId: (fallbackEmail ? fallbackEmail.split('@')[0] : defaultName),
            email: fallbackEmail || '',
            googleEmail: fallbackEmail || '',
            name: defaultName,
            role: 'AI Developer',
            approved: false,
            revoked: true
          };
          Auth.users.push(localUser);
          Auth._saveUserDb();
          return { approved: false, revoked: true, user: localUser };
        }

        if (!firestoreApproved) {
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
        // Firestore says approved → fall through to the approved-user flow below
      }
    }

    const assignedRole = isSuperAdmin ? 'SuperAdmin' : (isAdmin ? 'Admin' : ((existingUser && existingUser.role) || 'AI Developer'));
    const assignedTitle = isSuperAdmin ? 'Executive PMO & Lead' : (isAdmin ? 'Company PMO Admin' : ((existingUser && existingUser.title) || 'AI Developer'));
    const assignedCompanyId = (existingUser && existingUser.companyId) || defaultCompanyId;
    const assignedCompanyName = (existingUser && existingUser.companyName) || defaultCompanyName;
    const assignedTeamId = (existingUser && existingUser.teamId) || defaultTeamId;

    const localUser = existingUser ? {
      ...existingUser,
      id: user.uid || existingUser.id,
      name: existingUser.name || defaultName,
      role: assignedRole,
      title: assignedTitle,
      companyId: assignedCompanyId,
      companyName: assignedCompanyName,
      teamId: assignedTeamId,
      approved: true
    } : {
      id: user.uid,
      memberId: 'm_' + user.uid.slice(0, 6),
      loginId: (fallbackEmail ? fallbackEmail.split('@')[0] : defaultName),
      email: fallbackEmail || '',
      googleEmail: fallbackEmail || '',
      name: defaultName,
      role: assignedRole,
      avatar: initials,
      initials: initials,
      color: '#2563EB',
      title: assignedTitle,
      companyId: assignedCompanyId,
      companyName: assignedCompanyName,
      teamId: assignedTeamId,
      photoURL: user.photoURL || null,
      approved: true
    };

    if (typeof Auth !== 'undefined' && typeof Auth._setSessionUser === 'function') {
      Auth._setSessionUser(localUser);
    } else {
      try {
        if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('hintonn-current-user', JSON.stringify(localUser));
        if (typeof localStorage !== 'undefined') localStorage.removeItem('hintonn-current-user');
      } catch (e) {}
    }

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

    // ── Ensure approved user has a member record in Store ──
    // Without this, non-admin users can't be assigned tasks and see nothing.
    if (typeof Store !== 'undefined' && Store._data && Array.isArray(Store._data.members) && typeof Store.getMembers === 'function' && !isAdmin) {
      const members = Store.getMembers();
      const existingMember = members.find(m =>
        m.id === localUser.memberId ||
        (m.email && m.email.toLowerCase() === (localUser.email || '').toLowerCase())
      );
      if (!existingMember) {
        Store.createMember({
          id: localUser.memberId,
          name: localUser.name,
          role: localUser.role || 'AI Developer',
          designation: localUser.title || 'AI Developer',
          email: localUser.email,
          companyId: assignedCompanyId,
          companyName: assignedCompanyName,
          teamId: assignedTeamId,
          initials: initials,
          color: localUser.color || '#2563EB'
        });
      } else {
        // Sync memberId if member was found by email but has different ID
        localUser.memberId = existingMember.id;
        if (typeof Auth !== 'undefined' && typeof Auth._setSessionUser === 'function') {
          Auth._setSessionUser(localUser);
        } else {
          try {
            if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('hintonn-current-user', JSON.stringify(localUser));
            if (typeof localStorage !== 'undefined') localStorage.removeItem('hintonn-current-user');
          } catch (e) {}
        }
        if (typeof Auth !== 'undefined') Auth.currentUser = localUser;
      }
    }

    try {
      const userRef = this._db.collection('users').doc(user.uid);
      const doc = await userRef.get();
        const nowTs = (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue && typeof firebase.firestore.FieldValue.serverTimestamp === 'function')
          ? firebase.firestore.FieldValue.serverTimestamp()
          : new Date().toISOString();

        if (!doc.exists) {
          await userRef.set({
            uid: user.uid,
            name: localUser.name || defaultName,
            email: fallbackEmail,
            photoURL: user.photoURL || null,
            role: assignedRole,
            companyId: assignedCompanyId,
            companyName: assignedCompanyName,
            teamId: assignedTeamId,
            isActive: isPreApproved || isAdmin,
            provider: providerType || 'password',
            createdAt: nowTs,
            lastLogin: nowTs
          });
        } else {
          const existingData = doc.data() || {};
          const patch = {
            email: fallbackEmail,
            name: existingData.name || localUser.name || defaultName,
            photoURL: existingData.photoURL || user.photoURL || null,
            role: assignedRole,
            companyId: existingData.companyId || assignedCompanyId,
            companyName: existingData.companyName || assignedCompanyName,
            teamId: existingData.teamId || assignedTeamId,
            lastLogin: nowTs
          };
          if (isPreApproved || isAdmin) patch.isActive = true;
          await userRef.set(patch, { merge: true });
        }

        // Sync SuperAdmin / Admin tables in Firestore for backend isolation
        if (isSuperAdmin) {
          await this._db.collection('super_admins').doc(user.uid).set({
            userId: user.uid,
            email: fallbackEmail,
            name: localUser.name || defaultName,
            role: 'SuperAdmin',
            isActive: true,
            updatedAt: nowTs
          }, { merge: true }).catch(() => {});
        } else if (isAdmin) {
          await this._db.collection('admins').doc(user.uid).set({
            userId: user.uid,
            email: fallbackEmail,
            name: localUser.name || defaultName,
            role: 'Admin',
            companyId: assignedCompanyId,
            companyName: assignedCompanyName,
            isActive: true,
            updatedAt: nowTs
          }, { merge: true }).catch(() => {});
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
      const SUPER_ADMIN_EMAILS = ['mohithintonn@gmail.com', 'admin@hintonn.com'];
      const PRE_APPROVED_EMAILS = ['hirvihintonn@gmail.com', 'preethintonn@gmail.com', 'mohitjain12104@gmail.com'];
      const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(emailLower);
      const isAdmin = isSuperAdmin;
      const isPreApproved = PRE_APPROVED_EMAILS.includes(emailLower) || isSuperAdmin;

      await userRef.set({
        uid: user.uid,
        name: name,
        email: fallbackEmail,
        photoURL: user.photoURL || null,
        role: isSuperAdmin ? 'SuperAdmin' : (isAdmin ? 'Admin' : 'AI Developer'),
        companyId: (extra && extra.companyId) || 'comp_hintonn',
        companyName: (extra && extra.companyName) || 'Hintonn PMO',
        teamId: (extra && extra.teamId) || (isSuperAdmin ? 'team_exec' : 'team_ai'),
        isActive: isPreApproved,
        isRejected: false,
        provider: providerType || 'password',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
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

if (typeof FirebaseAuth !== 'undefined') {
  try {
    FirebaseAuth.init();
    if (typeof FirebaseAuth.handleRedirectResult === 'function') {
      FirebaseAuth.handleRedirectResult().then(user => {
        if (user) {
          console.log('Google redirect login successful:', user.email);
          window.location.hash = '#dashboard';
          if (typeof App !== 'undefined' && App.handleRoute) App.handleRoute();
        }
      }).catch(err => {
        console.warn('Redirect handling error:', err);
      });
    }
  } catch (e) {
    console.warn('[FirebaseAuth] Startup check error:', e);
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('[SW] Registered:', registration.scope);
      if (typeof FCM !== 'undefined') {
        navigator.serviceWorker.ready.then(() => FCM.init());
      }
    } catch (err) {
      console.warn('[SW] Registration failed:', err);
    }
  });
}
