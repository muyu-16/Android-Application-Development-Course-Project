<!-- pages/dice/free-mode.vue -->
<!-- 自由摇骰：1-6骰子，点击/摇一摇触发，结果锁定需手动解锁 -->
<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { useDiceStore } from '@/stores/dice'
import { useShake } from '@/composables/useShake'
import { useVibrate } from '@/composables/useVibrate'
import { useDiceRoll } from '@/composables/useDiceRoll'
import { DOTS, CUBE_FACES } from '@/utils/dice-constants'

const store = useDiceStore()
const { freeCount: diceCount, vibrateEnabled } = storeToRefs(store)
const vibrate = useVibrate()

// 3D 支持检测：低端机降级为 2D 平面骰子
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

// 摇骰逻辑（composable）
const {
	values, rolling, rotX, rotY, trans, flipping, bouncing,
	totalSum, roll: doRoll, syncCount
} = useDiceRoll({ count: diceCount, vibrateEnabled, vibrate })

// 锁定状态
const locked = ref(false)

// 同步骰子数量
const setCount = (n) => {
	if (rolling.value) return
	store.setFreeCount(n)
	syncCount(n)
	locked.value = false
}

// 摇骰（带锁定）
const roll = () => {
	if (rolling.value || locked.value) return
	doRoll()
	// 摇完自动锁定
	const totalDuration = diceCount.value * 150 + 1100
	setTimeout(() => { locked.value = true }, totalDuration)
}

// 解锁
const unlock = () => {
	locked.value = false
	if (vibrateEnabled.value) vibrate.tap()
}

// 摇一摇
const { start: startShake, stop: stopShake } = useShake({ onShake: roll })
onMounted(() => startShake())
onBeforeUnmount(() => stopShake())
</script>

<template>
	<view class="free-mode">
		<!-- 骰子数量选择 -->
		<view class="count-bar glass-card">
			<view v-for="n in [1, 2, 3, 4, 5, 6]" :key="n"
				class="count-btn" :class="{ active: diceCount === n }"
				@tap="setCount(n)">
				<text>{{ n }}</text>
			</view>
		</view>

		<!-- 骰子展示区 -->
		<view class="dice-area">
			<!-- 3D 模式 -->
			<template v-if="supports3D">
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
			</template>
			<!-- 2D 降级模式 -->
			<template v-else>
				<view v-for="(val, idx) in values" :key="'flat-' + idx" class="dice-flat"
					:style="{ animation: bouncing[idx] }">
					<view class="dice-flat-face">
						<view v-for="(pos, pi) in DOTS[val]" :key="pi" class="dice-flat-dot"
							:style="{ left: 'calc(50% + ' + pos[0] * 20 + 'px)', top: 'calc(50% + ' + pos[1] * 20 + 'px)' }"></view>
					</view>
					<view class="dice-shadow"></view>
				</view>
			</template>
		</view>

		<!-- 总点数 + 操作 -->
		<view class="control-bar">
			<view class="sum-box glass-card">
				<text class="sum-label">总点数</text>
				<text class="sum-value">{{ totalSum }}</text>
			</view>
			<view v-if="locked" class="action-btn unlock glass-card gbtn" @tap="unlock">
				<text class="action-icon">🔒</text>
				<text class="action-text">解锁</text>
			</view>
			<view v-else class="action-btn roll glass-card-strong gbtn" @tap="roll">
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
	border-radius: 999px;
	padding: 4px;
}
.count-btn {
	flex: 1;
	padding: 10px 0;
	text-align: center;
	border-radius: 999px;
	border: 1px solid transparent;
	transition: background 0.25s ease, transform 0.15s var(--ease-spring), border-color 0.25s;
}
.count-btn:active { transform: scale(0.94); }
.count-btn text {
	font-size: 16px;
	font-weight: 600;
	color: var(--clr-text-secondary);
}
.count-btn.active {
	background: rgba(208, 188, 255, 0.22);
	border: 1px solid rgba(208, 188, 255, 0.55);
	box-shadow: 0 2px 8px rgba(208, 188, 255, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.08);
}
.count-btn.active text {
	color: var(--clr-text-primary);
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
@keyframes bounce-settle {
	0% { transform: translateY(0); }
	30% { transform: translateY(-18px); }
	60% { transform: translateY(0); }
	75% { transform: translateY(-6px); }
	100% { transform: translateY(0); }
}

/* ─── 2D 降级骰子 ─── */
.dice-flat {
	position: relative;
	width: 110px;
	height: 110px;
	margin-top: 20px;
}
.dice-flat:first-child { margin-top: 0; }
.dice-flat-face {
	width: 110px;
	height: 110px;
	border-radius: 16px;
	background: var(--clr-surface);
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow:
		inset 0 0 0 1px rgba(0, 0, 0, 0.06),
		inset 0 1px 0 rgba(255, 255, 255, 0.8),
		0 4px 12px rgba(0, 0, 0, 0.15);
	position: relative;
}
.dice-flat-dot {
	position: absolute;
	width: 12px;
	height: 12px;
	border-radius: 50%;
	background: var(--clr-text-primary);
	transform: translate(-50%, -50%);
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
	border-radius: 16px;
	padding: 12px 20px;
}
.sum-label {
	font-size: 12px;
	color: var(--clr-text-secondary);
	font-weight: 500;
}
.sum-value {
	font-size: 28px;
	font-weight: 800;
	color: var(--clr-text-primary);
	line-height: 1.1;
}
.action-btn {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 14px 24px;
	border-radius: 999px;
}
.action-btn:active { transform: scale(0.94); }
.action-btn.roll {
	border: 1px solid rgba(208, 188, 255, 0.55);
}
.action-btn.unlock {
	border: 1px solid rgba(255, 255, 255, 0.20);
}
.action-icon { font-size: 22px; }
.action-text {
	font-size: 16px;
	font-weight: 700;
	color: var(--clr-text-primary);
}
</style>
