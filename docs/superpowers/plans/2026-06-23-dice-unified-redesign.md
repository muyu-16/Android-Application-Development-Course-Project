# 骰子模块统一重构实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有双 Tab 骰子模块重构为统一多面骰界面，支持 D4~D100 全类型骰子、投掷历史记录管理。

**Architecture:** 单页紧凑布局，dice.vue 作为唯一入口，移除 free-mode/cup-mode 子页面。骰子引擎独立为 utils/dice-engine.js，Store 扩展历史管理，composable 重构支持多面骰。

**Tech Stack:** uni-app (Vue3) + Pinia + CSS 3D 动画 + Mersenne Twister RNG

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `utils/dice-engine.js` | Create | Mersenne Twister RNG + 掷骰核心函数 |
| `utils/dice-constants.js` | Modify | 扩展多面骰常量（DICE_TYPES, POLYGON_DICE, D6_FACES 等） |
| `stores/dice.js` | Modify | 扩展 selectedType/diceCount/history 状态 + 方法 |
| `composables/useDiceRoll.js` | Modify | 重构支持多面骰掷骰 + 动画 |
| `pages/dice/dice.vue` | Modify | 重写为统一多面骰界面 |
| `pages/dice/free-mode.vue` | Delete | 功能合并入 dice.vue |
| `pages/dice/cup-mode.vue` | Delete | 功能合并入 dice.vue |

---

### Task 1: 创建骰子引擎 (utils/dice-engine.js)

**Files:**
- Create: `utils/dice-engine.js`

- [ ] **Step 1: 创建 Mersenne Twister RNG + 掷骰核心函数**

```javascript
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
```

- [ ] **Step 2: 提交骰子引擎**

```bash
git add utils/dice-engine.js
git commit -m "feat: add dice engine with Mersenne Twister RNG"
```

---

### Task 2: 扩展骰子常量 (utils/dice-constants.js)

**Files:**
- Modify: `utils/dice-constants.js`

- [ ] **Step 1: 重写 dice-constants.js，添加多面骰常量**

将现有文件内容替换为以下内容（保留 DOTS/CUBE_FACES/FACE_OFFSET/CUP_LAYOUTS，新增 DICE_TYPES/POLYGON_DICE）：

```javascript
/**
 * 骰子公共常量
 * 供 dice.vue / useDiceRoll 等骰子模块共用
 */

// ══════════════════════════════════════
// 多面骰类型定义
// ══════════════════════════════════════
export const DICE_TYPES = [
	{ sides: 4,   label: 'D4',   icon: '\u25B2',  clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' },
	{ sides: 6,   label: 'D6',   icon: '\u2B21',  clipPath: null },
	{ sides: 8,   label: 'D8',   icon: '\u25C6',  clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' },
	{ sides: 10,  label: 'D10',  icon: '\u2B20',  clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' },
	{ sides: 12,  label: 'D12',  icon: '\u2B21',  clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)' },
	{ sides: 20,  label: 'D20',  icon: '\u2B20',  clipPath: 'polygon(50% 0%, 97% 35%, 79% 91%, 21% 91%, 3% 35%)' },
	{ sides: 100, label: 'D100', icon: '%',        clipPath: 'circle(50%)' }
]

// 非立方体骰型集合（用于判断是否使用 2D 多边形渲染）
export const POLYGON_DICE = DICE_TYPES.filter(d => d.clipPath !== null)

// 根据 label 获取骰型定义
export const getDiceType = (label) => DICE_TYPES.find(d => d.label === label) || DICE_TYPES[1]

// ══════════════════════════════════════
// D6 专属常量（3D 立方体渲染）
// ══════════════════════════════════════

// 标准骰面点数位置（归一化坐标 -1/0/1）
export const DOTS = {
	1: [[0, 0]],
	2: [[-1, -1], [1, 1]],
	3: [[-1, -1], [0, 0], [1, 1]],
	4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
	5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
	6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]]
}

// 3D 骰子六面变换
export const CUBE_FACES = [
	{ num: 1, transform: 'rotateY(0deg) translateZ(56px) scale(1.04)' },
	{ num: 2, transform: 'rotateX(90deg) translateZ(56px) scale(1.04)' },
	{ num: 3, transform: 'rotateY(-90deg) translateZ(56px) scale(1.04)' },
	{ num: 4, transform: 'rotateY(90deg) translateZ(56px) scale(1.04)' },
	{ num: 5, transform: 'rotateX(-90deg) translateZ(56px) scale(1.04)' },
	{ num: 6, transform: 'rotateX(180deg) translateZ(56px) scale(1.04)' }
]

// 点数 → 3D 旋转角度
export const FACE_OFFSET = {
	1: { x: 0, y: 0 },
	2: { x: -90, y: 0 },
	3: { x: 0, y: 90 },
	4: { x: 0, y: -90 },
	5: { x: 90, y: 0 },
	6: { x: 180, y: 0 }
}

// 大话骰散落布局（相对于圆心偏移，单位 rpx）
export const CUP_LAYOUTS = {
	3: [[0, -48], [-56, 36], [56, 36]],
	4: [[-44, -44], [44, -44], [-44, 44], [44, 44]],
	5: [[0, -66], [-62, -20], [-40, 54], [40, 54], [62, -20]],
	6: [[-50, -56], [0, -62], [50, -56], [-50, 50], [0, 56], [50, 50]]
}
```

- [ ] **Step 2: 提交常量扩展**

```bash
git add utils/dice-constants.js
git commit -m "feat: extend dice constants with multi-sided dice types"
```

---

### Task 3: 扩展 Store (stores/dice.js)

**Files:**
- Modify: `stores/dice.js`

- [ ] **Step 1: 重写 stores/dice.js，扩展 selectedType/diceCount/history**

```javascript
// stores/dice.js
// 骰子模块状态管理：骰型选择、数量、历史记录、反馈开关
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { rollDice } from '@/utils/dice-engine'

const STORAGE_KEY = 'partyglass_dice'
const MAX_HISTORY = 200

function loadPersisted() {
	try {
		const raw = uni.getStorageSync(STORAGE_KEY)
		if (raw) return JSON.parse(raw)
	} catch (e) {}
	return null
}

export const useDiceStore = defineStore('dice', () => {
	const saved = loadPersisted() || {}

	// ── 骰型与数量 ──
	const selectedType = ref(saved.selectedType || 'D6')
	const diceCount = ref(saved.diceCount || 1)

	// ── 反馈开关 ──
	const vibrateEnabled = ref(saved.vibrateEnabled ?? true)
	const soundEnabled = ref(saved.soundEnabled ?? false)

	// ── 投掷历史 ──
	const history = ref(saved.history || [])

	// ── 持久化 ──
	const persist = () => {
		try {
			uni.setStorageSync(STORAGE_KEY, JSON.stringify({
				selectedType: selectedType.value,
				diceCount: diceCount.value,
				vibrateEnabled: vibrateEnabled.value,
				soundEnabled: soundEnabled.value,
				history: history.value.slice(0, MAX_HISTORY)
			}))
		} catch (e) {}
	}

	// ── 骰型切换 ──
	const setSelectedType = (type) => {
		selectedType.value = type
		persist()
	}

	// ── 数量调节 (1-20) ──
	const setDiceCount = (n) => {
		diceCount.value = Math.max(1, Math.min(20, n))
		persist()
	}

	// ── 反馈开关 ──
	const toggleVibrate = () => {
		vibrateEnabled.value = !vibrateEnabled.value
		persist()
	}

	const toggleSound = () => {
		soundEnabled.value = !soundEnabled.value
		persist()
	}

	// ── 历史管理 ──
	const addHistory = (record) => {
		history.value.unshift(record)
		if (history.value.length > MAX_HISTORY) {
			history.value = history.value.slice(0, MAX_HISTORY)
		}
		persist()
	}

	const clearHistory = () => {
		history.value = []
		persist()
	}

	const getHistoryByType = (type) => {
		if (!type || type === 'ALL') return history.value
		return history.value.filter(r => r.diceType === type)
	}

	// ── 便捷掷骰（Store 层面，供 UI 调用） ──
	const performRoll = (sides) => {
		const result = rollDice(sides, diceCount.value)
		const record = {
			id: Date.now(),
			diceType: selectedType.value,
			count: diceCount.value,
			results: result.results,
			sum: result.sum,
			max: result.max,
			min: result.min,
			timestamp: Date.now()
		}
		addHistory(record)
		return result
	}

	// ── 兼容旧代码 ──
	const freeCount = computed(() => diceCount.value)
	const cupCount = ref(saved.cupCount || 5)
	const setFreeCount = (n) => setDiceCount(n)
	const setCupCount = (n) => {
		cupCount.value = Math.max(3, Math.min(6, n))
		persist()
	}

	return {
		selectedType,
		diceCount,
		vibrateEnabled,
		soundEnabled,
		history,
		setSelectedType,
		setDiceCount,
		toggleVibrate,
		toggleSound,
		addHistory,
		clearHistory,
		getHistoryByType,
		performRoll,
		// 兼容旧代码
		freeCount,
		cupCount,
		setFreeCount,
		setCupCount
	}
})
```

- [ ] **Step 2: 提交 Store 扩展**

```bash
git add stores/dice.js
git commit -m "feat: extend dice store with multi-sided dice and history"
```

---

### Task 4: 重构 useDiceRoll composable

**Files:**
- Modify: `composables/useDiceRoll.js`

- [ ] **Step 1: 重写 useDiceRoll.js 支持多面骰**

```javascript
/**
 * useDiceRoll — 通用摇骰逻辑 composable
 * 支持 D4~D100 全类型骰子
 */
import { ref, computed } from 'vue'
import { rollDice } from '@/utils/dice-engine'
import { FACE_OFFSET, getDiceType } from '@/utils/dice-constants'

export function useDiceRoll(options = {}) {
	const { sides, count, vibrateEnabled, vibrate } = options

	const values = ref(Array(count.value).fill(1))
	const rolling = ref(false)
	const rotX = ref(Array(count.value).fill(0))
	const rotY = ref(Array(count.value).fill(0))
	const trans = ref(Array(count.value).fill('none'))
	const flipping = ref(Array(count.value).fill(false))
	const bouncing = ref(Array(count.value).fill(''))

	// 当前骰型是否为 D6（3D 立方体渲染）
	const isD6 = computed(() => sides.value === 6)

	const resetAnimState = (n) => {
		rotX.value = Array(n).fill(0)
		rotY.value = Array(n).fill(0)
		trans.value = Array(n).fill('none')
		flipping.value = Array(n).fill(false)
		bouncing.value = Array(n).fill('')
	}

	// 同步骰子数量变化
	const syncCount = (n) => {
		values.value = Array(n).fill(isD6.value ? 1 : 0)
		resetAnimState(n)
	}

	// 核心摇骰
	const roll = () => {
		if (rolling.value) return false
		rolling.value = true
		if (vibrateEnabled?.value && vibrate) vibrate.medium()

		const result = rollDice(sides.value, count.value)
		const results = result.results

		for (let i = 0; i < count.value; i++) {
			setTimeout(() => rollSingle(i, results[i]), i * 150)
		}

		const totalDuration = count.value * 150 + 1100
		setTimeout(() => {
			rolling.value = false
			values.value = [...results]
			for (let i = 0; i < count.value; i++) {
				flipping.value[i] = false
				bouncing.value[i] = ''
			}
		}, totalDuration)

		return result
	}

	const rollSingle = (index, targetValue) => {
		trans.value[index] = 'none'
		rotX.value[index] = 0
		rotY.value[index] = 0
		flipping.value[index] = true
		bouncing.value[index] = ''

		// 翻转中数字快速切换
		const flipId = setInterval(() => {
			if (!flipping.value[index]) { clearInterval(flipId); return }
			if (isD6.value) {
				const tmp = [...values.value]
				tmp[index] = Math.floor(Math.random() * 6) + 1
				values.value = tmp
			} else {
				// 多面骰：随机切换数字
				const tmp = [...values.value]
				tmp[index] = Math.floor(Math.random() * sides.value) + 1
				values.value = tmp
			}
		}, 80)

		setTimeout(() => clearInterval(flipId), 1500)

		if (isD6.value) {
			// D6: 3D 立方体旋转
			const spins = 1 + Math.floor(Math.random() * 3)
			const offset = FACE_OFFSET[targetValue]
			const endX = spins * 360 + offset.x
			const endY = spins * 360 + offset.y
			const duration = 0.6 + Math.random() * 0.3
			trans.value[index] = 'transform ' + duration + 's cubic-bezier(0.05, 0.7, 0.1, 1.0)'
			rotX.value[index] = endX
			rotY.value[index] = endY
		} else {
			// 多面骰: 2D 翻转动画
			const duration = 0.6 + Math.random() * 0.3
			trans.value[index] = 'transform ' + duration + 's cubic-bezier(0.05, 0.7, 0.1, 1.0)'
			rotX.value[index] = 360 + Math.random() * 720
			rotY.value[index] = Math.random() * 180 - 90
		}

		setTimeout(() => bouncing.value[index] = 'bounce-settle 0.3s ease-out 0.05s both', 30)
		if (vibrateEnabled?.value && vibrate) vibrate.tap()
	}

	const totalSum = computed(() => values.value.reduce((s, v) => s + v, 0))
	const maxVal = computed(() => values.value.length ? Math.max(...values.value) : 0)
	const minVal = computed(() => values.value.length ? Math.min(...values.value) : 0)

	return {
		values, rolling, rotX, rotY, trans, flipping, bouncing,
		isD6,
		totalSum, maxVal, minVal,
		roll, rollSingle, syncCount, resetAnimState
	}
}
```

- [ ] **Step 2: 提交 composable 重构**

```bash
git add composables/useDiceRoll.js
git commit -m "feat: refactor useDiceRoll to support multi-sided dice"
```

---

### Task 5: 重写骰子主页面 (pages/dice/dice.vue)

**Files:**
- Modify: `pages/dice/dice.vue`

- [ ] **Step 1: 重写 dice.vue 为统一多面骰界面**

```vue
<!-- pages/dice/dice.vue -->
<!-- 统一多面骰界面：D4~D100 全类型 + 投掷历史 -->
<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import NavBar from '@/components/NavBar.vue'
import { useDiceStore } from '@/stores/dice'
import { useDiceRoll } from '@/composables/useDiceRoll'
import { useShake } from '@/composables/useShake'
import { useVibrate } from '@/composables/useVibrate'
import { DICE_TYPES, getDiceType, DOTS, CUBE_FACES } from '@/utils/dice-constants'

const store = useDiceStore()
const { selectedType, diceCount, vibrateEnabled, history } = storeToRefs(store)
const vibrate = useVibrate()

// 当前骰型定义
const currentDice = computed(() => getDiceType(selectedType.value))
const currentSides = computed(() => currentDice.value.sides)

// 3D 支持检测
const supports3D = ref(true)
onMounted(() => {
	try {
		if (typeof document !== 'undefined') {
			const el = document.createElement('div')
			el.style.transformStyle = 'preserve-3d'
			supports3D.value = el.style.transformStyle === 'preserve-3d'
		}
	} catch (e) {
		supports3D.value = false
	}
})

// 摇骰逻辑
const {
	values, rolling, rotX, rotY, trans, flipping, bouncing,
	isD6, totalSum, maxVal, minVal,
	roll: doRoll, syncCount
} = useDiceRoll({
	sides: currentSides,
	count: diceCount,
	vibrateEnabled,
	vibrate
})

// 骰型切换
const selectType = (type) => {
	if (rolling.value) return
	store.setSelectedType(type)
	if (vibrateEnabled.value) vibrate.tap()
}

// 数量调节
const adjustCount = (delta) => {
	if (rolling.value) return
	const next = diceCount.value + delta
	if (next < 1 || next > 20) return
	store.setDiceCount(next)
	syncCount(next)
	if (vibrateEnabled.value) vibrate.tap()
}

// 摇骰
const roll = () => {
	if (rolling.value) return
	const result = doRoll()
	if (result) {
		store.addHistory({
			id: Date.now(),
			diceType: selectedType.value,
			count: diceCount.value,
			results: result.results,
			sum: result.sum,
			max: result.max,
			min: result.min,
			timestamp: Date.now()
		})
	}
}

// 同步骰子数量
watch(diceCount, (n) => {
	if (!rolling.value) syncCount(n)
})

// 摇一摇
const { start: startShake, stop: stopShake } = useShake({ onShake: roll })
onMounted(() => startShake())
onBeforeUnmount(() => stopShake())

// ── 历史抽屉 ──
const showHistory = ref(false)
const historyFilter = ref('ALL')
const filteredHistory = computed(() => store.getHistoryByType(historyFilter.value))

const openHistory = () => {
	historyFilter.value = 'ALL'
	showHistory.value = true
}
const closeHistory = () => { showHistory.value = false }
const deleteHistoryItem = (id) => {
	store.history = store.history.filter(r => r.id !== id)
}
const clearAllHistory = () => {
	store.clearHistory()
}

// 格式化时间
const formatTime = (ts) => {
	const d = new Date(ts)
	const h = String(d.getHours()).padStart(2, '0')
	const m = String(d.getMinutes()).padStart(2, '0')
	return h + ':' + m
}

// 骰子网格列数
const gridCols = computed(() => {
	const n = diceCount.value
	if (n <= 3) return n
	if (n <= 6) return 3
	return 4
})
</script>

<template>
	<view class="dice-page">
		<!-- 导航栏 -->
		<NavBar title="骰子" :showBack="true">
			<template #right>
				<view class="nav-btn glass-card gbtn" @tap="openHistory">
					<text class="nav-btn-icon">&#128203;</text>
				</view>
			</template>
		</NavBar>

		<!-- 骰型选择器 -->
		<scroll-view scroll-x class="type-scroll" :show-scrollbar="false">
			<view class="type-bar">
				<view v-for="dt in DICE_TYPES" :key="dt.label"
					class="type-chip glass-card gbtn"
					:class="{ active: selectedType === dt.label }"
					@tap="selectType(dt.label)">
					<text class="type-icon">{{ dt.icon }}</text>
					<text class="type-label">{{ dt.label }}</text>
				</view>
			</view>
		</scroll-view>

		<!-- 骰子展示区 -->
		<view class="dice-display">
			<view class="dice-grid" :style="{ gridTemplateColumns: 'repeat(' + gridCols + ', 1fr)' }">
				<!-- D6 3D 模式 -->
				<template v-if="isD6 && supports3D">
					<view v-for="(val, idx) in values" :key="idx" class="dice-3d"
						:style="{ animation: bouncing[idx] }">
						<view class="dice-cube"
							:style="{ transform: 'rotateX(' + rotX[idx] + 'deg) rotateY(' + rotY[idx] + 'deg)', transition: trans[idx] }">
							<view class="dice-back"></view>
							<view v-for="(face, fi) in CUBE_FACES" :key="fi" class="dice-face"
								:style="{ transform: face.transform }">
								<view v-for="(pos, pi) in DOTS[face.num]" :key="pi" class="dice-dot"
									:style="{ left: 'calc(50% + ' + pos[0] * 20 + 'px)', top: 'calc(50% + ' + pos[1] * 20 + 'px)' }"></view>
							</view>
							<view class="dice-flip-overlay" v-if="flipping[idx]">
								<text class="dice-flip-num">{{ values[idx] }}</text>
							</view>
						</view>
						<view class="dice-shadow"></view>
					</view>
				</template>
				<!-- 多面骰 2D 模式 / D6 降级模式 -->
				<template v-else>
					<view v-for="(val, idx) in values" :key="'p-' + idx" class="dice-poly"
						:style="{
							animation: bouncing[idx],
							transform: 'rotateX(' + rotX[idx] + 'deg) rotateY(' + rotY[idx] + 'deg)',
							transition: trans[idx]
						}">
						<view class="poly-face" :style="{ clipPath: currentDice.clipPath || 'none' }">
							<text class="poly-num">{{ val || '?' }}</text>
						</view>
						<view class="dice-shadow"></view>
					</view>
				</template>
			</view>
		</view>

		<!-- 结果统计栏 -->
		<view class="stats-bar glass-card">
			<view class="stat-item">
				<text class="stat-label">总和</text>
				<text class="stat-value sum">{{ rolling ? '...' : totalSum }}</text>
			</view>
			<view class="stat-divider"></view>
			<view class="stat-item">
				<text class="stat-label">最大</text>
				<text class="stat-value">{{ rolling ? '...' : maxVal }}</text>
			</view>
			<view class="stat-divider"></view>
			<view class="stat-item">
				<text class="stat-label">最小</text>
				<text class="stat-value">{{ rolling ? '...' : minVal }}</text>
			</view>
		</view>

		<!-- 控制栏 -->
		<view class="control-bar">
			<view class="stepper glass-card">
				<view class="step-btn gbtn" @tap="adjustCount(-1)">
					<text>-</text>
				</view>
				<text class="step-num">{{ diceCount }}</text>
				<view class="step-btn gbtn" @tap="adjustCount(1)">
					<text>+</text>
				</view>
			</view>
			<view class="roll-btn gbtn-primary gbtn" :class="{ disabled: rolling }" @tap="roll">
				<text class="roll-text">{{ rolling ? '摇动中...' : '摇骰' }}</text>
			</view>
		</view>

		<!-- 历史抽屉 -->
		<view v-if="showHistory" class="drawer-mask" @tap="closeHistory">
			<view class="drawer-panel" @tap.stop>
				<!-- 抽屉头部 -->
				<view class="drawer-header">
					<text class="drawer-title">投掷历史</text>
					<view class="drawer-clear gbtn" @tap="clearAllHistory">
						<text>清空</text>
					</view>
				</view>
				<!-- 筛选栏 -->
				<scroll-view scroll-x class="filter-scroll" :show-scrollbar="false">
					<view class="filter-bar">
						<view class="filter-chip" :class="{ active: historyFilter === 'ALL' }"
							@tap="historyFilter = 'ALL'">
							<text>全部</text>
						</view>
						<view v-for="dt in DICE_TYPES" :key="dt.label"
							class="filter-chip" :class="{ active: historyFilter === dt.label }"
							@tap="historyFilter = dt.label">
							<text>{{ dt.label }}</text>
						</view>
					</view>
				</scroll-view>
				<!-- 记录列表 -->
				<scroll-view scroll-y class="history-list">
					<view v-if="filteredHistory.length === 0" class="history-empty">
						<text>还没有投掷记录</text>
					</view>
					<view v-for="record in filteredHistory" :key="record.id" class="history-item glass-card">
						<view class="hi-left">
							<text class="hi-type">{{ record.diceType }}</text>
							<text class="hi-count">x{{ record.count }}</text>
						</view>
						<view class="hi-center">
							<text class="hi-results">{{ record.results.join(', ') }}</text>
							<text class="hi-sum">= {{ record.sum }}</text>
						</view>
						<view class="hi-right">
							<text class="hi-time">{{ formatTime(record.timestamp) }}</text>
							<view class="hi-del" @tap="deleteHistoryItem(record.id)">
								<text>x</text>
							</view>
						</view>
					</view>
				</scroll-view>
			</view>
		</view>
	</view>
</template>

<style scoped>
.dice-page {
	min-height: 100vh;
	background: var(--clr-bg-primary);
	display: flex;
	flex-direction: column;
	padding: 0 16px;
	padding-bottom: calc(var(--safe-area-bottom, 0px) + 24px);
}

/* ─── 导航栏按钮 ─── */
.nav-btn {
	width: 72rpx;
	height: 72rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
}
.nav-btn-icon {
	font-size: 32rpx;
	color: var(--clr-text-primary);
}

/* ─── 骰型选择器 ─── */
.type-scroll {
	flex-shrink: 0;
	white-space: nowrap;
	margin-bottom: 16rpx;
}
.type-bar {
	display: inline-flex;
	gap: 12rpx;
	padding: 8rpx 0;
}
.type-chip {
	display: inline-flex;
	align-items: center;
	gap: 6rpx;
	padding: 14rpx 24rpx;
	border-radius: 999rpx;
	flex-shrink: 0;
}
.type-chip .type-icon {
	font-size: 24rpx;
	color: var(--clr-text-secondary);
}
.type-chip .type-label {
	font-size: 26rpx;
	font-weight: 600;
	color: var(--clr-text-secondary);
}
.type-chip.active {
	background: rgba(103, 80, 164, 0.15);
	border-color: var(--clr-accent);
}
.type-chip.active .type-icon,
.type-chip.active .type-label {
	color: var(--clr-accent);
	font-weight: 700;
}

/* ─── 骰子展示区 ─── */
.dice-display {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 24rpx 0;
	min-height: 300rpx;
}
.dice-grid {
	display: grid;
	gap: 24rpx;
	justify-items: center;
	align-items: center;
	width: 100%;
	max-width: 600rpx;
}

/* D6 3D 骰子 */
.dice-3d {
	position: relative;
	width: 110px;
	height: 110px;
	perspective: 900px;
}
.dice-cube {
	width: 110px;
	height: 110px;
	position: relative;
	transform-style: preserve-3d;
	-webkit-transform-style: preserve-3d;
	will-change: transform;
}
.dice-back {
	position: absolute;
	left: 50%; top: 50%;
	width: 56px; height: 56px;
	margin-left: -28px; margin-top: -28px;
	background: #E0E0E0;
	border-radius: 4px;
	transform: translateZ(0);
	z-index: 0;
}
.dice-face {
	position: absolute;
	width: 110px;
	height: 110px;
	border-radius: 16px;
	backface-visibility: hidden;
	-webkit-backface-visibility: hidden;
	background: #F5F5F7;
	box-shadow:
		inset 0 0 0 1px #E0E0E0,
		inset 0 1px 0 rgba(255, 255, 255, 1),
		inset 0 -1px 0 rgba(0, 0, 0, 0.05);
	transform-style: preserve-3d;
	z-index: 1;
}
.dice-dot {
	position: absolute;
	width: 12px;
	height: 12px;
	border-radius: 50%;
	background: var(--clr-text-primary);
	transform: translate(-50%, -50%);
}
.dice-shadow {
	position: absolute;
	bottom: -10px;
	left: 10%; right: 10%;
	height: 16px;
	background: radial-gradient(ellipse at center, rgba(0,0,0,0.30) 0%, transparent 100%);
	filter: blur(6px);
	z-index: -1;
}
.dice-flip-overlay {
	position: absolute;
	inset: 0;
	z-index: 10;
	display: flex;
	align-items: center;
	justify-content: center;
	pointer-events: none;
}
.dice-flip-num {
	font-size: 36px;
	font-weight: 900;
	color: var(--clr-text-primary);
	text-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* 多面骰 2D */
.dice-poly {
	position: relative;
	width: 120rpx;
	height: 120rpx;
	perspective: 800rpx;
}
.poly-face {
	width: 120rpx;
	height: 120rpx;
	background: var(--clr-surface);
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow:
		0 6rpx 0 rgba(0, 0, 0, 0.08),
		0 8rpx 0 rgba(0, 0, 0, 0.05),
		0 12rpx 24rpx rgba(0, 0, 0, 0.25),
		inset 0 2rpx 0 rgba(255, 255, 255, 0.8);
}
.poly-num {
	font-size: 40rpx;
	font-weight: 800;
	color: var(--clr-text-primary);
	line-height: 1;
}

@keyframes bounce-settle {
	0% { transform: translateY(0); }
	30% { transform: translateY(-18px); }
	60% { transform: translateY(0); }
	75% { transform: translateY(-6px); }
	100% { transform: translateY(0); }
}

/* ─── 结果统计栏 ─── */
.stats-bar {
	display: flex;
	align-items: center;
	justify-content: space-around;
	border-radius: 24rpx;
	padding: 20rpx 0;
	margin-bottom: 24rpx;
}
.stat-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 4rpx;
}
.stat-label {
	font-size: 22rpx;
	color: var(--clr-text-secondary);
	font-weight: 500;
}
.stat-value {
	font-size: 36rpx;
	font-weight: 800;
	color: var(--clr-text-primary);
	font-variant-numeric: tabular-nums;
}
.stat-value.sum {
	color: var(--clr-accent);
	font-size: 44rpx;
}
.stat-divider {
	width: 1px;
	height: 48rpx;
	background: var(--clr-border);
}

/* ─── 控制栏 ─── */
.control-bar {
	display: flex;
	align-items: center;
	gap: 24rpx;
	flex-shrink: 0;
}
.stepper {
	display: flex;
	align-items: center;
	gap: 16rpx;
	border-radius: 999rpx;
	padding: 8rpx 16rpx;
}
.step-btn {
	width: 56rpx;
	height: 56rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 32rpx;
	font-weight: 700;
	color: var(--clr-text-primary);
}
.step-btn:active { transform: scale(0.9); }
.step-num {
	font-size: 32rpx;
	font-weight: 800;
	color: var(--clr-text-primary);
	min-width: 48rpx;
	text-align: center;
	font-variant-numeric: tabular-nums;
}
.roll-btn {
	flex: 1;
	padding: 24rpx 0;
	border-radius: 999rpx;
	text-align: center;
}
.roll-btn.disabled {
	opacity: 0.5;
	pointer-events: none;
}
.roll-btn:active { transform: scale(0.96); }
.roll-text {
	font-size: 32rpx;
	font-weight: 700;
	color: #FFFFFF;
	letter-spacing: 4rpx;
}

/* ─── 历史抽屉 ─── */
.drawer-mask {
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.50);
	backdrop-filter: blur(8px);
	-webkit-backdrop-filter: blur(8px);
	z-index: 100;
	display: flex;
	align-items: flex-end;
	justify-content: center;
}
.drawer-panel {
	width: 100%;
	max-height: 70vh;
	background: var(--clr-bg-primary);
	border-radius: 32rpx 32rpx 0 0;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}
.drawer-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 32rpx 32rpx 16rpx;
}
.drawer-title {
	font-size: 32rpx;
	font-weight: 700;
	color: var(--clr-text-primary);
}
.drawer-clear {
	padding: 12rpx 24rpx;
	border-radius: 999rpx;
	border: 1px solid var(--clr-border);
}
.drawer-clear text {
	font-size: 24rpx;
	color: var(--clr-text-secondary);
	font-weight: 600;
}

/* 筛选栏 */
.filter-scroll {
	white-space: nowrap;
	flex-shrink: 0;
}
.filter-bar {
	display: inline-flex;
	gap: 12rpx;
	padding: 0 32rpx 16rpx;
}
.filter-chip {
	display: inline-flex;
	padding: 10rpx 20rpx;
	border-radius: 999rpx;
	border: 1px solid var(--clr-border);
	flex-shrink: 0;
}
.filter-chip text {
	font-size: 24rpx;
	color: var(--clr-text-secondary);
	font-weight: 500;
}
.filter-chip.active {
	background: var(--clr-accent);
	border-color: var(--clr-accent);
}
.filter-chip.active text {
	color: var(--clr-accent-on);
	font-weight: 700;
}

/* 历史列表 */
.history-list {
	flex: 1;
	padding: 0 32rpx 32rpx;
	max-height: 50vh;
}
.history-empty {
	text-align: center;
	padding: 80rpx 0;
}
.history-empty text {
	font-size: 28rpx;
	color: var(--clr-text-disabled);
}
.history-item {
	display: flex;
	align-items: center;
	padding: 20rpx 24rpx;
	border-radius: 16rpx;
	margin-bottom: 12rpx;
	gap: 16rpx;
}
.hi-left {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 2rpx;
	min-width: 64rpx;
}
.hi-type {
	font-size: 26rpx;
	font-weight: 700;
	color: var(--clr-accent);
}
.hi-count {
	font-size: 20rpx;
	color: var(--clr-text-secondary);
}
.hi-center {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 4rpx;
}
.hi-results {
	font-size: 26rpx;
	color: var(--clr-text-primary);
	font-weight: 600;
	font-variant-numeric: tabular-nums;
}
.hi-sum {
	font-size: 22rpx;
	color: var(--clr-text-secondary);
	font-weight: 500;
}
.hi-right {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 8rpx;
}
.hi-time {
	font-size: 20rpx;
	color: var(--clr-text-disabled);
}
.hi-del {
	width: 40rpx;
	height: 40rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
}
.hi-del text {
	font-size: 22rpx;
	color: var(--clr-text-disabled);
}
</style>
```

- [ ] **Step 2: 提交骰子主页面重写**

```bash
git add pages/dice/dice.vue
git commit -m "feat: rewrite dice page as unified multi-sided dice interface"
```

---

### Task 6: 删除旧子页面

**Files:**
- Delete: `pages/dice/free-mode.vue`
- Delete: `pages/dice/cup-mode.vue`

- [ ] **Step 1: 删除 free-mode.vue 和 cup-mode.vue**

```bash
git rm pages/dice/free-mode.vue pages/dice/cup-mode.vue
git commit -m "chore: remove legacy free-mode and cup-mode sub-pages"
```

---

### Task 7: 验证与修复

**Files:**
- All modified files

- [ ] **Step 1: 检查语法错误**

在 HBuilder X 中打开项目，检查以下文件是否有红色错误标记：
- `utils/dice-engine.js`
- `utils/dice-constants.js`
- `stores/dice.js`
- `composables/useDiceRoll.js`
- `pages/dice/dice.vue`

- [ ] **Step 2: 验证功能正常**

在 HBuilder X 中运行到 Android App 基座，验证：
1. 骰型选择器可正常切换 D4~D100
2. 数量调节 1-20 正常工作
3. 摇骰按钮触发骰子翻转动画
4. D6 显示 3D 立方体，其他骰型显示多边形
5. 结果统计栏正确显示总和/最大/最小
6. 历史抽屉可打开，记录正确保存
7. 摇一摇触发掷骰
8. 切换主题后界面正常

- [ ] **Step 3: 修复发现的问题**

根据验证结果修复任何问题，提交修复。

- [ ] **Step 4: 最终提交**

```bash
git add -A
git commit -m "feat: complete unified dice module with multi-sided dice support"
```
