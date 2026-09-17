/**
 * AS JEWELLAR PAWN SHOP - AUTHENTICATION & SESSION SERVICE
 * Admin-only security model with token handling, route guards & brute-force resistance.
 */

const AUTH_TOKEN_KEY = 'as_jewellar_token';
const AUTH_USER_KEY = 'as_jewellar_user';
const FAILED_LOGINS_KEY = 'as_jewellar_failed_logins';
const SESSION_EXPIRY_MINUTES = 480; // 8 hours counter shift
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

class AuthService {
  constructor() {
    this.token = localStorage.getItem(AUTH_TOKEN_KEY);
    this.user = this.getStoredUser();
  }

  getStoredUser() {
    try {
      const data = localStorage.getItem(AUTH_USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  getFailedLoginRecord() {
    try {
      const stored = localStorage.getItem(FAILED_LOGINS_KEY);
      return stored ? JSON.parse(stored) : { count: 0, lockedUntil: 0 };
    } catch (e) {
      return { count: 0, lockedUntil: 0 };
    }
  }

  recordFailedLogin() {
    const record = this.getFailedLoginRecord();
    record.count = (record.count || 0) + 1;
    if (record.count >= MAX_FAILED_ATTEMPTS) {
      record.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
    }
    localStorage.setItem(FAILED_LOGINS_KEY, JSON.stringify(record));
    return record;
  }

  resetFailedLogins() {
    localStorage.removeItem(FAILED_LOGINS_KEY);
  }

  getLockoutRemainingSeconds() {
    const record = this.getFailedLoginRecord();
    if (record.lockedUntil && record.lockedUntil > Date.now()) {
      return Math.ceil((record.lockedUntil - Date.now()) / 1000);
    }
    return 0;
  }

  isAuthenticated() {
    if (!this.token || !this.user) return false;
    const loginTime = this.user.loginTime || 0;
    const now = Date.now();
    const isExpired = (now - loginTime) > (SESSION_EXPIRY_MINUTES * 60 * 1000);
    if (isExpired) {
      this.logout();
      return false;
    }
    return true;
  }

  getToken() {
    return this.token || localStorage.getItem(AUTH_TOKEN_KEY) || '';
  }

  getUser() {
    return this.user;
  }

  async login(username, password) {
    // 1. Check Brute-force Lockout
    const lockoutSecs = this.getLockoutRemainingSeconds();
    if (lockoutSecs > 0) {
      return {
        success: false,
        locked: true,
        remainingSeconds: lockoutSecs,
        message: `Too many failed attempts. Account locked for ${lockoutSecs}s.`
      };
    }

    // Check if backend API URL is configured
    const DEFAULT_API_ENDPOINT = 'https://script.google.com/macros/s/AKfycbw6fWoHIhQxVRHEoTVwoMIe5pPA8B17ClwYL4lpJl1oB8kOXHHrF-snXRICsgZbGOJu/exec';
    const apiUrl = (typeof window !== 'undefined' && window.api && window.api.endpoint) 
      || localStorage.getItem('as_jewellar_api_endpoint') 
      || localStorage.getItem('as_jewellar_api_url') 
      || DEFAULT_API_ENDPOINT;
    
    if (apiUrl) {
      try {
        const response = await fetch(`${apiUrl}?action=login`, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'login', data: { username, password } }),
          redirect: 'follow'
        });
        const resData = await response.json();
        if (resData.success && resData.data) {
          this.resetFailedLogins();
          this.setSession(resData.data.token, resData.data.user || resData.data);
          return { success: true, user: resData.data.user || resData.data };
        } else if (resData.message && !resData.message.includes('Script error')) {
          this.recordFailedLogin();
          return { success: false, message: resData.message || 'Invalid credentials' };
        }
      } catch (err) {
        console.warn('API login failed, checking local credentials fallback...', err);
      }
    }

    // Default Foundation Admin Login (For Initial Setup & Offline Mode)
    const adminUser = localStorage.getItem('as_admin_user') || 'Arockiasamy C';
    const adminPass = localStorage.getItem('as_admin_pass') || 'AS@2026';

    const normalizedUser = username.trim();
    const isMatchingUser = (normalizedUser === adminUser || normalizedUser.toLowerCase() === 'arockiasamy c' || normalizedUser.toLowerCase() === 'admin');
    const isMatchingPass = (password === adminPass || password === 'AS@2026');

    if (isMatchingUser && isMatchingPass) {
      this.resetFailedLogins();
      // Generate standard base64 payload token for full Sheets compatibility
      const tokenPayload = {
        u: normalizedUser,
        r: 'ADMIN',
        exp: Date.now() + (24 * 60 * 60 * 1000),
        rnd: Math.random().toString(36).substring(2, 8)
      };
      let mockToken = '';
      try {
        mockToken = (typeof btoa !== 'undefined') 
          ? btoa(JSON.stringify(tokenPayload)) 
          : Buffer.from(JSON.stringify(tokenPayload)).toString('base64');
      } catch (e) {
        mockToken = 'JWT_ADMIN_' + Math.random().toString(36).substring(2) + Date.now();
      }
      const mockUser = {
        userId: 'USR-2026-000001',
        username: normalizedUser,
        fullName: 'Arockiasamy C (முதன்மையாளர்)',
        role: 'ADMIN',
        loginTime: Date.now()
      };
      this.setSession(mockToken, mockUser);
      return { success: true, user: mockUser };
    }

    // Failed attempt
    const record = this.recordFailedLogin();
    const attemptsLeft = Math.max(0, MAX_FAILED_ATTEMPTS - record.count);
    return {
      success: false,
      attemptsLeft,
      message: attemptsLeft > 0 
        ? `Invalid admin username or password (${attemptsLeft} attempts remaining)` 
        : 'Too many failed attempts. Account locked for 5 minutes.'
    };
  }

  setSession(token, user) {
    this.token = token;
    this.user = { ...user, loginTime: Date.now() };
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(this.user));

    if (window.auditLogger) {
      window.auditLogger.log('LOGIN', 'AUTH', user ? user.username : 'ADMIN', {
        role: user ? user.role : 'ADMIN',
        loginTime: new Date().toISOString()
      });
    }
  }

  logout() {
    const user = this.user;
    if (window.auditLogger && user) {
      window.auditLogger.log('LOGOUT', 'AUTH', user.username, {
        role: user.role,
        logoutTime: new Date().toISOString()
      });
    }
    this.token = null;
    this.user = null;
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    window.location.href = 'login.html';
  }

  isAdmin() {
    return Boolean(this.user && (this.user.role === 'ADMIN' || this.user.role === 'DIRECTOR'));
  }

  requireAuth() {
    const isLoginPage = window.location.pathname.endsWith('login.html');
    if (!this.isAuthenticated() && !isLoginPage) {
      window.location.href = 'login.html';
    } else if (this.isAuthenticated() && isLoginPage) {
      window.location.href = 'dashboard.html';
    }
  }

  requireAdmin() {
    if (!this.isAuthenticated()) {
      window.location.href = 'login.html';
      return false;
    }
    if (!this.isAdmin()) {
      alert('Access Denied: Administrator privileges required for this section.');
      window.location.href = 'dashboard.html';
      return false;
    }
    return true;
  }
}

window.auth = new AuthService();

// Run immediate check if in browser
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    window.auth.requireAuth();
  });
}
