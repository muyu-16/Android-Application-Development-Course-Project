<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { gsap } from 'gsap'

// ══════ 骰子配置 ══════
// 标准骰子：对面点数之和 = 7
const CUBE_FACES = [
  { num: 1, transform: 'translateZ(55px)' },
  { num: 6, transform: 'rotateY(180deg) translateZ(55px)' },
  { num: 2, transform: 'rotateY(90deg) translateZ(55px)' },
  { num: 5, transform: 'rotateY(-90deg) translateZ(55px)' },
  { num: 3, transform: 'rotateX(-90deg) translateZ(55px)' },
  { num: 4, transform: 'rotateX(90deg) translateZ(55px)' }
]

// 每个点数对应的终止旋转角（让该面朝前）
const FACE_FINAL = {
  1: { x: 0, y: 0 },
  2: { x: 0, y: -90 },
  3: { x: -90, y: 0 },
  4: { x: 90, y: 0 },
  5: { x: 0, y: 90 },
  6: { x: 180, y: 0 }
}

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

// 两层引用：外框（y/scale弹跳） + 内立方体（旋转）
const diceRefs = ref([])
const cubeRefs = ref([])

function setDiceRef(el, idx) {
	if (el) diceRefs.value[idx] = el.$el || el
}
function setCubeRef(el, idx) {
	if (el) cubeRefs.value[idx] = el.$el || el
}

// 摇一摇
let lastX = 0, lastY = 0, lastZ = 0
let shakeTimer = null

// ─── 骰子滚动（两层分离：外框弹跳 + 内立方体单段平滑旋转） ───
function rollDice() {
	if (isRolling.value) return
	isRolling.value = true

	uni.vibrateShort?.({ type: 'medium' })

	const newValues = []
	for (let i = 0; i < diceCount.value; i++) {
		newValues.push(Math.floor(Math.random() * 6) + 1)
	}

	const cubes = cubeRefs.value.slice(0, diceCount.value)
	const dices = diceRefs.value.slice(0, diceCount.value)
	if (!cubes.length) {
		finishRoll(newValues)
		return
	}

	cubes.forEach((cube, idx) => {
		const wrapper = dices[idx]
		const targetVal = newValues[idx]
		const final = FACE_FINAL[targetVal]
		const spins = 3

		// 终点角度 = 额外圈数 + 目标面偏移
		const endX = spins * 360 + final.x
		const endY = spins * 360 + final.y

		// 清掉上一次的内联 transform
		if (wrapper) gsap.set(wrapper, { clearProps: 'transform' })
		gsap.set(cube, { clearProps: 'transform' })

		// === 外框：垂直弹跳（y + scale）===
		const bounceTl = gsap.timeline({
			delay: idx * 0.15,
			onComplete: () => {
				diceValues.value[idx] = targetVal
			}
		})

		if (wrapper) {
			bounceTl.to(wrapper, { y: -5, scale: 0.92, duration: 0.06, ease: 'power1.out' }, 0)

			// 抛起
			bounceTl.to(wrapper, { y: -68, scale: 0.7, duration: 0.22, ease: 'power3.out' })

			// 第一次落地
			bounceTl.to(wrapper, { y: 0, scale: 1.12, duration: 0.18, ease: 'power2.in' })

			// 弹起
			bounceTl.to(wrapper, { y: -32, scale: 0.85, duration: 0.12, ease: 'power2.out' })

			// 二次落地
			bounceTl.to(wrapper, { y: 0, scale: 1.06, duration: 0.1, ease: 'power1.in' })

			// 小弹
			bounceTl.to(wrapper, { y: -6, scale: 0.95, duration: 0.06, ease: 'power1.out' })

			// 弹性归位
			bounceTl.to(wrapper, { y: 0, scale: 1, duration: 0.3, ease: 'elastic.out(1.2, 0.3)' })
		}

		// === 内立方体：单段平滑 3D 旋转 ===
		// 用 power3.inOut — 慢起→中间最快→慢停，符合抛掷惯性
		gsap.to(cube, {
			rotationX: endX,
			rotationY: endY,
			duration: 0.65,
			ease: 'power3.inOut',
			delay: idx * 0.15 + 0.04
		})
	})

	const totalDuration = (cubes.length - 1) * 0.15 + 1.1
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

		<!-- ══════ 3D 骰子区 ══════ -->
		<view
			class="dice-area"
			:style="{ transform: tiltX !== 0 ? 'perspective(600px)' : '' }"
		>
			<view
				v-for="(val, idx) in diceValues"
				:key="idx"
				:ref="(el) => setDiceRef(el, idx)"
				class="dice"
				:style="{
					zIndex: diceValues.length - idx,
					marginTop: idx > 0 ? '24px' : '0'
				}"
				@tap="rollDice"
			>
				<!-- 3D 立方体 -->
				<view
					:ref="(el) => setCubeRef(el, idx)"
					class="dice-cube"
					:class="diceStyle"
				>
					<view
						v-for="(face, fi) in CUBE_FACES"
						:key="fi"
						class="dice-face"
						:class="'face-' + (fi + 1)"
						:style="{ transform: face.transform }"
					>
						<view
							v-for="(pos, pi) in DOTS[face.num]"
							:key="pi"
							class="dice-dot"
							:style="{
								left: `calc(50% + ${pos[0]} * 18px)`,
								top: `calc(50% + ${pos[1]} * 18px)`
							}"
						></view>
					</view>
				</view>
				<!-- 阴影投影 -->
				<view class="dice-shadow"></view>
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

/* ══════ 3D 骰子区 ══════ */
.dice-area {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 24px 0;
}

.dice {
	position: relative;
	width: 110px;
	height: 110px;
	perspective: 900px;
	cursor: pointer;
	will-change: transform;
}

/* ─── 3D 立方体容器 ─── */
.dice-cube {
	width: 110px;
	height: 110px;
	position: relative;
	transform-style: preserve-3d;
	will-change: transform;
}

/* ─── 6 个面 ─── */
.dice-face {
	position: absolute;
	width: 110px;
	height: 110px;
	border-radius: 16px;
	backface-visibility: hidden;
	-webkit-backface-visibility: hidden;
	overflow: hidden;
}

/* 磨砂白（默认） */
.dice-cube.frosted .dice-face,
.dice-face {
	background: linear-gradient(145deg, rgba(255,255,255,0.40), rgba(255,255,255,0.12));
	backdrop-filter: blur(8px);
	-webkit-backdrop-filter: blur(8px);
	border: 1px solid rgba(255,255,255,0.28);
	box-shadow:
		inset 0 1px 0 rgba(255,255,255,0.40),
		inset 0 -1px 0 rgba(0,0,0,0.06);
}

/* 透明 */
.dice-cube.transparent .dice-face {
	background: linear-gradient(145deg, rgba(255,255,255,0.20), rgba(255,255,255,0.04));
	backdrop-filter: blur(4px);
	-webkit-backdrop-filter: blur(4px);
	border: 1px solid rgba(255,255,255,0.12);
	box-shadow: none;
}

/* 磨砂黑 */
.dice-cube.frosted-black .dice-face {
	background: linear-gradient(145deg, rgba(0,0,0,0.35), rgba(0,0,0,0.12));
	backdrop-filter: blur(8px);
	-webkit-backdrop-filter: blur(8px);
	border: 1px solid rgba(255,255,255,0.08);
	box-shadow:
		inset 0 1px 0 rgba(255,255,255,0.10),
		inset 0 -1px 0 rgba(0,0,0,0.15);
}

/* ─── 点数 ─── */
.dice-dot {
	position: absolute;
	width: 5px;
	height: 5px;
	border-radius: 50%;
	background: var(--clr-text-primary);
	box-shadow: inset 0 1px 2px rgba(0,0,0,0.3);
	transform: translate(-50%, -50%);
}

.dice-cube.transparent .dice-dot {
	background: var(--clr-text-primary);
}

.dice-cube.frosted-black .dice-dot {
	background: rgba(255,255,255,0.85);
}

/* ─── 阴影 ─── */
.dice-shadow {
	position: absolute;
	bottom: -8px;
	left: 5%;
	right: 5%;
	height: 16px;
	background: radial-gradient(ellipse at center, rgba(0,0,0,0.25) 0%, transparent 70%);
	z-index: -1;
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