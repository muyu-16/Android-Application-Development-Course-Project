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
import { useThemeAware } from '@/composables/useThemeAware'
import { DICE_TYPES, getDiceType, DOTS, CUBE_FACES } from '@/utils/dice-constants'

const store = useDiceStore()
const { selectedType, diceCount, vibrateEnabled, history } = storeToRefs(store)
const vibrate = useVibrate()
const { isDark } = useThemeAware()

// 当前骰型定义
const currentDice = computed(() => getDiceType(selectedType.value))
const currentSides = computed(() => currentDice.value.sides)

// 3D Token 边缘层颜色（响应主题）
const edgeColor = (e) => {
	if (isDark.value) {
		return 'rgb(' + (43 - e * 2) + ',' + (41 - e * 2) + ',' + (48 - e * 1) + ')'
	}
	return 'rgb(' + (224 - e * 3) + ',' + (220 - e * 3) + ',' + (232 - e * 2) + ')'
}

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
	values, rolling, rotX, rotY, rotZ, trans, flipping, bouncing,
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
				<!-- 多面骰 3D Token 模式 / D6 降级模式 -->
				<template v-else>
					<view v-for="(val, idx) in values" :key="'p-' + idx" class="dice-3d-token"
						:style="{ animation: bouncing[idx] }">
						<view class="token-body"
							:style="{
								transform: 'rotateX(' + rotX[idx] + 'deg) rotateY(' + rotY[idx] + 'deg) rotateZ(' + rotZ[idx] + 'deg)',
								transition: trans[idx]
							}">
							<!-- Front face -->
							<view class="token-face token-front" :style="{
								clipPath: currentDice.clipPath || 'none',
								boxShadow: isDark
									? 'inset 0 1rpx 0 rgba(255,255,255,0.12), inset 0 -1rpx 0 rgba(0,0,0,0.15)'
									: 'inset 0 2rpx 0 rgba(255,255,255,0.85), inset 0 -1rpx 0 rgba(0,0,0,0.05)'
							}">
								<text class="token-num">{{ val || '?' }}</text>
							</view>
							<!-- Edge layers for 3D thickness (depth-driven gradient) -->
							<view v-for="e in (currentDice.depth || 8)" :key="e" class="token-edge"
								:style="{
									transform: 'translateZ(-' + (e * 2) + 'rpx)',
									clipPath: currentDice.clipPath || 'none',
									opacity: 1 - (e - 1) / ((currentDice.depth || 8) + 2) * 0.35,
									background: edgeColor(e)
								}">
							</view>
							<!-- Back face -->
							<view class="token-face token-back" :style="{
								transform: 'translateZ(-' + ((currentDice.depth || 8) * 2) + 'rpx) rotateY(180deg)',
								clipPath: currentDice.clipPath || 'none',
								background: isDark ? '#1A1820' : '#D8D4E0'
							}">
							</view>
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
	font-size: 30rpx;
	color: var(--clr-text-primary);
}
.type-chip .type-label {
	font-size: 30rpx;
	font-weight: 700;
	color: var(--clr-text-primary);
}
.type-chip.active {
	background: rgba(103, 80, 164, 0.15);
	border-color: var(--clr-accent);
}
.type-chip.active .type-icon,
.type-chip.active .type-label {
	color: var(--clr-accent);
	font-weight: 800;
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
	gap: 32rpx;
	justify-items: center;
	align-items: center;
	width: 100%;
	max-width: 720rpx;
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

/* 多面骰 3D Token */
.dice-3d-token {
	position: relative;
	width: 180rpx;
	height: 180rpx;
	perspective: 1200rpx;
}
.token-body {
	width: 180rpx;
	height: 180rpx;
	position: relative;
	transform-style: preserve-3d;
	-webkit-transform-style: preserve-3d;
	will-change: transform;
}
.token-face {
	position: absolute;
	width: 180rpx;
	height: 180rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	backface-visibility: hidden;
	-webkit-backface-visibility: hidden;
}
.token-front {
	background: var(--clr-surface);
	border: 2rpx solid var(--clr-border);
	border-radius: 16rpx;
	z-index: 2;
}
.token-back {
	border-radius: 16rpx;
	z-index: 0;
}
.token-edge {
	position: absolute;
	width: 180rpx;
	height: 180rpx;
	border-radius: 14rpx;
	backface-visibility: hidden;
	-webkit-backface-visibility: hidden;
}
.token-num {
	font-size: 64rpx;
	font-weight: 900;
	color: var(--clr-text-primary);
	line-height: 1;
	letter-spacing: -1rpx;
	z-index: 3;
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
	font-size: 26rpx;
	color: var(--clr-text-secondary);
	font-weight: 600;
}
.stat-value {
	font-size: 40rpx;
	font-weight: 800;
	color: var(--clr-text-primary);
	font-variant-numeric: tabular-nums;
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
.step-btn:active { transform: scale(0.9); }
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
}
.roll-btn.disabled {
	opacity: 0.5;
	pointer-events: none;
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
