// ─── Authentication Screen Component (Sign In, Sign Up, Forgot Password, Reset Password & Real Google Approval Flow) ───
const LoginScreen = {
  _currentView: 'signin', // 'signin' | 'signup' | 'forgot' | 'reset' | 'google-approval-required' | 'google-waiting-approval'
  _resetEmail: '',
  _errorMessage: '',
  _googleUser: null,
  _activeGoogleReqId: null,

  // Set the active authentication view
  setView(view, extraData) {
    this._currentView = view || 'signin';
    this._errorMessage = '';
    if (extraData && extraData.user) {
      this._googleUser = extraData.user;
    }
    if (extraData && extraData.reqId) {
      this._activeGoogleReqId = extraData.reqId;
    }
    
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
    if (btnEl) {
      btnEl.innerHTML = isPassword ? this._getEyeOffIcon() : this._getEyeIcon();
    }
  },

  _getEyeIcon() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" style="pointer-events:none;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  },

  _getEyeOffIcon() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" style="pointer-events:none;"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
  },

  _getGoogleIcon() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" style="flex-shrink:0;">
      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.34 24 12 24z"/>
      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.94 0 12s.45 3.84 1.24 5.42l4.04-3.15z"/>
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
    </svg>`;
  },

  // Main Screen Renderer
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
      <div class="login-wrapper auth-wrapper" style="min-height:100vh;width:100%;display:flex;align-items:center;justify-content:center;background:#F8FAFC;padding:24px;box-sizing:border-box;">
        ${this._renderCard()}
      </div>
    `;
  },

  _renderCard() {
    return `
      <div class="login-card auth-card" style="width:100%;max-width:440px;background:#FFFFFF;border:1px solid var(--color-border, #E2E8F0);border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.06);padding:36px 32px;box-sizing:border-box;">
        
        <!-- Official Hintonn AI Logo -->
        <div class="login-logo-wrapper" style="text-align:center;margin-bottom:18px;background-color:#FFFFFF;">
          <img 
            src="assets/hintonn-official-logo.png" 
            alt="Hintonn AI" 
            class="login-logo-img"
            style="max-height:44px;width:auto;object-fit:contain;display:block;margin:0 auto;mix-blend-mode:multiply !important;background:transparent !important;filter:contrast(108%);" 
          />
        </div>

        <!-- Inline Error Alert Banner -->
        <div id="auth-error-alert" style="display:${this._errorMessage ? 'flex' : 'none'};background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:10px 14px;color:#DC2626;font-size:13px;font-weight:500;margin-bottom:18px;align-items:flex-start;gap:8px;line-height:1.5;">
          <svg style="width:16px;height:16px;flex-shrink:0;margin-top:1px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span id="auth-error-text">${this._errorMessage}</span>
        </div>

        <!-- Dynamic View Router Content -->
        ${this._renderViewBody()}

      </div>
    `;
  },

  _renderViewBody() {
    switch(this._currentView) {
      case 'signup':
        return this._renderSignUpView();
      case 'forgot':
        return this._renderForgotPasswordView();
      case 'reset':
        return this._renderResetPasswordView();
      case 'google-approval-required':
        return this._renderGoogleApprovalRequiredView();
      case 'google-waiting-approval':
        return this._renderGoogleWaitingApprovalView();
      case 'signin':
      default:
        return this._renderSignInView();
    }
  },

  // ─── 1. Sign In View (Email/ID + Password: Direct Login | Google: Real OAuth) ───
  _renderSignInView() {
    return `
      <div>
        <h2 style="font-family:var(--font-display);font-size:18px;font-weight:700;color:var(--color-text-primary);text-align:center;margin:0 0 6px 0;">Sign in to your PMO workspace</h2>
        <p style="font-size:13px;color:var(--color-text-muted);text-align:center;margin:0 0 20px 0;">Enter your credentials to access the enterprise platform</p>

        <!-- Form: Direct ID / Password Login -->
        <form id="login-form" onsubmit="event.preventDefault(); LoginScreen.handleLogin();" style="display:flex;flex-direction:column;gap:14px;">
          <div class="form-group" style="text-align:left;">
            <label for="login-id" class="form-label" style="display:block;font-size:13px;font-weight:600;color:var(--color-text-primary);margin-bottom:6px;">Login ID or Email</label>
            <input 
              type="text" 
              id="login-id" 
              class="form-input" 
              placeholder="e.g. Ayush, Mohit, or ayush@hintonn.com" 
              autocomplete="username" 
              required 
              style="height:42px;font-size:14px;width:100%;border-radius:8px;border:1px solid var(--color-border);padding:0 12px;box-sizing:border-box;"
              oninput="LoginScreen.clearError()"
            />
          </div>
              autocomplete="username" 
              required 
              style="height:42px;font-size:14px;width:100%;border-radius:8px;border:1px solid var(--color-border);padding:0 12px;box-sizing:border-box;"
              oninput="LoginScreen.clearError()"
            />
          </div>

          <div class="form-group" style="text-align:left;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
              <label for="login-password" class="form-label" style="display:block;font-size:13px;font-weight:600;color:var(--color-text-primary);margin:0;">Password</label>
              <a href="#forgot-password" onclick="event.preventDefault(); LoginScreen.setView('forgot');" style="font-size:12.5px;color:var(--color-primary, #2563EB);text-decoration:none;font-weight:600;">Forgot password?</a>
            </div>
            <div style="position:relative;display:flex;align-items:center;">
              <input 
                type="password" 
                id="login-password" 
                class="form-input" 
                placeholder="Enter your password" 
                autocomplete="current-password" 
                required 
                style="height:42px;font-size:14px;width:100%;border-radius:8px;border:1px solid var(--color-border);padding:0 40px 0 12px;box-sizing:border-box;"
                oninput="LoginScreen.clearError()"
              />
              <button type="button" onclick="LoginScreen.togglePasswordVisibility('login-password', this)" title="Show password" aria-label="Show password"
                      style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#64748B;display:flex;align-items:center;padding:4px;">
                ${this._getEyeIcon()}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            class="btn btn-primary" 
            id="login-btn" 
            style="width:100%;height:42px;font-size:14px;font-weight:600;border-radius:8px;background:var(--color-primary, #2563EB);color:#FFFFFF;border:none;cursor:pointer;margin-top:4px;transition:background 0.2s;"
          >
            Sign In with Email
          </button>
        </form>

        <!-- Divider -->
        <div style="display:flex;align-items:center;text-align:center;margin:16px 0;color:#94A3B8;font-size:12px;font-weight:600;letter-spacing:0.05em;">
          <span style="flex:1;border-bottom:1px solid #E2E8F0;"></span>
          <span style="padding:0 12px;">OR</span>
          <span style="flex:1;border-bottom:1px solid #E2E8F0;"></span>
        </div>

        <!-- Google OAuth Button: Launches Real Google Authentication -->
        <button type="button" class="auth-google-btn" id="google-login-btn" onclick="LoginScreen.handleGoogleLogin()" 
                style="width:100%;height:42px;display:flex;align-items:center;justify-content:center;gap:10px;border:1px solid #CBD5E1;border-radius:8px;background:#FFFFFF;color:#1E293B;font-size:13.5px;font-weight:600;cursor:pointer;transition:background 0.15s, border-color 0.15s;margin-bottom:16px;box-shadow:0 1px 2px rgba(0,0,0,0.05);">
          ${this._getGoogleIcon()}
          <span>Continue with Google</span>
        </button>

        <!-- Footer Link -->
        <div style="text-align:center;font-size:13px;color:var(--color-text-muted);">
          Don't have an account? 
          <a href="#signup" onclick="event.preventDefault(); LoginScreen.setView('signup');" style="color:var(--color-primary, #2563EB);font-weight:600;text-decoration:none;">Request Access</a>
        </div>
      </div>
    `;
  },

  // ─── 2. "Admin Approval Required" View (Displays Real Google Account Info) ───
  _renderGoogleApprovalRequiredView() {
    const user = this._googleUser || {
      name: 'Google User',
      email: 'user@hintonn.com',
      avatar: 'GU',
      color: '#2563EB',
      photoURL: null
    };

    return `
      <div>
        <!-- Notice Icon -->
        <div style="width:56px;height:56px;border-radius:50%;background:#FFF7ED;border:2px solid #FED7AA;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="#EA580C" stroke-width="2" width="28" height="28"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>

        <h2 style="font-family:var(--font-display);font-size:19px;font-weight:700;color:var(--color-text-primary);text-align:center;margin:0 0 6px 0;">Admin Approval Required</h2>
        <p style="font-size:13px;color:var(--color-text-secondary);text-align:center;line-height:1.5;margin:0 0 18px 0;">
          The selected Google account is not currently associated with an approved Hintonn account. Administrator approval is required before access can be granted.
        </p>

        <!-- Real Selected Account Card -->
        <div style="background:#F8FAFC;border:1px solid var(--color-border);border-radius:10px;padding:14px 16px;margin-bottom:18px;display:flex;align-items:center;gap:12px;">
          ${user.photoURL ? `
            <img src="${user.photoURL}" alt="${user.name}" style="width:42px;height:42px;border-radius:50%;object-fit:cover;flex-shrink:0;border:1px solid var(--color-border);" />
          ` : `
            <div style="width:42px;height:42px;border-radius:50%;background:${user.color || '#2563EB'};color:#FFFFFF;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;flex-shrink:0;">
              ${user.avatar || user.initials || 'GU'}
            </div>
          `}
          <div style="flex:1;min-width:0;text-align:left;">
            <div style="display:flex;align-items:center;gap:6px;">
              <span style="font-size:14px;font-weight:700;color:var(--color-text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${user.name}</span>
              <span class="badge" style="background:#EFF6FF;color:#2563EB;border:1px solid #BFDBFE;font-size:10.5px;padding:1px 6px;">Google SSO</span>
            </div>
            <div style="font-size:12.5px;color:var(--color-text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${user.email}</div>
          </div>
        </div>

        <!-- Request Details / Department Note -->
        <div style="text-align:left;margin-bottom:20px;">
          <label class="form-label" style="display:block;font-size:12.5px;font-weight:600;color:var(--color-text-primary);margin-bottom:6px;">
            Department / Reason for Access
          </label>
          <input 
            type="text" 
            id="google-req-note" 
            class="form-input" 
            value="Commercial PMO & Project Delivery" 
            placeholder="e.g. Commercial PMO, AI Developer, Site Project Controls" 
            style="width:100%;height:40px;padding:0 12px;border-radius:8px;border:1px solid var(--color-border);font-size:13px;box-sizing:border-box;"
          />
        </div>

        <!-- Action Buttons -->
        <div style="display:flex;flex-direction:column;gap:10px;">
          <button 
            type="button" 
            class="btn btn-primary" 
            onclick="LoginScreen.submitGoogleApprovalRequest()"
            style="width:100%;height:42px;font-size:14px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;border-radius:8px;"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            Request Admin Approval
          </button>

          <button 
            type="button" 
            class="btn btn-secondary" 
            onclick="LoginScreen.setView('signin')"
            style="width:100%;height:40px;font-size:13px;font-weight:600;border-radius:8px;"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    `;
  },

  // ─── 3. "Approval Request Sent / Waiting for Admin Approval" View ───
  _renderGoogleWaitingApprovalView() {
    const requests = Auth.getGoogleApprovalRequests();
    let req = null;
    if (this._activeGoogleReqId) {
      req = requests.find(r => r.id === this._activeGoogleReqId);
    }
    if (!req && this._googleUser) {
      req = requests.find(r => r.email.toLowerCase() === this._googleUser.email.toLowerCase());
    }
    if (!req) {
      req = requests[0] || {
        id: 'req_goog_demo',
        name: (this._googleUser && this._googleUser.name) || 'Google User',
        email: (this._googleUser && this._googleUser.email) || 'user@hintonn.com',
        avatar: 'GU',
        color: '#2563EB',
        status: 'pending',
        requestedAt: new Date().toISOString()
      };
    }

    const isPending = req.status === 'pending';
    const isApproved = req.status === 'approved';
    const isRejected = req.status === 'rejected';

    return `
      <div>
        ${isPending ? `
          <!-- Pending State Icon -->
          <div style="width:64px;height:64px;border-radius:50%;background:#FFF7ED;border:2px solid #FDBA74;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#C2410C" stroke-width="2" width="30" height="30"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>

          <h2 style="font-family:var(--font-display);font-size:19px;font-weight:700;color:var(--color-text-primary);text-align:center;margin:0 0 6px 0;">Approval Request Sent</h2>
          <p style="font-size:13px;color:var(--color-text-secondary);text-align:center;line-height:1.5;margin:0 0 18px 0;">
            Waiting for administrator <strong>Mohit Jain</strong> to review and approve your account.
          </p>

          <!-- Status Card -->
          <div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:10px;padding:16px;margin-bottom:18px;text-align:left;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
              <span style="font-size:12px;font-weight:700;color:#9A3412;text-transform:uppercase;letter-spacing:0.04em;">Live Request Status</span>
              <span class="badge" style="background:#FEF3C7;color:#92400E;border:1px solid #FDE68A;font-weight:700;font-size:11px;display:inline-flex;align-items:center;gap:5px;">
                <span style="width:6px;height:6px;border-radius:50%;background:#D97706;animation:pulse 1.5s infinite;"></span>
                Pending Review
              </span>
            </div>

            <div style="font-size:13px;color:#7C2D12;line-height:1.6;display:flex;flex-direction:column;gap:4px;">
              <div><strong>Account:</strong> ${req.name} (${req.email})</div>
              <div><strong>Request ID:</strong> <span style="font-family:var(--font-mono);font-size:12px;">#${req.id.toUpperCase()}</span></div>
              <div><strong>Submitted:</strong> ${Utils.timeAgo(req.requestedAt)}</div>
              <div><strong>Assigned Approver:</strong> Mohit Jain (Admin)</div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div style="display:flex;flex-direction:column;gap:10px;">
            <button 
              type="button" 
              class="btn btn-primary" 
              onclick="LoginScreen.checkApprovalStatus('${req.id}')"
              style="width:100%;height:42px;font-size:14px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;border-radius:8px;"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
              Check Approval Status
            </button>

            <!-- Quick Demo Helper to switch to Admin -->
            <button 
              type="button" 
              class="btn btn-secondary" 
              onclick="LoginScreen.demoSwitchToAdmin('${req.id}')"
              style="width:100%;height:40px;font-size:12.5px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:6px;border-radius:8px;background:#F1F5F9;border-color:#CBD5E1;color:#1E293B;"
            >
              <span>⚡ Demo: Switch to Admin (Mohit) to Approve</span>
            </button>

            <button 
              type="button" 
              class="btn btn-ghost btn-sm" 
              onclick="LoginScreen.setView('signin')"
              style="color:var(--color-text-muted);font-weight:500;margin-top:4px;"
            >
              Cancel & Return to Sign In
            </button>
          </div>
        ` : ''}

        ${isApproved ? `
          <!-- Approved State -->
          <div style="width:64px;height:64px;border-radius:50%;background:#ECFDF5;border:2px solid #A7F3D0;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5" width="32" height="32"><polyline points="20 6 9 17 4 12"/></svg>
          </div>

          <h2 style="font-family:var(--font-display);font-size:20px;font-weight:700;color:#065F46;text-align:center;margin:0 0 6px 0;">Access Approved! 🎉</h2>
          <p style="font-size:13.5px;color:var(--color-text-secondary);text-align:center;line-height:1.5;margin:0 0 18px 0;">
            Administrator <strong>${req.reviewedBy || 'Mohit Jain (Admin)'}</strong> has authorized your Google account.
          </p>

          <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:14px;margin-bottom:20px;text-align:left;">
            <div style="font-size:13px;color:#166534;line-height:1.6;">
              <div><strong>Authorized User:</strong> ${req.name}</div>
              <div><strong>Google Email:</strong> ${req.email}</div>
              <div><strong>Assigned Role:</strong> ${req.role || 'AI Developer'}</div>
              <div><strong>Approved At:</strong> ${Utils.timeAgo(req.reviewedAt || new Date().toISOString())}</div>
            </div>
          </div>

          <button 
            type="button" 
            class="btn btn-primary" 
            onclick="LoginScreen.enterWithApprovedGoogle('${req.id}')"
            style="width:100%;height:44px;font-size:14.5px;font-weight:700;background:#059669;border-color:#059669;display:flex;align-items:center;justify-content:center;gap:8px;border-radius:8px;"
          >
            <span>Launch PMO Workspace</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        ` : ''}

        ${isRejected ? `
          <!-- Rejected State -->
          <div style="width:64px;height:64px;border-radius:50%;background:#FEF2F2;border:2px solid #FECACA;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2.5" width="30" height="30"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </div>

          <h2 style="font-family:var(--font-display);font-size:19px;font-weight:700;color:#991B1B;text-align:center;margin:0 0 6px 0;">Access Request Declined</h2>
          <p style="font-size:13px;color:var(--color-text-secondary);text-align:center;line-height:1.5;margin:0 0 18px 0;">
            Administrator <strong>${req.reviewedBy || 'Mohit Jain (Admin)'}</strong> declined access for this Google account. Please contact your administrator or try a different account.
          </p>

          <div style="display:flex;flex-direction:column;gap:10px;">
            <button 
              type="button" 
              class="btn btn-primary" 
              onclick="LoginScreen.handleGoogleLogin()"
              style="width:100%;height:42px;font-size:14px;font-weight:600;border-radius:8px;"
            >
              Try Another Account
            </button>
            <button 
              type="button" 
              class="btn btn-secondary" 
              onclick="LoginScreen.setView('signin')"
              style="width:100%;height:40px;font-size:13px;font-weight:600;border-radius:8px;"
            >
              Return to Sign In
            </button>
          </div>
        ` : ''}
      </div>
    `;
  },

  // ─── 4. Sign Up / Access Request View ───
  _renderSignUpView() {
    return `
      <div>
        <h2 style="font-family:var(--font-display);font-size:18px;font-weight:700;color:var(--color-text-primary);text-align:center;margin:0 0 6px 0;">Request System Access</h2>
        <p style="font-size:13px;color:var(--color-text-muted);text-align:center;margin:0 0 16px 0;">Submit your details to request credentials for Hintonn PMO</p>

        <form id="signup-form" onsubmit="event.preventDefault(); LoginScreen.handleSignUp();" style="display:flex;flex-direction:column;gap:14px;">
          <div class="form-group" style="text-align:left;">
            <label for="signup-name" class="form-label" style="display:block;font-size:13px;font-weight:600;color:var(--color-text-primary);margin-bottom:6px;">Full Name <span style="color:#EF4444">*</span></label>
            <input 
              type="text" 
              id="signup-name" 
              class="form-input" 
              placeholder="Enter your full name" 
              autocomplete="name" 
              required 
              style="height:42px;font-size:14px;width:100%;border-radius:8px;border:1px solid var(--color-border);padding:0 12px;box-sizing:border-box;"
              oninput="LoginScreen.clearError()"
            />
          </div>

          <div class="form-group" style="text-align:left;">
            <label for="signup-email" class="form-label" style="display:block;font-size:13px;font-weight:600;color:var(--color-text-primary);margin-bottom:6px;">Email Address <span style="color:#EF4444">*</span></label>
            <input 
              type="email" 
              id="signup-email" 
              class="form-input" 
              placeholder="Enter your email address" 
              autocomplete="email" 
              required 
              style="height:42px;font-size:14px;width:100%;border-radius:8px;border:1px solid var(--color-border);padding:0 12px;box-sizing:border-box;"
              oninput="LoginScreen.clearError()"
            />
          </div>

          <div class="form-group" style="text-align:left;">
            <label for="signup-password" class="form-label" style="display:block;font-size:13px;font-weight:600;color:var(--color-text-primary);margin-bottom:6px;">Password <span style="color:#EF4444">*</span></label>
            <div style="position:relative;display:flex;align-items:center;">
              <input 
                type="password" 
                id="signup-password" 
                class="form-input" 
                placeholder="Min 8 chars, 1 number & 1 special" 
                autocomplete="new-password" 
                required 
                style="height:42px;font-size:14px;width:100%;border-radius:8px;border:1px solid var(--color-border);padding:0 40px 0 12px;box-sizing:border-box;"
                oninput="LoginScreen.clearError()"
              />
              <button type="button" onclick="LoginScreen.togglePasswordVisibility('signup-password', this)" title="Show password" aria-label="Show password"
                      style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#64748B;display:flex;align-items:center;padding:4px;">
                ${this._getEyeIcon()}
              </button>
            </div>
          </div>

          <div class="form-group" style="text-align:left;">
            <label for="signup-confirm-password" class="form-label" style="display:block;font-size:13px;font-weight:600;color:var(--color-text-primary);margin-bottom:6px;">Confirm Password <span style="color:#EF4444">*</span></label>
            <div style="position:relative;display:flex;align-items:center;">
              <input 
                type="password" 
                id="signup-confirm-password" 
                class="form-input" 
                placeholder="Re-enter your password" 
                autocomplete="new-password" 
                required 
                style="height:42px;font-size:14px;width:100%;border-radius:8px;border:1px solid var(--color-border);padding:0 40px 0 12px;box-sizing:border-box;"
                oninput="LoginScreen.clearError()"
              />
              <button type="button" onclick="LoginScreen.togglePasswordVisibility('signup-confirm-password', this)" title="Show password" aria-label="Show password"
                      style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#64748B;display:flex;align-items:center;padding:4px;">
                ${this._getEyeIcon()}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            class="btn btn-primary" 
            id="signup-btn" 
            style="width:100%;height:42px;font-size:14px;font-weight:600;border-radius:8px;background:var(--color-primary, #2563EB);color:#FFFFFF;border:none;cursor:pointer;margin-top:6px;"
          >
            Create Account & Sign In
          </button>
        </form>

        <div style="text-align:center;margin-top:20px;font-size:13px;color:var(--color-text-muted);">
          Already have an account? 
          <a href="#login" onclick="event.preventDefault(); LoginScreen.setView('signin');" style="color:var(--color-primary, #2563EB);font-weight:600;text-decoration:none;">Sign In</a>
        </div>
      </div>
    `;
  },

  // ─── 5. Forgot Password View ───
  _renderForgotPasswordView() {
    return `
      <div>
        <h2 style="font-family:var(--font-display);font-size:18px;font-weight:700;color:var(--color-text-primary);text-align:center;margin:0 0 6px 0;">Reset your password</h2>
        <p style="font-size:13px;color:var(--color-text-muted);text-align:center;margin:0 0 20px 0;">Enter your registered email address to receive password reset instructions</p>

        <form id="forgot-form" onsubmit="event.preventDefault(); LoginScreen.handleForgotPassword();" style="display:flex;flex-direction:column;gap:14px;">
          <div class="form-group" style="text-align:left;">
            <label for="forgot-email" class="form-label" style="display:block;font-size:13px;font-weight:600;color:var(--color-text-primary);margin-bottom:6px;">Registered Email Address</label>
            <input 
              type="email" 
              id="forgot-email" 
              class="form-input" 
              placeholder="Enter your registered email address" 
              autocomplete="email" 
              required
              style="height:42px;font-size:14px;width:100%;border-radius:8px;border:1px solid var(--color-border);padding:0 12px;box-sizing:border-box;"
              oninput="LoginScreen.clearError()"
            />
          </div>

          <button 
            type="submit" 
            class="btn btn-primary" 
            id="forgot-btn" 
            style="width:100%;height:42px;font-size:14px;font-weight:600;border-radius:8px;background:var(--color-primary, #2563EB);color:#FFFFFF;border:none;cursor:pointer;margin-top:6px;"
          >
            Send Reset Link
          </button>
        </form>

        <div style="text-align:center;margin-top:20px;font-size:13px;color:var(--color-text-muted);">
          Remember your password? 
          <a href="#login" onclick="event.preventDefault(); LoginScreen.setView('signin');" style="color:var(--color-primary, #2563EB);font-weight:600;text-decoration:none;">Back to Sign In</a>
        </div>
      </div>
    `;
  },

  // ─── 6. Reset Password View ───
  _renderResetPasswordView() {
    return `
      <div>
        <h2 style="font-family:var(--font-display);font-size:18px;font-weight:700;color:var(--color-text-primary);text-align:center;margin:0 0 6px 0;">Set new password</h2>
        <p style="font-size:13px;color:var(--color-text-muted);text-align:center;margin:0 0 20px 0;">
          ${this._resetEmail ? `For account: <strong>${this._resetEmail}</strong>` : 'Enter your new password below to regain access'}
        </p>

        <form id="reset-form" onsubmit="event.preventDefault(); LoginScreen.handleResetPassword();" style="display:flex;flex-direction:column;gap:14px;">
          <div class="form-group" style="text-align:left;">
            <label for="reset-password" class="form-label" style="display:block;font-size:13px;font-weight:600;color:var(--color-text-primary);margin-bottom:6px;">New Password</label>
            <div style="position:relative;display:flex;align-items:center;">
              <input 
                type="password" 
                id="reset-password" 
                class="form-input" 
                placeholder="Min 8 chars, 1 number & 1 special" 
                autocomplete="new-password" 
                required 
                style="height:42px;font-size:14px;width:100%;border-radius:8px;border:1px solid var(--color-border);padding:0 40px 0 12px;box-sizing:border-box;"
                oninput="LoginScreen.clearError()"
              />
              <button type="button" onclick="LoginScreen.togglePasswordVisibility('reset-password', this)" title="Show password" aria-label="Show password" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#64748B;display:flex;align-items:center;padding:4px;">
                ${this._getEyeIcon()}
              </button>
            </div>
            <div style="font-size:11px;color:var(--color-text-muted);margin-top:4px;">Must contain at least 8 characters, 1 number, and 1 special symbol.</div>
          </div>

          <div class="form-group" style="text-align:left;">
            <label for="reset-confirm-password" class="form-label" style="display:block;font-size:13px;font-weight:600;color:var(--color-text-primary);margin-bottom:6px;">Confirm New Password</label>
            <div style="position:relative;display:flex;align-items:center;">
              <input 
                type="password" 
                id="reset-confirm-password" 
                class="form-input" 
                placeholder="Re-enter your new password" 
                autocomplete="new-password" 
                required 
                style="height:42px;font-size:14px;width:100%;border-radius:8px;border:1px solid var(--color-border);padding:0 40px 0 12px;box-sizing:border-box;"
                oninput="LoginScreen.clearError()"
              />
              <button type="button" onclick="LoginScreen.togglePasswordVisibility('reset-confirm-password', this)" title="Show password" aria-label="Show password" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#64748B;display:flex;align-items:center;padding:4px;">
                ${this._getEyeIcon()}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            class="btn btn-primary" 
            id="reset-btn" 
            style="width:100%;height:42px;font-size:14px;font-weight:600;border-radius:8px;background:var(--color-primary, #2563EB);color:#FFFFFF;border:none;cursor:pointer;margin-top:6px;"
          >
            Update Password
          </button>
        </form>

        <div style="text-align:center;margin-top:20px;font-size:13px;color:var(--color-text-muted);">
          <a href="#login" onclick="event.preventDefault(); LoginScreen.setView('signin');" style="color:var(--color-primary, #2563EB);font-weight:600;text-decoration:none;">Back to Sign In</a>
        </div>
      </div>
    `;
  },

  // ─── Direct ID / Password Login Handler ───
  handleLogin() {
    const idEl = document.getElementById('login-id');
    const passEl = document.getElementById('login-password');
    const loginId = idEl ? idEl.value.trim() : '';
    const password = passEl ? passEl.value : '';

    if (!loginId || !password) {
      this.showError('Please enter both Login ID and password.');
      return;
    }

    const res = Auth.login(loginId, password);
    if (res.success) {
      this.clearError();
      if (typeof Toast !== 'undefined') {
        Toast.show(`Welcome back, ${res.user.name}!`, 'success');
      }
      window.location.hash = '#dashboard';
      if (typeof App !== 'undefined') {
        App.handleRoute();
      }
    } else {
      this.showError(res.error || 'Invalid email or password.');
    }
  },

  // ─── Real Google Sign-In Handler ───
  async handleGoogleLogin() {
    this.clearError();
    const googleBtn = document.getElementById('google-login-btn');
    
    if (typeof firebase === 'undefined' || typeof FirebaseAuth === 'undefined') {
      this.showError('Authentication service is initializing. Please reload.');
      return;
    }

    if (googleBtn) {
      googleBtn.disabled = true;
      googleBtn.innerHTML = '<span class="spinner"></span> Connecting to Google...';
    }

    try {
      const res = await FirebaseAuth.signInGoogle();
      if (googleBtn) {
        googleBtn.disabled = false;
        googleBtn.innerHTML = `${LoginScreen._getGoogleIcon()}<span>Continue with Google</span>`;
      }

      if (!res) {
        // Redirect is occurring in browser
        return;
      }

      // Check the authentication decision returned by the backend/auth logic
      if (res.approved && res.user) {
        if (typeof Toast !== 'undefined') {
          Toast.show(`Welcome back, ${res.user.name || res.user.email}!`, 'success');
        }
        window.location.hash = '#dashboard';
        if (typeof App !== 'undefined' && typeof App.handleRoute === 'function') {
          App.handleRoute();
        }
      } else if (res.pending && res.user) {
        // Real Google account lookup indicates administrator approval is required
        this.showGoogleApprovalRequired(res.user);
      } else if (res.user) {
        this.showGoogleApprovalRequired(res.user);
      }
    } catch (err) {
      console.warn('Google sign-in notice:', err);
      if (googleBtn) {
        googleBtn.disabled = false;
        googleBtn.innerHTML = `${LoginScreen._getGoogleIcon()}<span>Continue with Google</span>`;
      }

      // If user closed the popup or cancelled
      if (err.message && err.message.includes('cancelled')) {
        this.showError('Google sign-in was cancelled.');
        return;
      }

      // In case of domain restriction or popup policy, check if Firebase returned current user
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
      avatar: (user.displayName || user.name || 'GU').split(' ').map(w=>w[0]).join('').slice(0,2),
      color: '#2563EB',
      photoURL: user.photoURL || null
    };
    this._googleUser = formattedUser;
    this.setView('google-approval-required', { user: formattedUser });
  },

  submitGoogleApprovalRequest() {
    const user = this._googleUser || {
      name: 'Google User',
      email: 'user@hintonn.com',
      avatar: 'GU',
      color: '#2563EB'
    };

    const noteEl = document.getElementById('google-req-note');
    const note = noteEl ? noteEl.value.trim() : 'Commercial PMO & Project Delivery';

    const req = Auth.submitGoogleApprovalRequest(user, note);
    this._activeGoogleReqId = req.id;

    if (typeof Toast !== 'undefined') {
      Toast.show('Google login approval request submitted to Administrator Mohit Jain!', 'success');
    }

    this.setView('google-waiting-approval', { reqId: req.id, user: user });
  },

  checkApprovalStatus(reqId) {
    const id = reqId || this._activeGoogleReqId;
    const requests = Auth.getGoogleApprovalRequests();
    const req = requests.find(r => r.id === id);

    if (req) {
      if (req.status === 'approved') {
        if (typeof Toast !== 'undefined') {
          Toast.show('🎉 Access approved! You can now launch into the workspace.', 'success');
        }
      } else if (req.status === 'rejected') {
        if (typeof Toast !== 'undefined') {
          Toast.show('Access request was declined by administrator.', 'error');
        }
      } else {
        if (typeof Toast !== 'undefined') {
          Toast.show('Status check: Request is still pending review by Mohit Jain.', 'info');
        }
      }
    }
    this.setView('google-waiting-approval', { reqId: id });
  },

  enterWithApprovedGoogle(reqId) {
    const id = reqId || this._activeGoogleReqId;
    const res = Auth.loginWithApprovedGoogle(id);
    if (res.success) {
      if (typeof Toast !== 'undefined') {
        Toast.show(`Welcome to Hintonn PMO, ${res.user.name}!`, 'success');
      }
      window.location.hash = '#dashboard';
      if (typeof App !== 'undefined') {
        App.handleRoute();
      }
    } else {
      this.showError(res.error || 'Failed to enter workspace.');
    }
  },

  demoSwitchToAdmin(reqId) {
    // Convenience helper for testing the flow: logs in as Mohit Jain (Admin) so they can approve
    const adminUser = Auth.users.find(u => u.loginId === 'Mohit' || u.role === 'Admin') || {
      id: 'mohit',
      memberId: 'm3',
      loginId: 'Mohit',
      password: 'Mohit@123',
      name: 'Mohit Jain',
      role: 'Admin',
      email: 'mohit@hintonn.com',
      googleEmail: 'mohithintonn@gmail.com',
      initials: 'MJ',
      color: '#4F46E5',
      approved: true
    };

    Auth.currentUser = adminUser;
    localStorage.setItem('hintonn-current-user', JSON.stringify(adminUser));
    if (typeof Store !== 'undefined' && Store._data && Store._data.settings) {
      Store._data.settings.currentUser = 'm3';
    }

    if (typeof Toast !== 'undefined') {
      Toast.show('Logged in as Admin (Mohit Jain). Opening User Approvals...', 'info');
    }

    window.location.hash = '#user-approvals';
    if (typeof App !== 'undefined') {
      App.handleRoute();
    }
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

    if (pass !== confirm) {
      this.showError('Passwords do not match.');
      return;
    }

    const res = Auth.signUp(name, email, pass);
    if (res.success) {
      this.clearError();
      if (typeof Toast !== 'undefined') {
        Toast.show('Account created successfully!', 'success');
      }
      Auth.login(email, pass);
      window.location.hash = '#dashboard';
      if (typeof App !== 'undefined') {
        App.handleRoute();
      }
    } else {
      this.showError(res.error || 'Failed to create account.');
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
    if (typeof Toast !== 'undefined') {
      Toast.show('Reset link sent to your email!', 'success');
    }
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

    if (typeof Toast !== 'undefined') {
      Toast.show('Password updated successfully! Please sign in.', 'success');
    }
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
    if (alertEl) {
      alertEl.style.display = 'none';
    }
    const inputs = document.querySelectorAll('.form-input.error');
    inputs.forEach(input => input.classList.remove('error'));
  }
};
