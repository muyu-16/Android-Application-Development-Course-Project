<!-- pages/dice/cup-mode.vue -->
<!-- 大话骰遮罩：极简拟物风格 — 纯黑背景 + 圆形灰线骰盘 + 白色哑光立体骰子 -->
<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { useDiceStore } from '@/stores/dice'
import { useShake } from '@/composables/useShake'
import { useVibrate } from '@/composables/useVibrate'

const store = useDiceStore()
const { cupCount } = storeToRefs(store) // 正确获取 Ref<number>，避免双层 ref 问题
const vibrate = useVibrate()

const DOTS = {
	1: [[0, 0]],
	2: [[-1, -1], [1, 1]],
	3: [[-1, -1], [0, 0], [1, 1]],
	4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
	5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
	6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]]
}

// 骰子散落布局（相对于圆心的偏移，单位 px）
const LAYOUTS = {
	3: [[0, -32], [-38, 24], [38, 24]],
	4: [[-30, -30], [30, -30], [-30, 30], [30, 30]],
	5: [[0, -44], [-42, -14], [-26, 36], [26, 36], [42, -14]],
	6: [[-34, -38], [0, -42], [34, -38], [-34, 34], [0, 38], [34, 34]]
}

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
const positions = computed(() => LAYOUTS[cupCount.value] || LAYOUTS[3])

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
		transform: 'translate(' + pos[0] + 'px, ' + pos[1] + 'px) rotate(' + tilt + 'deg)',
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
		<view class="nav-bar">
			<view class="nav-title">大话骰</view>
			<view class="nav-menu" @tap="openSettings">
				<text class="menu-icon">⋮</text>
			</view>
		</view>

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
				<view class="btn-roll" @tap="roll">
					<text>{{ rolling ? '摇动中…' : '摇 骰' }}</text>
				</view>
				<view class="btn-reset" @tap="reset">
					<text>重 摇</text>
				</view>
			</view>
			<view class="hint" v-if="!rolling && !revealing">
				<text>长按下方按钮查看点数</text>
			</view>
			<view class="btn-reveal" :class="{ active: revealing }"
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
   全局：纯黑背景，无冗余元素
   ══════════════════════════════════════ */
.cup-mode {
	display: flex;
	flex-direction: column;
	height: 100%;
	background: #000000;
	overflow: hidden;
}

/* ══════════════════════════════════════
   顶部导航栏 — 模糊深色，占屏幕 8-10%
   ══════════════════════════════════════ */
.nav-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 120rpx;
	padding: 0 32rpx;
	background: rgba(26, 26, 26, 0.50);
	backdrop-filter: blur(20rpx);
	-webkit-backdrop-filter: blur(20rpx);
	flex-shrink: 0;
}
.nav-title {
	font-size: 36rpx;
	font-weight: 700;
	color: #FFFFFF;
	letter-spacing: 4rpx;
}
.nav-menu {
	width: 72rpx;
	height: 72rpx;
	border-radius: 50%;
	background: #FFD700;
	border: 2px solid #000000;
	display: flex;
	align-items: center;
	justify-content: center;
}
.nav-menu:active { transform: scale(0.90); }
.menu-icon {
	font-size: 36rpx;
	font-weight: 900;
	color: #000000;
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

/* 圆形骰盘 — 浅灰细线 */
.circle-ring {
	position: relative;
	width: 560rpx;
	height: 560rpx;
	border: 2px solid #CCCCCC;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: border-color 0.35s ease;
}
.circle-ring.revealed {
	border-color: #FFFFFF;
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
	transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
}

/* 骰面 — 纯白哑光 + 立体投影 */
.dice-face {
	position: relative;
	width: 104rpx;
	height: 104rpx;
	background: #FFFFFF;
	border-radius: 14rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	/* 立体感：底部厚度 + 环境阴影 + 顶部柔光 */
	box-shadow:
		0 6rpx 0 #E6E6E6,
		0 8rpx 0 #D9D9D9,
		0 12rpx 24rpx rgba(0, 0, 0, 0.45),
		inset 0 2rpx 0 rgba(255, 255, 255, 1);
}

/* 点数 — 纯黑正圆 */
.dice-dot {
	position: absolute;
	width: 14rpx;
	height: 14rpx;
	border-radius: 50%;
	background: #000000;
	transform: translate(-50%, -50%);
}

/* 未摇问号 */
.dice-empty {
	font-size: 36rpx;
	font-weight: 700;
	color: #CCCCCC;
}

/* 骰子投影（底部椭圆暗影） */
.dice-drop {
	position: absolute;
	bottom: -16rpx;
	left: 10%;
	right: 10%;
	height: 16rpx;
	background: radial-gradient(ellipse at center, rgba(0,0,0,0.35) 0%, transparent 100%);
	filter: blur(6rpx);
	z-index: -1;
}

/* ══════════════════════════════════════
   操作区 — 极简按钮
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
	transition: transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.btn-roll:active, .btn-reset:active { transform: scale(0.94); }
.btn-roll text, .btn-reset text {
	font-size: 28rpx;
	font-weight: 700;
	letter-spacing: 4rpx;
}

.btn-roll {
	background: #FFFFFF;
}
.btn-roll text { color: #000000; }

.btn-reset {
	background: transparent;
	border: 2px solid #333333;
}
.btn-reset text { color: #999999; }

.hint {
	text-align: center;
	margin-bottom: 16rpx;
}
.hint text {
	font-size: 22rpx;
	color: #666666;
	font-weight: 500;
}

.btn-reveal {
	text-align: center;
	padding: 28rpx 0;
	border-radius: 999rpx;
	border: 2px solid #333333;
	transition: all 0.2s ease;
}
.btn-reveal text {
	font-size: 28rpx;
	font-weight: 700;
	color: #666666;
	letter-spacing: 4rpx;
}
.btn-reveal:active { transform: scale(0.96); }
.btn-reveal.active {
	background: #FFFFFF;
	border-color: #FFFFFF;
}
.btn-reveal.active text { color: #000000; }

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
	background: #1A1A1A;
	border: 1px solid #333333;
	border-radius: 32rpx;
	padding: 40rpx;
	display: flex;
	flex-direction: column;
	gap: 24rpx;
}
.modal-title {
	font-size: 32rpx;
	font-weight: 700;
	color: #FFFFFF;
	text-align: center;
}
.modal-desc {
	font-size: 24rpx;
	color: #666666;
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
	border: 2px solid #333333;
	transition: all 0.2s;
}
.count-btn text { font-size: 28rpx; font-weight: 600; color: #999999; }
.count-btn.active {
	background: #FFFFFF;
	border-color: #FFFFFF;
}
.count-btn.active text { color: #000000; }
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
.modal-ok { background: #FFFFFF; }
.modal-ok text { font-size: 26rpx; font-weight: 700; color: #000000; }
.modal-cancel { border: 2px solid #333333; }
.modal-cancel text { font-size: 26rpx; font-weight: 600; color: #999999; }
</style>