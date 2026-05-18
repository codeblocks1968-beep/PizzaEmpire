/* ============================================================
   PIZZA EMPIRE TYCOON — FULL GAME LOGIC
   ============================================================ */

// ─── INGREDIENTS DEFINITION ──────────────────────────────────
const INGREDIENTS = [
    // Step: dough (unlocked first)
    { id: 'dough',         emoji: '🍞', name: 'Dough',         step: 'dough',    value: 2  },
    { id: 'thin_dough',    emoji: '🥙', name: 'Thin Crust',    step: 'dough',    value: 3  },
    { id: 'thick_dough',   emoji: '🫓', name: 'Thick Crust',   step: 'dough',    value: 4  },

    // Step: sauce
    { id: 'tomato',        emoji: '🍅', name: 'Tomato Sauce',  step: 'sauce',    value: 2  },
    { id: 'pesto',         emoji: '🌿', name: 'Pesto',         step: 'sauce',    value: 3  },
    { id: 'bbq',           emoji: '🍯', name: 'BBQ Sauce',     step: 'sauce',    value: 3  },

    // Step: cheese
    { id: 'mozzarella',    emoji: '🧀', name: 'Mozzarella',    step: 'cheese',   value: 3  },
    { id: 'cheddar',       emoji: '🟡', name: 'Cheddar',       step: 'cheese',   value: 2  },
    { id: 'gouda',         emoji: '⚪', name: 'Gouda',         step: 'cheese',   value: 4  },

    // Step: toppings
    { id: 'pepperoni',     emoji: '🥩', name: 'Pepperoni',     step: 'toppings', value: 4  },
    { id: 'mushroom',      emoji: '🍄', name: 'Mushroom',      step: 'toppings', value: 2  },
    { id: 'olive',         emoji: '🫒', name: 'Olives',        step: 'toppings', value: 2  },
    { id: 'pepper',        emoji: '🌶️', name: 'Jalapeño',      step: 'toppings', value: 3  },
    { id: 'pineapple',     emoji: '🍍', name: 'Pineapple',     step: 'toppings', value: 2  },
    { id: 'onion',         emoji: '🧅', name: 'Onion',         step: 'toppings', value: 1  },
    { id: 'bacon',         emoji: '🥓', name: 'Bacon',         step: 'toppings', value: 5  },
    { id: 'corn',          emoji: '🌽', name: 'Corn',          step: 'toppings', value: 2  },
    { id: 'basil',         emoji: '🌱', name: 'Fresh Basil',   step: 'toppings', value: 3  },
];

// ─── STEP ORDER ───────────────────────────────────────────────
const STEPS = ['dough', 'sauce', 'cheese', 'toppings'];

// ─── PIZZA ORDERS TEMPLATES ──────────────────────────────────
const ORDER_TEMPLATES = [
    { name: 'Margherita',  items: ['dough',       'tomato',  'mozzarella', 'basil']       },
    { name: 'Pepperoni',   items: ['thin_dough',  'tomato',  'mozzarella', 'pepperoni']   },
    { name: 'BBQ Bacon',   items: ['thick_dough', 'bbq',     'cheddar',    'bacon']        },
    { name: 'Veggie',      items: ['dough',       'pesto',   'gouda',      'mushroom','olive'] },
    { name: 'Spicy Fire',  items: ['thin_dough',  'tomato',  'mozzarella', 'pepperoni','pepper'] },
    { name: 'Hawaiian',    items: ['dough',       'tomato',  'mozzarella', 'bacon','pineapple'] },
    { name: 'Garden',      items: ['dough',       'pesto',   'gouda',      'mushroom','onion','corn'] },
];

// ─── GAME STATE ───────────────────────────────────────────────
const Game = {
    cash: 100,
    totalServed: 0,
    multiplier: 1.0,
    currentTab: 'upgrades',
    isPreparingDough: false,

    // Current pizza in progress
    pizza: {
        active: false,          // pizza maker visible?
        doughAdded: false,      // has dough been placed?
        currentStep: 'dough',   // current step locked in
        placedIngredients: [],  // ingredient IDs placed so far
        currentOrder: null,     // the customer order we're filling
    },

    customers: [],
    tables: [
        { id: 1, occupied: false, orderReady: false, order: null },
        { id: 2, occupied: false, orderReady: false, order: null },
        { id: 3, occupied: false, orderReady: false, order: null },
        { id: 4, occupied: false, orderReady: false, order: null },
    ],

    upgrades: [
        { id: 'better_oven',    name: 'Brick Oven',    desc: 'Increases pizza value by 20%', price: 150,  factor: 1.2, type: 'value',      owned: 0 },
        { id: 'marketing',      name: 'Neon Sign',     desc: 'Increases customer spawn rate', price: 500,  factor: 0.8, type: 'spawn_rate', owned: 0 },
        { id: 'premium_dough',  name: 'Sourdough',     desc: 'Base pizza value +5',           price: 1000, factor: 5,   type: 'base_value', owned: 0 },
    ],

    staff: [
        { id: 'cashier_1', name: 'First Cashier',   role: 'cashier',    desc: 'Automates order taking',       price: 200,  owned: 0, multiplied: false },
        { id: 'chef_1',    name: 'Head Chef',        role: 'chef',       desc: 'Speeds up cooking by 30%',     price: 400,  owned: 0 },
        { id: 'waiter_1',  name: 'Junior Waiter',    role: 'waiter',     desc: 'Automates delivery',           price: 600,  owned: 0 },
        { id: 'multi_staff',name: 'Golden Training', role: 'multiplier', desc: 'Double money from cashier',    price: 2000, owned: 0 },
    ],

    // ─── INIT ────────────────────────────────────────────────
    init() {
        this.load();
        this.renderUpgrades();
        this.renderTables();
        this.startLoops();
        this.attachListeners();
        this.updateUI();
        this.renderIngredientsPanel();
    },

    // ─── LISTENERS ───────────────────────────────────────────
    attachListeners() {
        // Prep Table click
        document.getElementById('dough-btn').addEventListener('click', () => this.handleDoughClick());

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentTab = e.target.dataset.tab;
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.renderUpgrades();
            });
        });

        // Theme switcher
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const theme = e.currentTarget.dataset.theme;
                document.documentElement.setAttribute('data-theme', theme);
                document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                localStorage.setItem('pizza_empire_theme', theme);
            });
        });

        // Bake button
        document.getElementById('bake-btn').addEventListener('click', () => this.bakePizza());

        // Load saved theme
        const savedTheme = localStorage.getItem('pizza_empire_theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
            document.querySelectorAll('.theme-btn').forEach(b => {
                b.classList.toggle('active', b.dataset.theme === savedTheme);
            });
        }

        // Drag-and-drop on pizza canvas
        this.setupDragDrop();
    },

    // ─── DRAG & DROP ─────────────────────────────────────────
    setupDragDrop() {
        const canvas = document.getElementById('pizza-canvas');

        canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            canvas.classList.add('drag-over');
        });

        canvas.addEventListener('dragleave', () => {
            canvas.classList.remove('drag-over');
        });

        canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            canvas.classList.remove('drag-over');
            const ingId = e.dataTransfer.getData('text/plain');
            this.placeIngredient(ingId, e);
        });

        // Also allow click-to-add (tap on ingredient)
        // handled by renderIngredientsPanel click events
    },

    // ─── INGREDIENTS PANEL ───────────────────────────────────
    renderIngredientsPanel() {
        const grid = document.getElementById('ingredients-grid');
        grid.innerHTML = '';

        INGREDIENTS.forEach(ing => {
            const div = document.createElement('div');
            div.className = 'ingredient-item';
            div.draggable = true;
            div.dataset.id = ing.id;
            div.innerHTML = `
                <span class="ing-emoji">${ing.emoji}</span>
                <span class="ing-name">${ing.name}</span>
                <span class="ing-step">${ing.step}</span>
            `;

            // Drag start
            div.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', ing.id);
                div.classList.add('dragging');
            });
            div.addEventListener('dragend', () => div.classList.remove('dragging'));

            // Click-to-add
            div.addEventListener('click', () => this.placeIngredient(ing.id, null));

            grid.appendChild(div);
        });

        this.updateIngredientLocks();
    },

    updateIngredientLocks() {
        const { currentStep, doughAdded, active } = this.pizza;
        document.querySelectorAll('.ingredient-item').forEach(el => {
            const ing = INGREDIENTS.find(i => i.id === el.dataset.id);
            if (!ing) return;
            const locked = !active || (ing.step !== currentStep) ||
                           (ing.step !== 'dough' && !doughAdded);
            el.classList.toggle('locked', locked);
        });

        // Update step progress UI
        document.querySelectorAll('.step').forEach(el => {
            const s = el.dataset.step;
            const stepIdx = STEPS.indexOf(s);
            const curIdx  = STEPS.indexOf(currentStep);
            el.classList.toggle('active', s === currentStep && active);
            el.classList.toggle('done',   stepIdx < curIdx && active);
        });
    },

    // ─── PLACE INGREDIENT ────────────────────────────────────
    placeIngredient(ingId, dropEvent) {
        const { pizza } = this;
        if (!pizza.active) return;

        const ing = INGREDIENTS.find(i => i.id === ingId);
        if (!ing) return;

        // First step must be dough
        if (ing.step !== pizza.currentStep) {
            this.notify(`⚠️ Add ${pizza.currentStep} first!`);
            return;
        }

        const canvas = document.getElementById('pizza-canvas');

        // Calculate drop position relative to canvas center
        let x = 50, y = 50;
        if (dropEvent) {
            const rect = canvas.getBoundingClientRect();
            x = ((dropEvent.clientX - rect.left) / rect.width) * 100;
            y = ((dropEvent.clientY - rect.top)  / rect.height) * 100;
            // Clamp within circle (approx)
            x = Math.max(10, Math.min(90, x));
            y = Math.max(10, Math.min(90, y));
        } else {
            // Click-to-add: spread randomly on pizza
            const angle = Math.random() * 2 * Math.PI;
            const radius = 25 + Math.random() * 20;
            x = 50 + Math.cos(angle) * radius;
            y = 50 + Math.sin(angle) * radius;
        }

        // Show the ingredient on the pizza visually
        const span = document.createElement('span');
        span.className = 'placed-ingredient';
        span.textContent = ing.emoji;
        span.style.left = `${x}%`;
        span.style.top  = `${y}%`;
        span.style.transform = 'translate(-50%, -50%)';
        canvas.appendChild(span);

        // Remove the "drop here" label if it exists
        const label = canvas.querySelector('.pizza-base-label');
        if (label) label.remove();
        const base  = canvas.querySelector('.pizza-base');
        if (base)  base.remove();

        // Remove no-dough class once dough is placed
        if (ing.step === 'dough') {
            canvas.classList.remove('no-dough');
            pizza.doughAdded = true;
            this.notify('🍞 Dough added! Now add sauce!');
        }

        pizza.placedIngredients.push(ingId);

        // Mark as completed in order chips
        this.updateOrderChip(pizza.currentStep);

        // Advance step if this step is "done" (at least one of each step)
        const stepIdx = STEPS.indexOf(pizza.currentStep);
        if (stepIdx < STEPS.length - 1) {
            pizza.currentStep = STEPS[stepIdx + 1];
            this.notify(`✅ Now add ${pizza.currentStep}!`);
        }

        this.updateIngredientLocks();
    },

    updateOrderChip(step) {
        const stepsEl = document.getElementById('order-steps');
        if (!stepsEl) return;
        stepsEl.querySelectorAll('.order-step-chip').forEach(chip => {
            if (chip.dataset.step === step) chip.classList.add('done');
        });
    },

    // ─── SHOW ORDER BANNER ───────────────────────────────────
    showOrderBanner(order) {
        const banner   = document.getElementById('order-banner');
        const itemsEl  = document.getElementById('order-items-display');
        const stepsEl  = document.getElementById('order-steps');

        if (!order) { banner.style.display = 'none'; return; }

        // Get friendly names
        const ingNames = order.items.map(id => {
            const ing = INGREDIENTS.find(i => i.id === id);
            return ing ? `${ing.emoji} ${ing.name}` : id;
        }).join('  ·  ');

        itemsEl.textContent = `${order.name}: ${ingNames}`;

        // Build step chips
        const stepsInOrder = [...new Set(order.items.map(id => {
            const ing = INGREDIENTS.find(i => i.id === id);
            return ing ? ing.step : null;
        }).filter(Boolean))];

        stepsEl.innerHTML = '';
        STEPS.forEach(s => {
            if (stepsInOrder.includes(s)) {
                const chip = document.createElement('span');
                chip.className = 'order-step-chip';
                chip.dataset.step = s;
                chip.textContent = s.charAt(0).toUpperCase() + s.slice(1);
                stepsEl.appendChild(chip);
            }
        });

        banner.style.display = 'block';
    },

    // ─── DOUGH BUTTON CLICK (Prep Table) ─────────────────────
    handleDoughClick() {
        if (this.pizza.active) return; // already open

        // Find waiting customer order
        const table = this.tables.find(t => t.occupied && !t.orderReady);
        const order = table ? table.order : ORDER_TEMPLATES[Math.floor(Math.random() * ORDER_TEMPLATES.length)];

        // Open pizza maker
        this.pizza.active = true;
        this.pizza.doughAdded = false;
        this.pizza.currentStep = 'dough';
        this.pizza.placedIngredients = [];
        this.pizza.currentOrder = order;

        // Show order banner
        this.showOrderBanner(order);

        // Reset pizza canvas
        const canvas = document.getElementById('pizza-canvas');
        canvas.innerHTML = '<div class="pizza-base"><span class="pizza-base-label">Drop ingredients here!</span></div>';
        canvas.classList.add('no-dough');

        // Show pizza maker panel
        document.getElementById('pizza-maker').style.display = 'block';
        document.getElementById('bake-btn').disabled = false;

        this.updateIngredientLocks();
        this.prepareDough();
    },

    // ─── BAKE PIZZA ──────────────────────────────────────────
    bakePizza() {
        if (!this.pizza.active) return;
        if (!this.pizza.doughAdded) {
            this.notify('🍞 Add dough first!');
            return;
        }

        document.getElementById('bake-btn').disabled = true;
        this.notify('🔥 Sending to the oven!');

        // Close pizza maker
        document.getElementById('pizza-maker').style.display = 'none';
        document.getElementById('order-banner').style.display = 'none';

        this.pizza.active = false;

        this.cookPizza();
    },

    // ─── PREPARE DOUGH (progress bar) ────────────────────────
    prepareDough() {
        if (this.isPreparingDough) return;
        this.isPreparingDough = true;

        let speed = 1000;
        const chef = this.staff.find(s => s.role === 'chef');
        if (chef.owned > 0) speed *= Math.pow(0.7, chef.owned);

        const fill = document.querySelector('.dough-station .fill');
        fill.style.transition = `width ${speed}ms linear`;
        fill.style.width = '100%';

        setTimeout(() => {
            fill.style.transition = 'none';
            fill.style.width = '0%';
            this.isPreparingDough = false;
        }, speed);
    },

    // ─── COOK PIZZA (oven animation) ─────────────────────────
    cookPizza() {
        const slotContainer = document.getElementById('active-pizzas');
        const pizza = document.createElement('div');
        pizza.className = 'pizza-item';
        slotContainer.appendChild(pizza);

        setTimeout(() => {
            pizza.remove();
            this.fulfillOrder();
        }, 2000);
    },

    // ─── FULFILL ORDER ───────────────────────────────────────
    fulfillOrder() {
        const table = this.tables.find(t => t.occupied && !t.orderReady);
        if (table) {
            table.orderReady = true;
            const tableEl = document.getElementById(`table-${table.id}`);
            tableEl.innerHTML += '🍕';
            setTimeout(() => this.collectPayment(table), 1200);
        } else {
            this.addCash(10);
        }
    },

    // ─── COLLECT PAYMENT ─────────────────────────────────────
    collectPayment(table) {
        let baseValue = 10;
        const baseUpgrade = this.upgrades.find(u => u.type === 'base_value');
        baseValue += baseUpgrade.owned * baseUpgrade.factor;

        // Add bonus from placed ingredients
        if (this.pizza.placedIngredients) {
            this.pizza.placedIngredients.forEach(id => {
                const ing = INGREDIENTS.find(i => i.id === id);
                if (ing) baseValue += ing.value;
            });
        }

        const valueUpgrade = this.upgrades.find(u => u.type === 'value');
        let value = baseValue * Math.pow(valueUpgrade.factor, valueUpgrade.owned);

        let finalMultiplier = this.multiplier;
        const cashier = this.staff.find(s => s.role === 'cashier');
        const multi   = this.staff.find(s => s.role === 'multiplier');
        if (cashier.owned > 0 && multi.owned > 0) finalMultiplier *= 2;

        const finalValue = Math.floor(value * finalMultiplier);
        this.addCash(finalValue);
        this.totalServed++;

        table.occupied   = false;
        table.orderReady = false;
        table.order      = null;
        this.renderTables();
        this.updateUI();
        this.save();
    },

    addCash(amount) {
        this.cash += amount;
        this.notify(`+$${amount} 💰`);
        this.updateUI();
    },

    // ─── SPAWN CUSTOMER ──────────────────────────────────────
    spawnCustomer() {
        const freeTable = this.tables.find(t => !t.occupied);
        if (freeTable) {
            freeTable.occupied = true;
            // Assign a random order
            freeTable.order = ORDER_TEMPLATES[Math.floor(Math.random() * ORDER_TEMPLATES.length)];
            this.renderTables();

            const cashier = this.staff.find(s => s.role === 'cashier');
            if (cashier.owned > 0) this.prepareDough();
        }
    },

    // ─── RENDER TABLES ───────────────────────────────────────
    renderTables() {
        const container = document.getElementById('tables-container');
        container.innerHTML = '';
        this.tables.forEach(table => {
            const div = document.createElement('div');
            div.className = `table ${table.occupied ? 'occupied' : ''}`;
            div.id = `table-${table.id}`;
            if (table.occupied && table.order) {
                div.innerHTML = `<div class="customer" title="${table.order.name}">👤</div>`;
                div.title = `Order: ${table.order.name}`;
            }
            container.appendChild(div);
        });
    },

    // ─── UPGRADES ────────────────────────────────────────────
    buyUpgrade(id) {
        const list = this.currentTab === 'upgrades' ? this.upgrades : this.staff;
        const item = list.find(u => u.id === id);
        if (this.cash >= item.price) {
            this.cash -= item.price;
            item.owned++;
            item.price = Math.floor(item.price * 1.6);
            if (item.role === 'multiplier') {
                const cashier = this.staff.find(s => s.role === 'cashier');
                if (cashier) cashier.multiplied = true;
            }
            this.renderUpgrades();
            this.updateUI();
            this.save();
            this.notify(`✨ Purchased: ${item.name}`);
        }
    },

    updateUI() {
        document.getElementById('cash').innerText   = `$${Math.floor(this.cash)}`;
        document.getElementById('served').innerText = this.totalServed;

        const cashier   = this.staff.find(s => s.role === 'cashier');
        const indicator = document.getElementById('cashier-slot');
        if (cashier.owned > 0) {
            indicator.className = 'staff-indicator active' + (cashier.multiplied ? ' multiplied' : '');
        }

        document.querySelectorAll('.upgrade-card').forEach(card => {
            const id   = card.dataset.id;
            const list = this.currentTab === 'upgrades' ? this.upgrades : this.staff;
            const item = list.find(u => u.id === id);
            if (item) card.classList.toggle('disabled', this.cash < item.price);
        });
    },

    renderUpgrades() {
        const container = document.getElementById('upgrade-container');
        container.innerHTML = '';
        const list = this.currentTab === 'upgrades' ? this.upgrades : this.staff;
        list.forEach(u => {
            const card = document.createElement('div');
            card.className = `upgrade-card ${this.cash < u.price ? 'disabled' : ''}`;
            card.dataset.id = u.id;
            card.innerHTML = `
                <h3>${u.name} ${u.owned > 0 ? `<small style="opacity:.6;">(Lv.${u.owned})</small>` : ''}</h3>
                <p>${u.desc}</p>
                <span class="price">$${u.price}</span>
            `;
            card.onclick = () => this.buyUpgrade(u.id);
            container.appendChild(card);
        });
    },

    // ─── GAME LOOPS ──────────────────────────────────────────
    startLoops() {
        setInterval(() => {
            let spawnChance = 0.3;
            const marketing = this.upgrades.find(u => u.type === 'spawn_rate');
            spawnChance /= Math.pow(marketing.factor, marketing.owned);
            if (Math.random() < spawnChance) this.spawnCustomer();
        }, 3000);

        setInterval(() => this.updateUI(), 500);
    },

    // ─── NOTIFY ──────────────────────────────────────────────
    notify(msg) {
        const container = document.getElementById('notifs');
        const n = document.createElement('div');
        n.className = 'notif';
        n.innerText = msg;
        container.appendChild(n);
        setTimeout(() => n.remove(), 2500);
    },

    // ─── SAVE / LOAD ─────────────────────────────────────────
    save() {
        localStorage.setItem(Auth.saveKey(), JSON.stringify({
            cash: this.cash,
            totalServed: this.totalServed,
            upgrades: this.upgrades,
            staff: this.staff,
        }));
    },

    load() {
        const save = localStorage.getItem(Auth.saveKey());
        if (save) {
            const data = JSON.parse(save);
            this.cash        = data.cash;
            this.totalServed = data.totalServed;
            data.upgrades?.forEach(savedU => {
                const u = this.upgrades.find(c => c.id === savedU.id);
                if (u) { u.owned = savedU.owned; u.price = savedU.price; }
            });
            data.staff?.forEach(savedS => {
                const s = this.staff.find(c => c.id === savedS.id);
                if (s) { s.owned = savedS.owned; s.price = savedS.price; s.multiplied = savedS.multiplied || false; }
            });
        }
    },
};

window.onload = () => {
    if (Auth.checkSession()) {
        // Already logged in — inject badge, device simulator controls, and start game
        AuthUI.injectUserBadge();
        AuthUI.injectDeviceSelector();
        Game.init();
    } else {
        // Show auth screen first; it will call Game.init() on success
        AuthUI.build();
    }
};
