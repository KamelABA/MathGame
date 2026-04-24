/* ============================================
   UPGRADE SYSTEM — Limited inventory, +1 each on level up
   ============================================ */

class UpgradeSystem {
    constructor() {
        this.upgrades = {
            hint: {
                btnEl: document.getElementById('btn-hint'),
                countEl: null, // set after DOM query
                count: 1,
                active: false,
            },
            slow: {
                btnEl: document.getElementById('btn-slow'),
                countEl: null,
                count: 1,
                active: false,
            },
            double: {
                btnEl: document.getElementById('btn-double'),
                countEl: null,
                count: 1,
                active: false,
            },
            shield: {
                btnEl: document.getElementById('btn-shield'),
                countEl: null,
                count: 1,
                active: false,
            },
        };

        // Point the countEl to the .upgrade-cost span inside each button
        for (const [key, upgrade] of Object.entries(this.upgrades)) {
            upgrade.countEl = upgrade.btnEl.querySelector('.upgrade-cost');
        }
    }

    /** Reset all counts to 1 (for new game) */
    reset() {
        for (const upgrade of Object.values(this.upgrades)) {
            upgrade.count = 1;
            upgrade.active = false;
        }
        this.updateStates();
    }

    /** Add +1 to one random upgrade (called on level up) */
    onLevelUp() {
        const upgradeKeys = Object.keys(this.upgrades);
        const randomKey = upgradeKeys[Math.floor(Math.random() * upgradeKeys.length)];
        this.upgrades[randomKey].count++;
        this.updateStates();
    }

    init(onHint, onSlow, onDouble, onShield) {
        this.upgrades.hint.btnEl.addEventListener('click', () => {
            if (this._use('hint')) onHint();
        });
        this.upgrades.slow.btnEl.addEventListener('click', () => {
            if (this._use('slow')) onSlow();
        });
        this.upgrades.double.btnEl.addEventListener('click', () => {
            if (this._use('double')) onDouble();
        });
        this.upgrades.shield.btnEl.addEventListener('click', () => {
            if (this._use('shield')) onShield();
        });
    }

    /** Attempt to use an upgrade (must have count > 0) */
    _use(key) {
        const upgrade = this.upgrades[key];
        if (upgrade.count > 0) {
            upgrade.count--;
            audio.playUpgrade();
            this.updateStates();
            return true;
        }
        // None left — shake button
        upgrade.btnEl.classList.add('shake');
        setTimeout(() => upgrade.btnEl.classList.remove('shake'), 400);
        return false;
    }

    /** Update button enabled/disabled states and count display */
    updateStates() {
        for (const [key, upgrade] of Object.entries(this.upgrades)) {
            // Update count label
            upgrade.countEl.textContent = `×${upgrade.count}`;

            // Disable if none left
            upgrade.btnEl.disabled = upgrade.count <= 0;

            // Show active state for shield/double
            if (key === 'shield' && scoreSystem.shieldActive) {
                upgrade.btnEl.classList.add('active-upgrade');
            } else if (key === 'double' && scoreSystem.doubleScoreRemaining > 0) {
                upgrade.btnEl.classList.add('active-upgrade');
            } else {
                upgrade.btnEl.classList.remove('active-upgrade');
            }
        }
    }
}

// Global instance
const upgrades = new UpgradeSystem();
