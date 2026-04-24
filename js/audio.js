/* ============================================
   AUDIO MANAGER — Sound effects via Web Audio API
   ============================================ */

class AudioManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.volume = 0.3;
    }

    /** Lazily initialize AudioContext (requires user gesture) */
    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    /** Play a tone with given frequency, duration, and type */
    _playTone(freq, duration, type = 'sine', gainValue = null) {
        if (!this.enabled || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime((gainValue || this.volume), this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + duration);
    }

    /** Correct answer — happy ascending chime */
    playCorrect() {
        this.init();
        this._playTone(523, 0.15, 'sine');
        setTimeout(() => this._playTone(659, 0.15, 'sine'), 80);
        setTimeout(() => this._playTone(784, 0.25, 'sine'), 160);
    }

    /** Wrong answer — descending buzz */
    playWrong() {
        this.init();
        this._playTone(300, 0.15, 'square', 0.15);
        setTimeout(() => this._playTone(200, 0.25, 'square', 0.12), 100);
    }

    /** Combo milestone sound */
    playCombo() {
        this.init();
        this._playTone(660, 0.1, 'sine');
        setTimeout(() => this._playTone(880, 0.1, 'sine'), 60);
        setTimeout(() => this._playTone(1100, 0.15, 'sine'), 120);
        setTimeout(() => this._playTone(1320, 0.2, 'sine'), 180);
    }

    /** Level up fanfare */
    playLevelUp() {
        this.init();
        const notes = [523, 587, 659, 784, 880, 1047];
        notes.forEach((note, i) => {
            setTimeout(() => this._playTone(note, 0.18, 'sine'), i * 80);
        });
    }

    /** Timer warning tick */
    playTick() {
        this.init();
        this._playTone(800, 0.05, 'square', 0.1);
    }

    /** Game Over */
    playGameOver() {
        this.init();
        this._playTone(400, 0.3, 'sawtooth', 0.15);
        setTimeout(() => this._playTone(300, 0.3, 'sawtooth', 0.12), 200);
        setTimeout(() => this._playTone(200, 0.5, 'sawtooth', 0.1), 400);
    }

    /** Button click */
    playClick() {
        this.init();
        this._playTone(600, 0.06, 'sine', 0.15);
    }

    /** Upgrade purchase */
    playUpgrade() {
        this.init();
        this._playTone(440, 0.1, 'triangle');
        setTimeout(() => this._playTone(660, 0.1, 'triangle'), 70);
        setTimeout(() => this._playTone(880, 0.15, 'triangle'), 140);
    }

    toggle() {
        this.enabled = !this.enabled;
    }
}

// Global instance
const audio = new AudioManager();
