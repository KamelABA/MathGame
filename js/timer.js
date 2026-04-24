/* ============================================
   TIMER SYSTEM — Per-question countdown
   ============================================ */

class TimerSystem {
    constructor() {
        this.timerBarEl = document.getElementById('timer-bar');
        this.maxTime = 15;     // seconds
        this.timeLeft = 15;
        this.running = false;
        this.interval = null;
        this.onExpire = null;   // callback when timer runs out
        this.lastTick = 0;
        this.tickPlayed3 = false;
    }

    reset() {
        this.stop();
        this.timeLeft = this.maxTime;
        this._updateBar();
    }

    /** Start timer with given max seconds */
    start(maxSeconds, onExpire) {
        this.stop();
        this.maxTime = maxSeconds;
        this.timeLeft = maxSeconds;
        this.onExpire = onExpire;
        this.running = true;
        this.lastTick = Date.now();
        this.tickPlayed3 = false;
        this._updateBar();

        this.interval = setInterval(() => {
            if (!this.running) return;

            const now = Date.now();
            const delta = (now - this.lastTick) / 1000;
            this.lastTick = now;
            this.timeLeft -= delta;

            // Play tick sounds in last 3 seconds
            if (this.timeLeft <= 3 && this.timeLeft > 0 && !this.tickPlayed3) {
                audio.playTick();
                this.tickPlayed3 = true;
            }

            if (this.timeLeft <= 0) {
                this.timeLeft = 0;
                this._updateBar();
                this.stop();
                if (this.onExpire) this.onExpire();
                return;
            }

            this._updateBar();
        }, 50);
    }

    stop() {
        this.running = false;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    pause() {
        this.running = false;
    }

    resume() {
        if (this.interval) {
            this.running = true;
            this.lastTick = Date.now();
        }
    }

    /** Add time (for Slow Time upgrade) */
    addTime(seconds) {
        this.timeLeft += seconds;
        if (this.timeLeft > this.maxTime + seconds) {
            this.timeLeft = this.maxTime + seconds;
        }
        this._updateBar();
    }

    /** Get elapsed time in ms */
    getElapsed() {
        return Math.max(0, (this.maxTime - this.timeLeft) * 1000);
    }

    /** Update timer bar visual */
    _updateBar() {
        const pct = Math.max(0, Math.min(100, (this.timeLeft / this.maxTime) * 100));
        this.timerBarEl.style.width = `${pct}%`;

        // Color states
        this.timerBarEl.classList.remove('low', 'critical');
        if (pct <= 15) {
            this.timerBarEl.classList.add('critical');
        } else if (pct <= 35) {
            this.timerBarEl.classList.add('low');
        }
    }
}

// Global instance
const timer = new TimerSystem();
