<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { gsap } from 'gsap'

// ══════ 骰子配置 ══════
const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']
const DOTS = {
	1: [[0,0]],
	2: [[-1,-1],[1,1]],
	3: [[-1,-1],[0,0],[1,1]],
	4: [[-1,-1],[1,-1],[-1,1],[1,1]],
	5: [[-1,-1],[1,-1],[0,0],[-1,1],[1,1]],
	6: [[-1,-1],[1,-1],[-1,0],[1,0],[-1,1],[1,1]]
}
const MAX_HISTORY = 20

// ══════ 状态 ══════
const diceCount = ref(1)
const diceValues = ref([1])
const diceStyle = ref('frosted')
const isRolling = ref(false)
const history = ref([])
const showCoach = ref(false)
const tiltX = ref(0)
const tiltY = ref(0)

// GSAP context — 用于组件销毁时清理
let gsapCtx = null
const diceRefs = ref([])

function setDiceRef(el, idx) {
	if (el) diceRefs.value[idx] = el.$el || el
}

// 摇一摇
let lastX = 0, lastY = 0, lastZ = 0
let shakeTimer = null

// ─── 骰子滚动（GSAP 拟真翻动） ───
const ROLL_HEIGHTS = [50, 65, 45]  // 不同弹跳高度 px
const BOUNCE_DAMP = [0.6, 0.35, 0.15] // 弹跳衰减

function rollDice() {
	if (isRolling.value) return
	isRolling.value = true

	uni.vibrateShort?.({ type: 'medium' })

	const newValues = []
	for (let i = 0; i < diceCount.value; i++) {
		newValues.push(Math.floor(Math.random() * 6) + 1)
	}

	const els = diceRefs.value.slice(0, diceCount.value)
	if (!els.length) {
		finishRoll(newValues)
		return
	}

	// 每个骰子独立 GSAP 动画，依次延迟
	els.forEach((el, idx) => {
		gsap.set(el, { clearProps: 'transform' })

		// 视觉翻面：滚动过程中快速切换显示值
		const flipInterval = setInterval(() => {
			if (isRolling.value) {
				diceValues.value[idx] = Math.floor(Math.random() * 6) + 1
			}
		}, 80)

		const tl = gsap.timeline({
			delay: idx * 0.15,
			defaults: { ease: 'power2.inOut', overwrite: 'auto' },
			onComplete: () => {
				clearInterval(flipInterval)
				// 最终值 + 弹性归位
				diceValues.value[idx] = newValues[idx]
				gsap.to(el, {
					scale: 1,
					rotation: 0,
					rotationX: 0,
					rotationY: 0,
					y: 0,
					duration: 0.6,
					ease: 'elastic.out(1.2, 0.25)',
					clearProps: 'transform'
				})
			}
		})

		// Step 1: 抓起 — 向上提起 + 缩小蓄力
		tl.to(el, {
			y: -12,
			scale: 0.82,
			rotation: -5,
			duration: 0.1,
			ease: 'power1.out'
		}, 0)

		// Step 2: 抛向空中 — 急速上升 + 开始3D翻转
		tl.to(el, {
			y: -ROLL_HEIGHTS[0] * 1.2,
			scale: 0.7,
			rotation: 180,
			rotationX: 360,
			rotationY: 180,
			duration: 0.25,
			ease: 'power3.out'
		})

		// Step 3: 空中顶点 — 旋转继续，速度减慢（势能转动能）
		tl.to(el, {
			rotation: 540,
			rotationX: 720,
			rotationY: 540,
			scale: 0.65,
			duration: 0.2,
			ease: 'none'
		})

		// Step 4: 第一次落地 — 快速下落 + 触地弹起
		tl.to(el, {
			y: -ROLL_HEIGHTS[1],
			rotation: 720,
			rotationX: 1080,
			rotationY: 900,
			scale: BOUNCE_DAMP[0] + 0.3,
			duration: 0.18,
			ease: 'power2.in'
		})

		// Step 5: 第一次弹跳 — 弹起 + 旋转减速
		tl.to(el, {
			y: -ROLL_HEIGHTS[2],
			rotation: 810,
			rotationX: 1170,
			rotationY: 990,
			scale: BOUNCE_DAMP[0],
			duration: 0.12,
			ease: 'power2.out'
		})

		// Step 6: 第二次触地 — 更小弹跳
		tl.to(el, {
			y: -6,
			rotation: 855,
			rotationX: 1215,
			rotationY: 1035,
			scale: BOUNCE_DAMP[1] + 0.15,
			duration: 0.1,
			ease: 'power2.in'
		})

		// Step 7: 第二次弹跳 — 微弹
		tl.to(el, {
			y: -3,
			rotation: 873,
			rotationX: 1233,
			rotationY: 1047,
			scale: BOUNCE_DAMP[1],
			duration: 0.08,
			ease: 'power2.out'
		})

		// Step 8: 第三次触地 — 几乎静止
		tl.to(el, {
			y: 0,
			rotation: 882,
			rotationX: 1242,
			rotationY: 1056,
			scale: BOUNCE_DAMP[2] + 0.08,
			duration: 0.06,
			ease: 'power1.in'
		})

		// Step 9: 小弹 + 前倾
		tl.to(el, {
			y: -1,
			rotation: 888,
			rotationX: 1248,
			rotationY: 1062,
			scale: BOUNCE_DAMP[2],
			duration: 0.05,
			ease: 'power1.out'
		})

		// Step 10: 最后晃动 — 到正位 + 轻微超调
		tl.to(el, {
			y: 0,
			rotation: 900,
			rotationX: 1260,
			rotationY: 1080,
			scale: 1.03,
			duration: 0.06,
			ease: 'power2.in'
		})
	})

	// 总时长 = 最后骰子延迟 + 动画时长
	const totalDuration = (els.length - 1) * 0.15 + 1.35
	setTimeout(() => finishRoll(newValues), totalDuration * 1000)
}

function finishRoll(values) {
	diceValues.value = values
	isRolling.value = false

	const entry = {
		id: Date.now(),
		values: [...values],
		time: new Date().toLocaleTimeString()
	}
	history.value.unshift(entry)
	if (history.value.length > MAX_HISTORY) history.value.pop()
}

// ══════ 摇一摇检测 ══════
function onShake(e) {
	if (isRolling.value) return
	const { x, y, z } = e
	if (!lastX && !lastY && !lastZ) {
		if (!shakeTimer) {
			lastX = x; lastY = y; lastZ = z
			shakeTimer = setTimeout(() => { shakeTimer = null }, 300)
			return
		}
	}
	const delta = Math.abs(x - lastX) + Math.abs(y - lastY) + Math.abs(z - lastZ)
	if (delta > 1.5) {
		rollDice()
	}
	lastX = x; lastY = y; lastZ = z
}

// ─── 长按倾斜 ───
let containerTilt = null
function onTouchStart(e) {
	if (containerTilt) return
	const touch = e.touches[0]
	containerTilt = { startX: touch.clientX, startY: touch.clientY }
}
function onTouchMove(e) {
	if (!containerTilt) return
	const touch = e.touches[0]
	const dx = touch.clientX - containerTilt.startX
	const dy = touch.clientY - containerTilt.startY
	tiltX.value = Math.max(-15, Math.min(15, dy / 8))
	tiltY.value = Math.max(-15, Math.min(15, -dx / 8))
}
function onTouchEnd() {
	containerTilt = null
	tiltX.value = 0
	tiltY.value = 0
}

// ─── 骰子数切换 ───
function setCount(n) {
	if (isRolling.value) return
	diceCount.value = n
	diceValues.value = Array(n).fill(1)
}

// ─── 样式切换 ───
function nextStyle() {
	const styles = ['transparent', 'frosted', 'frosted-black']
	const idx = (styles.indexOf(diceStyle.value) + 1) % styles.length
	diceStyle.value = styles[idx]
}

// ─── 教练引导 ───
function dismissCoach() {
	showCoach.value = false
	uni.setStorageSync('coach_dismissed', true)
}

onMounted(() => {
	uni.onAccelerometerChange?.(onShake)
	if (!uni.getStorageSync('coach_dismissed')) {
		showCoach.value = true
	}
})

onUnmounted(() => {
	uni.offAccelerometerChange?.(onShake)
	if (gsapCtx) gsapCtx.revert()
})
</script>

<template>
	<view
		class="container"
		:style="{ transform: `perspective(600px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)` }"
		@touchstart="onTouchStart"
		@touchmove="onTouchMove"
		@touchend="onTouchEnd"
	>
		<!-- ══════ 导航栏 ══════ -->
		<view class="nav-bar">
			<view class="nav-left">
				<text class="material-icons nav-back" @tap="uni.navigateBack()">arrow_back</text>
				<text class="nav-title">骰子</text>
			</view>
			<view class="nav-right">
				<view class="seg-control">
					<view
						v-for="n in [1,2,3]"
						:key="n"
						class="seg-item"
						:class="{ active: diceCount === n }"
						@tap="setCount(n)"
					>
						<text>{{ n }}</text>
					</view>
				</view>
				<view class="style-btn" @tap="nextStyle">
					<text class="material-icons">palette</text>
				</view>
			</view>
		</view>

		<!-- ══════ 骰子区 ══════ -->
		<view
			class="dice-area"
			:style="{ transform: tiltX !== 0 ? 'perspective(600px)' : '' }"
		>
			<view
				v-for="(val, idx) in diceValues"
				:key="idx"
				:ref="(el) => setDiceRef(el, idx)"
				class="dice"
				:class="[
					diceStyle === 'transparent' ? 'dice-transparent' : '',
					diceStyle === 'frosted' ? 'dice-frosted' : '',
					diceStyle === 'frosted-black' ? 'dice-frosted-black' : ''
				]"
				:style="{
					zIndex: diceValues.length - idx,
					marginTop: idx > 0 ? '20px' : '0'
				}"
				@tap="rollDice"
			>
				<view v-for="(pos, pi) in DOTS[val]" :key="pi"
					class="dice-dot"
					:style="{
						left: `calc(50% + ${pos[0]} * 18px)`,
						top: `calc(50% + ${pos[1]} * 18px)`
					}"
				></view>
				<view class="dice-reflection"></view>
			</view>
		</view>

		<!-- ══════ 历史记录 ══════ -->
		<view class="history-wrap" v-if="history.length > 0">
			<view class="history-hint">
				<text class="history-hint-text">投掷记录</text>
			</view>
			<scroll-view class="history-scroll" scroll-x>
				<view
					v-for="(h, i) in history"
					:key="h.id"
					class="history-chip"
					:class="{ faded: i >= 5 }"
				>
					<text class="material-icons history-icon">casino</text>
					<text class="history-text">{{ h.values.join(',') }}</text>
				</view>
			</scroll-view>
		</view>

		<!-- ══════ 教练引导 ══════ -->
		<view class="coach-mask" v-if="showCoach" @tap="dismissCoach">
			<view class="coach-content">
				<view class="coach-arrow"></view>
				<view class="coach-bubble">
					<text class="coach-title">点击骰子开始</text>
					<text class="coach-desc">摇动手机也能触发哦~</text>
					<view class="coach-btn" @tap.stop="dismissCoach">
						<text>知道了</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<style scoped>
/* ══════ 容器 ══════ */
.container {
	min-height: 100vh;
	background: #141218;
	padding: 16px;
	padding-top: calc(var(--safe-area-top) + 12px);
	padding-bottom: calc(var(--safe-area-bottom) + 24px);
	display: flex;
	flex-direction: column;
	transition: transform 0.05s;
}

/* ══════ 导航栏 ══════ */
.nav-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 24px;
}
.nav-left { display: flex; align-items: center; gap: 12px; }
.nav-back {
	font-size: 22px;
	color: var(--clr-text-primary);
	padding: 4px;
}
.nav-title {
	font-size: 22px;
	font-weight: 700;
	color: var(--clr-text-primary);
}
.nav-right { display: flex; align-items: center; gap: 8px; }

.seg-control {
	display: flex;
	background: rgba(255,255,255,0.08);
	border-radius: 20px;
	padding: 3px;
	gap: 2px;
}
.seg-item {
	width: 36px;
	padding: 6px 0;
	text-align: center;
	border-radius: 999px;
	transition: all 0.25s;
}
.seg-item text {
	font-size: 14px;
	font-weight: 600;
	color: var(--clr-text-secondary);
}
.seg-item.active {
	background: var(--clr-bg-secondary);
}
.seg-item.active text {
	color: var(--clr-text-primary);
}

.style-btn {
	width: 36px;
	height: 36px;
	border-radius: 50%;
	background: rgba(255,255,255,0.08);
	display: flex;
	align-items: center;
	justify-content: center;
}
.style-btn .material-icons {
	font-size: 18px;
	color: var(--clr-text-secondary);
}

/* ══════ 骰子区 ══════ */
.dice-area {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 0;
	padding: 24px 0;
}

.dice {
	position: relative;
	width: 110px;
	height: 110px;
	border-radius: 24px;
	cursor: pointer;
	will-change: transform;
}

/* 透明样式 */
.dice-transparent {
	background: linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.05));
	border: 1px solid rgba(255,255,255,0.15);
	backdrop-filter: blur(8px);
}

/* 磨砂样式 */
.dice-frosted {
	background: linear-gradient(135deg, rgba(255,255,255,0.4), rgba(255,255,255,0.1));
	backdrop-filter: blur(8px);
	border: 1px solid rgba(255,255,255,0.3);
	box-shadow: inset 0 1px 0 rgba(255,255,255,0.5), 0 8px 24px rgba(0,0,0,0.1);
}

/* 磨砂黑样式 */
.dice-frosted-black {
	background: linear-gradient(135deg, rgba(0,0,0,0.35), rgba(0,0,0,0.15));
	backdrop-filter: blur(8px);
	border: 1px solid rgba(255,255,255,0.1);
	box-shadow: inset 0 1px 0 rgba(255,255,255,0.15), 0 8px 24px rgba(0,0,0,0.3);
}

.dice-dot {
	position: absolute;
	width: 5px;
	height: 5px;
	border-radius: 50%;
	background: var(--clr-text-primary);
	box-shadow: inset 0 1px 2px rgba(0,0,0,0.3);
	transform: translate(-50%, -50%);
}

.dice-transparent .dice-dot {
	background: var(--clr-text-primary);
}

.dice-frosted-black .dice-dot {
	background: rgba(255,255,255,0.85);
}

.dice-reflection {
	position: absolute;
	bottom: -2px;
	left: 10%;
	right: 10%;
	height: 30px;
	background: linear-gradient(to top, rgba(0,0,0,0.15), transparent);
	transform: scaleY(-1);
	mask-image: linear-gradient(to top, rgba(0,0,0,0.4), transparent);
	-webkit-mask-image: linear-gradient(to top, rgba(0,0,0,0.4), transparent);
	pointer-events: none;
}

/* ══════ 历史记录 ══════ */
.history-wrap {
	margin-top: 8px;
}
.history-hint {
	margin-bottom: 8px;
}
.history-hint-text {
	font-size: 12px;
	color: var(--clr-text-secondary);
	font-weight: 600;
}
.history-scroll {
	display: flex;
	flex-direction: row;
	white-space: nowrap;
	overflow-x: auto;
}
.history-chip {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	background: rgba(255,255,255,0.08);
	border-radius: 999px;
	padding: 6px 14px;
	margin-right: 8px;
	transition: opacity 0.3s;
}
.history-chip.faded { opacity: 0.3; }
.history-icon { font-size: 14px; }
.history-text {
	font-size: 12px;
	font-weight: 600;
	color: var(--clr-text-primary);
}

/* ══════ 教练引导 ══════ */
.coach-mask {
	position: fixed;
	inset: 0;
	background: rgba(0,0,0,0.3);
	z-index: 100;
	display: flex;
	align-items: flex-end;
	justify-content: center;
	padding-bottom: 120px;
}
.coach-content {
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
}
.coach-arrow {
	width: 0; height: 0;
	border-left: 10px solid transparent;
	border-right: 10px solid transparent;
	border-bottom: 10px solid rgba(255,255,255,0.12);
}
.coach-bubble {
	background: rgba(255,255,255,0.12);
	backdrop-filter: blur(24px);
	-webkit-backdrop-filter: blur(24px);
	border: 1px solid rgba(255,255,255,0.15);
	border-radius: 16px;
	padding: 16px 24px;
	text-align: center;
}
.coach-title {
	font-size: 16px;
	font-weight: 700;
	color: var(--clr-text-primary);
	display: block;
	margin-bottom: 4px;
}
.coach-desc {
	font-size: 13px;
	color: var(--clr-text-secondary);
	display: block;
	margin-bottom: 8px;
}
.coach-btn {
	padding: 8px 20px;
	border-radius: 999px;
	background: var(--clr-accent);
	display: inline-block;
}
.coach-btn text {
	font-size: 14px;
	font-weight: 600;
	color: var(--clr-accent-on);
}
</style>