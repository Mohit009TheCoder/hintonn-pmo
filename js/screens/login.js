// ─── Authentication Screen Component (Sign In, Sign Up, Forgot Password, Reset Password) ───
const LoginScreen = {
  _currentView: 'signin', // 'signin' | 'signup' | 'forgot' | 'reset'
  _resetEmail: '',
  _errorMessage: '',

  // Set the active authentication view
  setView(view) {
    this._currentView = view || 'signin';
    this._errorMessage = '';
    
    // Update hash without triggering reload loop
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

  // Toggle Password Field Visibility
  togglePasswordVisibility(inputId, btnEl) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';

    if (btnEl) {
      btnEl.innerHTML = isPassword ? this._getEyeOffIcon() : this._getEyeIcon();
      if (btnEl.setAttribute) btnEl.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
      btnEl.title = isPassword ? 'Hide password' : 'Show password';
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

  _getShieldIcon() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
  },

  _getClockIcon() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
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
      else this._currentView = 'signin';
    }

    return `
      <div class="login-wrapper auth-wrapper" style="min-height:100vh;width:100%;display:flex;align-items:center;justify-content:center;background:#F8FAFC;padding:24px;box-sizing:border-box;">
        ${this._renderCard()}
      </div>
    `;
  },

  _renderCard() {
    return `
      <div class="login-card auth-card" style="width:100%;max-width:420px;background:#FFFFFF;border:1px solid var(--color-border, #E2E8F0);border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.06);padding:36px 32px;box-sizing:border-box;">
        
        <!-- Official Hintonn AI Logo -->
        <div class="login-logo-wrapper" style="text-align:center;margin-bottom:18px;background-color:#FFFFFF;">
          <img 
            src="assets/hintonn-official-logo.png" 
            alt="Hintonn AI" 
            class="login-logo-img"
            style="max-height:44px;width:auto;object-fit:contain;display:block;margin:0 auto;mix-blend-mode:multiply !important;background:transparent !important;filter:contrast(108%);" 
          />
        </div>

        <!-- Inline Error Alert Callout Banner -->
        <div id="auth-error-alert" style="display:${this._errorMessage ? 'flex' : 'none'};background:${this._errorMessage && this._errorMessage.includes('pending') ? '#FFF7ED' : '#FEF2F2'};border:1px solid ${this._errorMessage && this._errorMessage.includes('pending') ? '#FED7AA' : '#FECACA'};border-radius:8px;padding:10px 14px;color:${this._errorMessage && this._errorMessage.includes('pending') ? '#C2410C' : '#DC2626'};font-size:13px;font-weight:500;margin-bottom:18px;align-items:flex-start;gap:8px;line-height:1.5;">
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
      case 'signin':
      default:
        return this._renderSignInView();
    }
  },

  // ─── 1. Sign In View ───
  _renderSignInView() {
    return `
      <div>
        <h2 style="font-family:var(--font-display);font-size:18px;font-weight:700;color:var(--color-text-primary);text-align:center;margin:0 0 6px 0;">Sign in to your PMO workspace</h2>
        <p style="font-size:13px;color:var(--color-text-muted);text-align:center;margin:0 0 20px 0;">Enter your credentials to access the enterprise platform</p>

        <!-- Admin Approval Notice -->
        <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:8px;padding:10px 14px;margin-bottom:18px;display:flex;align-items:flex-start;gap:8px;">
          <svg style="width:16px;height:16px;flex-shrink:0;margin-top:1px;color:#2563EB" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <div style="font-size:12px;color:#1E40AF;line-height:1.5;">
            <strong>Admin-Only Access</strong> — Only approved users can sign in. New accounts require administrator approval before login is granted.
          </div>
        </div>

        <!-- Form -->
        <form id="login-form" onsubmit="event.preventDefault(); LoginScreen.handleLogin();" style="display:flex;flex-direction:column;gap:14px;">
          <div class="form-group" style="text-align:left;">
            <label for="login-id" class="form-label" style="display:block;font-size:13px;font-weight:600;color:var(--color-text-primary);margin-bottom:6px;">Login ID or Email</label>
            <input 
              type="text" 
              id="login-id" 
              class="form-input" 
              placeholder="Enter your Login ID or Email" 
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
            Sign In
          </button>
        </form>

        <!-- Divider -->
        <div style="display:flex;align-items:center;text-align:center;margin:16px 0;color:#94A3B8;font-size:12px;font-weight:600;letter-spacing:0.05em;">
          <span style="flex:1;border-bottom:1px solid #E2E8F0;"></span>
          <span style="padding:0 12px;">OR</span>
          <span style="flex:1;border-bottom:1px solid #E2E8F0;"></span>
        </div>

        <!-- Google OAuth Button -->
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

  // ─── 2. Sign Up / Request Access View ───
  _renderSignUpView() {
    return `
      <div>
        <h2 style="font-family:var(--font-display);font-size:18px;font-weight:700;color:var(--color-text-primary);text-align:center;margin:0 0 6px 0;">Request System Access</h2>
        <p style="font-size:13px;color:var(--color-text-muted);text-align:center;margin:0 0 6px 0;">Submit your details to request access to Hintonn PMO</p>
        
        <!-- Approval Required Notice -->
        <div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:8px;padding:12px 14px;margin-bottom:18px;display:flex;align-items:flex-start;gap:10px;">
          <div style="width:32px;height:32px;border-radius:50%;background:#FFF7ED;border:1px solid #FDBA74;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#C2410C" stroke-width="2" width="16" height="16"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div>
            <div style="font-size:13px;font-weight:700;color:#9A3412;margin-bottom:2px;">Admin Approval Required</div>
            <div style="font-size:12px;color:#C2410C;line-height:1.5;">After submitting, an administrator must approve your account before you can log in. You will see a pending status until approved.</div>
          </div>
        </div>

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
            <div style="font-size:11px;color:var(--color-text-muted);margin-top:4px;">Must contain at least 8 characters, 1 number, and 1 special symbol.</div>
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
            style="width:100%;height:42px;font-size:14px;font-weight:600;border-radius:8px;background:var(--color-primary, #2563EB);color:#FFFFFF;border:none;cursor:pointer;margin-top:6px;display:flex;align-items:center;justify-content:center;gap:8px;"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Submit Access Request
          </button>
        </form>

        <div style="text-align:center;margin-top:20px;font-size:13px;color:var(--color-text-muted);">
          Already have an account? 
          <a href="#login" onclick="event.preventDefault(); LoginScreen.setView('signin');" style="color:var(--color-primary, #2563EB);font-weight:600;text-decoration:none;">Sign In</a>
        </div>
      </div>
    `;
  },

  // ─── 3. Forgot Password View ───
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
              value="${this._resetEmail || ''}"
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

  // ─── 4. Reset Password View ───
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

  // ─── Actions & Handlers ───
  handleLogin() {
    const idEl = document.getElementById('login-id');
    const passEl = document.getElementById('login-password');
    const loginId = idEl ? idEl.value.trim() : '';
    const password = passEl ? passEl.value : '';

    if (!loginId || !password) {
      this.showError('Invalid Login ID or password.');
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
      this.showError(res.error || 'Invalid Login ID or password.');
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

    // 1. Name validation
    if (!name) {
      this.showError('Please enter your full name.');
      if (nameEl) nameEl.classList.add('error');
      return;
    }

    // 2. Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      this.showError('Please enter a valid email address.');
      if (emailEl) emailEl.classList.add('error');
      return;
    }

    // 3. Password Requirements
    const hasMinLen = pass.length >= 8;
    const hasNum = /[0-9]/.test(pass);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-+=\\\/\[\]~`]/.test(pass);

    if (!hasMinLen || !hasNum || !hasSpecial) {
      this.showError('Password must be at least 8 characters long, including one number and one special character.');
      if (passEl) passEl.classList.add('error');
      return;
    }

    // 4. Passwords Match validation
    if (pass !== confirm) {
      this.showError('Passwords do not match.');
      if (confirmEl) confirmEl.classList.add('error');
      return;
    }

    // 5. Submit access request (creates PENDING user)
    const res = Auth.signUp(name, email, pass);
    if (res.success) {
      this.clearError();
      if (typeof Toast !== 'undefined') {
        Toast.show('Access request submitted! Waiting for admin approval.', 'success');
      }
      // Show the pending approval screen
      this._showPendingApprovalScreen(name, email);
    } else {
      this.showError(res.error || 'Failed to submit access request.');
    }
  },

  // ─── Show Pending Approval Screen after sign-up ───
  _showPendingApprovalScreen(name, email) {
    const content = document.getElementById('page-content');
    if (!content) return;
    
    const wrapper = document.querySelector('.login-wrapper') || document.querySelector('.auth-wrapper');
    if (wrapper) {
      wrapper.innerHTML = `
        <div class="login-card auth-card" style="width:100%;max-width:420px;background:#FFFFFF;border:1px solid var(--color-border, #E2E8F0);border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.06);padding:36px 32px;box-sizing:border-box;text-align:center;">
          
          <!-- Logo -->
          <div style="text-align:center;margin-bottom:18px;">
            <img src="assets/hintonn-official-logo.png" alt="Hintonn AI" style="max-height:44px;width:auto;object-fit:contain;display:block;margin:0 auto;mix-blend-mode:multiply !important;background:transparent !important;" />
          </div>

          <!-- Pending Icon -->
          <div style="width:72px;height:72px;border-radius:50%;background:#FFF7ED;border:2px solid #FDBA74;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#C2410C" stroke-width="2" width="32" height="32"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>

          <h2 style="font-family:var(--font-display);font-size:20px;font-weight:700;color:var(--color-text-primary);margin:0 0 8px 0;">Access Request Pending</h2>
          
          <p style="font-size:14px;color:var(--color-text-secondary);line-height:1.6;margin:0 0 20px 0;">
            Thank you, <strong>${name}</strong>. Your request to join Hintonn PMO has been submitted.
          </p>

          <!-- Status Card -->
          <div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:10px;padding:16px;margin-bottom:20px;">
            <div style="display:flex;align-items:center;gap:8px;justify-content:center;margin-bottom:8px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="#C2410C" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span style="font-size:14px;font-weight:700;color:#9A3412;">Awaiting Admin Approval</span>
            </div>
            <p style="font-size:12.5px;color:#C2410C;margin:0;line-height:1.5;">
              An administrator will review your request and grant access. You will be able to sign in once your account is approved.
            </p>
          </div>

          <!-- Details -->
          <div style="font-size:13px;color:var(--color-text-muted);margin-bottom:24px;">
            <div style="margin-bottom:4px;">Account: <strong style="color:var(--color-text-primary);">${email}</strong></div>
            <div>Submitted: <strong style="color:var(--color-text-primary);">${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong></div>
          </div>

          <!-- Action -->
          <button type="button" class="btn btn-primary" onclick="LoginScreen.setView('signin')" style="width:100%;height:42px;font-size:14px;font-weight:600;border-radius:8px;background:var(--color-primary, #2563EB);color:#FFFFFF;border:none;cursor:pointer;">
            Back to Sign In
          </button>
        </div>
      `;
    }
  },

  handleForgotPassword() {
    const emailEl = document.getElementById('forgot-email');
    const email = emailEl ? emailEl.value.trim() : '';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      this.showError('Please enter a valid email address.');
      if (emailEl) emailEl.classList.add('error');
      return;
    }

    this._resetEmail = email;
    Auth.forgotPassword(email);

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

    const hasMinLen = pass.length >= 8;
    const hasNum = /[0-9]/.test(pass);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-+=\\\/\[\]~`]/.test(pass);

    if (!hasMinLen || !hasNum || !hasSpecial) {
      this.showError('Password must be at least 8 characters long, including one number and one special character.');
      if (passEl) passEl.classList.add('error');
      return;
    }

    if (pass !== confirm) {
      this.showError('Passwords do not match.');
      if (confirmEl) confirmEl.classList.add('error');
      return;
    }

    Auth.resetPassword(this._resetEmail, pass);

    if (typeof Toast !== 'undefined') {
      Toast.show('Password updated successfully! Please sign in with your new password.', 'success');
    }

    this.setView('signin');
  },

  // ─── Google OAuth via Redirect ───
  async handleGoogleLogin() {
    this.clearError();
    const googleBtn = document.getElementById('google-login-btn');
    
    if (typeof firebase === 'undefined') {
      this.showError('Firebase SDK not loaded. Check your internet connection and reload.');
      return;
    }
    if (typeof FirebaseAuth === 'undefined') {
      this.showError('Firebase Auth module not loaded. Please reload the page.');
      return;
    }

    if (googleBtn) {
      googleBtn.disabled = true;
      googleBtn.innerHTML = '<span class="spinner"></span> Connecting to Google...';
    }

    try {
      const result = await FirebaseAuth.signInGoogle();
      if (result) {
        // Approved user — proceed to dashboard
        if (typeof Toast !== 'undefined') {
          Toast.show(`Welcome back, ${result.displayName || result.email}!`, 'success');
        }
        window.location.hash = '#dashboard';
        if (typeof App !== 'undefined' && typeof App.handleRoute === 'function') {
          App.handleRoute();
        }
      } else {
        // User was blocked — either pending approval or error
        // Check if there's a pending user from the Google sign-in
        const firebaseUser = FirebaseAuth.getCurrentUser ? FirebaseAuth.getCurrentUser() : null;
        const userEmail = firebaseUser ? firebaseUser.email : '';
        
        // Look up the pending user
        const pendingUser = userEmail ? Auth.users.find(u => 
          (u.email && u.email.toLowerCase() === userEmail.toLowerCase()) ||
          (u.googleEmail && u.googleEmail.toLowerCase() === userEmail.toLowerCase())
        ) : null;
        
        if (pendingUser && pendingUser.approved === false) {
          // Show pending approval screen
          this._showPendingApprovalScreen(pendingUser.name, pendingUser.email || userEmail);
        } else {
          this.showError('Your account is pending admin approval. Please wait for an administrator to approve your access.');
        }
      }
    } catch (err) {
      console.error('Google sign-in error:', err);
      this.showError(err.message || 'Google authentication failed. Please try again.');
      if (googleBtn) {
        googleBtn.disabled = false;
        googleBtn.innerHTML = `${LoginScreen._getGoogleIcon()}<span>Continue with Google</span>`;
      }
    }
  },

  showError(msg) {
    this._errorMessage = msg;
    const alertEl = document.getElementById('auth-error-alert');
    const textEl = document.getElementById('auth-error-text');
    if (alertEl && textEl) {
      textEl.textContent = msg;
      // Style differently for pending approval messages
      if (msg && msg.includes('pending')) {
        alertEl.style.background = '#FFF7ED';
        alertEl.style.borderColor = '#FED7AA';
        alertEl.style.color = '#C2410C';
      } else {
        alertEl.style.background = '#FEF2F2';
        alertEl.style.borderColor = '#FECACA';
        alertEl.style.color = '#DC2626';
      }
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

// Global event delegation for Google OAuth button
if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    const googleBtn = e.target && e.target.closest && (e.target.closest('#google-login-btn') || e.target.closest('.auth-google-btn'));
    if (googleBtn) {
      e.preventDefault();
      LoginScreen.handleGoogleLogin();
    }
  });
}
