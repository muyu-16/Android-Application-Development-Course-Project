# 骰子模块双模式重构实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有单文件 `dice.vue` 重构为支持「自由摇骰」+「大话骰遮罩」两种模式的单页双Tab应用，移除自定义模板/历史记录/社交分享等非必要功能。

**Architecture:** 
- `pages/dice/dice.vue` 作为主入口，顶部Tab切换两种模式
- 通用逻辑抽离为 `composables/`（useShake 摇一摇、useVibrate 震动反馈）
- 大话骰遮罩使用 `stores/dice.js` Pinia store 管理骰盅状态和持久化设置
- 保持 uni-app + Vue3 Composition API + uni.storage 技术栈

**Tech Stack:** Vue 3, uni-app, Pinia, uni.storage, CSS 3D Transform

---

## File Structure

| 文件 | 类型 | 职责 |
|------|------|------|
| `pages/dice/dice.vue` | Modify | 主入口，双Tab布局，引入两个子组件 |
| `pages/dice/free-mode.vue` | Create | 自由摇骰Tab内容（极简：1-6骰 + 摇骰 + 解锁） |
| `pages/dice/cup-mode.vue` | Create | 大话骰遮罩Tab内容（骰盅动画 + 长按掀开） |
| `composables/useShake.js` | Create | 加速度感应监听封装 |
| `composables/useVibrate.js` | Create | 震动反馈封装 |
| `stores/dice.js` | Create | 骰子设置持久化（骰子数量、震动开关、音效开关） |

---

## Task 1: 创建震动反馈 composable

**Files:**
- Create: `composables/useVibrate.js`

- [ ] **Step 1: 创建 useVibrate.js**

```javascript
// composables/useVibrate.js
// 统一震动反馈入口，兼容 uni-app 与 Web 环境
export function useVibrate() {
	const tap = () => {
		try {
			uni.vibrateShort?.({ type: 'light' })
		} catch (e) {
			// 静默失败
		}
	}

	const medium = () => {
		try {
			uni.vibrateShort?.({ type: 'medium' })
		} catch (e) {}
	}

	const long = () => {
		try {
			uni.vibrateLong?.()
		} catch (e) {}
	}

	return { tap, medium, long }
}
```

- [ ] **Step 2: 提交**

Run: `git add composables/useVibrate.js`
Commit: `feat(dice): add useVibrate composable`

---

## Task 2: 创建摇一摇 composable

**Files:**
- Create: `composables/useShake.js`

- [ ] **Step 1: 创建 useShake.js**

```javascript
// composables/useShake.js
// 加速度感应：检测摇一摇动作并触发回调
// 灵敏度：low(2.5) / medium(1.8) / high(1.2) 数字越小越灵敏
export function useShake(options = {}) {
	const { threshold = 1.8, cooldown = 800, onShake } = options

	let lastX = 0, lastY = 0, lastZ = 0
	let lastTime = 0
	let primed = false
	let handle = null

	const start = () => {
		uni.onAccelerometerChange?.(handler)
	}

	const stop = () => {
		uni.offAccelerometerChange?.(handler)
	}

	const handler = (e) => {
		const { x = 0, y = 0, z = 0 } = e || {}
		const now = Date.now()
		if (now - lastTime < cooldown) return

		if (!primed) {
			lastX = x; lastY = y; lastZ = z
			primed = true
			lastTime = now
			return
		}

		const delta = Math.abs(x - lastX) + Math.abs(y - lastY) + Math.abs(z - lastZ)
		if (delta > threshold) {
			primed = false
			lastTime = now
			onShake?.()
		}
		lastX = x; lastY = y; lastZ = z
	}

	return { start, stop }
}
```

- [ ] **Step 2: 提交**

Run: `git add composables/useShake.js`
Commit: `feat(dice): add useShake composable for accelerometer detection`

---

## Task 3: 创建骰子设置 store

**Files:**
- Create: `stores/dice.js`

- [ ] **Step 1: 创建 stores/dice.js**

```javascript
// stores/dice.js
// 骰子模块设置持久化：自由摇骰数量、大话骰数量、震动/音效开关
import { defineStore } from 'pinia'
import { ref } from 'vue'

const STORAGE_KEY = 'partyglass_dice'

function loadPersisted() {
	try {
		const raw = uni.getStorageSync(STORAGE_KEY)
		if (raw) return JSON.parse(raw)
	} catch (e) {}
	return null
}

export const useDiceStore = defineStore('dice', () => {
	const saved = loadPersisted() || {}

	// 自由摇骰：1-6，默认 1
	const freeCount = ref(saved.freeCount || 1)

	// 大话骰遮罩：3-6，默认 5
	const cupCount = ref(saved.cupCount || 5)

	// 反馈开关
	const vibrateEnabled = ref(saved.vibrateEnabled ?? true)
	const soundEnabled = ref(saved.soundEnabled ?? false)

	const persist = () => {
		try {
			uni.setStorageSync(STORAGE_KEY, JSON.stringify({
				freeCount: freeCount.value,
				cupCount: cupCount.value,
				vibrateEnabled: vibrateEnabled.value,
				soundEnabled: soundEnabled.value
			}))
		} catch (e) {}
	}

	const setFreeCount = (n) => {
		freeCount.value = Math.max(1, Math.min(6, n))
		persist()
	}

	const setCupCount = (n) => {
		cupCount.value = Math.max(3, Math.min(6, n))
		persist()
	}

	const toggleVibrate = () => {
		vibrateEnabled.value = !vibrateEnabled.value
		persist()
	}

	const toggleSound = () => {
		soundEnabled.value = !soundEnabled.value
		persist()
	}

	return {
		freeCount,
		cupCount,
		vibrateEnabled,
		soundEnabled,
		setFreeCount,
		setCupCount,
		toggleVibrate,
		toggleSound
	}
})
```

- [ ] **Step 2: 提交**

Run: `git add stores/dice.js`
Commit: `feat(dice): add dice settings store with persistence`

---

## Task 4: 创建自由摇骰子组件

**Files:**
- Create: `pages/dice/free-mode.vue`

- [ ] **Step 1: 创建 free-mode.vue**

```vue
<!-- pages/dice/free-mode.vue -->
<!-- 自由摇骰：1-6骰子，点击/摇一摇触发，结果锁定需手动解锁 -->
<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { useDiceStore } from '@/stores/dice'
import { useShake } from '@/composables/useShake'
import { useVibrate } from '@/composables/useVibrate'

const store = useDiceStore()
const vibrate = useVibrate()

// 骰子静态数据
const CUBE_FACES = [
	{ num: 1, transform: 'rotateY(0deg) translateZ(56px) scale(1.04)' },
	{ num: 2, transform: 'rotateX(90deg) translateZ(56px) scale(1.04)' },
	{ num: 3, transform: 'rotateY(-90deg) translateZ(56px) scale(1.04)' },
	{ num: 4, transform: 'rotateY(90deg) translateZ(56px) scale(1.04)' },
	{ num: 5, transform: 'rotateX(-90deg) translateZ(56px) scale(1.04)' },
	{ num: 6, transform: 'rotateX(180deg) translateZ(56px) scale(1.04)' }
]
const FACE_OFFSET = {
	1: { x: 0, y: 0 },
	2: { x: -90, y: 0 },
	3: { x: 0, y: 90 },
	4: { x: 0, y: -90 },
	5: { x: 90, y: 0 },
	6: { x: 180, y: 0 }
}
const DOTS = {
	1: [[0, 0]],
	2: [[-1, -1], [1, 1]],
	3: [[-1, -1], [0, 0], [1, 1]],
	4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
	5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
	6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]]
}

// 状态
const diceCount = computed(() => store.freeCount)
const values = ref([1])  // 当前点数
const rolling = ref(false)
const locked = ref(false)  // 锁定防误触
const rotX = ref([0])
const rotY = ref([0])
const trans = ref(['none'])
const flipping = ref([false])
const bouncing = ref([''])

// 同步 store.count 变化
const setCount = (n) => {
	if (rolling.value) return
	store.setFreeCount(n)
	values.value = Array(n).fill(1)
	resetAnimState(n)
	locked.value = false
}

const resetAnimState = (n) => {
	rotX.value = Array(n).fill(0)
	rotY.value = Array(n).fill(0)
	trans.value = Array(n).fill('none')
	flipping.value = Array(n).fill(false)
	bouncing.value = Array(n).fill('')
}

// 核心摇骰
const roll = () => {
	if (rolling.value || locked.value) return
	rolling.value = true
	if (store.vibrateEnabled) vibrate.medium()

	const results = []
	for (let i = 0; i < diceCount.value; i++) {
		results.push(Math.floor(Math.random() * 6) + 1)
	}

	for (let i = 0; i < diceCount.value; i++) {
		setTimeout(() => rollSingle(i, results[i]), i * 150)
	}

	const totalDuration = diceCount.value * 150 + 1100
	setTimeout(() => {
		rolling.value = false
		values.value = [...results]
		for (let i = 0; i < diceCount.value; i++) {
			flipping.value[i] = false
			bouncing.value[i] = ''
		}
		locked.value = true  // 摇完自动锁定
	}, totalDuration)
}

const rollSingle = (index, targetValue) => {
	trans.value[index] = 'none'
	rotX.value[index] = 0
	rotY.value[index] = 0
	flipping.value[index] = true
	bouncing.value[index] = ''

	const flipId = setInterval(() => {
		if (!flipping.value[index]) { clearInterval(flipId); return }
		const tmp = [...values.value]
		tmp[index] = Math.floor(Math.random() * 6) + 1
		values.value = tmp
	}, 80)

	setTimeout(() => clearInterval(flipId), 1500)

	const spins = 1 + Math.floor(Math.random() * 3)
	const offset = FACE_OFFSET[targetValue]
	const endX = spins * 360 + offset.x
	const endY = spins * 360 + offset.y
	const duration = 0.6 + Math.random() * 0.3
	trans.value[index] = 'transform ' + duration + 's cubic-bezier(0.05, 0.7, 0.1, 1.0)'
	rotX.value[index] = endX
	rotY.value[index] = endY
	setTimeout(() => bouncing.value[index] = 'bounce-settle 0.3s ease-out 0.05s both', 30)
	if (store.vibrateEnabled) vibrate.tap()
}

// 解锁
const unlock = () => {
	locked.value = false
	if (store.vibrateEnabled) vibrate.tap()
}

const totalSum = computed(() => values.value.reduce((s, v) => s + v, 0))

// 摇一摇
const { start: startShake, stop: stopShake } = useShake({ onShake: roll })
onMounted(() => startShake())
onBeforeUnmount(() => stopShake())
</script>

<template>
	<view class="free-mode">
		<!-- 骰子数量选择 -->
		<view class="count-bar">
			<view v-for="n in [1, 2, 3, 4, 5, 6]" :key="n"
				class="count-btn" :class="{ active: diceCount === n }"
				@tap="setCount(n)">
				<text>{{ n }}</text>
			</view>
		</view>

		<!-- 骰子展示区 -->
		<view class="dice-area">
			<view v-for="(val, idx) in values" :key="idx" class="dice"
				:style="{ zIndex: values.length - idx, marginTop: idx > 0 ? '20px' : '0', animation: bouncing[idx] }">
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
		</view>

		<!-- 总点数 + 操作 -->
		<view class="control-bar">
			<view class="sum-box">
				<text class="sum-label">总点数</text>
				<text class="sum-value">{{ totalSum }}</text>
			</view>
			<view v-if="locked" class="action-btn unlock" @tap="unlock">
				<text class="action-icon">🔒</text>
				<text class="action-text">解锁</text>
			</view>
			<view v-else class="action-btn roll" @tap="roll">
				<text class="action-icon">🎲</text>
				<text class="action-text">{{ rolling ? '摇动中...' : '摇骰' }}</text>
			</view>
		</view>
	</view>
</template>

<style scoped>
.free-mode {
	display: flex;
	flex-direction: column;
	height: 100%;
	padding: 16px;
}

/* ─── 数量选择 ─── */
.count-bar {
	display: flex;
	gap: 8px;
	background: rgba(30, 27, 35, 0.55);
	backdrop-filter: blur(14px) saturate(180%);
	-webkit-backdrop-filter: blur(14px) saturate(180%);
	border: 1px solid rgba(255, 255, 255, 0.10);
	border-radius: 999px;
	padding: 4px;
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08);
}
.count-btn {
	flex: 1;
	padding: 10px 0;
	text-align: center;
	border-radius: 999px;
	border: 1px solid transparent;
	transition: background 0.25s ease, transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1), border-color 0.25s;
}
.count-btn:active { transform: scale(0.94); }
.count-btn text {
	font-size: 16px;
	font-weight: 600;
	color: #CAC4D0;
}
.count-btn.active {
	background: rgba(208, 188, 255, 0.22);
	border: 1px solid rgba(208, 188, 255, 0.55);
	box-shadow: 0 2px 8px rgba(208, 188, 255, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.08);
}
.count-btn.active text {
	color: #F5EFF7;
	font-weight: 700;
}

/* ─── 骰子区 ─── */
.dice-area {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 20px 0;
}
.dice {
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
	background: #1C1B1F;
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
	color: #1C1B1F;
	text-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
@keyframes bounce-settle {
	0% { transform: translateY(0); }
	30% { transform: translateY(-18px); }
	60% { transform: translateY(0); }
	75% { transform: translateY(-6px); }
	100% { transform: translateY(0); }
}

/* ─── 控制区 ─── */
.control-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	padding: 0 8px;
}
.sum-box {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	background: rgba(30, 27, 35, 0.55);
	backdrop-filter: blur(14px) saturate(180%);
	-webkit-backdrop-filter: blur(14px) saturate(180%);
	border: 1px solid rgba(255, 255, 255, 0.10);
	border-radius: 16px;
	padding: 12px 20px;
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08);
}
.sum-label {
	font-size: 12px;
	color: #CAC4D0;
	font-weight: 500;
}
.sum-value {
	font-size: 28px;
	font-weight: 800;
	color: #F5EFF7;
	line-height: 1.1;
}
.action-btn {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 14px 24px;
	border-radius: 999px;
	transition: transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.action-btn:active { transform: scale(0.94); }
.action-btn.roll {
	background: rgba(208, 188, 255, 0.28);
	border: 1px solid rgba(208, 188, 255, 0.55);
	box-shadow: 0 4px 24px rgba(208, 188, 255, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2);
}
.action-btn.unlock {
	background: rgba(255, 255, 255, 0.10);
	border: 1px solid rgba(255, 255, 255, 0.20);
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08);
}
.action-icon { font-size: 22px; }
.action-text {
	font-size: 16px;
	font-weight: 700;
	color: #F5EFF7;
}
</style>
```

- [ ] **Step 2: 提交**

Run: `git add pages/dice/free-mode.vue`
Commit: `feat(dice): add free roll mode component`

---

## Task 5: 创建大话骰遮罩组件

**Files:**
- Create: `pages/dice/cup-mode.vue`

- [ ] **Step 1: 创建 cup-mode.vue**

```vue
<!-- pages/dice/cup-mode.vue -->
<!-- 大话骰遮罩：模拟实体骰盅，扣放状态不显示点数，长按掀开查看 -->
<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useDiceStore } from '@/stores/dice'
import { useShake } from '@/composables/useShake'
import { useVibrate } from '@/composables/useVibrate'

const store = useDiceStore()
const vibrate = useVibrate()

// 骰子数据
const CUBE_FACES = [
	{ num: 1, transform: 'rotateY(0deg) translateZ(40px) scale(1.04)' },
	{ num: 2, transform: 'rotateX(90deg) translateZ(40px) scale(1.04)' },
	{ num: 3, transform: 'rotateY(-90deg) translateZ(40px) scale(1.04)' },
	{ num: 4, transform: 'rotateY(90deg) translateZ(40px) scale(1.04)' },
	{ num: 5, transform: 'rotateX(-90deg) translateZ(40px) scale(1.04)' },
	{ num: 6, transform: 'rotateX(180deg) translateZ(40px) scale(1.04)' }
]
const DOTS = {
	1: [[0, 0]],
	2: [[-1, -1], [1, 1]],
	3: [[-1, -1], [0, 0], [1, 1]],
	4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
	5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
	6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]]
}

// 状态
const cupCount = computed(() => store.cupCount)
const values = ref(Array(cupCount.value).fill(1))  // 骰子点数（掀开后才可见）
const rolling = ref(false)        // 摇骰中
const revealing = ref(false)      // 长按掀开中
const cupLifted = ref(false)      // 骰盅抬起动画
const shakeAnim = ref(false)      // 晃动动画

// 骰盅设置面板
const showSettings = ref(false)
const draftCount = ref(cupCount.value)
const openSettings = () => {
	draftCount.value = store.cupCount
	showSettings.value = true
}
const closeSettings = () => { showSettings.value = false }
const confirmSettings = () => {
	store.setCupCount(draftCount.value)
	values.value = Array(draftCount.value).fill(1)
	closeSettings()
}

// 摇骰
const roll = () => {
	if (rolling.value || revealing.value) return
	rolling.value = true
	cupLifted.value = false
	shakeAnim.value = true
	if (store.vibrateEnabled) vibrate.medium()

	const results = []
	for (let i = 0; i < cupCount.value; i++) {
		results.push(Math.floor(Math.random() * 6) + 1)
	}

	// 晃动 1200ms 后停止，骰子落定
	setTimeout(() => {
		values.value = [...results]
		shakeAnim.value = false
		rolling.value = false
	}, 1200)
}

// 重摇：直接复位，无弹窗
const reset = () => {
	if (rolling.value) return
	cupLifted.value = false
	revealing.value = false
	values.value = Array(cupCount.value).fill(0)
	if (store.vibrateEnabled) vibrate.tap()
}

// 长按掀开
let pressTimer = null
const onPressStart = () => {
	if (rolling.value) return
	pressTimer = setTimeout(() => {
		cupLifted.value = true
		revealing.value = true
		if (store.vibrateEnabled) vibrate.medium()
	}, 250)
}
const onPressEnd = () => {
	clearTimeout(pressTimer)
	if (revealing.value) {
		setTimeout(() => {
			cupLifted.value = false
			revealing.value = false
		}, 100)
	}
}

// 摇一摇
const { start: startShake, stop: stopShake } = useShake({ onShake: roll })
onMounted(() => startShake())
onBeforeUnmount(() => stopShake())
</script>

<template>
	<view class="cup-mode">
		<!-- 顶部设置按钮 -->
		<view class="top-bar">
			<text class="title">大话骰遮罩</text>
			<view class="settings-btn" @tap="openSettings">
				<text>⚙️</text>
			</view>
		</view>

		<!-- 骰盅区域 -->
		<view class="cup-stage">
			<view class="cup-container" :class="{ shaking: shakeAnim }">
				<!-- 骰盅盖子（覆盖在骰子上） -->
				<view class="cup-lid" :class="{ lifted: cupLifted }">
					<view class="cup-handle"></view>
					<text class="cup-icon">🎲</text>
				</view>

				<!-- 骰子们 -->
				<view class="dice-row">
					<view v-for="(val, idx) in values" :key="idx" class="mini-dice"
						:style="{ marginLeft: idx > 0 ? '8px' : '0' }">
						<view class="mini-cube">
							<view v-for="(face, fi) in CUBE_FACES" :key="fi" class="mini-face"
								:style="{ transform: face.transform }">
								<view v-for="(pos, pi) in DOTS[face.num]" :key="pi" class="mini-dot"
									:style="{ left: 'calc(50% + ' + pos[0] * 10 + 'px)', top: 'calc(50% + ' + pos[1] * 10 + 'px)' }"></view>
							</view>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 操作区 -->
		<view class="action-bar">
			<view class="action-row">
				<view class="action-btn roll-btn" @tap="roll">
					<text class="action-icon">🎲</text>
					<text class="action-text">{{ rolling ? '摇动中...' : '摇骰' }}</text>
				</view>
				<view class="action-btn reset-btn" @tap="reset">
					<text class="action-icon">🔄</text>
					<text class="action-text">重摇</text>
				</view>
			</view>
			<view class="press-hint" v-if="!rolling && !revealing">
				<text>长按下方按钮查看点数</text>
			</view>
			<view class="reveal-btn" :class="{ active: revealing }"
				@touchstart="onPressStart" @touchend="onPressEnd" @touchcancel="onPressEnd">
				<text class="reveal-icon">👁</text>
				<text class="reveal-text">{{ revealing ? '查看中...' : '长按掀开' }}</text>
			</view>
		</view>

		<!-- 设置弹窗 -->
		<view v-if="showSettings" class="modal-mask" @tap="closeSettings">
			<view class="modal-panel" @tap.stop>
				<text class="modal-title">骰子数量</text>
				<text class="modal-desc">3 - 6 颗可调</text>
				<view class="count-picker">
					<view v-for="n in [3, 4, 5, 6]" :key="n"
						class="pick-btn" :class="{ active: draftCount === n }"
						@tap="draftCount = n">
						<text>{{ n }}</text>
					</view>
				</view>
				<view class="modal-actions">
					<view class="modal-btn primary" @tap="confirmSettings">
						<text>确认</text>
					</view>
					<view class="modal-btn secondary" @tap="closeSettings">
						<text>取消</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<style scoped>
.cup-mode {
	display: flex;
	flex-direction: column;
	height: 100%;
	padding: 16px;
}

/* ─── 顶部 ─── */
.top-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 12px;
}
.title {
	font-size: 18px;
	font-weight: 700;
	color: #F5EFF7;
}
.settings-btn {
	width: 36px;
	height: 36px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(30, 27, 35, 0.55);
	backdrop-filter: blur(14px) saturate(180%);
	-webkit-backdrop-filter: blur(14px) saturate(180%);
	border: 1px solid rgba(255, 255, 255, 0.10);
	border-radius: 50%;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08);
}
.settings-btn:active { transform: scale(0.92); }
.settings-btn text { font-size: 18px; }

/* ─── 骰盅舞台 ─── */
.cup-stage {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 20px 0;
}
.cup-container {
	position: relative;
	width: 280px;
	height: 280px;
	background: rgba(30, 27, 35, 0.55);
	backdrop-filter: blur(14px) saturate(180%);
	-webkit-backdrop-filter: blur(14px) saturate(180%);
	border: 1px solid rgba(255, 255, 255, 0.10);
	border-radius: 24px;
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.08);
	display: flex;
	align-items: center;
	justify-content: center;
	perspective: 800px;
	transition: transform 0.1s ease;
}
.cup-container.shaking {
	animation: cup-shake 0.1s linear infinite;
}
@keyframes cup-shake {
	0% { transform: translate(0, 0) rotate(0deg); }
	25% { transform: translate(-3px, 2px) rotate(-1deg); }
	50% { transform: translate(3px, -2px) rotate(1deg); }
	75% { transform: translate(-2px, 3px) rotate(-0.5deg); }
	100% { transform: translate(0, 0) rotate(0deg); }
}

/* ─── 骰盅盖子 ─── */
.cup-lid {
	position: absolute;
	inset: 8px;
	background: linear-gradient(135deg, #2D1B69 0%, #1E1B3A 100%);
	border: 2px solid rgba(208, 188, 255, 0.55);
	border-radius: 20px;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-direction: column;
	gap: 12px;
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.55), inset 0 2px 0 rgba(255, 255, 255, 0.15);
	transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.4s;
	z-index: 10;
	transform-origin: bottom center;
}
.cup-lid.lifted {
	transform: translateY(-140px) rotateX(20deg);
	opacity: 0.95;
}
.cup-handle {
	width: 50px;
	height: 8px;
	background: linear-gradient(to bottom, #6B5B95, #4A3F6B);
	border-radius: 4px;
	box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.3);
}
.cup-icon {
	font-size: 80px;
	filter: drop-shadow(0 4px 12px rgba(208, 188, 255, 0.5));
}

/* ─── 骰子们 ─── */
.dice-row {
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
	z-index: 1;
}
.mini-dice {
	width: 80px;
	height: 80px;
	perspective: 800px;
}
.mini-cube {
	width: 80px;
	height: 80px;
	position: relative;
	transform-style: preserve-3d;
	-webkit-transform-style: preserve-3d;
}
.mini-face {
	position: absolute;
	width: 80px;
	height: 80px;
	border-radius: 12px;
	backface-visibility: hidden;
	-webkit-backface-visibility: hidden;
	background: #F5F5F7;
	box-shadow:
		inset 0 0 0 1px #E0E0E0,
		inset 0 1px 0 rgba(255, 255, 255, 1);
	transform-style: preserve-3d;
}
.mini-dot {
	position: absolute;
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: #1C1B1F;
	transform: translate(-50%, -50%);
}

/* ─── 操作区 ─── */
.action-bar {
	padding: 0 8px;
}
.action-row {
	display: flex;
	gap: 12px;
	margin-bottom: 16px;
}
.action-btn {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	padding: 14px 16px;
	border-radius: 999px;
	transition: transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.action-btn:active { transform: scale(0.94); }
.roll-btn {
	background: rgba(208, 188, 255, 0.28);
	border: 1px solid rgba(208, 188, 255, 0.55);
	box-shadow: 0 4px 24px rgba(208, 188, 255, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2);
}
.reset-btn {
	background: rgba(255, 255, 255, 0.10);
	border: 1px solid rgba(255, 255, 255, 0.20);
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08);
}
.action-icon { font-size: 20px; }
.action-text {
	font-size: 15px;
	font-weight: 700;
	color: #F5EFF7;
}

.press-hint {
	text-align: center;
	font-size: 12px;
	color: #CAC4D0;
	margin-bottom: 8px;
}
.reveal-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	padding: 18px 24px;
	background: rgba(255, 255, 255, 0.10);
	border: 1px solid rgba(255, 255, 255, 0.20);
	border-radius: 999px;
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08);
	transition: background 0.2s, transform 0.15s;
}
.reveal-btn.active {
	background: rgba(208, 188, 255, 0.35);
	border: 1px solid rgba(208, 188, 255, 0.65);
	transform: scale(0.96);
}
.reveal-icon { font-size: 20px; }
.reveal-text {
	font-size: 15px;
	font-weight: 700;
	color: #F5EFF7;
}

/* ─── 设置弹窗 ─── */
.modal-mask {
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.45);
	backdrop-filter: blur(8px);
	-webkit-backdrop-filter: blur(8px);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 100;
}
.modal-panel {
	width: 300px;
	background: rgba(30, 27, 35, 0.85);
	backdrop-filter: blur(24px) saturate(180%);
	-webkit-backdrop-filter: blur(24px) saturate(180%);
	border: 1px solid rgba(255, 255, 255, 0.12);
	border-radius: 24px;
	padding: 24px;
	display: flex;
	flex-direction: column;
	gap: 16px;
	box-shadow: 0 8px 32px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.12);
}
.modal-title {
	font-size: 18px;
	font-weight: 700;
	color: #F5EFF7;
	text-align: center;
}
.modal-desc {
	font-size: 13px;
	color: #CAC4D0;
	text-align: center;
}
.count-picker {
	display: flex;
	gap: 8px;
}
.pick-btn {
	flex: 1;
	padding: 12px 0;
	text-align: center;
	border-radius: 999px;
	background: rgba(255, 255, 255, 0.06);
	border: 1px solid transparent;
}
.pick-btn text {
	font-size: 16px;
	font-weight: 600;
	color: #CAC4D0;
}
.pick-btn.active {
	background: rgba(208, 188, 255, 0.28);
	border: 1px solid rgba(208, 188, 255, 0.55);
}
.pick-btn.active text { color: #F5EFF7; }
.modal-actions {
	display: flex;
	gap: 8px;
}
.modal-btn {
	flex: 1;
	padding: 12px;
	border-radius: 999px;
	text-align: center;
}
.modal-btn text {
	font-size: 14px;
	font-weight: 700;
}
.modal-btn.primary {
	background: rgba(208, 188, 255, 0.28);
	border: 1px solid rgba(208, 188, 255, 0.55);
}
.modal-btn.primary text { color: #F5EFF7; }
.modal-btn.secondary {
	background: rgba(255, 255, 255, 0.06);
}
.modal-btn.secondary text { color: #CAC4D0; }
</style>
```

- [ ] **Step 2: 提交**

Run: `git add pages/dice/cup-mode.vue`
Commit: `feat(dice): add cup mode component with shake and reveal`

---

## Task 6: 重构 dice.vue 主入口

**Files:**
- Modify: `pages/dice/dice.vue` (完全重写为双Tab架构)

- [ ] **Step 1: 重写 dice.vue**

```vue
<!-- pages/dice/dice.vue -->
<!-- 骰子模块主入口：双Tab切换自由摇骰 / 大话骰遮罩 -->
<script setup>
import { ref } from 'vue'
import FreeMode from './free-mode.vue'
import CupMode from './cup-mode.vue'

const activeTab = ref('free')  // 'free' | 'cup'
</script>

<template>
	<view class="container">
		<!-- 顶部导航栏 -->
		<view class="nav-bar">
			<view class="nav-left">
				<text class="material-icons nav-back" @tap="uni.navigateBack()">←</text>
				<text class="nav-title">骰子</text>
			</view>
		</view>

		<!-- Tab 切换 -->
		<view class="tab-bar">
			<view class="tab" :class="{ active: activeTab === 'free' }" @tap="activeTab = 'free'">
				<text class="tab-icon">🎲</text>
				<text class="tab-text">自由摇骰</text>
			</view>
			<view class="tab" :class="{ active: activeTab === 'cup' }" @tap="activeTab = 'cup'">
				<text class="tab-icon">🎭</text>
				<text class="tab-text">大话骰遮罩</text>
			</view>
		</view>

		<!-- 内容区 -->
		<view class="content">
			<FreeMode v-if="activeTab === 'free'" />
			<CupMode v-else />
		</view>
	</view>
</template>

<style scoped>
.container {
	min-height: 100vh;
	background: #1a1a2e;
	padding: 16px;
	padding-top: calc(var(--safe-area-top, 24px) + 20px);
	padding-bottom: calc(var(--safe-area-bottom, 0px) + 24px);
	display: flex;
	flex-direction: column;
}

.nav-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding-top: 12px;
	margin-bottom: 20px;
}
.nav-left {
	display: flex;
	align-items: center;
	gap: 12px;
}
.nav-back {
	font-size: 22px;
	color: #F5EFF7;
	padding: 4px;
}
.nav-title {
	font-size: 22px;
	font-weight: 700;
	color: #F5EFF7;
}

.tab-bar {
	display: flex;
	background: rgba(30, 27, 35, 0.55);
	backdrop-filter: blur(14px) saturate(180%);
	-webkit-backdrop-filter: blur(14px) saturate(180%);
	border: 1px solid rgba(255, 255, 255, 0.10);
	border-radius: 999px;
	padding: 4px;
	gap: 4px;
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08);
	margin-bottom: 16px;
}
.tab {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	padding: 10px 0;
	border-radius: 999px;
	border: 1px solid transparent;
	transition: background 0.25s ease, transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.tab:active { transform: scale(0.96); }
.tab-icon { font-size: 18px; }
.tab-text {
	font-size: 14px;
	font-weight: 600;
	color: #CAC4D0;
	transition: color 0.25s;
}
.tab.active {
	background: rgba(208, 188, 255, 0.22);
	border: 1px solid rgba(208, 188, 255, 0.55);
	box-shadow: 0 2px 8px rgba(208, 188, 255, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.08);
}
.tab.active .tab-text {
	color: #F5EFF7;
	font-weight: 700;
}

.content {
	flex: 1;
	overflow: hidden;
}
</style>
```

- [ ] **Step 2: 提交**

Run: `git add pages/dice/dice.vue`
Commit: `refactor(dice): rewrite dice.vue as dual-tab entry with free/cup modes`

---

## Task 7: 验证 & 构建测试

- [ ] **Step 1: 语法检查**

在 HBuilder X 中打开项目，查看 `pages/dice/dice.vue` 等文件无编译错误。

- [ ] **Step 2: 手动测试清单**

在 HBuilder X 中运行到 Android 基座，验证：
- [ ] 顶部Tab能正常切换
- [ ] 自由摇骰：1-6数量选择正常
- [ ] 自由摇骰：点击按钮触发摇骰动画
- [ ] 自由摇骰：摇一摇触发摇骰动画
- [ ] 自由摇骰：结果自动锁定，需点击解锁
- [ ] 自由摇骰：总点数正确显示
- [ ] 大话骰：默认5骰
- [ ] 大话骰：设置弹窗可调整3-6
- [ ] 大话骰：骰盅扣放状态不显示点数
- [ ] 大话骰：摇骰晃动动画
- [ ] 大话骰：长按掀开显示点数
- [ ] 大话骰：松开后自动合盖
- [ ] 大话骰：重摇无弹窗
- [ ] 震动反馈正常

- [ ] **Step 3: 提交**

Run: `git add -A`
Commit: `chore(dice): verification pass complete`

---

## Self-Review Checklist

**1. Spec coverage:**
- ✅ 1-6 骰子数量选择 → free-mode `count-bar` (Task 4)
- ✅ 点击摇骰按钮 → free-mode `roll()` (Task 4)
- ✅ 摇一摇触发 → useShake composable (Task 2)
- ✅ 点数 + 总点数 → free-mode `totalSum` (Task 4)
- ✅ 锁定机制 → free-mode `locked` 状态 (Task 4)
- ✅ 解锁按钮 → free-mode `unlock()` (Task 4)
- ✅ 大话骰默认5骰 → store `cupCount` 默认5 (Task 3)
- ✅ 3-6可调 → store `setCupCount` (Task 3)
- ✅ 扣放状态不显示点数 → cup-mode `cupLifted` + 盖子 (Task 5)
- ✅ 双触发摇骰 → cup-mode `roll()` + useShake (Task 5)
- ✅ 长按掀开防误触 → cup-mode 250ms延迟 (Task 5)
- ✅ 重摇无弹窗 → cup-mode `reset()` (Task 5)
- ✅ 移除自定义模板/历史/分享 → 完全重写，无相关代码
- ✅ 物理动效 + 震动 → useVibrate (Task 1)

**2. Placeholder scan:** 无 TBD/TODO/占位符

**3. Type consistency:** 
- `useDiceStore()` 暴露 `freeCount`, `cupCount`, `vibrateEnabled`, `setFreeCount`, `setCupCount` 一致使用
- `useShake` 暴露 `start`, `stop`
- `useVibrate` 暴露 `tap`, `medium`, `long`

---

**Plan complete and saved to `docs/superpowers/plans/2026-06-18-dice-dual-mode.md`.**

执行方式选择：
1. **Subagent-Driven** (推荐) - 我为每个任务派遣独立的subagent执行，任务间审查
2. **Inline Execution** - 在当前会话中按任务顺序执行，带检查点

请选择执行方式？
