/* ============================================
   MATH PROBLEM GENERATOR — Adaptive difficulty AI
   ============================================ */

class MathGenerator {
    constructor() {
        // Performance tracking for adaptive difficulty
        this.history = [];         // Last N answers: { correct: bool, time: ms }
        this.historySize = 10;
        this.difficultyModifier = 0; // AI adjusts this: -2 to +3
    }

    reset() {
        this.history = [];
        this.difficultyModifier = 0;
    }

    /** Record a player answer for AI tracking */
    recordAnswer(correct, timeMs) {
        this.history.push({ correct, time: timeMs });
        if (this.history.length > this.historySize) {
            this.history.shift();
        }
        this._adjustDifficulty();
    }

    /** AI: Adjust difficulty based on performance */
    _adjustDifficulty() {
        if (this.history.length < 5) return;

        const recent = this.history.slice(-this.historySize);
        const correctRate = recent.filter(h => h.correct).length / recent.length;
        const avgTime = recent.reduce((s, h) => s + h.time, 0) / recent.length;

        if (correctRate > 0.85 && avgTime < 5000) {
            // Player is crushing it → increase difficulty
            this.difficultyModifier = Math.min(this.difficultyModifier + 1, 3);
        } else if (correctRate < 0.5) {
            // Player is struggling → decrease difficulty
            this.difficultyModifier = Math.max(this.difficultyModifier - 1, -2);
        } else if (correctRate < 0.65 && this.difficultyModifier > 0) {
            this.difficultyModifier--;
        }
    }

    /** Get effective difficulty tier */
    getEffectiveTier(level) {
        return Math.max(1, level + this.difficultyModifier);
    }

    /** Generate a math problem based on player level */
    generate(level) {
        const tier = this.getEffectiveTier(level);

        if (tier <= 3) {
            return this._generateAddSub(tier);
        } else if (tier <= 6) {
            return this._generateMulDiv(tier);
        } else if (tier <= 9) {
            return this._generateMixed(tier);
        } else if (tier <= 12) {
            return this._generateParentheses(tier);
        } else {
            return this._generateAlgebra(tier);
        }
    }

    /** Level 1-3: Addition & Subtraction */
    _generateAddSub(tier) {
        const maxNum = tier * 7 + 5; // 12, 19, 26
        const a = this._rand(1, maxNum);
        const b = this._rand(1, maxNum);

        if (Math.random() < 0.5) {
            return {
                text: `${a} + ${b} = ?`,
                answer: a + b,
                type: 'addition',
            };
        } else {
            const big = Math.max(a, b);
            const small = Math.min(a, b);
            return {
                text: `${big} − ${small} = ?`,
                answer: big - small,
                type: 'subtraction',
            };
        }
    }

    /** Level 4-6: Multiplication & Division */
    _generateMulDiv(tier) {
        const maxMul = tier - 1; // 3, 4, 5 → use these as table range multiplier
        const a = this._rand(2, 6 + maxMul);
        const b = this._rand(2, 6 + maxMul);

        if (Math.random() < 0.5) {
            return {
                text: `${a} × ${b} = ?`,
                answer: a * b,
                type: 'multiplication',
            };
        } else {
            // Ensure clean division
            const product = a * b;
            return {
                text: `${product} ÷ ${a} = ?`,
                answer: b,
                type: 'division',
            };
        }
    }

    /** Level 7-9: Mixed operations */
    _generateMixed(tier) {
        const difficulty = tier - 6; // 1, 2, 3
        const templates = [
            () => {
                const a = this._rand(2, 10 + difficulty * 5);
                const b = this._rand(2, 8);
                const c = this._rand(1, 10 + difficulty * 3);
                // a + b × c (order of operations)
                return {
                    text: `${a} + ${b} × ${c} = ?`,
                    answer: a + b * c,
                    type: 'mixed'
                };
            },
            () => {
                const a = this._rand(5, 15 + difficulty * 5);
                const b = this._rand(2, 6);
                const c = this._rand(1, 10);
                return {
                    text: `${a} − ${b} × ${c} = ?`,
                    answer: a - b * c,
                    type: 'mixed'
                };
            },
            () => {
                const a = this._rand(2, 8);
                const b = this._rand(2, 8);
                const c = this._rand(1, 10);
                return {
                    text: `${a} × ${b} + ${c} = ?`,
                    answer: a * b + c,
                    type: 'mixed'
                };
            },
        ];

        const problem = templates[Math.floor(Math.random() * templates.length)]();
        // Ensure answer is positive
        if (problem.answer < 0) {
            return this._generateMixed(tier);
        }
        return problem;
    }

    /** Level 10-12: Parentheses */
    _generateParentheses(tier) {
        const difficulty = tier - 9;
        const templates = [
            () => {
                const a = this._rand(2, 8 + difficulty * 3);
                const b = this._rand(2, 8 + difficulty * 3);
                const c = this._rand(2, 6 + difficulty);
                return {
                    text: `(${a} + ${b}) × ${c} = ?`,
                    answer: (a + b) * c,
                    type: 'parentheses'
                };
            },
            () => {
                const a = this._rand(10, 20 + difficulty * 5);
                const b = this._rand(2, 8);
                const c = this._rand(2, 5);
                return {
                    text: `(${a} − ${b}) ÷ ${c} = ?`,
                    answer: Math.floor((a - b) / c),
                    type: 'parentheses'
                };
            },
            () => {
                const a = this._rand(2, 6);
                const b = this._rand(2, 6);
                const c = this._rand(1, 5);
                const d = this._rand(1, 5);
                return {
                    text: `(${a} × ${b}) + (${c} × ${d}) = ?`,
                    answer: a * b + c * d,
                    type: 'parentheses'
                };
            },
        ];

        const problem = templates[Math.floor(Math.random() * templates.length)]();

        // Ensure clean division for parentheses with ÷
        if (problem.type === 'parentheses' && problem.text.includes('÷')) {
            const parts = problem.text.match(/\((\d+) − (\d+)\) ÷ (\d+)/);
            if (parts) {
                const diff = parseInt(parts[1]) - parseInt(parts[2]);
                const div = parseInt(parts[3]);
                if (diff % div !== 0 || diff < 0) {
                    return this._generateParentheses(tier);
                }
                problem.answer = diff / div;
            }
        }

        if (problem.answer < 0) return this._generateParentheses(tier);
        return problem;
    }

    /** Level 13+: Basic Algebra */
    _generateAlgebra(tier) {
        const difficulty = tier - 12;
        const templates = [
            // ax + b = c → solve for x
            () => {
                const x = this._rand(1, 5 + difficulty * 2);
                const a = this._rand(2, 4 + difficulty);
                const b = this._rand(1, 10 + difficulty * 3);
                const c = a * x + b;
                return {
                    text: `${a}x + ${b} = ${c}, x = ?`,
                    answer: x,
                    type: 'algebra'
                };
            },
            // ax - b = c → solve for x
            () => {
                const x = this._rand(2, 6 + difficulty * 2);
                const a = this._rand(2, 5);
                const b = this._rand(1, 8);
                const c = a * x - b;
                if (c < 0) return null;
                return {
                    text: `${a}x − ${b} = ${c}, x = ?`,
                    answer: x,
                    type: 'algebra'
                };
            },
            // a + bx = c → solve for x
            () => {
                const x = this._rand(1, 6 + difficulty);
                const a = this._rand(3, 12);
                const b = this._rand(2, 5);
                const c = a + b * x;
                return {
                    text: `${a} + ${b}x = ${c}, x = ?`,
                    answer: x,
                    type: 'algebra'
                };
            },
        ];

        let problem = null;
        let attempts = 0;
        while (!problem && attempts < 10) {
            problem = templates[Math.floor(Math.random() * templates.length)]();
            attempts++;
        }

        return problem || this._generateParentheses(12);
    }

    /** Helper: random int in range [min, max] */
    _rand(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /** Get a speech line for the customer based on problem type */
    getSpeechLine(type) {
        const lines = {
            addition: [
                "Can you add these up?",
                "What's the sum?",
                "Quick addition, please!",
            ],
            subtraction: [
                "Subtract this for me!",
                "What's the difference?",
                "Help me subtract!",
            ],
            multiplication: [
                "Multiply these, please!",
                "What's the product?",
                "Times table time!",
            ],
            division: [
                "Divide this for me!",
                "What's the quotient?",
                "Split this evenly!",
            ],
            mixed: [
                "This one's tricky!",
                "Watch the order!",
                "Mixed operations!",
            ],
            parentheses: [
                "Don't forget the brackets!",
                "Parentheses first!",
                "Group those numbers!",
            ],
            algebra: [
                "Find x for me!",
                "Solve for x, please!",
                "What's the variable?",
            ],
        };

        const options = lines[type] || lines.addition;
        return options[Math.floor(Math.random() * options.length)];
    }

    /** Get the base time allowed for a problem tier */
    getTimeForTier(tier) {
        const baseTimes = {
            1: 15, 2: 14, 3: 12,
            4: 14, 5: 13, 6: 12,
            7: 16, 8: 15, 9: 14,
            10: 18, 11: 17, 12: 16,
            13: 20, 14: 19, 15: 18,
        };
        return baseTimes[Math.min(tier, 15)] || 15;
    }
}

// Global instance
const mathGen = new MathGenerator();
