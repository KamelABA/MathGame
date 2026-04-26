/* ============================================
   GAME ENGINE — Core game logic & scene management
   ============================================ */

class GameEngine {
    constructor() {
        // Scenes
        this.scenes = {
            menu: document.getElementById('scene-menu'),
            tutorial: document.getElementById('scene-tutorial'),
            game: document.getElementById('scene-game'),
            gameover: document.getElementById('scene-gameover'),
        };

        // Game state
        this.currentScene = 'menu';
        this.isPaused = false;
        this.isProcessing = false; // Prevent double-submit
        this.currentProblem = null;
        this.problemStartTime = 0;
        this.missedCount = 0;
        this.maxMissed = 3; // 3 timeouts = game over

        // DOM elements
        this.answerInput = document.getElementById('answer-input');
        this.problemText = document.getElementById('problem-text');
        this.inputWrapper = document.getElementById('input-wrapper');
        this.feedbackOverlay = document.getElementById('feedback-overlay');
        this.feedbackText = document.getElementById('feedback-text');
        this.levelupOverlay = document.getElementById('levelup-overlay');
        this.levelupLevel = document.getElementById('levelup-level');
        this.pauseOverlay = document.getElementById('pause-overlay');
    }

    init() {
        this._bindEvents();
        this._loadBestScores();
        particles.start();
    }

    /** Bind all UI events */
    _bindEvents() {
        // Menu
        document.getElementById('btn-play').addEventListener('click', () => {
            audio.playClick();
            this.startGame();
        });
        document.getElementById('btn-how-to').addEventListener('click', () => {
            audio.playClick();
            this.switchScene('tutorial');
        });
        document.getElementById('btn-back-menu').addEventListener('click', () => {
            audio.playClick();
            this.switchScene('menu');
        });

        // Game input
        this.answerInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.submitAnswer();
            }
        });
        document.getElementById('btn-submit').addEventListener('click', () => {
            this.submitAnswer();
        });

        // Pause
        document.getElementById('btn-pause').addEventListener('click', () => {
            audio.playClick();
            this.togglePause();
        });
        document.getElementById('btn-resume').addEventListener('click', () => {
            audio.playClick();
            this.togglePause();
        });
        document.getElementById('btn-quit').addEventListener('click', () => {
            audio.playClick();
            this.isPaused = false;
            this.pauseOverlay.classList.remove('show');
            timer.stop();
            this.switchScene('menu');
        });

        // Game Over
        document.getElementById('btn-retry').addEventListener('click', () => {
            audio.playClick();
            this.startGame();
        });
        document.getElementById('btn-menu').addEventListener('click', () => {
            audio.playClick();
            this.switchScene('menu');
            this._loadBestScores();
        });

        // Numeric Keypad
        document.querySelectorAll('.numeric-keypad .key[data-value]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.isPaused || this.isProcessing) return;
                audio.playClick();
                this.answerInput.value += btn.dataset.value;
                this.answerInput.focus();
            });
        });

        document.getElementById('key-clear').addEventListener('click', () => {
            if (this.isPaused || this.isProcessing) return;
            audio.playClick();
            this.answerInput.value = '';
            this.answerInput.focus();
        });

        document.getElementById('key-delete').addEventListener('click', () => {
            if (this.isPaused || this.isProcessing) return;
            audio.playClick();
            this.answerInput.value = this.answerInput.value.slice(0, -1);
            this.answerInput.focus();
        });

        document.getElementById('key-submit-keypad').addEventListener('click', () => {
            this.submitAnswer();
        });

        // Keyboard shortcut for pause
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentScene === 'game') {
                this.togglePause();
            }
        });
    }

    /** Switch scenes with transition */
    switchScene(sceneName) {
        // Hide all
        Object.values(this.scenes).forEach(el => el.classList.remove('active'));
        // Show target
        this.scenes[sceneName].classList.add('active');
        this.currentScene = sceneName;
    }

    /** Start a new game */
    startGame() {
        // Reset all systems
        scoreSystem.reset();
        mathGen.reset();
        customerQueue.reset();
        timer.reset();
        this.missedCount = 0;
        this.isProcessing = false;
        this.isPaused = false;

        // Switch to game scene
        this.switchScene('game');

        // Fill queue and start first customer
        customerQueue.fillQueue();
        this._nextCustomer();
    }

    /** Present next customer & problem */
    _nextCustomer() {
        this.isProcessing = false;

        // Clear input
        this.answerInput.value = '';
        this.inputWrapper.classList.remove('correct', 'wrong');

        // Get next customer
        const customer = customerQueue.nextCustomer();

        // Generate problem
        this.currentProblem = mathGen.generate(scoreSystem.level);
        this.problemStartTime = Date.now();

        // Display problem with animation
        this.problemText.textContent = this.currentProblem.text;
        this.problemText.classList.add('problem-enter');
        setTimeout(() => this.problemText.classList.remove('problem-enter'), 400);

        // Show speech
        const speech = mathGen.getSpeechLine(this.currentProblem.type);
        customerQueue.showSpeech(speech);

        // Start timer
        const tier = mathGen.getEffectiveTier(scoreSystem.level);
        const timeAllowed = mathGen.getTimeForTier(tier);
        timer.start(timeAllowed, () => this._onTimerExpire());

        // Focus input
        setTimeout(() => this.answerInput.focus(), 100);

        // Update upgrade button states
        upgrades.updateStates();
    }

    /** Submit the typed answer */
    submitAnswer() {
        if (this.isProcessing || this.isPaused) return;
        if (!this.currentProblem) return;

        const inputVal = this.answerInput.value.trim();
        if (inputVal === '') return;

        const playerAnswer = parseFloat(inputVal);
        if (isNaN(playerAnswer)) {
            this.answerInput.value = '';
            return;
        }

        this.isProcessing = true;
        timer.stop();

        const timeMs = Date.now() - this.problemStartTime;
        const isCorrect = Math.abs(playerAnswer - this.currentProblem.answer) < 0.001;

        // Record for AI
        mathGen.recordAnswer(isCorrect, timeMs);

        if (isCorrect) {
            this._handleCorrect(timeMs);
        } else {
            this._handleWrong();
        }
    }

    /** Handle correct answer */
    async _handleCorrect(timeMs) {
        const result = scoreSystem.addCorrect(timeMs);

        // Visual feedback
        this.inputWrapper.classList.add('correct');
        audio.playCorrect();

        // Show score popup
        this._showFeedback(`+${result.points}`, 'correct');

        // Show combo milestone
        if (scoreSystem.combo > 0 && scoreSystem.combo % 5 === 0) {
            audio.playCombo();
            setTimeout(() => {
                this._showFeedback(`🔥 ${scoreSystem.combo} STREAK!`, 'combo');
            }, 400);
        }

        // Particle burst
        const rect = this.inputWrapper.getBoundingClientRect();
        particles.burst(rect.left + rect.width / 2, rect.top, 8, '#10b981');

        // Score popup floating number
        this._spawnScorePopup(result.points, rect);

        // Customer exits happy
        await customerQueue.exitCorrect();

        // Level up check
        if (result.leveled) {
            await this._showLevelUp();
        }

        // Next customer
        this._nextCustomer();
    }

    /** Handle wrong answer — instant game over */
    async _handleWrong() {
        scoreSystem.addWrong();

        // Visual feedback
        this.inputWrapper.classList.add('wrong');
        audio.playWrong();
        this._showFeedback(`✗ Answer: ${this.currentProblem.answer}`, 'wrong');

        // Shake customer then game over
        await customerQueue.shakeWrong();

        setTimeout(() => this._gameOver(), 800);
    }

    /** Timer expired — instant game over */
    _onTimerExpire() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        mathGen.recordAnswer(false, 999999);
        scoreSystem.addWrong();

        this._showFeedback('⏰ Time\'s up!', 'wrong');
        audio.playWrong();

        setTimeout(() => this._gameOver(), 800);
    }

    /** Show level up overlay */
    _showLevelUp() {
        return new Promise(resolve => {
            this.levelupLevel.textContent = `Level ${scoreSystem.level}`;
            this.levelupOverlay.classList.add('show');
            audio.playLevelUp();

            setTimeout(() => {
                this.levelupOverlay.classList.remove('show');
                resolve();
            }, 1800);
        });
    }

    /** Game Over */
    _gameOver() {
        timer.stop();
        audio.playGameOver();

        // Save best scores
        const wasBest = scoreSystem.score > scoreSystem.getBestScore();
        scoreSystem.saveBest();

        // Populate game over screen
        document.getElementById('go-score').textContent = scoreSystem.score.toLocaleString();
        document.getElementById('go-level').textContent = scoreSystem.level;
        document.getElementById('go-solved').textContent = scoreSystem.correctCount;
        document.getElementById('go-combo').textContent = scoreSystem.bestCombo;
        document.getElementById('go-accuracy').textContent = `${scoreSystem.getAccuracy()}%`;

        const newBestEl = document.getElementById('go-new-best');
        newBestEl.style.display = wasBest ? 'block' : 'none';

        this.switchScene('gameover');
    }

    /** Show feedback text overlay */
    _showFeedback(text, type) {
        this.feedbackText.textContent = text;
        this.feedbackText.className = `feedback-text ${type}`;
        this.feedbackOverlay.classList.remove('show');
        // Force reflow
        void this.feedbackOverlay.offsetWidth;
        this.feedbackOverlay.classList.add('show');

        setTimeout(() => {
            this.feedbackOverlay.classList.remove('show');
        }, 800);
    }

    /** Spawn floating score number */
    _spawnScorePopup(points, rect) {
        const popup = document.createElement('div');
        popup.className = 'score-popup';
        popup.textContent = `+${points}`;
        popup.style.left = `${rect.left + rect.width / 2}px`;
        popup.style.top = `${rect.top - 20}px`;
        popup.style.color = points > 200 ? '#f59e0b' : '#10b981';
        document.body.appendChild(popup);

        setTimeout(() => popup.remove(), 1000);
    }

    /** Toggle pause */
    togglePause() {
        if (this.currentScene !== 'game') return;

        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            timer.pause();
            this.pauseOverlay.classList.add('show');
        } else {
            timer.resume();
            this.pauseOverlay.classList.remove('show');
            this.answerInput.focus();
        }
    }

    /** Load best scores for menu */
    _loadBestScores() {
        document.getElementById('menu-best-score').textContent =
            scoreSystem.getBestScore().toLocaleString();
        document.getElementById('menu-best-level').textContent =
            scoreSystem.getBestLevel();
    }

}

// Global instance
const engine = new GameEngine();
