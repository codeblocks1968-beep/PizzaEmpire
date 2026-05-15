const Game = {
    cash: 100, // Start with a bit more for the expansion
    totalServed: 0,
    multiplier: 1.0,
    currentTab: 'upgrades',
    
    // Game State
    customers: [],
    tables: [
        { id: 1, occupied: false, orderReady: false },
        { id: 2, occupied: false, orderReady: false },
        { id: 3, occupied: false, orderReady: false },
        { id: 4, occupied: false, orderReady: false }
    ],
    
    upgrades: [
        { id: 'better_oven', name: 'Brick Oven', desc: 'Increases pizza value by 20%', price: 150, factor: 1.2, type: 'value', owned: 0 },
        { id: 'marketing', name: 'Neon Sign', desc: 'Increases customer spawn rate', price: 500, factor: 0.8, type: 'spawn_rate', owned: 0 },
        { id: 'premium_dough', name: 'Sourdough', desc: 'Base pizza value +5', price: 1000, factor: 5, type: 'base_value', owned: 0 }
    ],

    staff: [
        { id: 'cashier_1', name: 'First Cashier', role: 'cashier', desc: 'Automates order taking', price: 200, owned: 0, multiplied: false },
        { id: 'chef_1', name: 'Head Chef', role: 'chef', desc: 'Speeds up cooking by 30%', price: 400, owned: 0 },
        { id: 'waiter_1', name: 'Junior Waiter', role: 'waiter', desc: 'Automates delivery', price: 600, owned: 0 },
        { id: 'multi_staff', name: 'Golden Training', role: 'multiplier', desc: 'Double money from First Cashier', price: 2000, owned: 0 }
    ],

    init() {
        this.load();
        this.renderUpgrades();
        this.renderTables();
        this.startLoops();
        this.attachListeners();
        this.updateUI();
    },

    attachListeners() {
        document.getElementById('dough-btn').addEventListener('click', () => this.handleDoughClick());
        
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentTab = e.target.dataset.tab;
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.renderUpgrades();
            });
        });
    },

    renderTables() {
        const container = document.getElementById('tables-container');
        container.innerHTML = '';
        this.tables.forEach(table => {
            const div = document.createElement('div');
            div.className = `table ${table.occupied ? 'occupied' : ''}`;
            div.id = `table-${table.id}`;
            if (table.occupied) {
                div.innerHTML = `<div class="customer">👤</div>`;
            }
            container.appendChild(div);
        });
    },

    handleDoughClick() {
        // Manual dough prep if no chef or to speed up
        this.prepareDough();
    },

    prepareDough() {
        if (this.isPreparingDough) return;
        this.isPreparingDough = true;
        
        let speed = 1000; // Base 1s
        const chef = this.staff.find(s => s.role === 'chef');
        if (chef.owned > 0) speed *= Math.pow(0.7, chef.owned);

        const fill = document.querySelector('.dough-station .fill');
        fill.style.transition = `width ${speed}ms linear`;
        fill.style.width = '100%';
        
        setTimeout(() => {
            fill.style.transition = 'none';
            fill.style.width = '0%';
            this.isPreparingDough = false;
            this.cookPizza();
        }, speed);
    },

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

    fulfillOrder() {
        // Find a table waiting for food
        const table = this.tables.find(t => t.occupied && !t.orderReady);
        if (table) {
            table.orderReady = true;
            const tableEl = document.getElementById(`table-${table.id}`);
            tableEl.innerHTML += '🍕';
            
            setTimeout(() => {
                this.collectPayment(table);
            }, 1000);
        } else {
            // No one waiting? Just sell it (overflow)
            this.addCash(10);
        }
    },

    collectPayment(table) {
        let baseValue = 10;
        const baseUpgrade = this.upgrades.find(u => u.type === 'base_value');
        baseValue += baseUpgrade.owned * baseUpgrade.factor;

        const valueUpgrade = this.upgrades.find(u => u.type === 'value');
        let value = baseValue * Math.pow(valueUpgrade.factor, valueUpgrade.owned);
        
        let finalMultiplier = this.multiplier;
        const cashier = this.staff.find(s => s.role === 'cashier');
        const multi = this.staff.find(s => s.role === 'multiplier');
        
        if (cashier.owned > 0 && multi.owned > 0) {
            finalMultiplier *= 2; // Double money for first staff
        }

        const finalValue = Math.floor(value * finalMultiplier);
        this.addCash(finalValue);
        this.totalServed++;
        
        // Reset table
        table.occupied = false;
        table.orderReady = false;
        this.renderTables();
        this.updateUI();
        this.save();
    },

    addCash(amount) {
        this.cash += amount;
        this.notify(`+$${amount}`);
        this.updateUI();
    },

    spawnCustomer() {
        const freeTable = this.tables.find(t => !t.occupied);
        if (freeTable) {
            freeTable.occupied = true;
            this.renderTables();
            
            // If cashier exists, they "take the order" automatically
            const cashier = this.staff.find(s => s.role === 'cashier');
            if (cashier.owned > 0) {
                this.prepareDough();
            }
        }
    },

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
            this.notify(`Purchased: ${item.name}`);
        }
    },

    updateUI() {
        document.getElementById('cash').innerText = `$${Math.floor(this.cash)}`;
        document.getElementById('served').innerText = this.totalServed;
        
        const cashier = this.staff.find(s => s.role === 'cashier');
        const indicator = document.getElementById('cashier-slot');
        if (cashier.owned > 0) {
            indicator.className = 'staff-indicator active' + (cashier.multiplied ? ' multiplied' : '');
        }

        document.querySelectorAll('.upgrade-card').forEach(card => {
            const id = card.dataset.id;
            const list = this.currentTab === 'upgrades' ? this.upgrades : this.staff;
            const item = list.find(u => u.id === id);
            if (this.cash < item.price) card.classList.add('disabled');
            else card.classList.remove('disabled');
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
                <h3>${u.name} ${u.owned > 0 ? `(Lv.${u.owned})` : ''}</h3>
                <p>${u.desc}</p>
                <span class="price">$${u.price}</span>
            `;
            card.onclick = () => this.buyUpgrade(u.id);
            container.appendChild(card);
        });
    },

    startLoops() {
        // Customer spawning
        setInterval(() => {
            let spawnChance = 0.3;
            const marketing = this.upgrades.find(u => u.type === 'spawn_rate');
            spawnChance /= Math.pow(marketing.factor, marketing.owned);
            
            if (Math.random() < spawnChance) {
                this.spawnCustomer();
            }
        }, 3000);

        // Auto-UI refresh for affordability
        setInterval(() => this.updateUI(), 500);
    },

    notify(msg) {
        const container = document.getElementById('notifs');
        const n = document.createElement('div');
        n.className = 'notif';
        n.innerText = msg;
        container.appendChild(n);
        setTimeout(() => n.remove(), 2000);
    },

    save() {
        localStorage.setItem('pizza_tycoon_v2_save', JSON.stringify({
            cash: this.cash,
            totalServed: this.totalServed,
            upgrades: this.upgrades,
            staff: this.staff
        }));
    },

    load() {
        const save = localStorage.getItem('pizza_tycoon_v2_save');
        if (save) {
            const data = JSON.parse(save);
            this.cash = data.cash;
            this.totalServed = data.totalServed;
            
            data.upgrades?.forEach(savedU => {
                const u = this.upgrades.find(currU => currU.id === savedU.id);
                if (u) { u.owned = savedU.owned; u.price = savedU.price; }
            });
            data.staff?.forEach(savedS => {
                const s = this.staff.find(currS => currS.id === savedS.id);
                if (s) { 
                    s.owned = savedS.owned; 
                    s.price = savedS.price;
                    s.multiplied = savedS.multiplied || false;
                }
            });
        }
    }
};

window.onload = () => Game.init();
