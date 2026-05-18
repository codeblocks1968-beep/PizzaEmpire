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
    register(username, password, favoriteColor) {
        username = username.trim().toLowerCase();
        if (!username || username.length < 3)  return { ok: false, msg: 'Username must be at least 3 characters.' };
        if (!password || password.length < 4)  return { ok: false, msg: 'Password must be at least 4 characters.' };
        if (!favoriteColor)                    return { ok: false, msg: 'Please select your favorite color.' };
        if (!/^[a-z0-9_]+$/.test(username))    return { ok: false, msg: 'Username: letters, numbers, _ only.' };

        const accounts = this.getAccounts();
        if (accounts[username]) return { ok: false, msg: 'Username already taken! This name is reserved for only 1 person.' };

        accounts[username] = {
            username,
            passwordHash: this.hash(password),
            favoriteColor,
            created: Date.now(),
            lastLogin: Date.now(),
        };
        this.saveAccounts(accounts);
        this.setSession(username);
        return { ok: true };
    },

    // ── Login ──
    login(username, password, favoriteColor) {
        username = username.trim().toLowerCase();
        if (!favoriteColor) return { ok: false, msg: 'Please select your favorite color.' };
        
        const accounts = this.getAccounts();
        const acc = accounts[username];
        if (!acc) return { ok: false, msg: 'Account not found.' };
        if (acc.passwordHash !== this.hash(password)) return { ok: false, msg: 'Wrong password!' };

        // Color check with migration support for legacy accounts
        if (acc.favoriteColor) {
            if (acc.favoriteColor !== favoriteColor) {
                return { ok: false, msg: 'Incorrect favorite color! Access denied.' };
            }
        } else {
            // Migrate: Save the favorite color on first successful login if it wasn't set before
            acc.favoriteColor = favoriteColor;
        }

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
                    <div class="auth-field" id="color-field">
                        <label id="color-label">🎨 Select your Fave Colour to verify identity</label>
                        <div class="color-picker-grid" id="auth-color-picker">
                            <button type="button" class="color-bubble" data-color="Red" style="--bubble-color: #ff4b4b;" title="Red"></button>
                            <button type="button" class="color-bubble" data-color="Blue" style="--bubble-color: #3b82f6;" title="Blue"></button>
                            <button type="button" class="color-bubble" data-color="Green" style="--bubble-color: #10b981;" title="Green"></button>
                            <button type="button" class="color-bubble" data-color="Yellow" style="--bubble-color: #f59e0b;" title="Yellow"></button>
                            <button type="button" class="color-bubble" data-color="Purple" style="--bubble-color: #8b5cf6;" title="Purple"></button>
                            <button type="button" class="color-bubble" data-color="Pink" style="--bubble-color: #ec4899;" title="Pink"></button>
                            <button type="button" class="color-bubble" data-color="Orange" style="--bubble-color: #f97316;" title="Orange"></button>
                            <button type="button" class="color-bubble" data-color="Cyan" style="--bubble-color: #06b6d4;" title="Cyan"></button>
                        </div>
                        <input type="hidden" id="auth-favorite-color" value="" />
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
        const colorInput  = overlay.querySelector('#auth-favorite-color');
        const colorBubbles = overlay.querySelectorAll('.color-bubble');
        const colorLabel  = overlay.querySelector('#color-label');
        const errorEl     = overlay.querySelector('#auth-error');

        // Tab switching
        tabLogin.addEventListener('click', () => {
            this.mode = 'login';
            tabLogin.classList.add('active');
            tabRegister.classList.remove('active');
            submitBtn.textContent = '🍕 Login';
            colorLabel.textContent = '🎨 Select your Fave Colour to verify identity';
            errorEl.style.display = 'none';
        });

        tabRegister.addEventListener('click', () => {
            this.mode = 'register';
            tabRegister.classList.add('active');
            tabLogin.classList.remove('active');
            submitBtn.textContent = '✨ Create Account';
            colorLabel.textContent = '🎨 Choose your Fave Colour (keeps your account extra secure)';
            errorEl.style.display = 'none';
        });

        // Color bubble click choice handler
        colorBubbles.forEach(bubble => {
            bubble.addEventListener('click', () => {
                colorBubbles.forEach(b => b.classList.remove('active'));
                bubble.classList.add('active');
                colorInput.value = bubble.dataset.color;
            });
        });

        // Submit
        submitBtn.addEventListener('click', () => this.submit(usernameEl, passwordEl, colorInput, errorEl, overlay));

        // Enter key
        [usernameEl, passwordEl].forEach(el => {
            el.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.submit(usernameEl, passwordEl, colorInput, errorEl, overlay);
            });
        });

        // Focus username
        setTimeout(() => usernameEl.focus(), 100);
    },

    submit(usernameEl, passwordEl, colorInput, errorEl, overlay) {
        const username = usernameEl.value.trim();
        const password = passwordEl.value;
        const favoriteColor = colorInput.value;
        errorEl.style.display = 'none';

        if (!favoriteColor) {
            errorEl.textContent = 'Please select your favorite color!';
            errorEl.style.display = 'block';
            return;
        }

        const result = this.mode === 'login'
            ? Auth.login(username, password, favoriteColor)
            : Auth.register(username, password, favoriteColor);

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
        this.injectDeviceSelector();
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

    // ── Inject Device Simulator card in Sidebar after Account badge ──
    injectDeviceSelector() {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;

        const existing = sidebar.querySelector('.device-selector-card');
        if (existing) existing.remove();

        const card = document.createElement('div');
        card.className = 'device-selector-card';
        card.innerHTML = `
            <span class="device-label">📱 Device Simulator</span>
            <div class="device-buttons-grid">
                <button class="device-btn active" data-device="computer" title="Computer">🖥️</button>
                <button class="device-btn" data-device="laptop" title="Laptop">💻</button>
                <button class="device-btn" data-device="vr" title="VR Headset">🕶️</button>
                <button class="device-btn" data-device="tablet" title="Tablet">📟</button>
                <button class="device-btn" data-device="mobile" title="Mobile">📱</button>
            </div>
            <div class="orientation-picker" id="orientation-picker" style="display: none;">
                <span class="device-label" style="margin-top: 0.5rem; display: block;">🔄 Orientation</span>
                <div class="orientation-buttons">
                    <button class="orientation-btn active" data-orientation="portrait">↕️ Portrait</button>
                    <button class="orientation-btn" data-orientation="landscape">↔️ Landscape</button>
                </div>
            </div>
        `;

        // Place right after user-badge
        const badge = sidebar.querySelector('.user-badge');
        if (badge) {
            badge.after(card);
        } else {
            const logo = sidebar.querySelector('.logo');
            logo.after(card);
        }

        this.attachDeviceEvents(card);
    },

    attachDeviceEvents(card) {
        const deviceBtns = card.querySelectorAll('.device-btn');
        const orientationPicker = card.querySelector('#orientation-picker');
        const orientationBtns = card.querySelectorAll('.orientation-btn');

        // Load saved preferences per user
        let currentDevice = localStorage.getItem(`pizza_device_${Auth.currentUser}`) || 'computer';
        let currentOrientation = localStorage.getItem(`pizza_orientation_${Auth.currentUser}`) || 'portrait';

        const updateDeviceClass = (device, orientation) => {
            document.body.classList.remove(
                'simulating-device',
                'device-computer',
                'device-laptop',
                'device-vr',
                'device-tablet-portrait',
                'device-tablet-landscape',
                'device-mobile-portrait',
                'device-mobile-landscape'
            );

            if (device === 'computer') {
                document.body.classList.add('device-computer');
            } else {
                document.body.classList.add('simulating-device');
                if (device === 'laptop') {
                    document.body.classList.add('device-laptop');
                } else if (device === 'vr') {
                    document.body.classList.add('device-vr');
                } else if (device === 'tablet') {
                    document.body.classList.add(`device-tablet-${orientation}`);
                } else if (device === 'mobile') {
                    document.body.classList.add(`device-mobile-${orientation}`);
                }
            }
        };

        const setDevice = (device) => {
            currentDevice = device;
            localStorage.setItem(`pizza_device_${Auth.currentUser}`, device);

            deviceBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.device === device));

            if (device === 'tablet' || device === 'mobile') {
                orientationPicker.style.display = 'block';
            } else {
                orientationPicker.style.display = 'none';
            }

            updateDeviceClass(device, currentOrientation);
        };

        const setOrientation = (orientation) => {
            currentOrientation = orientation;
            localStorage.setItem(`pizza_orientation_${Auth.currentUser}`, orientation);

            orientationBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.orientation === orientation));
            updateDeviceClass(currentDevice, orientation);
        };

        deviceBtns.forEach(btn => {
            btn.addEventListener('click', () => setDevice(btn.dataset.device));
        });

        orientationBtns.forEach(btn => {
            btn.addEventListener('click', () => setOrientation(btn.dataset.orientation));
        });

        // Initialize display from storage
        setDevice(currentDevice);
        setOrientation(currentOrientation);
    },
};
