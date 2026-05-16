/* ============================================================
   PIZZA EMPIRE — AUTH SYSTEM (localStorage-based)
   Each account: { username, passwordHash, created, lastLogin }
   Each save stored separately under key: pizza_save_<username>
   ============================================================ */

const Auth = {
    ACCOUNTS_KEY: 'pizza_empire_accounts',
    SESSION_KEY:  'pizza_empire_session',
    currentUser: null,

    // ── Simple hash (not cryptographic — client-side game only) ──
    hash(str) {
        let h = 0;
        for (let i = 0; i < str.length; i++) {
            h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
        }
        return h.toString(36);
    },

    // ── Get all stored accounts ──
    getAccounts() {
        return JSON.parse(localStorage.getItem(this.ACCOUNTS_KEY) || '{}');
    },

    saveAccounts(accounts) {
        localStorage.setItem(this.ACCOUNTS_KEY, JSON.stringify(accounts));
    },

    // ── Create new account ──
    register(username, password) {
        username = username.trim().toLowerCase();
        if (!username || username.length < 3)  return { ok: false, msg: 'Username must be at least 3 characters.' };
        if (!password || password.length < 4)  return { ok: false, msg: 'Password must be at least 4 characters.' };
        if (!/^[a-z0-9_]+$/.test(username))    return { ok: false, msg: 'Username: letters, numbers, _ only.' };

        const accounts = this.getAccounts();
        if (accounts[username]) return { ok: false, msg: 'Username already taken!' };

        accounts[username] = {
            username,
            passwordHash: this.hash(password),
            created: Date.now(),
            lastLogin: Date.now(),
        };
        this.saveAccounts(accounts);
        this.setSession(username);
        return { ok: true };
    },

    // ── Login ──
    login(username, password) {
        username = username.trim().toLowerCase();
        const accounts = this.getAccounts();
        const acc = accounts[username];
        if (!acc) return { ok: false, msg: 'Account not found.' };
        if (acc.passwordHash !== this.hash(password)) return { ok: false, msg: 'Wrong password!' };

        acc.lastLogin = Date.now();
        this.saveAccounts(accounts);
        this.setSession(username);
        return { ok: true };
    },

    // ── Session ──
    setSession(username) {
        this.currentUser = username;
        localStorage.setItem(this.SESSION_KEY, username);
    },

    getSession() {
        return localStorage.getItem(this.SESSION_KEY);
    },

    logout() {
        this.currentUser = null;
        localStorage.removeItem(this.SESSION_KEY);
        location.reload();
    },

    // ── Per-user save key ──
    saveKey() {
        return `pizza_save_${this.currentUser}`;
    },

    // ── Check on boot ──
    checkSession() {
        const user = this.getSession();
        if (user) {
            const accounts = this.getAccounts();
            if (accounts[user]) {
                this.currentUser = user;
                return true;
            }
        }
        return false;
    },

    getDisplayName() {
        if (!this.currentUser) return '';
        // Capitalize first letter
        return this.currentUser.charAt(0).toUpperCase() + this.currentUser.slice(1);
    },
};

/* ============================================================
   AUTH UI — builds and manages the login/signup overlay
   ============================================================ */
const AuthUI = {
    mode: 'login',   // 'login' | 'register'

    // Build the full-screen auth overlay
    build() {
        const overlay = document.createElement('div');
        overlay.id = 'auth-overlay';
        overlay.innerHTML = `
            <div class="auth-card">
                <div class="auth-logo">
                    <h1>PIZZA<span>EMPIRE</span></h1>
                    <p class="auth-sub">Sign in to save your progress & build your legacy</p>
                </div>

                <div class="auth-tabs">
                    <button class="auth-tab active" id="tab-login">Login</button>
                    <button class="auth-tab" id="tab-register">Sign Up</button>
                </div>

                <div class="auth-form" id="auth-form">
                    <div class="auth-field">
                        <label for="auth-username">👤 Username</label>
                        <input type="text" id="auth-username" placeholder="your_username" autocomplete="username" maxlength="20" />
                    </div>
                    <div class="auth-field">
                        <label for="auth-password">🔒 Password</label>
                        <input type="password" id="auth-password" placeholder="••••••••" autocomplete="current-password" />
                    </div>

                    <div class="auth-error" id="auth-error" style="display:none;"></div>

                    <button class="auth-submit" id="auth-submit">🍕 Login</button>
                </div>

                <p class="auth-note">Progress is stored on this device. Each account has its own save.</p>
            </div>
        `;
        document.body.appendChild(overlay);
        this.attachEvents(overlay);
    },

    attachEvents(overlay) {
        const tabLogin    = overlay.querySelector('#tab-login');
        const tabRegister = overlay.querySelector('#tab-register');
        const submitBtn   = overlay.querySelector('#auth-submit');
        const usernameEl  = overlay.querySelector('#auth-username');
        const passwordEl  = overlay.querySelector('#auth-password');
        const errorEl     = overlay.querySelector('#auth-error');

        // Tab switching
        tabLogin.addEventListener('click', () => {
            this.mode = 'login';
            tabLogin.classList.add('active');
            tabRegister.classList.remove('active');
            submitBtn.textContent = '🍕 Login';
            errorEl.style.display = 'none';
        });

        tabRegister.addEventListener('click', () => {
            this.mode = 'register';
            tabRegister.classList.add('active');
            tabLogin.classList.remove('active');
            submitBtn.textContent = '✨ Create Account';
            errorEl.style.display = 'none';
        });

        // Submit
        submitBtn.addEventListener('click', () => this.submit(usernameEl, passwordEl, errorEl, overlay));

        // Enter key
        [usernameEl, passwordEl].forEach(el => {
            el.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.submit(usernameEl, passwordEl, errorEl, overlay);
            });
        });

        // Focus username
        setTimeout(() => usernameEl.focus(), 100);
    },

    submit(usernameEl, passwordEl, errorEl, overlay) {
        const username = usernameEl.value.trim();
        const password = passwordEl.value;
        errorEl.style.display = 'none';

        const result = this.mode === 'login'
            ? Auth.login(username, password)
            : Auth.register(username, password);

        if (result.ok) {
            // Animate out
            overlay.style.animation = 'authFadeOut 0.5s ease forwards';
            setTimeout(() => {
                overlay.remove();
                this.onSuccess();
            }, 450);
        } else {
            errorEl.textContent = result.msg;
            errorEl.style.display = 'block';
            usernameEl.classList.add('shake');
            setTimeout(() => usernameEl.classList.remove('shake'), 500);
        }
    },

    onSuccess() {
        // Inject username badge into sidebar and start game
        this.injectUserBadge();
        Game.init();
    },

    injectUserBadge() {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;

        const badge = document.createElement('div');
        badge.className = 'user-badge';
        badge.innerHTML = `
            <div class="user-badge-inner">
                <span class="user-avatar">👨‍🍳</span>
                <div class="user-info">
                    <span class="user-name">${Auth.getDisplayName()}</span>
                    <span class="user-sub">Chef</span>
                </div>
                <button class="logout-btn" id="logout-btn" title="Logout">⏏</button>
            </div>
        `;
        // Insert after logo
        const logo = sidebar.querySelector('.logo');
        logo.after(badge);

        document.getElementById('logout-btn').addEventListener('click', () => {
            if (confirm('Log out? Your progress is saved.')) Auth.logout();
        });
    },
};
