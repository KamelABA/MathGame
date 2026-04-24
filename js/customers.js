/* ============================================
   CUSTOMER SYSTEM — Shape customers with personalities
   ============================================ */

class CustomerFactory {
    constructor() {
        this.shapeTypes = [
            {
                type: 'circle',
                bodyClass: 'circle-body',
                color: '#ff6b6b',
                name: 'Orbsworth',
            },
            {
                type: 'square',
                bodyClass: 'square-body',
                color: '#4ecdc4',
                name: 'Blockley',
            },
            {
                type: 'triangle',
                bodyClass: 'triangle-body',
                color: '#ffe66d',
                name: 'Pointy',
            },
            {
                type: 'diamond',
                bodyClass: 'diamond-body',
                color: '#a855f7',
                name: 'Gemsworth',
            },
            {
                type: 'hexagon',
                bodyClass: 'hexagon-body',
                color: '#10b981',
                name: 'Hexley',
            },
            {
                type: 'star',
                bodyClass: 'star-body',
                color: '#f59e0b',
                name: 'Starla',
            },
        ];

        this.lastUsed = -1;
    }

    /** Create a random shape customer */
    create() {
        let idx;
        do {
            idx = Math.floor(Math.random() * this.shapeTypes.length);
        } while (idx === this.lastUsed); // Avoid same shape twice in a row

        this.lastUsed = idx;
        const shape = this.shapeTypes[idx];

        return {
            ...shape,
            id: Date.now() + Math.random(),
        };
    }

    /** Render a customer shape as HTML */
    renderShape(customer, isQueue = false) {
        const container = document.createElement('div');
        container.className = `shape-render ${isQueue ? 'queue-shape' : ''}`;

        if (customer.type === 'triangle') {
            // Triangle uses border trick, color via border-bottom-color
            container.innerHTML = `
                <div class="shape-body ${customer.bodyClass}" style="border-bottom-color: ${customer.color}"></div>
                ${!isQueue ? `
                <div class="shape-eyes" style="transform: translate(-50%, -90%);">
                    <div class="shape-eye blink"></div>
                    <div class="shape-eye blink"></div>
                </div>` : ''}
            `;
        } else {
            container.innerHTML = `
                <div class="shape-body ${customer.bodyClass}" style="background: ${customer.color}"></div>
                ${!isQueue ? `
                <div class="shape-eyes">
                    <div class="shape-eye blink"></div>
                    <div class="shape-eye blink"></div>
                </div>` : ''}
            `;
        }

        return container;
    }
}

class CustomerQueue {
    constructor() {
        this.factory = new CustomerFactory();
        this.queue = [];
        this.maxVisible = 4;
        this.queueEl = document.getElementById('customer-queue');
        this.activeEl = document.getElementById('active-customer');
        this.speechEl = document.getElementById('customer-speech');
        this.speechTextEl = document.getElementById('speech-text');
        this.currentCustomer = null;
    }

    reset() {
        this.queue = [];
        this.currentCustomer = null;
        this.queueEl.innerHTML = '';
        this.activeEl.innerHTML = '';
        this.speechEl.classList.remove('show');
    }

    /** Fill the queue with customers */
    fillQueue() {
        while (this.queue.length < this.maxVisible) {
            this.queue.push(this.factory.create());
        }
        this._renderQueue();
    }

    /** Get next customer from queue */
    nextCustomer() {
        if (this.queue.length === 0) {
            this.fillQueue();
        }

        this.currentCustomer = this.queue.shift();
        this.queue.push(this.factory.create()); // Add one to back
        this._renderQueue();
        this._renderActiveCustomer();

        return this.currentCustomer;
    }

    /** Show speech bubble with text */
    showSpeech(text) {
        this.speechTextEl.textContent = text;
        this.speechEl.classList.add('show');
    }

    hideSpeech() {
        this.speechEl.classList.remove('show');
    }

    /** Animate current customer exit (correct answer) */
    exitCorrect() {
        return new Promise(resolve => {
            this.activeEl.classList.add('customer-exit-correct');
            this.hideSpeech();
            setTimeout(() => {
                this.activeEl.classList.remove('customer-exit-correct');
                this.activeEl.innerHTML = '';
                resolve();
            }, 500);
        });
    }

    /** Animate current customer shake (wrong answer) */
    shakeWrong() {
        return new Promise(resolve => {
            this.activeEl.classList.add('customer-exit-wrong');
            setTimeout(() => {
                this.activeEl.classList.remove('customer-exit-wrong');
                resolve();
            }, 400);
        });
    }

    /** Render the queue display */
    _renderQueue() {
        this.queueEl.innerHTML = '';
        const visibleQueue = this.queue.slice(0, this.maxVisible);
        for (const customer of visibleQueue) {
            const el = this.factory.renderShape(customer, true);
            this.queueEl.appendChild(el);
        }
    }

    /** Render the active customer at desk */
    _renderActiveCustomer() {
        this.activeEl.innerHTML = '';
        if (this.currentCustomer) {
            const el = this.factory.renderShape(this.currentCustomer, false);
            el.classList.add('customer-enter');
            this.activeEl.appendChild(el);
        }
    }
}

// Global instance
const customerQueue = new CustomerQueue();
