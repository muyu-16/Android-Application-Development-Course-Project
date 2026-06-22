// utils/dice-engine.js
// 骰子引擎：Mersenne Twister RNG + 多面骰掷骰逻辑

// ══════════════════════════════════════
// Mersenne Twister RNG (MT19937)
// 移植自 rpg-dice-roller，长周期 2^19937-1
// ══════════════════════════════════════
const MT_N = 624
const MT_M = 397
const MT_UPPER_MASK = 0x80000000
const MT_LOWER_MASK = 0x7fffffff
const MT_MATRIX_A = 0x9908b0df

export class MersenneTwister {
	constructor(seed) {
		this.mt = new Array(MT_N)
		this.mti = MT_N + 1
		this.seed = (seed != null) ? seed : (Date.now() & 0x7fffffff)
		this._init(this.seed)
	}

	_init(seed) {
		this.mt[0] = seed >>> 0
		for (let i = 1; i < MT_N; i++) {
			this.mt[i] = (1812433253 * (this.mt[i - 1] ^ (this.mt[i - 1] >>> 30)) + i) >>> 0
		}
		this.mti = MT_N
	}

	_gen() {
		let y
		const mag01 = [0x0, MT_MATRIX_A]

		if (this.mti >= MT_N) {
			let kk
			for (kk = 0; kk < MT_N - MT_M; kk++) {
				y = (this.mt[kk] & MT_UPPER_MASK) | (this.mt[kk + 1] & MT_LOWER_MASK)
				this.mt[kk] = this.mt[kk + MT_M] ^ (y >>> 1) ^ mag01[y & 0x1]
			}
			for (; kk < MT_N - 1; kk++) {
				y = (this.mt[kk] & MT_UPPER_MASK) | (this.mt[kk + 1] & MT_LOWER_MASK)
				this.mt[kk] = this.mt[kk + (MT_M - MT_N)] ^ (y >>> 1) ^ mag01[y & 0x1]
			}
			y = (this.mt[MT_N - 1] & MT_UPPER_MASK) | (this.mt[0] & MT_LOWER_MASK)
			this.mt[MT_N - 1] = this.mt[MT_M - 1] ^ (y >>> 1) ^ mag01[y & 0x1]
			this.mti = 0
		}

		y = this.mt[this.mti++]

		y ^= (y >>> 11)
		y ^= (y << 7) & 0x9d2c5680
		y ^= (y << 15) & 0xefc60000
		y ^= (y >>> 18)

		return y >>> 0
	}

	// 返回 [0, 1) 之间的浮点数
	next() {
		return this._gen() / 4294967296.0
	}

	// 返回 [min, max] 之间的整数
	nextInt(min, max) {
		return Math.floor(this.next() * (max - min + 1)) + min
	}
}

// 全局默认实例（无种子，每次启动不同）
const defaultRng = new MersenneTwister()

// ══════════════════════════════════════
// 掷骰核心
// ══════════════════════════════════════

/**
 * rollDice — 掷骰核心函数
 * @param {number} sides  骰子面数 (4/6/8/10/12/20/100)
 * @param {number} count  骰子数量 (1-20)
 * @param {MersenneTwister} [rng]  可选 RNG 实例
 * @returns {{ results: number[], sum: number, max: number, min: number }}
 */
export function rollDice(sides, count, rng) {
	const r = rng || defaultRng
	const results = []
	for (let i = 0; i < count; i++) {
		results.push(r.nextInt(1, sides))
	}
	return {
		results,
		sum: results.reduce((a, b) => a + b, 0),
		max: Math.max(...results),
		min: Math.min(...results)
	}
}
