<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import NavBar from '@/components/NavBar.vue'
import { useQuestionStore } from '@/stores/questions'
import { useThemeAware } from '@/composables/useThemeAware'

const store = useQuestionStore()
const { isDark } = useThemeAware()

// ─── 模式色系 ───
const modeColor = computed(() => store.mode === 'truth' ? '#00D4FF' : '#FF006E')
const modeColorGlow = computed(() => store.mode === 'truth' ? 'rgba(0,212,255,0.35)' : 'rgba(255,0,110,0.35)')
const modeColorSoft = computed(() => store.mode === 'truth' ? 'rgba(0,212,255,0.12)' : 'rgba(255,0,110,0.12)')

// ─── 题目展示 ───
const currentText = ref('')
const isFlipped = ref(false)
const flipResponse = ref('')
const isTransitioning = ref(false)

// 🔍 兜底检查：监听题目变化
watch(currentText, (val, old) => {
	console.log('[truth] currentText 变化:', { old, new: val, length: val?.length })
})

// ─── 答题状态 ───
const questionStatus = ref('pending')
const stats = computed(() => {
	let answered = 0, skipped = 0, total = 0
	store.history.forEach(r => {
		if (r.status === 'answered') answered++
		else if (r.status === 'skipped') skipped++
		if (r.status !== 'pending') total++
	})
	return { answered, skipped, total }
})

// ─── 历史抽屉 ───
const showHistory = ref(false)

// ─── 转盘 ───
const showWheel = ref(false)
const wheelRotation = ref(0)
const selectedPlayer = ref(null)
const isSpinning = ref(false)

// ─── 自定义输入 ───
const showCustomInput = ref(false)
const customInput = ref('')

// ─── 3D 倾斜 ───
const tiltX = ref(0)
const tiltY = ref(0)
let tiltTimer = null

// ─── 回应文案 ───
const goodResponses = [
	'干得漂亮！', '你太厉害了！', '完全正确！',
	'真有趣！', '大家鼓掌！', '太棒了！',
	'精彩！', '好样的！', '厉害了！',
	'完美！', '不错哦！', '真给力！'
]
const badResponses = [
	'有点遗憾', '还需要努力', '再试试吧',
	'不太行哦', '哎哟喂', '翻车了',
	'差一点点', '加油啊', '尴尬了',
	'下次一定', '6', '不行哦'
]
function getRandomResponse(isGood) {
	const pool = isGood ? goodResponses : badResponses
	return pool[Math.floor(Math.random() * pool.length)]
}

// ─── 模式 ───
const segments = [
	{ key: 'truth', label: '真心话', icon: '🧠' },
	{ key: 'dare', label: '大冒险', icon: '🔥' }
]
function setMode(key) {
	if (isTransitioning.value) return
	store.setMode(key)
	resetFlip()
	nextDraw()
}

// ─── 强度 ───
const intensityLabels = ['温和', '适中', '较强', '强烈', '极限']
const intensityColors = ['#00D4FF', '#06B6D4', '#0EA5E9', '#FF006E', '#BE123C']
function setIntensity(val) {
	store.setIntensity(val)
}
const sliderBg = computed(() => intensityColors[store.intensity - 1])

// ─── 抽题 ───
function nextDraw() {
	console.log('[truth] nextDraw 调用', { isTransitioning: isTransitioning.value, currentText: currentText.value, status: questionStatus.value })
	if (isTransitioning.value) return
	if (currentText.value && questionStatus.value === 'pending') {
		store.updateLastStatus('skipped')
	}
	questionStatus.value = 'pending'
	isTransitioning.value = true
	setTimeout(() => {
		currentText.value = store.getRandomWithHistory()
		console.log('[truth] nextDraw 新题目:', currentText.value)
		nextTick(() => {
			setTimeout(() => { isTransitioning.value = false }, 50)
		})
	}, 250)
}

function handleSkip() {
	console.log('[truth] handleSkip 调用', { isTransitioning: isTransitioning.value, status: questionStatus.value })
	if (isTransitioning.value) return
	if (questionStatus.value === 'pending') {
		questionStatus.value = 'skipped'
		store.updateLastStatus('skipped')
		uni.vibrateShort({ type: 'light' })
	}
	nextDraw()
}

function handleComplete() {
	if (isFlipped.value) {
		isFlipped.value = false
		return
	}
	if (questionStatus.value === 'pending') {
		questionStatus.value = 'answered'
		store.updateLastStatus('answered')
		uni.vibrateShort({ type: 'medium' })
	}
	const isGood = Math.random() > 0.3
	flipResponse.value = getRandomResponse(isGood)
	isFlipped.value = true
}

function resetFlip() {
	isFlipped.value = false
	flipResponse.value = ''
}

// ─── 加速度计 3D 倾斜 ───
function onAccelerometer(e) {
	if (tiltTimer) clearTimeout(tiltTimer)
	tiltTimer = setTimeout(() => {
		const { x, y } = e
		tiltX.value = Math.max(-5, Math.min(5, y * 3))
		tiltY.value = Math.max(-5, Math.min(5, -x * 3))
	})
}

onMounted(() => {
	try { uni.onAccelerometerChange(onAccelerometer) } catch (e) {}
	currentText.value = store.getRandomWithHistory()
	console.log('[truth] onMounted 初始题目:', currentText.value)
})
onUnmounted(() => {
	try { uni.offAccelerometerChange(onAccelerometer) } catch (e) {}
})

// ─── 转盘 ───
const wheelPlayerIds = computed(() => {
	const ps = store.players
	return ps.length <= 8 ? ps : ps.slice(0, 8)
})
const wheelAngle = computed(() => 360 / wheelPlayerIds.value.length)

function openWheel() {
	showWheel.value = true
	selectedPlayer.value = null
	wheelRotation.value = 0
}
function spinWheel() {
	if (isSpinning.value) return
	isSpinning.value = true
	selectedPlayer.value = null
	const targetIdx = Math.floor(Math.random() * wheelPlayerIds.value.length)
	const extraSpins = 4 + Math.floor(Math.random() * 2)
	const targetAngle = extraSpins * 360 + (360 - targetIdx * wheelAngle.value - wheelAngle.value / 2)
	wheelRotation.value += targetAngle
	setTimeout(() => {
		selectedPlayer.value = wheelPlayerIds.value[targetIdx]
		isSpinning.value = false
		uni.vibrateShort({ type: 'medium' })
	}, 4200)
}
function closeWheel() {
	showWheel.value = false
	wheelRotation.value = 0
	selectedPlayer.value = null
	isSpinning.value = false
}

// ─── 自定义 ───
function addCustom() {
	if (!customInput.value.trim()) return
	store.addCustomQuestion(customInput.value)
	customInput.value = ''
	showCustomInput.value = false
	uni.showToast({ title: '已添加', icon: 'success' })
}

// ─── 历史 ───
const formatTime = (ts) => {
	if (!ts) return ''
	const d = new Date(ts)
	return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
}
function statusLabel(status) {
	if (status === 'answered') return '已答'
	if (status === 'skipped') return '跳过'
	return '待答'
}
function clearHistory() {
	store.clearHistory()
}

// ─── 状态指示器文案 ───
const statusInfo = computed(() => {
	if (isFlipped.value) return { text: '已揭晓', color: '#FFD700' }
	if (questionStatus.value === 'answered') return { text: '已作答', color: '#00D4FF' }
	if (questionStatus.value === 'skipped') return { text: '已跳过', color: '#64748B' }
	return { text: '待作答', color: modeColor.value }
})

const completionRate = computed(() => {
	if (stats.value.total === 0) return 0
	return Math.round((stats.value.answered / stats.value.total) * 100)
})
</script>

<template>
	<view class="container" :class="{ dark: isDark }">
		<!-- ═══ 宇宙深空背景 ═══ -->
		<view class="bg-cosmos">
			<view class="bg-aurora bg-aurora-1" :class="store.mode"></view>
			<view class="bg-aurora bg-aurora-2" :class="store.mode"></view>
			<view class="bg-aurora bg-aurora-3" :class="store.mode"></view>
			<view class="bg-stars"></view>
			<view class="bg-vignette"></view>
		</view>

		<!-- 导航栏 -->
		<NavBar title="真心话大冒险">
			<template #right>
				<view class="nav-btn" @tap="showHistory = true">
					<text class="nav-icon">📋</text>
				</view>
			</template>
		</NavBar>

		<!-- ═══ 模式切换 ═══ -->
		<view class="segmented-wrapper">
			<view class="segmented">
				<view
					v-for="seg in segments"
					:key="seg.key"
					class="seg-item"
					:class="{ active: store.mode === seg.key }"
					@tap="setMode(seg.key)"
				>
					<text class="seg-icon">{{ seg.icon }}</text>
					<text class="seg-label">{{ seg.label }}</text>
				</view>
				<view
					class="seg-indicator"
					:class="store.mode"
					:style="{ transform: `translateX(${store.mode === 'truth' ? 0 : 100}%)` }"
				></view>
			</view>
		</view>

		<!-- ═══ 状态栏 ═══ -->
		<view class="status-bar">
			<view class="status-pill" :style="{ '--status-color': statusInfo.color }">
				<view class="status-dot"></view>
				<text class="status-text">{{ statusInfo.text }}</text>
			</view>
			<view class="status-stats">
				<view class="ss-item">
					<text class="ss-num answered">{{ stats.answered }}</text>
					<text class="ss-label">已答</text>
				</view>
				<view class="ss-divider"></view>
				<view class="ss-item">
					<text class="ss-num skipped">{{ stats.skipped }}</text>
					<text class="ss-label">跳过</text>
				</view>
				<view class="ss-divider"></view>
				<view class="ss-item">
					<text class="ss-num rate">{{ completionRate }}%</text>
					<text class="ss-label">完成率</text>
				</view>
			</view>
		</view>

		<!-- ═══ 核心卡片 ═══ -->
		<view class="card-scene">
			<view
				class="card-3d"
				:class="[store.mode, { flipped: isFlipped }]"
				:style="{ transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg)` }"
			>
				<!-- 正面 -->
				<view class="card-face card-front">
					<view class="card-glow-ring"></view>

					<!-- 顶部窄条：只放 TRUTH / DARE 小标签 -->
					<view class="card-header">
						<text class="cl-icon">{{ store.mode === 'truth' ? '🧠' : '🔥' }}</text>
						<text class="cl-text">{{ store.mode === 'truth' ? 'TRUTH' : 'DARE' }}</text>
					</view>

					<!-- 中间主内容区：题目文字 -->
					<view class="card-body">
						<!-- 🔴 诊断：直接渲染 currentText 变量 -->
						<view style="background:red; color:white; font-size:40rpx; height:100rpx; z-index:99999;">
							currentText: {{ currentText }}
						</view>
						<!-- 🔴 测试文字 -->
						<text style="color: red; font-size: 40rpx; position: relative; z-index: 999;">测试文字</text>
						<text
							v-if="currentText"
							class="question-text"
							:class="{ 'text-out': isTransitioning, 'text-in': !isTransitioning }"
							:key="currentText"
						>{{ currentText }}</text>
						<text v-else class="question-text question-placeholder">加载中...</text>
					</view>

					<view class="card-footer">
						<view class="card-intensity">
							<view class="intensity-dots">
								<view
									v-for="i in 5"
									:key="i"
									class="dot"
									:class="{ filled: i <= store.intensity }"
								></view>
							</view>
						</view>
						<view class="card-divider"></view>
						<text class="card-level">Lv.{{ store.intensity }}</text>
					</view>
				</view>

				<!-- 背面 -->
				<view class="card-face card-back">
					<view class="back-burst"></view>
					<view class="back-emoji">
						<text class="be-icon">✨</text>
					</view>
					<text class="back-text">{{ flipResponse }}</text>
					<text class="back-hint">点击下方按钮继续</text>
				</view>
			</view>
		</view>

		<!-- ═══ 强度滑块 ═══ -->
		<view class="slider-section">
			<view class="slider-header">
				<text class="slider-emoji" :style="{ opacity: store.intensity <= 2 ? 1 : 0.25 }">😌</text>
				<view class="slider-track">
					<view class="slider-fill" :style="{ width: (store.intensity - 1) * 25 + '%' }"></view>
					<view
						v-for="i in 5"
						:key="i"
						class="slider-dot"
						:class="{ active: i <= store.intensity }"
						:style="{ left: (i - 1) * 25 + '%' }"
						@tap="setIntensity(i)"
					>
						<text class="dot-label">{{ intensityLabels[i - 1] }}</text>
					</view>
				</view>
				<text class="slider-emoji" :style="{ opacity: store.intensity >= 4 ? 1 : 0.25 }">😱</text>
			</view>
		</view>

		<!-- ═══ 底部操作栏 ═══ -->
		<view class="bottom-bar">
			<view class="bottom-left">
				<view class="btn-skip" @tap="handleSkip">
					<text class="bs-icon">⏭</text>
					<text class="bs-text">换一题</text>
				</view>
				<view class="btn-icon" @tap="showCustomInput = !showCustomInput">
					<text>＋</text>
				</view>
				<view class="btn-icon" @tap="openWheel">
					<text>🎯</text>
				</view>
			</view>
			<view class="btn-done" :class="{ reset: isFlipped, truth: store.mode === 'truth', dare: store.mode === 'dare' }" @tap="handleComplete">
				<text class="bd-icon">{{ isFlipped ? '🔄' : '✓' }}</text>
				<text class="bd-text">{{ isFlipped ? '知道了' : '完成' }}</text>
			</view>
		</view>

		<!-- 自定义输入面板 -->
		<view class="custom-panel" v-if="showCustomInput">
			<view class="custom-row">
				<input
					v-model="customInput"
					class="custom-input"
					:placeholder="'输入自定义' + (store.mode === 'truth' ? '真心话' : '大冒险')"
					@confirm="addCustom"
				/>
				<view class="custom-add" :class="store.mode" @tap="addCustom">
					<text>➤</text>
				</view>
			</view>
		</view>

		<!-- ═══ 历史抽屉 ═══ -->
		<view class="drawer-mask" v-if="showHistory" @tap="showHistory = false">
			<view class="drawer-panel" @tap.stop>
				<view class="drawer-handle"></view>
				<view class="drawer-header">
					<text class="drawer-title">答题历史</text>
					<view class="drawer-clear" @tap="clearHistory">
						<text>清空</text>
					</view>
				</view>
				<view class="drawer-stats">
					<view class="ds-item">
						<text class="ds-num answered">{{ stats.answered }}</text>
						<text class="ds-label">已答</text>
					</view>
					<view class="ds-item">
						<text class="ds-num skipped">{{ stats.skipped }}</text>
						<text class="ds-label">跳过</text>
					</view>
					<view class="ds-item">
						<text class="ds-num total">{{ stats.total }}</text>
						<text class="ds-label">总计</text>
					</view>
				</view>
				<scroll-view scroll-y class="history-list">
					<view v-if="store.historyRecent.length === 0" class="history-empty">
						<text class="he-icon">📝</text>
						<text class="he-text">还没有答题记录</text>
					</view>
					<view v-for="(record, idx) in store.historyRecent" :key="record.id || idx" class="history-item">
						<view class="hi-tag" :class="record.mode">
							<text>{{ record.mode === 'truth' ? '🧠' : '🔥' }}</text>
						</view>
						<view class="hi-content">
							<text class="hi-text">{{ record.content }}</text>
							<view class="hi-meta">
								<text class="hi-intensity">强度 {{ record.intensity }}</text>
								<text class="hi-time">{{ formatTime(record.timestamp) }}</text>
								<text class="hi-status" :class="record.status">{{ statusLabel(record.status) }}</text>
							</view>
						</view>
					</view>
				</scroll-view>
			</view>
		</view>

		<!-- ═══ 转盘弹窗 ═══ -->
		<view class="wheel-mask" v-if="showWheel" @tap="closeWheel">
			<view class="wheel-overlay" @tap.stop>
				<text class="wheel-title">🎯 随机抽人</text>
				<view class="wheel-container">
					<view class="wheel-pointer"></view>
					<view class="wheel-ring" :style="{ transform: `rotate(${wheelRotation}deg)` }">
						<view
							v-for="(player, idx) in wheelPlayerIds"
							:key="player.id"
							class="wheel-player"
							:style="{ transform: `rotate(${idx * wheelAngle}deg) translateY(-95px)` }"
						>
							<view class="wheel-avatar" :class="{ selected: selectedPlayer?.id === player.id }">
								<text class="wa-icon">{{ (idx + 1) }}</text>
							</view>
							<text class="wheel-name">{{ player.name }}</text>
						</view>
					</view>
				</view>
				<view class="wheel-actions">
					<view class="wheel-btn spin" :class="{ disabled: isSpinning }" @tap="spinWheel">
						<text>{{ isSpinning ? '⟳ 转动中' : '🎲 开始' }}</text>
					</view>
					<view class="wheel-btn close" @tap="closeWheel">
						<text>关闭</text>
					</view>
				</view>
				<text class="wheel-result" v-if="selectedPlayer">
					✨ 已选中 {{ selectedPlayer.name }}
				</text>
			</view>
		</view>
	</view>
</template>

<style scoped>
/* ═══════════════════════════════════════════
   Aurora Pulse · 极光脉动
   宇宙深空 #060B1F → #0F1438 → #0A0E2A
   真心话：极光青 #00D4FF / #06B6D4
   大冒险：霓虹绯 #FF006E / #EC4899
   揭晓：流光金 #FFD700
   氛围：极光波浪 + 星尘粒子 + 霓虹光晕
   ═══════════════════════════════════════════ */

/* ====== 容器 ====== */
.container {
	flex: 1;
	min-height: 100vh;
	padding: 6px 16rpx;
	padding-top: calc(var(--safe-area-top, 24px) + 4px);
	padding-bottom: calc(var(--safe-area-bottom, 0px) + 56px + 8px);
	display: flex;
	flex-direction: column;
	position: relative;
	overflow: hidden;
	background: #060B1F;
}
.container.dark {
	background: #030612;
}

/* ═══════════════════════════════════════════
   背景系统：宇宙深空 + 极光波 + 星尘
   ═══════════════════════════════════════════ */
.bg-cosmos {
	position: fixed; top: 0; left: 0; right: 0; bottom: 0;
	pointer-events: none; z-index: 0;
}

/* 极光波浪 */
.bg-aurora {
	position: absolute;
	border-radius: 50%;
	filter: blur(80px);
	opacity: 0.45;
	transition: background 0.8s ease;
}
.bg-aurora-1 {
	width: 320px; height: 320px;
	top: -80px; right: -60px;
	background: radial-gradient(circle, rgba(0,212,255,0.5) 0%, transparent 70%);
	animation: aurora-float-1 8s ease-in-out infinite;
}
.bg-aurora-1.dare {
	background: radial-gradient(circle, rgba(255,0,110,0.5) 0%, transparent 70%);
}
.bg-aurora-2 {
	width: 260px; height: 260px;
	bottom: 10%; left: -40px;
	background: radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%);
	animation: aurora-float-2 10s ease-in-out infinite;
}
.bg-aurora-2.dare {
	background: radial-gradient(circle, rgba(236,72,153,0.4) 0%, transparent 70%);
}
.bg-aurora-3 {
	width: 200px; height: 200px;
	top: 40%; left: 50%;
	transform: translate(-50%, -50%);
	background: radial-gradient(circle, rgba(6,182,212,0.35) 0%, transparent 70%);
	animation: aurora-pulse 6s ease-in-out infinite;
}
.bg-aurora-3.dare {
	background: radial-gradient(circle, rgba(244,114,182,0.35) 0%, transparent 70%);
}

@keyframes aurora-float-1 {
	0%, 100% { transform: translate(0, 0) scale(1); }
	33% { transform: translate(-30px, 20px) scale(1.1); }
	66% { transform: translate(15px, -15px) scale(0.95); }
}
@keyframes aurora-float-2 {
	0%, 100% { transform: translate(0, 0) scale(1); }
	33% { transform: translate(20px, -25px) scale(1.08); }
	66% { transform: translate(-10px, 15px) scale(0.92); }
}
@keyframes aurora-pulse {
	0%, 100% { opacity: 0.35; transform: translate(-50%, -50%) scale(1); }
	50% { opacity: 0.55; transform: translate(-50%, -50%) scale(1.2); }
}

/* 星尘粒子 */
.bg-stars {
	position: absolute; top: 0; left: 0; right: 0; bottom: 0;
	background-image:
		radial-gradient(1px 1px at 10% 15%, rgba(255,255,255,0.8), transparent),
		radial-gradient(1px 1px at 25% 8%, rgba(255,255,255,0.6), transparent),
		radial-gradient(1.5px 1.5px at 40% 22%, rgba(255,255,255,0.7), transparent),
		radial-gradient(1px 1px at 55% 12%, rgba(255,255,255,0.5), transparent),
		radial-gradient(1px 1px at 70% 28%, rgba(255,255,255,0.65), transparent),
		radial-gradient(1.5px 1.5px at 85% 18%, rgba(255,255,255,0.55), transparent),
		radial-gradient(1px 1px at 15% 45%, rgba(255,255,255,0.5), transparent),
		radial-gradient(1px 1px at 35% 55%, rgba(255,255,255,0.6), transparent),
		radial-gradient(1.5px 1.5px at 60% 48%, rgba(0,212,255,0.5), transparent),
		radial-gradient(1px 1px at 78% 58%, rgba(255,255,255,0.45), transparent),
		radial-gradient(1px 1px at 90% 42%, rgba(255,0,110,0.5), transparent),
		radial-gradient(1px 1px at 22% 75%, rgba(255,255,255,0.55), transparent),
		radial-gradient(1px 1px at 48% 82%, rgba(255,255,255,0.4), transparent),
		radial-gradient(1.5px 1.5px at 68% 72%, rgba(0,212,255,0.45), transparent),
		radial-gradient(1px 1px at 82% 85%, rgba(255,255,255,0.5), transparent),
		radial-gradient(1px 1px at 8% 88%, rgba(255,255,255,0.4), transparent);
	background-size: 200% 200%;
	animation: stars-drift 12s ease-in-out infinite;
}
@keyframes stars-drift {
	0%, 100% { opacity: 0.7; background-position: 0% 0%; }
	25% { opacity: 0.9; background-position: 3% 2%; }
	50% { opacity: 0.6; background-position: 1% 4%; }
	75% { opacity: 0.85; background-position: -2% 1%; }
}

/* 暗角 */
.bg-vignette {
	position: absolute; top: 0; left: 0; right: 0; bottom: 0;
	background: radial-gradient(ellipse at 50% 40%,
		transparent 40%,
		rgba(6,11,31,0.5) 80%,
		rgba(6,11,31,0.85) 100%
	);
}

/* ====== 导航栏按钮 ====== */
.nav-btn {
	width: 64rpx; height: 64rpx;
	border-radius: 50%;
	display: flex; align-items: center; justify-content: center;
	background: rgba(255,255,255,0.06);
	border: 1px solid rgba(255,255,255,0.1);
	transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.nav-btn:active { transform: scale(0.92); background: rgba(255,255,255,0.12); }
.nav-icon { font-size: 32rpx; }

/* ====== 模式切换 ====== */
.segmented-wrapper { position: relative; z-index: 2; margin-bottom: 8rpx; }
.segmented {
	display: flex;
	background: rgba(10,15,40,0.7);
	border: 1px solid rgba(255,255,255,0.08);
	border-radius: 999px;
	padding: 4px;
	position: relative;
	backdrop-filter: blur(16px);
	-webkit-backdrop-filter: blur(16px);
}
.seg-item {
	flex: 1;
	padding: 10px 0;
	display: flex; align-items: center; justify-content: center;
	gap: 6px;
	border-radius: 999px;
	z-index: 1;
	transition: color 0.3s;
}
.seg-icon { font-size: 16px; }
.seg-label { font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.45); }
.seg-item.active .seg-label { color: #060B1F; }
.seg-indicator {
	position: absolute;
	top: 4px; left: 4px;
	width: calc(50% - 4px); height: calc(100% - 8px);
	border-radius: 999px;
	transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
	z-index: 0;
}
.seg-indicator.truth {
	background: linear-gradient(135deg, #00D4FF, #06B6D4);
	box-shadow: 0 2px 16px rgba(0,212,255,0.4);
}
.seg-indicator.dare {
	background: linear-gradient(135deg, #FF006E, #EC4899);
	box-shadow: 0 2px 16px rgba(255,0,110,0.4);
}

/* ====== 状态指示器 ====== */
.status-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	border-radius: 16px;
	padding: 8px 14px;
	position: relative;
	z-index: 1;
	margin-bottom: 6rpx;
	background: rgba(10,15,40,0.55);
	border: 1px solid rgba(255,255,255,0.06);
	backdrop-filter: blur(10px);
	-webkit-backdrop-filter: blur(10px);
}
.status-pill {
	display: flex; align-items: center; gap: 6px;
	padding: 4px 12px;
	border-radius: 999px;
	background: rgba(255,255,255,0.05);
	border: 1px solid rgba(255,255,255,0.08);
}
.status-dot {
	width: 8px; height: 8px;
	border-radius: 50%;
	background: var(--status-color, #00D4FF);
	box-shadow: 0 0 12px var(--status-color, #00D4FF);
	animation: status-pulse 1.5s ease-in-out infinite;
}
@keyframes status-pulse {
	0%, 100% { opacity: 1; transform: scale(1); }
	50% { opacity: 0.4; transform: scale(0.75); }
}
.status-text { font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.85); }
.status-stats { display: flex; align-items: center; gap: 10px; }
.ss-item { display: flex; flex-direction: column; align-items: center; }
.ss-num { font-size: 18px; font-weight: 800; font-variant-numeric: tabular-nums; }
.ss-num.answered { color: #00D4FF; }
.ss-num.skipped { color: #FF006E; }
.ss-num.rate { color: #FFD700; }
.ss-label { font-size: 9px; color: rgba(255,255,255,0.35); font-weight: 600; }
.ss-divider { width: 1px; height: 24px; background: rgba(255,255,255,0.08); }

/* ═══════════════════════════════════════════
   核心卡片：深空玻璃 + 霓虹光晕边框
   ═══════════════════════════════════════════ */
.card-scene {
	flex: 1;
	display: flex;
	align-items: stretch;
	justify-content: center;
	perspective: 1200px;
	position: relative;
	z-index: 1;
	min-height: 0;
	padding: 4px 0;
}
.card-3d {
	width: 100%;
	height: 100%;
	position: relative;
	transition: transform 0.2s ease-out;
	transform-style: preserve-3d;
}
.card-3d.flipped { transform: rotateY(180deg) !important; }

.card-face {
	position: absolute;
	top: 0; right: 0; bottom: 0; left: 0;
	border-radius: 24px;
	backface-visibility: hidden;
	-webkit-backface-visibility: hidden;
	display: flex;
	flex-direction: column;
	padding: 16px 18px;
	overflow: hidden;
}

/* 卡片发光边框环 */
.card-glow-ring {
	position: absolute; top: 0; right: 0; bottom: 0; left: 0;
	border-radius: 24px;
	pointer-events: none; z-index: 0;
	border: 1px solid transparent;
	transition: border-color 0.6s ease;
}
.card-3d.truth .card-glow-ring {
	border-color: rgba(0,212,255,0.25);
	box-shadow: 0 0 30px rgba(0,212,255,0.08) inset, 0 0 50px rgba(0,212,255,0.05);
}
.card-3d.dare .card-glow-ring {
	border-color: rgba(255,0,110,0.25);
	box-shadow: 0 0 30px rgba(255,0,110,0.08) inset, 0 0 50px rgba(255,0,110,0.05);
}

/* 正面 */
.card-front {
	background: linear-gradient(160deg,
		rgba(10,15,45,0.95) 0%,
		rgba(15,20,55,0.92) 40%,
		rgba(8,12,35,0.95) 100%
	);
	border: 1px solid rgba(255,255,255,0.08);
	box-shadow: 0 8px 40px rgba(0,0,0,0.5);
}

/* 卡片标签 */
.card-header {
	display: flex; align-items: center; gap: 6px;
	align-self: flex-start;
	padding: 5px 14px;
	border-radius: 999px;
	background: rgba(0,212,255,0.1);
	border: 1px solid rgba(0,212,255,0.2);
	position: relative; z-index: 1;
	transition: background 0.4s, border-color 0.4s;
}
.card-3d.dare .card-header {
	background: rgba(255,0,110,0.1);
	border-color: rgba(255,0,110,0.2);
}
.cl-icon { font-size: 15px; }
.cl-text {
	font-size: 11px; font-weight: 800;
	color: #00D4FF;
	letter-spacing: 1.5px;
	transition: color 0.4s;
}
.card-3d.dare .cl-text { color: #FF006E; }

/* 中间主内容区 */
.card-body {
	width: 100%;
	min-height: 300px;
	padding: 30rpx;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	overflow: visible;
	position: relative;
	z-index: 10;
	flex: 1;
}
.question-text {
	font-size: 22px;
	font-weight: 700;
	line-height: 1.55;
	text-align: center;
	color: #E2E8F0;
	letter-spacing: 0.5px;
	transition: opacity 0.25s, transform 0.25s;
	word-break: break-word;
	overflow-wrap: break-word;
}
.question-placeholder {
	color: rgba(255,255,255,0.25);
	font-size: 18px;
	font-weight: 400;
}
.question-text.text-out {
	opacity: 0; transform: scale(0.9) translateY(-8px);
}
.question-text.text-in {
	opacity: 1; transform: scale(1) translateY(0);
	animation: text-reveal 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes text-reveal {
	0% { opacity: 0; transform: scale(0.85) translateY(10px); filter: blur(4px); }
	100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
}

/* 卡片底部 */
.card-footer {
	display: flex; align-items: center; gap: 10px;
	position: relative; z-index: 1;
}
.card-intensity { display: flex; align-items: center; }
.intensity-dots { display: flex; gap: 5px; }
.dot {
	width: 6px; height: 6px; border-radius: 50%;
	background: rgba(255,255,255,0.1);
	transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.dot.filled {
	background: #00D4FF;
	box-shadow: 0 0 8px rgba(0,212,255,0.6);
}
.card-3d.dare .dot.filled {
	background: #FF006E;
	box-shadow: 0 0 8px rgba(255,0,110,0.6);
}
.card-divider { width: 1px; height: 14px; background: rgba(255,255,255,0.08); }
.card-level {
	font-size: 10px; font-weight: 700;
	color: #00D4FF;
	letter-spacing: 0.5px;
	transition: color 0.4s;
}
.card-3d.dare .card-level { color: #FF006E; }

/* 背面 */
.card-back {
	background: linear-gradient(160deg,
		rgba(10,15,45,0.95) 0%,
		rgba(15,20,55,0.92) 40%,
		rgba(8,12,35,0.95) 100%
	);
	border: 1px solid rgba(255,215,0,0.2);
	box-shadow: 0 8px 40px rgba(0,0,0,0.5), 0 0 60px rgba(255,215,0,0.08) inset;
	transform: rotateY(180deg);
	align-items: center; justify-content: center;
	gap: 14px;
}
.back-burst {
	position: absolute; top: 50%; left: 50%;
	transform: translate(-50%, -50%);
	width: 200px; height: 200px;
	border-radius: 50%;
	background: radial-gradient(circle, rgba(255,215,0,0.15) 0%, transparent 60%);
	pointer-events: none;
	animation: burst-pulse 2s ease-in-out infinite;
}
@keyframes burst-pulse {
	0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
	50% { transform: translate(-50%, -50%) scale(1.3); opacity: 1; }
}
.back-emoji {
	width: 72px; height: 72px;
	border-radius: 50%;
	background: rgba(255,215,0,0.1);
	border: 1px solid rgba(255,215,0,0.25);
	display: flex; align-items: center; justify-content: center;
	position: relative; z-index: 1;
	animation: emoji-float 2s ease-in-out infinite;
}
@keyframes emoji-float {
	0%, 100% { transform: translateY(0) scale(1); }
	50% { transform: translateY(-6px) scale(1.06); }
}
.be-icon { font-size: 36px; }
.back-text {
	font-size: 24px; font-weight: 800;
	color: #FFD700;
	text-align: center;
	text-shadow: 0 2px 24px rgba(255,215,0,0.5);
	position: relative; z-index: 1;
}
.back-hint {
	font-size: 11px; color: rgba(255,255,255,0.35);
	position: relative; z-index: 1;
}

/* ====== 强度滑块 ====== */
.slider-section { margin: 8rpx 0 4rpx; position: relative; z-index: 1; }
.slider-header { display: flex; align-items: center; gap: 8px; }
.slider-emoji { font-size: 20px; transition: opacity 0.3s; }
.slider-track {
	flex: 1; height: 4px;
	background: rgba(255,255,255,0.06);
	border-radius: 2px;
	position: relative;
	margin: 4px 0;
}
.slider-fill {
	height: 100%; border-radius: 2px;
	background: linear-gradient(90deg, #00D4FF, #06B6D4, #0EA5E9, #FF006E, #BE123C);
	transition: width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
	box-shadow: 0 0 12px rgba(0,212,255,0.5);
}
.slider-dot {
	position: absolute;
	top: 50%;
	transform: translate(-50%, -50%);
	width: 20px; height: 20px;
	border-radius: 50%;
	background: rgba(255,255,255,0.1);
	border: 2px solid rgba(255,255,255,0.15);
	transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	display: flex; align-items: center; justify-content: center;
	z-index: 1;
}
.slider-dot.active {
	width: 26px; height: 26px;
	background: #00D4FF;
	border-color: rgba(0,212,255,0.5);
	box-shadow: 0 0 18px rgba(0,212,255,0.6);
}
.dot-label {
	position: absolute; top: -22px;
	white-space: nowrap;
	font-size: 9px; font-weight: 600;
	color: rgba(255,255,255,0.5);
	opacity: 0; transition: opacity 0.2s;
}
.slider-dot.active .dot-label { opacity: 1; color: rgba(255,255,255,0.8); }

/* ====== 底部操作栏 ====== */
.bottom-bar {
	display: flex; align-items: center; justify-content: space-between;
	position: relative; z-index: 1;
	padding-top: 4px;
}
.bottom-left { display: flex; align-items: center; gap: 8px; }
.btn-skip {
	padding: 9px 16px;
	border-radius: 999px;
	display: flex; align-items: center; gap: 5px;
	background: rgba(255,255,255,0.05);
	border: 1px solid rgba(255,255,255,0.08);
	transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s;
}
.btn-skip:active { transform: scale(0.95); background: rgba(255,255,255,0.1); }
.bs-icon { font-size: 14px; }
.bs-text { font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.7); }
.btn-icon {
	width: 38px; height: 38px;
	border-radius: 50%;
	display: flex; align-items: center; justify-content: center;
	font-size: 18px; font-weight: 700;
	color: rgba(255,255,255,0.7);
	background: rgba(255,255,255,0.05);
	border: 1px solid rgba(255,255,255,0.08);
	transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s;
}
.btn-icon:active { transform: scale(0.9); background: rgba(255,255,255,0.1); }

.btn-done {
	padding: 11px 24px;
	border-radius: 999px;
	display: flex; align-items: center; gap: 6px;
	transition: all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.btn-done:active { transform: scale(0.95); }
.btn-done.truth {
	background: linear-gradient(135deg, #00D4FF, #06B6D4);
	box-shadow: 0 4px 24px rgba(0,212,255,0.4);
}
.btn-done.dare {
	background: linear-gradient(135deg, #FF006E, #EC4899);
	box-shadow: 0 4px 24px rgba(255,0,110,0.4);
}
.btn-done.reset {
	background: linear-gradient(135deg, #FFD700, #F59E0B);
	box-shadow: 0 4px 24px rgba(255,215,0,0.4);
}
.bd-icon { font-size: 16px; color: #060B1F; }
.bd-text { font-size: 15px; font-weight: 800; color: #060B1F; }

/* ====== 自定义输入 ====== */
.custom-panel { margin-top: 4px; position: relative; z-index: 1; animation: fade-in-up 0.25s ease; }
.custom-row { display: flex; gap: 8px; }
.custom-input {
	flex: 1;
	border-radius: 14px;
	padding: 9px 14px;
	font-size: 13px;
	color: #E2E8F0;
	background: rgba(10,15,40,0.6);
	border: 1px solid rgba(255,255,255,0.1);
}
.custom-input::placeholder { color: rgba(255,255,255,0.25); }
.custom-add {
	width: 42px; height: 42px;
	border-radius: 50%;
	display: flex; align-items: center; justify-content: center;
	transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.custom-add:active { transform: scale(0.9); }
.custom-add.truth { background: linear-gradient(135deg, #00D4FF, #06B6D4); box-shadow: 0 4px 16px rgba(0,212,255,0.4); }
.custom-add.dare { background: linear-gradient(135deg, #FF006E, #EC4899); box-shadow: 0 4px 16px rgba(255,0,110,0.4); }
.custom-add text { color: #060B1F; font-size: 16px; }

/* ====== 历史抽屉 ====== */
.drawer-mask {
	position: fixed; top: 0; right: 0; bottom: 0; left: 0;
	background: rgba(3,6,18,0.8);
	backdrop-filter: blur(14px);
	-webkit-backdrop-filter: blur(14px);
	display: flex; align-items: flex-end; justify-content: center;
	z-index: 100;
	animation: fade-in 0.2s ease;
}
.drawer-panel {
	width: 100%; max-height: 75vh;
	background: linear-gradient(180deg, #0F1438 0%, #0A0E2A 100%);
	border-radius: 28px 28px 0 0;
	border-top: 1px solid rgba(0,212,255,0.12);
	display: flex; flex-direction: column;
	overflow: hidden;
	animation: drawer-up 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.drawer-handle {
	width: 36px; height: 4px;
	border-radius: 2px;
	background: rgba(255,255,255,0.12);
	align-self: center;
	margin-top: 10px;
	margin-bottom: 4px;
}
@keyframes drawer-up {
	from { transform: translateY(100%); }
	to { transform: translateY(0); }
}
.drawer-header {
	display: flex; align-items: center; justify-content: space-between;
	padding: 14px 20px 10px;
}
.drawer-title { font-size: 17px; font-weight: 800; color: #E2E8F0; }
.drawer-clear {
	padding: 6px 14px; border-radius: 999px;
	background: rgba(255,255,255,0.05);
	border: 1px solid rgba(255,255,255,0.08);
}
.drawer-clear text { font-size: 12px; color: rgba(255,255,255,0.5); font-weight: 600; }

.drawer-stats {
	display: flex; justify-content: space-around;
	padding: 8px 20px 14px;
	border-bottom: 1px solid rgba(255,255,255,0.05);
}
.ds-item { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.ds-num { font-size: 22px; font-weight: 800; font-variant-numeric: tabular-nums; }
.ds-num.answered { color: #00D4FF; }
.ds-num.skipped { color: #FF006E; }
.ds-num.total { color: #FFD700; }
.ds-label { font-size: 10px; color: rgba(255,255,255,0.35); font-weight: 600; }

.history-list { flex: 1; padding: 12px 20px 20px; max-height: 50vh; }
.history-empty {
	display: flex; flex-direction: column; align-items: center; gap: 8px;
	padding: 60px 0;
}
.he-icon { font-size: 40px; opacity: 0.25; }
.he-text { font-size: 13px; color: rgba(255,255,255,0.25); }
.history-item {
	display: flex; align-items: flex-start; gap: 10px;
	padding: 12px 14px;
	border-radius: 14px;
	background: rgba(255,255,255,0.025);
	border: 1px solid rgba(255,255,255,0.04);
	margin-bottom: 8px;
}
.hi-tag {
	width: 32px; height: 32px;
	border-radius: 10px;
	display: flex; align-items: center; justify-content: center;
	flex-shrink: 0;
}
.hi-tag.truth { background: rgba(0,212,255,0.12); }
.hi-tag.dare { background: rgba(255,0,110,0.12); }
.hi-tag text { font-size: 16px; }
.hi-content { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.hi-text { font-size: 13px; color: rgba(255,255,255,0.75); line-height: 1.4; }
.hi-meta { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.hi-intensity { font-size: 10px; color: rgba(255,255,255,0.3); font-weight: 600; }
.hi-time { font-size: 10px; color: rgba(255,255,255,0.25); font-variant-numeric: tabular-nums; }
.hi-status {
	font-size: 10px; font-weight: 700;
	padding: 1px 8px; border-radius: 999px;
	border: 1px solid transparent;
}
.hi-status.answered { color: #00D4FF; background: rgba(0,212,255,0.1); border-color: rgba(0,212,255,0.2); }
.hi-status.skipped { color: #64748B; background: rgba(100,116,139,0.1); border-color: rgba(100,116,139,0.2); }
.hi-status.pending { color: #FFD700; background: rgba(255,215,0,0.1); border-color: rgba(255,215,0,0.2); }

/* ====== 转盘弹窗 ====== */
.wheel-mask {
	position: fixed; top: 0; right: 0; bottom: 0; left: 0;
	background: rgba(3,6,18,0.8);
	backdrop-filter: blur(14px);
	-webkit-backdrop-filter: blur(14px);
	display: flex; align-items: center; justify-content: center;
	z-index: 100;
	animation: fade-in 0.2s ease;
}
.wheel-overlay {
	width: 310px;
	padding: 24px 20px;
	border-radius: 28px;
	display: flex; flex-direction: column; align-items: center; gap: 16px;
	animation: spring-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
	background: linear-gradient(160deg, rgba(15,20,55,0.95), rgba(10,15,45,0.95));
	border: 1px solid rgba(0,212,255,0.15);
	box-shadow: 0 16px 48px rgba(0,0,0,0.5);
}
.wheel-title { font-size: 16px; font-weight: 800; color: #E2E8F0; }
.wheel-container {
	width: 210px; height: 210px;
	border-radius: 50%;
	position: relative;
	display: flex; align-items: center; justify-content: center;
}
.wheel-pointer {
	position: absolute; top: -6px; left: 50%;
	transform: translateX(-50%);
	width: 0; height: 0;
	border-left: 12px solid transparent;
	border-right: 12px solid transparent;
	border-top: 18px solid #FFD700;
	filter: drop-shadow(0 2px 8px rgba(255,215,0,0.6));
	z-index: 10;
}
.wheel-ring {
	width: 100%; height: 100%;
	border-radius: 50%;
	position: relative;
	transition: transform 4s cubic-bezier(0.05, 0.9, 0.2, 1);
	background: radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%);
	border: 2px solid rgba(0,212,255,0.15);
}
.wheel-player {
	position: absolute; top: 50%; left: 50%;
	transform-origin: 0 0;
	display: flex; flex-direction: column; align-items: center; gap: 2px;
}
.wheel-avatar {
	width: 38px; height: 38px;
	border-radius: 50%;
	background: rgba(255,255,255,0.08);
	border: 1px solid rgba(255,255,255,0.12);
	display: flex; align-items: center; justify-content: center;
	transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.wheel-avatar.selected {
	border-color: #FFD700;
	background: rgba(255,215,0,0.2);
	transform: scale(1.2);
	box-shadow: 0 0 24px rgba(255,215,0,0.5);
}
.wa-icon { font-size: 16px; font-weight: 700; color: #E2E8F0; }
.wheel-avatar.selected .wa-icon { color: #FFD700; }
.wheel-name { font-size: 9px; font-weight: 600; color: rgba(255,255,255,0.5); white-space: nowrap; }
.wheel-actions { display: flex; gap: 8px; width: 100%; }
.wheel-btn {
	flex: 1; padding: 10px;
	border-radius: 14px;
	display: flex; align-items: center; justify-content: center;
	transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.wheel-btn:active { transform: scale(0.95); }
.wheel-btn.spin {
	background: linear-gradient(135deg, #00D4FF, #06B6D4);
	box-shadow: 0 4px 16px rgba(0,212,255,0.35);
}
.wheel-btn.spin text { color: #060B1F; font-size: 14px; font-weight: 700; }
.wheel-btn.spin.disabled { opacity: 0.5; }
.wheel-btn.close {
	background: rgba(255,255,255,0.05);
	border: 1px solid rgba(255,255,255,0.08);
}
.wheel-btn.close text { color: rgba(255,255,255,0.6); font-size: 13px; font-weight: 600; }
.wheel-result { font-size: 14px; font-weight: 800; color: #FFD700; text-align: center; }

@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes fade-in-up { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes spring-pop {
	0% { transform: scale(0.8); opacity: 0; }
	60% { transform: scale(1.05); opacity: 1; }
	100% { transform: scale(1); opacity: 1; }
}

/* ====== 响应式 ====== */
@media screen and (max-height: 640px) {
	.card-text { font-size: 19px; }
	.card-face { padding: 12px 14px; }
	.status-bar { padding: 6px 12px; }
	.seg-item { padding: 8px 0; }
	.bottom-bar { padding-top: 2px; }
}
@media screen and (max-height: 560px) {
	.card-text { font-size: 17px; line-height: 1.4; }
	.card-face { padding: 10px 12px; }
	.status-bar { padding: 5px 10px; margin-bottom: 2rpx; }
	.ss-num { font-size: 16px; }
	.segmented-wrapper { margin-bottom: 4rpx; }
	.slider-section { margin: 4rpx 0 2rpx; }
	.btn-done { padding: 9px 20px; }
	.btn-skip { padding: 7px 13px; }
}
@media screen and (max-width: 360px) {
	.card-text { font-size: 20px; }
	.status-stats { gap: 8px; }
	.ss-num { font-size: 16px; }
	.bottom-left { gap: 6px; }
	.btn-skip { padding: 8px 12px; }
}

/* ====== 深色模式 ====== */
.container.dark .card-front {
	background: linear-gradient(160deg, rgba(5,8,25,0.97), rgba(8,12,30,0.95), rgba(3,5,18,0.97));
	border-color: rgba(255,255,255,0.05);
}
.container.dark .card-back {
	background: linear-gradient(160deg, rgba(5,8,25,0.97), rgba(8,12,30,0.95), rgba(3,5,18,0.97));
	border-color: rgba(255,215,0,0.12);
}
.container.dark .bg-vignette {
	background: radial-gradient(ellipse at 50% 40%,
		transparent 35%,
		rgba(3,6,18,0.6) 75%,
		rgba(3,6,18,0.9) 100%
	);
}

/* ====== 无障碍 - 减少动画 ====== */
@media (prefers-reduced-motion: reduce) {
	.bg-aurora-1, .bg-aurora-2, .bg-aurora-3 { animation: none; }
	.bg-stars { animation: none; }
	.status-dot { animation: none; }
	.back-emoji { animation: none; }
	.back-burst { animation: none; }
	.card-3d { transition: none; }
	.card-text.text-in { animation: none; }
	.card-text.text-out { opacity: 0; }
	.card-text.text-in { opacity: 1; }
}
</style>