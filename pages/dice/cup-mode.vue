<!-- pages/dice/cup-mode.vue -->
<!-- 大话骰遮罩：极简拟物风格 — 纯黑背景 + 圆形灰线骰盘 + 白色哑光立体骰子 -->
<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import NavBar from '@/components/NavBar.vue'
import { useDiceStore } from '@/stores/dice'
import { useShake } from '@/composables/useShake'
import { useVibrate } from '@/composables/useVibrate'
import { DOTS, CUP_LAYOUTS } from '@/utils/dice-constants'

const store = useDiceStore()
const { cupCount } = storeToRefs(store) // 正确获取 Ref<number>，避免双层 ref 问题
const vibrate = useVibrate()

// 状态
const values = ref(Array(cupCount.value).fill(1))
const rolling = ref(false)
const revealing = ref(false)
const shakeAnim = ref(false)

// 骰子随机倾斜角（15° ~ 30°）
const tilts = ref([])
const genTilts = (n) => {
	const arr = []
	for (let i = 0; i < n; i++) {
		const base = 15 + Math.random() * 15          // 15~30
		const sign = Math.random() > 0.5 ? 1 : -1
		arr.push(base * sign)
	}
	return arr
}
tilts.value = genTilts(cupCount.value)

// 骰子位置
const positions = computed(() => CUP_LAYOUTS[cupCount.value] || CUP_LAYOUTS[3])

// 设置弹窗
const showSettings = ref(false)
const draftCount = ref(cupCount.value)
const openSettings = () => {
	draftCount.value = cupCount.value
	showSettings.value = true
}
const closeSettings = () => { showSettings.value = false }
const confirmSettings = () => {
	store.setCupCount(draftCount.value)
	tilts.value = genTilts(draftCount.value)
	closeSettings()
}

// 摇骰
const roll = () => {
	if (rolling.value || revealing.value) return
	rolling.value = true
	shakeAnim.value = true
	if (store.vibrateEnabled) vibrate.medium()

	const results = []
	for (let i = 0; i < cupCount.value; i++) {
		results.push(Math.floor(Math.random() * 6) + 1)
	}

	setTimeout(() => {
		values.value = [...results]
		tilts.value = genTilts(cupCount.value)
		shakeAnim.value = false
		rolling.value = false
	}, 1200)
}

// 重摇
const reset = () => {
	if (rolling.value) return
	revealing.value = false
	values.value = Array(cupCount.value).fill(0)
	tilts.value = genTilts(cupCount.value)
	if (store.vibrateEnabled) vibrate.tap()
}

// 长按掀开
let pressTimer = null
const onPressStart = () => {
	if (rolling.value) return
	pressTimer = setTimeout(() => {
		revealing.value = true
		if (store.vibrateEnabled) vibrate.medium()
	}, 250)
}
const onPressEnd = () => {
	clearTimeout(pressTimer)
	if (revealing.value) {
		setTimeout(() => { revealing.value = false }, 100)
	}
}

// 摇一摇
const { start: startShake, stop: stopShake } = useShake({ onShake: roll })
onMounted(() => startShake())
onBeforeUnmount(() => stopShake())

// 点数可见性（0 表示未摇）
const hasResult = (v) => v > 0

// 骰子样式（防御性取值，避免 positions/tilts 越界）
const diceStyle = (idx) => {
	const pos = positions.value[idx] || [0, 0]
	const tilt = tilts.value[idx] != null ? tilts.value[idx] : 0
	return {
		transform: 'translate(' + pos[0] + 'rpx, ' + pos[1] + 'rpx) rotate(' + tilt + 'deg)',
		zIndex: idx + 1
	}
}

// 骰子数量变化时同步 values 和 tilts
watch(cupCount, (n) => {
	values.value = Array(n).fill(0)
	tilts.value = genTilts(n)
})
</script>

<template>
	<view class="cup-mode">
		<!-- 顶部导航栏 -->
		<NavBar title="大话骰">
			<template #right>
				<view class="nav-menu glass-card gbtn" @tap="openSettings">
					<text class="menu-icon">⋮</text>
				</view>
			</template>
		</NavBar>

		<!-- 骰盘区域 -->
		<view class="cup-stage">
			<!-- 圆形骰盘 -->
			<view class="circle-ring" :class="{ shaking: shakeAnim, revealed: revealing }">
				<!-- 骰子散落 -->
				<view v-for="(val, idx) in values" :key="idx" class="dice"
					:style="diceStyle(idx)">
					<!-- 骰面 -->
					<view class="dice-face">
						<view v-if="hasResult(val)" v-for="(pos, pi) in DOTS[val]" :key="pi" class="dice-dot"
							:style="{ left: 'calc(50% + ' + pos[0] * 14 + 'px)', top: 'calc(50% + ' + pos[1] * 14 + 'px)' }"></view>
						<!-- 未摇时显示问号 -->
						<text v-else class="dice-empty">?</text>
					</view>
					<!-- 骰子投影 -->
					<view class="dice-drop"></view>
				</view>
			</view>
		</view>

		<!-- 操作区 -->
		<view class="action-bar">
			<view class="action-row">
				<view class="btn-roll glass-card-strong gbtn" @tap="roll">
					<text>{{ rolling ? '摇动中…' : '摇 骰' }}</text>
				</view>
				<view class="btn-reset glass-card gbtn" @tap="reset">
					<text>重 摇</text>
				</view>
			</view>
			<view class="hint" v-if="!rolling && !revealing">
				<text>长按下方按钮查看点数</text>
			</view>
			<view class="btn-reveal glass-card gbtn" :class="{ active: revealing }"
				@touchstart="onPressStart" @touchend="onPressEnd" @touchcancel="onPressEnd">
				<text>{{ revealing ? '查看中…' : '长按掀开' }}</text>
			</view>
		</view>

		<!-- 设置弹窗 -->
		<view v-if="showSettings" class="modal-mask" @tap="closeSettings">
			<view class="modal-panel" @tap.stop>
				<text class="modal-title">骰子数量</text>
				<text class="modal-desc">3 - 6 颗</text>
				<view class="count-row">
					<view v-for="n in [3, 4, 5, 6]" :key="n"
						class="count-btn" :class="{ active: draftCount === n }"
						@tap="draftCount = n">
						<text>{{ n }}</text>
					</view>
				</view>
				<view class="modal-actions">
					<view class="modal-ok" @tap="confirmSettings"><text>确认</text></view>
					<view class="modal-cancel" @tap="closeSettings"><text>取消</text></view>
				</view>
			</view>
		</view>
	</view>
</template>

<style scoped>
/* ══════════════════════════════════════
   全局：接入设计系统变量
   ══════════════════════════════════════ */
.cup-mode {
	display: flex;
	flex-direction: column;
	height: 100%;
	background: var(--clr-bg-primary);
	overflow: hidden;
}

/* ══════════════════════════════════════
   导航栏菜单按钮
   ══════════════════════════════════════ */
.nav-menu {
	width: 72rpx;
	height: 72rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
}
.menu-icon {
	font-size: 36rpx;
	font-weight: 900;
	color: var(--clr-text-primary);
	line-height: 1;
}

/* ══════════════════════════════════════
   骰盘区域 — 居中大圆
   ══════════════════════════════════════ */
.cup-stage {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 20rpx 0;
}

/* 圆形骰盘 */
.circle-ring {
	position: relative;
	width: 560rpx;
	height: 560rpx;
	border: 2px solid var(--clr-border);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: border-color 0.35s ease;
}
.circle-ring.revealed {
	border-color: var(--clr-text-primary);
}

/* 晃动动画 */
.circle-ring.shaking {
	animation: ring-shake 0.08s linear infinite;
}
@keyframes ring-shake {
	0%   { transform: translate(0, 0); }
	25%  { transform: translate(-4rpx, 2rpx); }
	50%  { transform: translate(4rpx, -2rpx); }
	75%  { transform: translate(-2rpx, 4rpx); }
	100% { transform: translate(0, 0); }
}

/* ══════════════════════════════════════
   骰子 — 白色哑光立体，倾斜 15-30°
   ══════════════════════════════════════ */
.dice {
	position: absolute;
	left: 50%;
	top: 50%;
	width: 104rpx;
	height: 104rpx;
	margin-left: -52rpx;
	margin-top: -52rpx;
	transition: transform 0.5s var(--ease-spring);
}

/* 骰面 — 纯白哑光 + 立体投影 */
.dice-face {
	position: relative;
	width: 104rpx;
	height: 104rpx;
	background: var(--clr-surface);
	border-radius: 14rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow:
		0 6rpx 0 rgba(0, 0, 0, 0.08),
		0 8rpx 0 rgba(0, 0, 0, 0.05),
		0 12rpx 24rpx rgba(0, 0, 0, 0.25),
		inset 0 2rpx 0 rgba(255, 255, 255, 0.8);
}

/* 点数 */
.dice-dot {
	position: absolute;
	width: 14rpx;
	height: 14rpx;
	border-radius: 50%;
	background: var(--clr-text-primary);
	transform: translate(-50%, -50%);
}

/* 未摇问号 */
.dice-empty {
	font-size: 36rpx;
	font-weight: 700;
	color: var(--clr-text-disabled);
}

/* 骰子投影 */
.dice-drop {
	position: absolute;
	bottom: -16rpx;
	left: 10%;
	right: 10%;
	height: 16rpx;
	background: radial-gradient(ellipse at center, rgba(0,0,0,0.20) 0%, transparent 100%);
	filter: blur(6rpx);
	z-index: -1;
}

/* ══════════════════════════════════════
   操作区 — 玻璃态按钮
   ══════════════════════════════════════ */
.action-bar {
	padding: 0 32rpx 32rpx;
	flex-shrink: 0;
}
.action-row {
	display: flex;
	gap: 20rpx;
	margin-bottom: 24rpx;
}

.btn-roll, .btn-reset {
	flex: 1;
	text-align: center;
	padding: 24rpx 0;
	border-radius: 999rpx;
}
.btn-roll text, .btn-reset text {
	font-size: 28rpx;
	font-weight: 700;
	letter-spacing: 4rpx;
	color: var(--clr-text-primary);
}

.btn-reset text { color: var(--clr-text-secondary); }

.hint {
	text-align: center;
	margin-bottom: 16rpx;
}
.hint text {
	font-size: 22rpx;
	color: var(--clr-text-disabled);
	font-weight: 500;
}

.btn-reveal {
	text-align: center;
	padding: 28rpx 0;
	border-radius: 999rpx;
	transition: all 0.2s ease;
}
.btn-reveal text {
	font-size: 28rpx;
	font-weight: 700;
	color: var(--clr-text-secondary);
	letter-spacing: 4rpx;
}
.btn-reveal.active text { color: var(--clr-accent); }

/* ══════════════════════════════════════
   设置弹窗
   ══════════════════════════════════════ */
.modal-mask {
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.60);
	backdrop-filter: blur(12rpx);
	-webkit-backdrop-filter: blur(12rpx);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 100;
}
.modal-panel {
	width: 560rpx;
	background: var(--clr-bg-secondary);
	border: 1px solid var(--clr-border);
	border-radius: 32rpx;
	padding: 40rpx;
	display: flex;
	flex-direction: column;
	gap: 24rpx;
}
.modal-title {
	font-size: 32rpx;
	font-weight: 700;
	color: var(--clr-text-primary);
	text-align: center;
}
.modal-desc {
	font-size: 24rpx;
	color: var(--clr-text-secondary);
	text-align: center;
}
.count-row {
	display: flex;
	gap: 12rpx;
}
.count-btn {
	flex: 1;
	padding: 20rpx 0;
	text-align: center;
	border-radius: 999rpx;
	border: 2px solid var(--clr-border);
	transition: all 0.2s;
}
.count-btn text { font-size: 28rpx; font-weight: 600; color: var(--clr-text-secondary); }
.count-btn.active {
	background: var(--clr-accent);
	border-color: var(--clr-accent);
}
.count-btn.active text { color: var(--clr-accent-on); }
.modal-actions {
	display: flex;
	gap: 12rpx;
}
.modal-ok, .modal-cancel {
	flex: 1;
	padding: 20rpx 0;
	border-radius: 999rpx;
	text-align: center;
}
.modal-ok { background: var(--clr-accent); }
.modal-ok text { font-size: 26rpx; font-weight: 700; color: var(--clr-accent-on); }
.modal-cancel { border: 2px solid var(--clr-border); }
.modal-cancel text { font-size: 26rpx; font-weight: 600; color: var(--clr-text-secondary); }
</style>