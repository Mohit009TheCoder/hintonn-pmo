// ─── Authentication Screen — Google OAuth + Email/Password (No Mobile/Phone) ───
const LoginScreen = {
  _currentView: 'signin',
  _resetEmail: '',
  _errorMessage: '',
  _googleUser: null,
  _activeGoogleReqId: null,

  setView(view, extraData) {
    this._currentView = view || 'signin';
    this._errorMessage = '';
    if (extraData && extraData.user) this._googleUser = extraData.user;
    if (extraData && extraData.reqId) this._activeGoogleReqId = extraData.reqId;

    const targetHash = view === 'signup' ? '#signup' :
                       view === 'forgot' ? '#forgot-password' :
                       view === 'reset' ? '#reset-password' : '#login';

    if (window.location.hash !== targetHash) {
      if (typeof history !== 'undefined' && history.pushState) {
        history.pushState(null, null, targetHash);
      } else {
        window.location.hash = targetHash;
      }
    }

    const wrapper = document.querySelector('.login-wrapper') || document.querySelector('.auth-wrapper');
    if (wrapper) {
      wrapper.innerHTML = this._renderCard();
    } else {
      const content = document.getElementById('page-content');
      if (content) content.innerHTML = this.render(view);
    }
  },

  togglePasswordVisibility(inputId, btnEl) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    if (btnEl) btnEl.innerHTML = isPassword ? this._getEyeOffIcon() : this._getEyeIcon();
  },

  _getEyeIcon() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" style="pointer-events:none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  },

  _getEyeOffIcon() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" style="pointer-events:none"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
  },

  _getGoogleIcon() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" style="flex-shrink:0">
      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.34 24 12 24z"/>
      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.94 0 12s.45 3.84 1.24 5.42l4.04-3.15z"/>
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
    </svg>`;
  },

  render(view) {
    if (view) {
      this._currentView = view;
    } else {
      const hash = (window.location.hash || '').replace('#', '');
      if (hash === 'signup') this._currentView = 'signup';
      else if (hash === 'forgot-password') this._currentView = 'forgot';
      else if (hash === 'reset-password') this._currentView = 'reset';
      else if (this._currentView === 'google-approval-required' || this._currentView === 'google-waiting-approval') {
        // keep current view
      } else {
        this._currentView = 'signin';
      }
    }

    return `
      <div class="login-wrapper auth-wrapper">
        ${this._renderCard()}
      </div>
    `;
  },

  _renderCard() {
    return `
      <div class="login-card auth-card">
        <div class="login-logo-wrapper">
          <img src="assets/hintonn-official-logo.png" alt="Hintonn AI" class="login-logo-img" />
        </div>
        <div id="auth-error-alert" class="login-error-alert">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span id="auth-error-text">${this._errorMessage}</span>
        </div>
        ${this._renderViewBody()}
      </div>
    `;
  },

  _renderViewBody() {
    switch(this._currentView) {
      case 'signup': return this._renderSignUpView();
      case 'forgot': return this._renderForgotPasswordView();
      case 'reset': return this._renderResetPasswordView();
      case 'google-approval-required': return this._renderGoogleApprovalRequiredView();
      case 'google-waiting-approval': return this._renderGoogleWaitingApprovalView();
      case 'signin':
      default: return this._renderSignInView();
    }
  },

  // ─── 1. Sign In View ───
  _renderSignInView() {
    return `
      <div>
        <h2 class="login-title">Sign in to your PMO workspace</h2>
        <p class="login-subtitle">Enter your credentials to access the enterprise platform</p>

        <form id="login-form" class="login-form" onsubmit="event.preventDefault(); LoginScreen.handleLogin();">
          <div class="login-field-group">
            <div class="login-field-label">
              <label for="login-id">Login ID or Email</label>
            </div>
            <div class="login-input-wrap">
              <input type="text" id="login-id" class="login-input" placeholder="e.g. Ayush, Mohit, or ayush@hintonn.com" autocomplete="username" required oninput="LoginScreen.clearError()" />
            </div>
          </div>

          <div class="login-field-group">
            <div class="login-field-label">
              <label for="login-password">Password</label>
              <a href="#forgot-password" class="login-forgot-link" onclick="event.preventDefault(); LoginScreen.setView('forgot');">Forgot password?</a>
            </div>
            <div class="login-input-wrap">
              <input type="password" id="login-password" class="login-input" placeholder="Enter your password" autocomplete="current-password" required oninput="LoginScreen.clearError()" style="padding-right: 44px" />
              <button type="button" class="login-pw-toggle" onclick="LoginScreen.togglePasswordVisibility('login-password', this)" title="Show password" aria-label="Show password">
                ${this._getEyeIcon()}
              </button>
            </div>
          </div>

          <button type="submit" class="login-submit-btn" id="login-btn">
            Sign In
          </button>
        </form>

        <!-- Quick Demo Credentials Helper -->
        <div style="margin-top:14px;padding:10px 12px;background:var(--color-bg-page,#F8FAFC);border:1px solid var(--color-border,#E2E8F0);border-radius:8px;font-size:12px;display:flex;flex-direction:column;gap:6px">
          <div style="font-weight:600;color:var(--color-text-secondary,#64748B);display:flex;align-items:center;justify-content:space-between">
            <span>Quick Sign-In Credentials</span>
            <span style="font-size:11px;color:var(--color-primary,#2563EB);font-weight:600">Click to fill</span>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button type="button" class="btn btn-outline" style="padding:4px 8px;font-size:11px;border-radius:4px" onclick="LoginScreen.fillCredentials('mohithintonn@gmail.com', 'Mohit@123')">
              👑 Admin (Mohit)
            </button>
            <button type="button" class="btn btn-outline" style="padding:4px 8px;font-size:11px;border-radius:4px" onclick="LoginScreen.fillCredentials('admin@hintonn.com', 'admin@123')">
              🛡️ Admin (Alias)
            </button>
            <button type="button" class="btn btn-outline" style="padding:4px 8px;font-size:11px;border-radius:4px" onclick="LoginScreen.fillCredentials('preethintonn@gmail.com', 'Preet@123')">
              💻 Preet (Developer)
            </button>
            <button type="button" class="btn btn-outline" style="padding:4px 8px;font-size:11px;border-radius:4px" onclick="LoginScreen.fillCredentials('hirvihintonn@gmail.com', 'Hirvi@123')">
              💻 Hirvi (Developer)
            </button>
          </div>
        </div>

        <div class="login-divider"><span>OR</span></div>

        <button type="button" class="login-google-btn" id="google-login-btn" onclick="LoginScreen.handleGoogleLogin()">
          ${this._getGoogleIcon()}
          <span>Continue with Google</span>
        </button>

        <div class="login-footer" style="margin-top:20px">
          Don't have an account?
          <a href="#signup" onclick="event.preventDefault(); LoginScreen.setView('signup');">Request Access</a>
        </div>
      </div>
    `;
  },

  // ─── 2. Google Approval Required View ───
  _renderGoogleApprovalRequiredView() {
    const user = this._googleUser || { name: 'Google User', email: 'user@hintonn.com', avatar: 'GU', color: '#2563EB', photoURL: null };

    return `
      <div>
        <div class="login-pending-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="#EA580C" stroke-width="2" width="28" height="28"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>

        <h2 class="login-title">Admin Approval Required</h2>
        <p class="login-subtitle">The selected Google account is not currently associated with an approved Hintonn account. Administrator approval is required before access can be granted.</p>

        <div class="login-account-card">
          ${user.photoURL
            ? `<img src="${user.photoURL}" alt="${user.name}" style="width:42px;height:42px;border-radius:50%;object-fit:cover;flex-shrink:0;border:1px solid #E2E8F0" />`
            : `<div class="login-account-avatar" style="background:${user.color || '#2563EB'}">${user.avatar || 'GU'}</div>`
          }
          <div class="login-account-info">
            <div class="login-account-name">
              ${user.name}
              <span class="login-sso-badge">Google SSO</span>
            </div>
            <div class="login-account-email">${user.email}</div>
          </div>
        </div>

        <div class="login-field-group">
          <div class="login-field-label"><label for="google-req-note">Department / Reason for Access</label></div>
          <div class="login-input-wrap">
            <input type="text" id="google-req-note" class="login-input" value="Commercial PMO & Project Delivery" placeholder="e.g. Commercial PMO, AI Developer" />
          </div>
        </div>

        <div class="login-actions" style="margin-top:20px">
          <button type="button" class="login-submit-btn" onclick="LoginScreen.submitGoogleApprovalRequest()">
            Request Admin Approval
          </button>
          <button type="button" class="login-btn-secondary" onclick="LoginScreen.setView('signin')">Back to Sign In</button>
        </div>
      </div>
    `;
  },

  // ─── 3. Google Waiting Approval View ───
  _renderGoogleWaitingApprovalView() {
    const requests = Auth.getGoogleApprovalRequests ? Auth.getGoogleApprovalRequests() : [];
    let req = null;
    if (this._activeGoogleReqId) req = requests.find(r => r.id === this._activeGoogleReqId);
    if (!req && this._googleUser) req = requests.find(r => r.email && r.email.toLowerCase() === (this._googleUser.email || '').toLowerCase());
    if (!req) {
      req = requests[0] || {
        id: 'req_goog_demo', name: (this._googleUser && this._googleUser.name) || 'Google User',
        email: (this._googleUser && this._googleUser.email) || 'user@hintonn.com',
        avatar: 'GU', color: '#2563EB', status: 'pending', requestedAt: new Date().toISOString()
      };
    }

    const isPending = req.status === 'pending';
    const isApproved = req.status === 'approved';
    const isRejected = req.status === 'rejected';

    return `
      <div>
        ${isPending ? `
          <div class="login-pending-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#C2410C" stroke-width="2" width="30" height="30"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <h2 class="login-title">Approval Request Sent</h2>
          <p class="login-subtitle">Waiting for administrator <strong>Mohit Jain</strong> to review and approve your account.</p>

          <div class="login-status-card pending">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
              <span class="login-status-card-title">Live Request Status</span>
              <span class="login-status-badge"><span class="login-status-dot"></span> Pending Review</span>
            </div>
            <div class="login-status-detail">
              <div><strong>Account:</strong> ${req.name} (${req.email})</div>
              <div><strong>Request ID:</strong> <span style="font-family:monospace;font-size:12px">#${(req.id || '').toUpperCase()}</span></div>
              <div><strong>Submitted:</strong> ${typeof Utils !== 'undefined' && Utils.timeAgo ? Utils.timeAgo(req.requestedAt) : 'just now'}</div>
              <div><strong>Assigned Approver:</strong> Mohit Jain (Admin)</div>
            </div>
          </div>

          <div class="login-actions">
            <button type="button" class="login-submit-btn" onclick="LoginScreen.checkApprovalStatus('${req.id}')">
              Check Approval Status
            </button>
            <button type="button" class="login-btn-secondary" onclick="LoginScreen.demoSwitchToAdmin('${req.id}')">
              ⚡ Demo: Switch to Admin (Mohit) to Approve
            </button>
            <button type="button" class="login-btn-ghost" onclick="LoginScreen.setView('signin')">Cancel & Return to Sign In</button>
          </div>
        ` : ''}

        ${isApproved ? `
          <div class="login-approved-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5" width="32" height="32"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2 class="login-title" style="color:#065F46">Access Approved! 🎉</h2>
          <p class="login-subtitle">Administrator <strong>${req.reviewedBy || 'Mohit Jain (Admin)'}</strong> has authorized your Google account.</p>

          <div class="login-status-card approved">
            <span class="login-status-card-title">Authorization Details</span>
            <div class="login-status-detail">
              <div><strong>Authorized User:</strong> ${req.name}</div>
              <div><strong>Google Email:</strong> ${req.email}</div>
              <div><strong>Assigned Role:</strong> ${req.role || 'AI Developer'}</div>
              <div><strong>Approved At:</strong> ${typeof Utils !== 'undefined' && Utils.timeAgo ? Utils.timeAgo(req.reviewedAt || new Date().toISOString()) : 'just now'}</div>
            </div>
          </div>

          <div class="login-actions">
            <button type="button" class="login-submit-btn" style="background:linear-gradient(135deg,#059669,#047857);box-shadow:0 2px 8px rgba(5,150,105,0.25)" onclick="LoginScreen.enterWithApprovedGoogle('${req.id}')">
              Launch PMO Workspace →
            </button>
          </div>
        ` : ''}

        ${isRejected ? `
          <div class="login-rejected-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2.5" width="30" height="30"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </div>
          <h2 class="login-title" style="color:#991B1B">Access Request Declined</h2>
          <p class="login-subtitle">Administrator <strong>${req.reviewedBy || 'Mohit Jain (Admin)'}</strong> declined access for this Google account. Please contact your administrator or try a different account.</p>

          <div class="login-actions">
            <button type="button" class="login-submit-btn" onclick="LoginScreen.handleGoogleLogin()">Try Another Account</button>
            <button type="button" class="login-btn-secondary" onclick="LoginScreen.setView('signin')">Return to Sign In</button>
          </div>
        ` : ''}
      </div>
    `;
  },

  // ─── 4. Sign Up / Request Access View ───
  _renderSignUpView() {
    return `
      <div>
        <h2 class="login-title">Request System Access</h2>
        <p class="login-subtitle">Submit your details to request credentials for Hintonn PMO</p>

        <div class="login-info-box warning">
          <div class="login-info-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#C2410C" stroke-width="2" width="16" height="16"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div>
            <div class="login-info-title">Admin Approval Required</div>
            <div class="login-info-desc">After submitting, an administrator must approve your account before you can log in. You will see a pending status until approved.</div>
          </div>
        </div>

        <form id="signup-form" class="login-form" onsubmit="event.preventDefault(); LoginScreen.handleSignUp();">
          <div class="login-field-group">
            <div class="login-field-label"><label for="signup-name">Full Name <span class="login-required">*</span></label></div>
            <div class="login-input-wrap">
              <input type="text" id="signup-name" class="login-input" placeholder="Enter your full name" autocomplete="name" required oninput="LoginScreen.clearError()" />
            </div>
          </div>

          <div class="login-field-group">
            <div class="login-field-label"><label for="signup-email">Email Address <span class="login-required">*</span></label></div>
            <div class="login-input-wrap">
              <input type="email" id="signup-email" class="login-input" placeholder="Enter your email address" autocomplete="email" required oninput="LoginScreen.clearError()" />
            </div>
          </div>

          <div class="login-field-group">
            <div class="login-field-label"><label for="signup-password">Password <span class="login-required">*</span></label></div>
            <div class="login-input-wrap">
              <input type="password" id="signup-password" class="login-input" placeholder="Min 8 chars, 1 number & 1 special" autocomplete="new-password" required oninput="LoginScreen.clearError()" style="padding-right:44px" />
              <button type="button" class="login-pw-toggle" onclick="LoginScreen.togglePasswordVisibility('signup-password', this)" title="Show password" aria-label="Show password">
                ${this._getEyeIcon()}
              </button>
            </div>
            <div class="login-pw-hint">Must contain at least 8 characters, 1 number, and 1 special symbol.</div>
          </div>

          <div class="login-field-group">
            <div class="login-field-label"><label for="signup-confirm-password">Confirm Password <span class="login-required">*</span></label></div>
            <div class="login-input-wrap">
              <input type="password" id="signup-confirm-password" class="login-input" placeholder="Re-enter your password" autocomplete="new-password" required oninput="LoginScreen.clearError()" style="padding-right:44px" />
              <button type="button" class="login-pw-toggle" onclick="LoginScreen.togglePasswordVisibility('signup-confirm-password', this)" title="Show password" aria-label="Show password">
                ${this._getEyeIcon()}
              </button>
            </div>
          </div>

          <button type="submit" class="login-submit-btn" id="signup-btn">
            Submit Access Request
          </button>
        </form>

        <div class="login-footer" style="margin-top:24px">
          Already have an account?
          <a href="#login" onclick="event.preventDefault(); LoginScreen.setView('signin');">Sign In</a>
        </div>
      </div>
    `;
  },

  // ─── 5. Forgot Password View ───
  _renderForgotPasswordView() {
    return `
      <div>
        <h2 class="login-title">Reset your password</h2>
        <p class="login-subtitle">Enter your registered email address to receive password reset instructions</p>

        <form id="forgot-form" class="login-form" onsubmit="event.preventDefault(); LoginScreen.handleForgotPassword();">
          <div class="login-field-group">
            <div class="login-field-label"><label for="forgot-email">Registered Email Address</label></div>
            <div class="login-input-wrap">
              <input type="email" id="forgot-email" class="login-input" placeholder="Enter your registered email address" autocomplete="email" required oninput="LoginScreen.clearError()" />
            </div>
          </div>

          <button type="submit" class="login-submit-btn" id="forgot-btn">Send Reset Link</button>
        </form>

        <div class="login-footer" style="margin-top:24px">
          Remember your password?
          <a href="#login" onclick="event.preventDefault(); LoginScreen.setView('signin');">Back to Sign In</a>
        </div>
      </div>
    `;
  },

  // ─── 6. Reset Password View ───
  _renderResetPasswordView() {
    return `
      <div>
        <h2 class="login-title">Set new password</h2>
        <p class="login-subtitle">
          ${this._resetEmail ? `For account: <strong>${this._resetEmail}</strong>` : 'Enter your new password below to regain access'}
        </p>

        <form id="reset-form" class="login-form" onsubmit="event.preventDefault(); LoginScreen.handleResetPassword();">
          <div class="login-field-group">
            <div class="login-field-label"><label for="reset-password">New Password</label></div>
            <div class="login-input-wrap">
              <input type="password" id="reset-password" class="login-input" placeholder="Min 8 chars, 1 number & 1 special" autocomplete="new-password" required oninput="LoginScreen.clearError()" style="padding-right:44px" />
              <button type="button" class="login-pw-toggle" onclick="LoginScreen.togglePasswordVisibility('reset-password', this)" title="Show password" aria-label="Show password">
                ${this._getEyeIcon()}
              </button>
            </div>
            <div class="login-pw-hint">Must contain at least 8 characters, 1 number, and 1 special symbol.</div>
          </div>

          <div class="login-field-group">
            <div class="login-field-label"><label for="reset-confirm-password">Confirm New Password</label></div>
            <div class="login-input-wrap">
              <input type="password" id="reset-confirm-password" class="login-input" placeholder="Re-enter your new password" autocomplete="new-password" required oninput="LoginScreen.clearError()" style="padding-right:44px" />
              <button type="button" class="login-pw-toggle" onclick="LoginScreen.togglePasswordVisibility('reset-confirm-password', this)" title="Show password" aria-label="Show password">
                ${this._getEyeIcon()}
              </button>
            </div>
          </div>

          <button type="submit" class="login-submit-btn" id="reset-btn">Update Password</button>
        </form>

        <div class="login-footer" style="margin-top:24px">
          <a href="#login" onclick="event.preventDefault(); LoginScreen.setView('signin');">Back to Sign In</a>
        </div>
      </div>
    `;
  },

  fillCredentials(email, password) {
    const idEl = document.getElementById('login-id');
    const passEl = document.getElementById('login-password');
    if (idEl) idEl.value = email;
    if (passEl) passEl.value = password;
    this.clearError();
  },

  // ─── Handlers ───
  async handleLogin() {
    const idEl = document.getElementById('login-id');
    const passEl = document.getElementById('login-password');
    const loginId = idEl ? idEl.value.trim() : '';
    const password = passEl ? passEl.value : '';

    if (!loginId || !password) {
      this.showError('Please enter both email/login ID and password.');
      return;
    }

    // Reject phone numbers as mobile login is not supported
    if (/^\+?[\d\s-]{7,15}$/.test(loginId) && !loginId.includes('@')) {
      this.showError('Mobile/phone login is not supported. Please enter your email address or login ID.');
      return;
    }

    // Show loading state
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) { loginBtn.disabled = true; loginBtn.textContent = 'Signing in...'; }

    const res = await Auth.login(loginId, password);
    
    if (loginBtn) { loginBtn.disabled = false; loginBtn.textContent = 'Sign In'; }

    if (res.success) {
      this.clearError();
      if (typeof Toast !== 'undefined') Toast.show(`Welcome back, ${res.user.name}!`, 'success');
      window.location.hash = '#dashboard';
      if (typeof App !== 'undefined') App.handleRoute();
    } else if (res.pendingApproval) {
      this.clearError();
      if (typeof Toast !== 'undefined') Toast.show('Your account is pending admin approval.', 'info');
      this._showPendingApprovalScreen(res.user ? res.user.name : '', res.user ? res.user.email : loginId);
    } else {
      this.showError(res.error || 'Invalid email or password.');
    }
  },

  async handleGoogleLogin() {
    this.clearError();
    const googleBtn = document.getElementById('google-login-btn');

    if (typeof firebase === 'undefined' || typeof FirebaseAuth === 'undefined') {
      this.showError('Authentication service is initializing. Please reload.');
      return;
    }

    if (googleBtn) {
      googleBtn.disabled = true;
      googleBtn.innerHTML = '<span class="login-spinner"></span> Connecting to Google...';
    }

    try {
      const res = await FirebaseAuth.signInGoogle();
      if (googleBtn) {
        googleBtn.disabled = false;
        googleBtn.innerHTML = `${this._getGoogleIcon()}<span>Continue with Google</span>`;
      }
      if (!res) return;

      if (res.approved) {
        if (typeof Toast !== 'undefined') Toast.show(`Welcome back, ${res.user.name || res.user.email}!`, 'success');
        window.location.hash = '#dashboard';
        if (typeof App !== 'undefined' && typeof App.handleRoute === 'function') App.handleRoute();
      } else if (res.revoked) {
        this.showError('Your access has been revoked by an administrator. Please contact admin to regain access.');
      } else {
        this.showGoogleApprovalRequired(res.user);
      }
    } catch (err) {
      console.warn('Google sign-in notice:', err);
      if (googleBtn) {
        googleBtn.disabled = false;
        googleBtn.innerHTML = `${this._getGoogleIcon()}<span>Continue with Google</span>`;
      }
      if (err.message && err.message.includes('cancelled')) {
        this.showError('Google sign-in was cancelled.');
        return;
      }
      const currentUser = FirebaseAuth.getCurrentUser();
      if (currentUser && currentUser.email) {
        this.showGoogleApprovalRequired({
          name: currentUser.displayName || currentUser.email.split('@')[0],
          email: currentUser.email,
          photoURL: currentUser.photoURL || null
        });
      } else {
        this.showError(err.message || 'Google sign-in could not be completed.');
      }
    }
  },

  showGoogleApprovalRequired(user) {
    const formattedUser = {
      name: user.displayName || user.name || (user.email ? user.email.split('@')[0] : 'Google User'),
      email: user.email || '',
      avatar: (user.displayName || user.name || 'GU').split(' ').map(w => w[0]).join('').slice(0, 2),
      color: '#2563EB',
      photoURL: user.photoURL || null
    };
    this._googleUser = formattedUser;
    this.setView('google-approval-required', { user: formattedUser });
  },

  submitGoogleApprovalRequest() {
    const user = this._googleUser || { name: 'Google User', email: 'user@hintonn.com', avatar: 'GU', color: '#2563EB' };
    const noteEl = document.getElementById('google-req-note');
    const note = noteEl ? noteEl.value.trim() : 'Commercial PMO & Project Delivery';

    const req = Auth.submitGoogleApprovalRequest ? Auth.submitGoogleApprovalRequest(user, note) : { id: 'req_' + Date.now(), status: 'pending' };
    this._activeGoogleReqId = req.id;

    if (typeof Toast !== 'undefined') Toast.show('Google login approval request submitted to Administrator Mohit Jain!', 'success');
    this.setView('google-waiting-approval', { reqId: req.id, user: user });
  },

  checkApprovalStatus(reqId) {
    const id = reqId || this._activeGoogleReqId;
    const requests = Auth.getGoogleApprovalRequests ? Auth.getGoogleApprovalRequests() : [];
    const req = requests.find(r => r.id === id);

    if (req) {
      if (req.status === 'approved') {
        if (typeof Toast !== 'undefined') Toast.show('🎉 Access approved! You can now launch into the workspace.', 'success');
      } else if (req.status === 'rejected') {
        if (typeof Toast !== 'undefined') Toast.show('Access request was declined by administrator.', 'error');
      } else {
        if (typeof Toast !== 'undefined') Toast.show('Status check: Request is still pending review by Mohit Jain.', 'info');
      }
    }
    this.setView('google-waiting-approval', { reqId: id });
  },

  enterWithApprovedGoogle(reqId) {
    const id = reqId || this._activeGoogleReqId;
    const res = Auth.loginWithApprovedGoogle ? Auth.loginWithApprovedGoogle(id) : { success: false, error: 'Not available' };
    if (res.success) {
      if (typeof Toast !== 'undefined') Toast.show(`Welcome to Hintonn PMO, ${res.user.name}!`, 'success');
      window.location.hash = '#dashboard';
      if (typeof App !== 'undefined') App.handleRoute();
    } else {
      this.showError(res.error || 'Failed to enter workspace.');
    }
  },

  demoSwitchToAdmin(reqId) {
    const adminUser = Auth.users.find(u => u.loginId === 'Mohit' || u.role === 'Admin') || {
      id: 'mohit', memberId: 'm3', loginId: 'Mohit', password: 'Mohit@123',
      name: 'Mohit Jain', role: 'Admin', email: 'mohithintonn@gmail.com',
      googleEmail: 'mohithintonn@gmail.com', initials: 'MJ', color: '#4F46E5', approved: true
    };

    Auth.currentUser = adminUser;
    localStorage.setItem('hintonn-current-user', JSON.stringify(adminUser));
    if (typeof Store !== 'undefined' && Store._data && Store._data.settings) {
      Store._data.settings.currentUser = 'm3';
    }

    if (typeof Toast !== 'undefined') Toast.show('Logged in as Admin (Mohit Jain). Opening Dashboard...', 'info');
    window.location.hash = '#dashboard';
    if (typeof App !== 'undefined') App.handleRoute();
  },

  handleSignUp() {
    const nameEl = document.getElementById('signup-name');
    const emailEl = document.getElementById('signup-email');
    const passEl = document.getElementById('signup-password');
    const confirmEl = document.getElementById('signup-confirm-password');

    const name = nameEl ? nameEl.value.trim() : '';
    const email = emailEl ? emailEl.value.trim() : '';
    const pass = passEl ? passEl.value : '';
    const confirm = confirmEl ? confirmEl.value : '';

    if (!name || !email || !pass) {
      this.showError('Please fill in all required fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.showError('Please enter a valid email address.');
      return;
    }

    if (pass.length < 8 || !/[0-9]/.test(pass) || !/[!@#$%^&*(),.?":{}|<>_\-+=\/\[\]~`]/.test(pass)) {
      this.showError('Password must be at least 8 characters long, including one number and one special character.');
      return;
    }

    if (pass !== confirm) {
      this.showError('Passwords do not match.');
      return;
    }

    const res = Auth.signUp(name, email, pass);
    if (res.success || res.pendingApproval) {
      this.clearError();
      if (typeof Toast !== 'undefined') Toast.show('Access request submitted! Waiting for admin approval.', 'success');
      this._showPendingApprovalScreen(name, email);
    } else {
      this.showError(res.error || 'Failed to submit access request.');
    }
  },

  _showPendingApprovalScreen(name, email) {
    const wrapper = document.querySelector('.login-wrapper') || document.querySelector('.auth-wrapper');
    if (wrapper) {
      wrapper.innerHTML = `
        <div class="login-card auth-card" style="text-align:center">
          <div class="login-logo-wrapper">
            <img src="assets/hintonn-official-logo.png" alt="Hintonn AI" class="login-logo-img" />
          </div>

          <div class="login-pending-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#C2410C" stroke-width="2" width="32" height="32"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>

          <h2 class="login-title">Access Request Pending</h2>
          <p class="login-subtitle">Thank you, <strong>${name}</strong>. Your request to join Hintonn PMO has been submitted.</p>

          <div class="login-status-card pending" style="text-align:center">
            <div style="display:flex;align-items:center;gap:8px;justify-content:center;margin-bottom:8px">
              <svg viewBox="0 0 24 24" fill="none" stroke="#C2410C" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span style="font-size:14px;font-weight:700;color:#9A3412">Awaiting Admin Approval</span>
            </div>
            <p style="font-size:12.5px;color:#C2410C;margin:0;line-height:1.5">
              An administrator will review your request and grant access. You will be able to sign in once your account is approved.
            </p>
          </div>

          <div style="font-size:13px;color:#64748B;margin-bottom:24px">
            <div style="margin-bottom:4px">Account: <strong style="color:#0F172A">${email}</strong></div>
            <div>Submitted: <strong style="color:#0F172A">${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong></div>
          </div>

          <button type="button" class="login-submit-btn" onclick="LoginScreen.setView('signin')">Back to Sign In</button>
        </div>
      `;
    }
  },

  handleForgotPassword() {
    const emailEl = document.getElementById('forgot-email');
    const email = emailEl ? emailEl.value.trim() : '';
    if (!email || !email.includes('@')) {
      this.showError('Please enter a valid email address.');
      return;
    }
    this._resetEmail = email;
    Auth.forgotPassword(email);
    if (typeof Toast !== 'undefined') Toast.show('Reset link sent to your email!', 'success');
    this.setView('reset');
  },

  handleResetPassword() {
    const passEl = document.getElementById('reset-password');
    const confirmEl = document.getElementById('reset-confirm-password');
    const pass = passEl ? passEl.value : '';
    const confirm = confirmEl ? confirmEl.value : '';

    if (!pass || pass.length < 8) {
      this.showError('Password must be at least 8 characters long.');
      return;
    }
    if (pass !== confirm) {
      this.showError('Passwords do not match.');
      return;
    }

    Auth.resetPassword(this._resetEmail, pass);
    if (typeof Toast !== 'undefined') Toast.show('Password updated successfully! Please sign in.', 'success');
    this.setView('signin');
  },

  showError(msg) {
    this._errorMessage = msg;
    const alertEl = document.getElementById('auth-error-alert');
    const textEl = document.getElementById('auth-error-text');
    if (alertEl && textEl) {
      textEl.textContent = msg;
      alertEl.style.display = 'flex';
    }
  },

  clearError() {
    this._errorMessage = '';
    const alertEl = document.getElementById('auth-error-alert');
    if (alertEl) alertEl.style.display = 'none';
  }
};
