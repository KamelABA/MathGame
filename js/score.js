/* ============================================
   SCORE & COMBO SYSTEM
   ============================================ */

class ScoreSystem {
    constructor() {
        this.score = 0;
        this.level = 1;
        this.combo = 0;
        this.bestCombo = 0;
        this.correctCount = 0;
        this.totalCount = 0;
        this.correctInLevel = 0;
        this.correctNeededForLevelUp = 5;

        // HUD elements
        this.scoreEl = document.getElementById('hud-score');
        this.comboEl = document.getElementById('hud-combo');
        this.levelEl = document.getElementById('hud-level');
        this.correctEl = document.getElementById('hud-correct');
    }

    reset() {
        this.score = 0;
        this.level = 1;
        this.combo = 0;
        this.bestCombo = 0;
        this.correctCount = 0;
        this.totalCount = 0;
        this.correctInLevel = 0;
        this.updateHUD();
    }

    /** Get combo multiplier */
    getMultiplier() {
        if (this.combo < 3) return 1;
        if (this.combo < 5) return 1.5;
        if (this.combo < 8) return 2;
        if (this.combo < 11) return 3;
        return 5;
    }

    /** Award points for correct answer */
    addCorrect(timeMs) {
        this.combo++;
        this.correctCount++;
        this.totalCount++;
        this.correctInLevel++;

        if (this.combo > this.bestCombo) {
            this.bestCombo = this.combo;
        }

        // Base points
        let points = 100 * this.level;

        // Combo bonus
        points += 25 * this.combo;

        // Speed bonus
        if (timeMs < 3000) points += 50;

        // Multiplier
        points = Math.floor(points * this.getMultiplier());

        this.score += points;

        // Check level up
        let leveled = false;
        if (this.correctInLevel >= this.correctNeededForLevelUp) {
            this.level++;
            this.correctInLevel = 0;
            leveled = true;
        }

        this.updateHUD();

        return { points, leveled, multiplier: this.getMultiplier() };
    }

    /** Penalize wrong answer */
    addWrong() {
        this.totalCount++;

        this.combo = 0;
        const penalty = 25;
        this.score = Math.max(0, this.score - penalty);

        this.updateHUD();

        return { penalty, shielded: false };
    }

    /** Get accuracy percentage */
    getAccuracy() {
        if (this.totalCount === 0) return 0;
        return Math.round((this.correctCount / this.totalCount) * 100);
    }

    /** Update HUD display */
    updateHUD() {
        // Animate score
        this.scoreEl.textContent = this.score.toLocaleString();
        this.scoreEl.classList.add('score-animate');
        setTimeout(() => this.scoreEl.classList.remove('score-animate'), 300);

        // Combo
        const mult = this.getMultiplier();
        this.comboEl.textContent = mult > 1 ? `×${mult}` : `×1`;
        if (mult >= 3) {
            this.comboEl.style.color = '#f59e0b';
        } else if (mult >= 2) {
            this.comboEl.style.color = '#ff6b9d';
        } else {
            this.comboEl.style.color = '';
        }

        // Level
        this.levelEl.textContent = this.level;

        // Progress
        this.correctEl.textContent = `${this.correctInLevel}/${this.correctNeededForLevelUp}`;
    }

    /** Save best score to localStorage */
    saveBest() {
        const best = this.getBestScore();
        const bestLevel = this.getBestLevel();
        if (this.score > best) {
            localStorage.setItem('mathdesk_best_score', this.score);
        }
        if (this.level > bestLevel) {
            localStorage.setItem('mathdesk_best_level', this.level);
        }
    }

    getBestScore() {
        return parseInt(localStorage.getItem('mathdesk_best_score') || '0');
    }

    getBestLevel() {
        return parseInt(localStorage.getItem('mathdesk_best_level') || '1');
    }
}

// Global instance
const scoreSystem = new ScoreSystem();
