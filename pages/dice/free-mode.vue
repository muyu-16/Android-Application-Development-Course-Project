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
