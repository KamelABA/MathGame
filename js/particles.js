/* ============================================
   PARTICLE SYSTEM — Background ambient particles
   ============================================ */

class ParticleSystem {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.maxParticles = 50;
        this.running = false;

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createParticle() {
        const colors = [
            'rgba(108, 99, 255, 0.15)',
            'rgba(255, 107, 157, 0.12)',
            'rgba(78, 205, 196, 0.1)',
            'rgba(255, 230, 109, 0.08)',
            'rgba(168, 85, 247, 0.1)',
        ];
        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            size: Math.random() * 3 + 1,
            speedX: (Math.random() - 0.5) * 0.3,
            speedY: (Math.random() - 0.5) * 0.3,
            color: colors[Math.floor(Math.random() * colors.length)],
            opacity: Math.random() * 0.5 + 0.2,
            pulse: Math.random() * Math.PI * 2,
            pulseSpeed: Math.random() * 0.02 + 0.005,
        };
    }

    init() {
        this.particles = [];
        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push(this.createParticle());
        }
    }

    update() {
        for (const p of this.particles) {
            p.x += p.speedX;
            p.y += p.speedY;
            p.pulse += p.pulseSpeed;

            // Wrap around
            if (p.x < -10) p.x = this.canvas.width + 10;
            if (p.x > this.canvas.width + 10) p.x = -10;
            if (p.y < -10) p.y = this.canvas.height + 10;
            if (p.y > this.canvas.height + 10) p.y = -10;
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (const p of this.particles) {
            const pulsedSize = p.size + Math.sin(p.pulse) * 0.5;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, pulsedSize, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.fill();
        }
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.init();
        this._loop();
    }

    _loop() {
        if (!this.running) return;
        this.update();
        this.draw();
        requestAnimationFrame(() => this._loop());
    }

    stop() {
        this.running = false;
    }

    /** Burst particles at position (for correct answer celebration) */
    burst(x, y, count = 12, color = '#10b981') {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = Math.random() * 3 + 2;
            const particle = {
                x,
                y,
                size: Math.random() * 4 + 2,
                speedX: Math.cos(angle) * speed,
                speedY: Math.sin(angle) * speed,
                color,
                opacity: 1,
                pulse: 0,
                pulseSpeed: 0,
                isBurst: true,
                life: 1,
                decay: Math.random() * 0.02 + 0.02,
            };
            this.particles.push(particle);
        }
    }
}

// Global instance
const particles = new ParticleSystem('particle-canvas');
