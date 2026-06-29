<!-- pages/dice/dice.vue -->
<!-- 六面骰子（D6）专用界面 -->
<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import NavBar from '@/components/NavBar.vue'
import { useDiceStore } from '@/stores/dice'
import { useDiceRoll } from '@/composables/useDiceRoll'
import { useShake } from '@/composables/useShake'
import { useVibrate } from '@/composables/useVibrate'
import { useThemeAware } from '@/composables/useThemeAware'
import { getCubeFaces, getDotPositions } from '@/utils/dice-constants'

const store = useDiceStore()
const { diceCount, vibrateEnabled, history } = storeToRefs(store)
const vibrate = useVibrate()
const { isDark } = useThemeAware()

// 固定6面
const currentSides = ref(6)

// 3D 支持检测（uni-app 兼容）
const supports3D = ref(true)
onMounted(() => {
	try {
		// #ifdef H5
		const el = document.createElement('div')
		el.style.transformStyle = 'preserve-3d'
		supports3D.value = el.style.transformStyle === 'preserve-3d'
		// #endif
		// #ifndef H5
		// App 端 WebView 默认支持 CSS 3D Transform
		supports3D.value = true
		// #endif
	} catch (e) {
		supports3D.value = false
	}
})

// 摇骰逻辑
const {
	values, rolling, rotX, rotY, trans, flipping, bouncing,
	totalSum, maxVal, minVal,
	roll: doRoll, syncCount
} = useDiceRoll({
	sides: currentSides,
	count: diceCount,
	vibrateEnabled,
	vibrate
})

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
			diceType: 'D6',
			count: diceCount.value,
			results: result.results,
			sum: result.sum,
			max: result.max,
			min: result.min,
			timestamp: Date.now()
		})
	}
}

// 统计数值弹跳
const statsBump = ref(false)
watch(totalSum, () => {
	statsBump.value = true
	setTimeout(() => { statsBump.value = false }, 450)
})

// 快速数量选择
const quickCounts = [1, 2, 3, 5]
const setQuickCount = (n) => {
	if (rolling.value || n === diceCount.value) return
	store.setDiceCount(n)
	syncCount(n)
	if (vibrateEnabled.value) vibrate.tap()
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

// D6 自适应尺寸（根据骰子数量动态调整，解决3/6颗显示不下的问题）
const d6Sizes = { small: 120, medium: 140, large: 160, xl: 200 }
const diceSize = computed(() => {
	const n = diceCount.value
	if (n <= 2) return d6Sizes.xl      // 200rpx
	if (n <= 4) return d6Sizes.large    // 160rpx
	if (n <= 8) return d6Sizes.medium   // 140rpx
	return d6Sizes.small                // 120rpx
})

// D6 相关衍生尺寸（跟随 diceSize 动态变化）
const d6Half = computed(() => Math.floor(diceSize.value / 2))
const dotSize = computed(() => Math.floor(diceSize.value * 0.16))   // ~32rpx at 200rpx, ~19rpx at 120rpx

// 动态生成六面变换（translateZ 与 diceSize 联动，确保立方体几何正确）
const cubeFaces = computed(() => getCubeFaces(d6Half.value))
</script>

<template>
	<view class="dice-page" :class="{ dark: isDark }">
		<!-- 背景装饰光晕 -->
		<view class="bg-decoration">
			<view class="bg-orb bg-orb-1"></view>
			<view class="bg-orb bg-orb-2"></view>
			<view class="bg-orb bg-orb-3"></view>
		</view>

		<!-- 导航栏 -->
		<NavBar title="骰子">
			<template #right>
				<view class="nav-btn glass-card gbtn" @tap="openHistory">
					<text class="nav-btn-icon">&#128203;</text>
				</view>
			</template>
		</NavBar>

		<!-- 骰子展示区 -->
		<view class="dice-display">
			<view class="dice-grid" :style="{ gridTemplateColumns: 'repeat(' + gridCols + ', 1fr)' }">
				<!-- D6 3D 骰子 -->
				<view v-for="(val, idx) in values" :key="idx" class="dice-3d"
					:style="{ width: diceSize + 'rpx', height: diceSize + 'rpx', perspective: diceSize * 8 + 'rpx', animation: bouncing[idx] }">
					<view class="dice-cube"
						:style="{ width: diceSize + 'rpx', height: diceSize + 'rpx', transform: 'rotateX(' + rotX[idx] + 'deg) rotateY(' + rotY[idx] + 'deg)', transition: trans[idx] }">
						<!-- 背面底座 -->
						<view class="dice-back"
							:style="{ width: diceSize + 'rpx', height: diceSize + 'rpx', marginLeft: '-' + d6Half + 'rpx', marginTop: '-' + d6Half + 'rpx', background: isDark ? '#1C1A22' : '#E0E0E0' }"></view>
						<!-- 六个骰面 -->
						<view v-for="(face, fi) in cubeFaces" :key="fi" class="dice-face"
							:style="{ width: diceSize + 'rpx', height: diceSize + 'rpx', transform: face.transform, background: isDark ? 'linear-gradient(135deg, #2A2830 0%, #221F28 100%)' : 'linear-gradient(135deg, #FFFFFF 0%, #F0EDF5 100%)', boxShadow: isDark ? 'inset 0 0 0 2rpx rgba(255,255,255,0.06), inset 0 2rpx 4rpx rgba(255,255,255,0.10), inset 0 -2rpx 4rpx rgba(0,0,0,0.30)' : 'inset 0 0 0 1rpx #E0E0E0, inset 0 2rpx 4rpx rgba(255,255,255,1), inset 0 -2rpx 4rpx rgba(0,0,0,0.06)' }">
							<view v-for="(pos, pi) in getDotPositions(face.num, diceSize)" :key="pi" class="dice-dot"
								:style="{ left: pos[0] + 'rpx', top: pos[1] + 'rpx', width: dotSize + 'rpx', height: dotSize + 'rpx', background: isDark ? '#E8E6F0' : '#D32F2F', boxShadow: isDark ? 'inset 0 1rpx 2rpx rgba(0,0,0,0.4), 0 0 4rpx rgba(232,230,240,0.3)' : 'inset 0 1rpx 2rpx rgba(0,0,0,0.25), 0 0 4rpx rgba(211,47,47,0.2)' }"></view>
						</view>
						<!-- 翻转中数字遮罩 -->
						<view class="dice-flip-overlay" v-if="flipping[idx]">
							<text class="dice-flip-num" :style="{ fontSize: diceSize * 0.32 + 'rpx', color: isDark ? '#E8E6F0' : 'var(--clr-text-primary)' }">{{ values[idx] }}</text>
						</view>
					</view>
					<view class="dice-shadow" :style="{ bottom: '-' + Math.floor(diceSize * 0.08) + 'rpx', height: Math.floor(diceSize * 0.14) + 'rpx', background: 'radial-gradient(ellipse at center, ' + (isDark ? 'rgba(0,0,0,0.50)' : 'rgba(0,0,0,0.30)') + ' 0%, transparent 100%)' }"></view>
				</view>
			</view>
		</view>

		<!-- 结果统计栏 -->
		<view class="stats-bar glass-card">
			<view class="stat-item">
				<text class="stat-label">总和</text>
				<text class="stat-value sum" :class="{ bump: statsBump }">{{ rolling ? '...' : totalSum }}</text>
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

		<!-- 快速数量选择 -->
		<view class="quick-counts">
			<view v-for="n in quickCounts" :key="n" class="qc-chip glass-card gbtn"
				:class="{ active: diceCount === n, disabled: rolling }"
				@tap="setQuickCount(n)">
				<text class="qc-text">{{ n }}</text>
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
			<view class="roll-btn gbtn-primary gbtn" :class="{ disabled: rolling, ready: !rolling }" @tap="roll">
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
				<!-- 筛选栏（仅保留全部/D6） -->
				<scroll-view scroll-x class="filter-scroll" :show-scrollbar="false">
					<view class="filter-bar">
						<view class="filter-chip" :class="{ active: historyFilter === 'ALL' }"
							@tap="historyFilter = 'ALL'">
							<text>全部</text>
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
	flex: 1;
	background: linear-gradient(160deg, #F3EDF7 0%, #E8DEF8 40%, #FCE4EC 100%);
	display: flex;
	flex-direction: column;
	padding: 0 16px;
	padding-bottom: calc(var(--safe-area-bottom, 0px) + 64px + 24px);
	position: relative;
	overflow: hidden;
}
.dice-page.dark {
	background: linear-gradient(160deg, #141218 0%, #1E1A24 40%, #1A1420 100%);
}

/* 背景光晕 */
.bg-decoration { position: fixed; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 0; }
.bg-orb { position: absolute; border-radius: 50%; filter: blur(50px); }
.bg-orb-1 { width: 240px; height: 240px; background: radial-gradient(circle, rgba(103,80,164,0.25) 0%, transparent 70%); top: -60px; right: -50px; }
.bg-orb-2 { width: 200px; height: 200px; background: radial-gradient(circle, rgba(211,47,47,0.18) 0%, transparent 70%); bottom: 120px; left: -70px; }
.bg-orb-3 { width: 160px; height: 160px; background: radial-gradient(circle, rgba(255,193,7,0.20) 0%, transparent 70%); top: 40%; left: 50%; }
.dark .bg-orb-1 { background: radial-gradient(circle, rgba(208,188,255,0.10) 0%, transparent 70%); }
.dark .bg-orb-2 { background: radial-gradient(circle, rgba(211,47,47,0.08) 0%, transparent 70%); }
.dark .bg-orb-3 { background: radial-gradient(circle, rgba(255,193,7,0.06) 0%, transparent 70%); }

/* ─── 导航栏按钮 ─── */
.nav-btn {
	width: 80rpx;
	height: 80rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
}
.nav-btn-icon {
	font-size: 36rpx;
	color: var(--clr-text-primary);
}

/* ─── 骰子展示区 ─── */
.dice-display {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 24rpx 0;
	min-height: 300rpx;
	position: relative;
	z-index: 1;
}
.dice-grid {
	display: grid;
	gap: 32rpx;
	justify-items: center;
	align-items: center;
	width: 100%;
	max-width: 720rpx;
}

/* D6 3D 骰子（尺寸由内联style动态控制） */
.dice-3d {
	position: relative;
	perspective: 900rpx;
	animation: dice-idle-float 3.5s ease-in-out infinite;
}
@keyframes dice-idle-float {
	0%, 100% { transform: translateY(0); }
	50% { transform: translateY(-6rpx); }
}
.dice-cube {
	position: relative;
	transform-style: preserve-3d;
	-webkit-transform-style: preserve-3d;
	will-change: transform;
}
.dice-back {
	position: absolute;
	left: 50%; top: 50%;
	border-radius: 8rpx;
	transform: translateZ(0);
	z-index: 0;
}
.dice-face {
	position: absolute;
	border-radius: 32rpx;
	backface-visibility: hidden;
	-webkit-backface-visibility: hidden;
	transform-style: preserve-3d;
	z-index: 1;
}
.dice-dot {
	position: absolute;
	border-radius: 50%;
	transform: translate(-50%, -50%);
}
.dice-shadow {
	position: absolute;
	left: 10%; right: 10%;
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
	font-weight: 900;
	text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
}

@keyframes bounce-settle {
	0% { transform: translateY(0); }
	30% { transform: translateY(-18rpx); }
	60% { transform: translateY(0); }
	75% { transform: translateY(-6rpx); }
	100% { transform: translateY(0); }
}

/* ─── 结果统计栏 ─── */
.stats-bar {
	display: flex;
	align-items: center;
	justify-content: space-around;
	border-radius: 24rpx;
	padding: 20rpx 0;
	margin-bottom: 16rpx;
	position: relative;
	z-index: 1;
}
.stat-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 4rpx;
}
.stat-label {
	font-size: 26rpx;
	color: var(--clr-text-secondary);
	font-weight: 600;
}
.stat-value {
	font-size: 40rpx;
	font-weight: 800;
	color: var(--clr-text-primary);
	font-variant-numeric: tabular-nums;
	transition: transform 0.3s var(--ease-bounce);
}
.stat-value.bump { animation: stat-bump 0.45s var(--ease-bounce); }
@keyframes stat-bump {
	0% { transform: scale(1); }
	40% { transform: scale(1.35); }
	100% { transform: scale(1); }
}
.stat-value.sum {
	color: var(--clr-accent);
	font-size: 52rpx;
	font-weight: 900;
}
.stat-divider {
	width: 1px;
	height: 48rpx;
	background: var(--clr-border);
}

/* ─── 快速数量选择 ─── */
.quick-counts {
	display: flex;
	justify-content: center;
	gap: 12rpx;
	margin-bottom: 16rpx;
	position: relative;
	z-index: 1;
}
.qc-chip {
	min-width: 72rpx;
	height: 64rpx;
	border-radius: 16rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.25s var(--ease-spring);
}
.qc-chip.disabled { opacity: 0.4; pointer-events: none; }
.qc-chip.active {
	background: var(--clr-accent);
	box-shadow: 0 4rpx 16rpx rgba(103, 80, 164, 0.35);
}
.qc-chip.active .qc-text { color: var(--clr-accent-on); }
.qc-text { font-size: 30rpx; font-weight: 700; color: var(--clr-text-primary); }

/* ─── 控制栏 ─── */
.control-bar {
	display: flex;
	align-items: center;
	gap: 24rpx;
	flex-shrink: 0;
	position: relative;
	z-index: 1;
}
.stepper {
	display: flex;
	align-items: center;
	gap: 16rpx;
	border-radius: 999rpx;
	padding: 8rpx 16rpx;
}
.step-btn {
	width: 64rpx;
	height: 64rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 36rpx;
	font-weight: 700;
	color: var(--clr-text-primary);
}
.step-btn:active { transform: scale(0.88); }
.step-num {
	font-size: 36rpx;
	font-weight: 800;
	color: var(--clr-text-primary);
	min-width: 56rpx;
	text-align: center;
	font-variant-numeric: tabular-nums;
}
.roll-btn {
	flex: 1;
	padding: 24rpx 0;
	border-radius: 999rpx;
	text-align: center;
	position: relative;
	overflow: hidden;
}
.roll-btn.disabled {
	opacity: 0.5;
	pointer-events: none;
}
.roll-btn.ready { animation: roll-ready-pulse 2s ease-in-out infinite; }
@keyframes roll-ready-pulse {
	0%, 100% { box-shadow: 0 4rpx 16rpx rgba(103, 80, 164, 0.3); }
	50% { box-shadow: 0 4rpx 24rpx rgba(103, 80, 164, 0.55), 0 0 0 6rpx rgba(103, 80, 164, 0.08); }
}
.roll-btn:active { transform: scale(0.96); }
.roll-text {
	font-size: 36rpx;
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
	font-size: 26rpx;
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
	color: var(--clr-text-secondary);
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
	font-size: 30rpx;
	font-weight: 700;
	color: var(--clr-accent);
}
.hi-count {
	font-size: 24rpx;
	color: var(--clr-text-secondary);
}
.hi-center {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 4rpx;
}
.hi-results {
	font-size: 30rpx;
	color: var(--clr-text-primary);
	font-weight: 600;
	font-variant-numeric: tabular-nums;
}
.hi-sum {
	font-size: 26rpx;
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
	font-size: 24rpx;
	color: var(--clr-text-secondary);
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
	color: var(--clr-text-secondary);
}
</style>
