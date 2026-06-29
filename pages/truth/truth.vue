<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useQuestionStore } from '@/stores/questions'

const store = useQuestionStore()

// ─── 题目 ───
const currentText = ref('')
const isRevealed = ref(false)
const revealText = ref('')
const isAnimating = ref(false)

// ─── 状态 ───
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

// ─── 弹窗 ───
const showHistory = ref(false)
const showWheel = ref(false)
const showAddInput = ref(false)
const addInputVal = ref('')

// ─── 转盘 ───
const wheelAngle = ref(0)
const wheelSpinning = ref(false)
const wheelResult = ref(null)
const wheelPlayers = computed(() => store.players.slice(0, 8))
const wheelSliceDeg = computed(() => 360 / wheelPlayers.value.length)

// ─── 回应 ───
const goodWords = ['干得漂亮！','太棒了！','好样的！','完美！','真给力！','精彩！']
const badWords = ['有点遗憾','加油啊','再试试','尴尬了','差一点','下次一定']
function pickResponse() {
	const pool = Math.random() > 0.3 ? goodWords : badWords
	return pool[Math.floor(Math.random() * pool.length)]
}

// ─── 强度 ───
const levels = ['温和','适中','较强','强烈','极限']
const levelEmoji = ['😌','🙂','😏','😰','🤯']

// ─── 抽题 ───
function draw() {
	if (isAnimating.value) return
	if (currentText.value && questionStatus.value === 'pending') {
		store.updateLastStatus('skipped')
	}
	questionStatus.value = 'pending'
	isRevealed.value = false
	isAnimating.value = true
	setTimeout(() => {
		currentText.value = store.getRandomWithHistory()
		isAnimating.value = false
	}, 200)
}

function skip() {
	if (isAnimating.value) return
	if (questionStatus.value === 'pending') {
		questionStatus.value = 'skipped'
		store.updateLastStatus('skipped')
	}
	draw()
}

function complete() {
	if (isAnimating.value) return
	if (isRevealed.value) {
		isRevealed.value = false
		draw()
		return
	}
	if (questionStatus.value === 'pending') {
		questionStatus.value = 'answered'
		store.updateLastStatus('answered')
	}
	revealText.value = pickResponse()
	isRevealed.value = true
}

// ─── 转盘 ───
function spinWheel() {
	if (wheelSpinning.value) return
	wheelSpinning.value = true
	wheelResult.value = null
	const idx = Math.floor(Math.random() * wheelPlayers.value.length)
	const spins = 4 + Math.floor(Math.random() * 2)
	const target = spins * 360 + (360 - idx * wheelSliceDeg.value - wheelSliceDeg.value / 2)
	wheelAngle.value += target
	setTimeout(() => {
		wheelResult.value = wheelPlayers.value[idx]
		wheelSpinning.value = false
	}, 4000)
}

function addQuestion() {
	const t = addInputVal.value.trim()
	if (!t) return
	store.addCustomQuestion(t)
	addInputVal.value = ''
	showAddInput.value = false
	uni.showToast({ title: '已添加', icon: 'success' })
}

function fmtTime(ts) {
	if (!ts) return ''
	const d = new Date(ts)
	return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0')
}
function statusTag(s) {
	return s === 'answered' ? '已答' : s === 'skipped' ? '跳过' : '待答'
}

onMounted(() => { currentText.value = store.getRandomWithHistory() })
</script>

<template>
<view class="page">
	<!-- 背景 -->
	<view class="bg">
		<view class="bg-orb bg-orb-1" :class="store.mode"></view>
		<view class="bg-orb bg-orb-2"></view>
	</view>

	<!-- 顶栏 -->
	<view class="topbar">
		<text class="topbar-title">真心话大冒险</text>
		<view class="topbar-btn" @tap="showHistory = true">
			<text class="topbar-btn-icon">📋</text>
		</view>
	</view>

	<!-- 模式切换 -->
	<view class="mode-bar">
		<view class="mode-opt" :class="{ on: store.mode === 'truth' }" @tap="store.setMode('truth'); isRevealed = false; draw()">
			<text class="mode-emoji">🧠</text>
			<text class="mode-txt">真心话</text>
		</view>
		<view class="mode-opt" :class="{ on: store.mode === 'dare' }" @tap="store.setMode('dare'); isRevealed = false; draw()">
			<text class="mode-emoji">🔥</text>
			<text class="mode-txt">大冒险</text>
		</view>
	</view>

	<!-- 统计条 -->
	<view class="stat-bar">
		<view class="stat-chip">
			<text class="stat-num" style="color:#00D4FF">{{ stats.answered }}</text>
			<text class="stat-lbl">已答</text>
		</view>
		<view class="stat-dot"></view>
		<view class="stat-chip">
			<text class="stat-num" style="color:#FF006E">{{ stats.skipped }}</text>
			<text class="stat-lbl">跳过</text>
		</view>
		<view class="stat-dot"></view>
		<view class="stat-chip">
			<text class="stat-num" style="color:#FFD700">{{ stats.total > 0 ? Math.round(stats.answered / stats.total * 100) : 0 }}%</text>
			<text class="stat-lbl">完成</text>
		</view>
	</view>

	<!-- 题目卡片 -->
	<view class="card" :class="store.mode">
		<!-- 状态行 -->
		<view class="card-header">
			<view class="card-badge" :class="store.mode">
				<text class="badge-emoji">{{ store.mode === 'truth' ? '🧠' : '🔥' }}</text>
				<text class="badge-txt">{{ store.mode === 'truth' ? 'TRUTH' : 'DARE' }}</text>
			</view>
			<view class="card-level" :class="store.mode">
				<text class="lv-emoji">{{ levelEmoji[store.intensity - 1] }}</text>
				<text class="lv-txt">Lv.{{ store.intensity }}</text>
			</view>
		</view>

		<!-- 题目内容 / 揭晓 -->
		<view class="card-body" v-if="!isRevealed">
			<text class="q-text" :class="{ fade: isAnimating }">{{ currentText || '加载中...' }}</text>
		</view>
		<view class="card-body card-reveal" v-else>
			<text class="reveal-emoji">✨</text>
			<text class="reveal-txt">{{ revealText }}</text>
			<text class="reveal-hint">点击「继续」换下一题</text>
		</view>

		<!-- 强度选择 -->
		<view class="levels" v-if="!isRevealed">
			<view
				v-for="i in 5" :key="i"
				class="lv-btn"
				:class="{ on: i <= store.intensity, [store.mode]: i <= store.intensity }"
				@tap="store.setIntensity(i)"
			>
				<text class="lv-btn-txt">{{ levels[i - 1] }}</text>
			</view>
		</view>
	</view>

	<!-- 操作栏 -->
	<view class="actions">
		<view class="act-left">
			<view class="act-btn act-skip" @tap="skip">
				<text class="act-btn-icon">⏭</text>
				<text class="act-btn-txt">换一题</text>
			</view>
			<view class="act-circle" @tap="showAddInput = !showAddInput">
				<text class="act-circle-txt">＋</text>
			</view>
			<view class="act-circle" @tap="showWheel = true">
				<text class="act-circle-txt">🎯</text>
			</view>
		</view>
		<view
			class="act-main"
			:class="store.mode"
			@tap="complete"
		>
			<text class="act-main-icon">{{ isRevealed ? '🔄' : '✓' }}</text>
			<text class="act-main-txt">{{ isRevealed ? '继续' : '完成' }}</text>
		</view>
	</view>

	<!-- 自定义输入 -->
	<view class="add-row" v-if="showAddInput">
		<input
			class="add-input"
			v-model="addInputVal"
			:placeholder="'自定义' + (store.mode === 'truth' ? '真心话' : '大冒险')"
			confirm-type="done"
			@confirm="addQuestion"
		/>
		<view class="add-btn" :class="store.mode" @tap="addQuestion">
			<text class="add-btn-txt">➤</text>
		</view>
	</view>

	<!-- ═══ 历史抽屉 ═══ -->
	<view class="overlay" v-if="showHistory" @tap="showHistory = false">
		<view class="sheet" @tap.stop>
			<view class="sheet-handle"></view>
			<view class="sheet-head">
				<text class="sheet-title">答题历史</text>
				<view class="sheet-clear" @tap="store.clearHistory()">
					<text class="sheet-clear-txt">清空</text>
				</view>
			</view>
			<scroll-view scroll-y class="sheet-list">
				<view v-if="store.historyRecent.length === 0" class="empty">
					<text class="empty-icon">📝</text>
					<text class="empty-txt">暂无记录</text>
				</view>
				<view v-for="r in store.historyRecent" :key="r.id" class="row">
					<view class="row-icon" :class="r.mode">
						<text>{{ r.mode === 'truth' ? '🧠' : '🔥' }}</text>
					</view>
					<view class="row-body">
						<text class="row-q">{{ r.content }}</text>
						<view class="row-meta">
							<text class="row-lv">Lv.{{ r.intensity }}</text>
							<text class="row-time">{{ fmtTime(r.timestamp) }}</text>
							<text class="row-status" :class="r.status">{{ statusTag(r.status) }}</text>
						</view>
					</view>
				</view>
			</scroll-view>
		</view>
	</view>

	<!-- ═══ 转盘弹窗 ═══ -->
	<view class="overlay center" v-if="showWheel" @tap="showWheel = false">
		<view class="wheel-popup" @tap.stop>
			<text class="wheel-title">🎯 随机抽人</text>
			<view class="wheel-box">
				<view class="wheel-pointer"></view>
				<view class="wheel-disc" :style="{ transform: 'rotate(' + wheelAngle + 'deg)' }">
					<view
						v-for="(p, i) in wheelPlayers" :key="p.id"
						class="wheel-p"
						:style="{ transform: 'rotate(' + (i * wheelSliceDeg) + 'deg) translateY(-80px)' }"
					>
						<view class="wheel-av" :class="{ picked: wheelResult?.id === p.id }">
							<text class="wheel-av-txt">{{ i + 1 }}</text>
						</view>
						<text class="wheel-nm">{{ p.name }}</text>
					</view>
				</view>
			</view>
			<view class="wheel-btns">
				<view class="wbtn wbtn-go" :class="{ off: wheelSpinning }" @tap="spinWheel">
					<text class="wbtn-txt">{{ wheelSpinning ? '转动中...' : '🎲 开始' }}</text>
				</view>
				<view class="wbtn wbtn-close" @tap="showWheel = false">
					<text class="wbtn-txt">关闭</text>
				</view>
			</view>
			<text class="wheel-result" v-if="wheelResult">✨ {{ wheelResult.name }}</text>
		</view>
	</view>
</view>
</template>

<style scoped>
/* ═══════════════════════════════════════════
   真心话大冒险 — 简洁可靠版
   纯 flex 布局，无 absolute 卡片，无 3D
   ═══════════════════════════════════════════ */

.page {
	display: flex;
	flex-direction: column;
	flex: 1;
	background: #0B1120;
	position: relative;
	overflow: hidden;
}

/* ── 背景 ── */
.bg {
	position: absolute; inset: 0;
	pointer-events: none; z-index: 0;
	overflow: hidden;
}
.bg-orb {
	position: absolute;
	border-radius: 50%;
	filter: blur(60px);
	opacity: 0.4;
}
.bg-orb-1 {
	width: 260px; height: 260px;
	top: -60px; right: -40px;
	background: radial-gradient(circle, rgba(0,212,255,0.6), transparent 70%);
	animation: drift 8s ease-in-out infinite alternate;
}
.bg-orb-1.dare {
	background: radial-gradient(circle, rgba(255,0,110,0.6), transparent 70%);
}
.bg-orb-2 {
	width: 200px; height: 200px;
	bottom: 15%; left: -30px;
	background: radial-gradient(circle, rgba(139,92,246,0.5), transparent 70%);
	animation: drift 10s ease-in-out infinite alternate-reverse;
}
@keyframes drift {
	from { transform: translate(0,0) scale(1); }
	to { transform: translate(20px,15px) scale(1.1); }
}

/* ── 顶栏 ── */
.topbar {
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 12px 20px;
	padding-top: calc(var(--safe-area-top, 0px) + 12px);
	position: relative;
	z-index: 2;
}
.topbar-title {
	font-size: 22px;
	font-weight: 800;
	color: #E2E8F0;
}
.topbar-btn {
	width: 44px; height: 44px;
	border-radius: 50%;
	background: rgba(255,255,255,0.08);
	display: flex; align-items: center; justify-content: center;
}
.topbar-btn:active { background: rgba(255,255,255,0.15); }
.topbar-btn-icon { font-size: 20px; }

/* ── 模式切换 ── */
.mode-bar {
	flex-shrink: 0;
	display: flex;
	margin: 4px 20px 8px;
	background: rgba(255,255,255,0.06);
	border-radius: 16px;
	padding: 4px;
	position: relative;
	z-index: 2;
}
.mode-opt {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	padding: 12px 0;
	border-radius: 12px;
	transition: all 0.3s;
}
.mode-opt.on.truth {
	background: linear-gradient(135deg, #00D4FF, #06B6D4);
	box-shadow: 0 2px 16px rgba(0,212,255,0.4);
}
.mode-opt.on.dare {
	background: linear-gradient(135deg, #FF006E, #EC4899);
	box-shadow: 0 2px 16px rgba(255,0,110,0.4);
}
.mode-emoji { font-size: 18px; }
.mode-txt {
	font-size: 15px;
	font-weight: 700;
	color: rgba(255,255,255,0.6);
	transition: color 0.3s;
}
.mode-opt.on .mode-txt { color: #0B1120; }

/* ── 统计条 ── */
.stat-bar {
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 14px;
	padding: 8px 20px 10px;
	position: relative;
	z-index: 2;
}
.stat-chip {
	display: flex;
	align-items: center;
	gap: 4px;
}
.stat-num {
	font-size: 18px;
	font-weight: 800;
	font-variant-numeric: tabular-nums;
}
.stat-lbl {
	font-size: 12px;
	color: rgba(255,255,255,0.6);
	font-weight: 600;
}
.stat-dot {
	width: 3px; height: 3px;
	border-radius: 50%;
	background: rgba(255,255,255,0.15);
}

/* ═══════════════════════════════════════════
   题目卡片 — 纯 flex，无 absolute
   ═══════════════════════════════════════════ */
.card {
	flex: 1;
	min-height: 0;
	display: flex;
	flex-direction: column;
	margin: 0 16px;
	border-radius: 24px;
	padding: 18px 20px;
	position: relative;
	z-index: 1;
	overflow: hidden;
}
.card.truth {
	background: linear-gradient(160deg, rgba(12,20,50,0.92), rgba(8,14,38,0.95));
	border: 1px solid rgba(0,212,255,0.2);
	box-shadow: 0 0 30px rgba(0,212,255,0.06) inset, 0 8px 32px rgba(0,0,0,0.4);
}
.card.dare {
	background: linear-gradient(160deg, rgba(12,20,50,0.92), rgba(8,14,38,0.95));
	border: 1px solid rgba(255,0,110,0.2);
	box-shadow: 0 0 30px rgba(255,0,110,0.06) inset, 0 8px 32px rgba(0,0,0,0.4);
}

.card-header {
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 10px;
}
.card-badge {
	display: flex;
	align-items: center;
	gap: 5px;
	padding: 5px 14px;
	border-radius: 999px;
}
.card-badge.truth {
	background: rgba(0,212,255,0.12);
	border: 1px solid rgba(0,212,255,0.2);
}
.card-badge.dare {
	background: rgba(255,0,110,0.12);
	border: 1px solid rgba(255,0,110,0.2);
}
.badge-emoji { font-size: 16px; }
.badge-txt {
	font-size: 12px;
	font-weight: 800;
	letter-spacing: 1.5px;
}
.card-badge.truth .badge-txt { color: #00D4FF; }
.card-badge.dare .badge-txt { color: #FF006E; }

.card-level {
	display: flex;
	align-items: center;
	gap: 4px;
	padding: 5px 12px;
	border-radius: 999px;
}
.card-level.truth {
	background: rgba(0,212,255,0.08);
	border: 1px solid rgba(0,212,255,0.12);
}
.card-level.dare {
	background: rgba(255,0,110,0.08);
	border: 1px solid rgba(255,0,110,0.12);
}
.lv-emoji { font-size: 15px; }
.lv-txt {
	font-size: 11px;
	font-weight: 800;
}
.card-level.truth .lv-txt { color: #00D4FF; }
.card-level.dare .lv-txt { color: #FF006E; }

/* 题目正文 */
.card-body {
	flex: 1;
	min-height: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 12px 8px;
}
.q-text {
	font-size: 26px;
	font-weight: 700;
	line-height: 1.5;
	color: #E2E8F0;
	text-align: center;
	word-break: break-word;
	transition: opacity 0.2s;
}
.q-text.fade { opacity: 0; }

/* 揭晓 */
.card-reveal { gap: 14px; }
.reveal-emoji { font-size: 48px; }
.reveal-txt {
	font-size: 26px;
	font-weight: 800;
	color: #FFD700;
	text-shadow: 0 2px 20px rgba(255,215,0,0.4);
}
.reveal-hint {
	font-size: 13px;
	color: rgba(255,255,255,0.55);
}

/* 强度选择 */
.levels {
	flex-shrink: 0;
	display: flex;
	gap: 4px;
	background: rgba(255,255,255,0.04);
	border-radius: 12px;
	padding: 3px;
	margin-top: 10px;
}
.lv-btn {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 10px 0;
	border-radius: 10px;
	transition: all 0.25s;
}
.lv-btn:active { transform: scale(0.95); }
.lv-btn-txt {
	font-size: 13px;
	font-weight: 600;
	color: rgba(255,255,255,0.5);
	transition: all 0.25s;
}
.lv-btn.on.truth {
	background: rgba(0,212,255,0.15);
	border: 1px solid rgba(0,212,255,0.25);
}
.lv-btn.on.truth .lv-btn-txt { color: #00D4FF; font-weight: 700; }
.lv-btn.on.dare {
	background: rgba(255,0,110,0.15);
	border: 1px solid rgba(255,0,110,0.25);
}
.lv-btn.on.dare .lv-btn-txt { color: #FF006E; font-weight: 700; }

/* ═══════════════════════════════════════════
   操作栏
   ═══════════════════════════════════════════ */
.actions {
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 10px 16px 12px;
	position: relative;
	z-index: 2;
}
.act-left { display: flex; align-items: center; gap: 8px; }
.act-btn {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 12px 18px;
	border-radius: 999px;
	background: rgba(255,255,255,0.06);
	border: 1px solid rgba(255,255,255,0.08);
}
.act-btn:active { background: rgba(255,255,255,0.12); }
.act-btn-icon { font-size: 16px; }
.act-btn-txt { font-size: 15px; font-weight: 700; color: rgba(255,255,255,0.88); }
.act-circle {
	width: 44px; height: 44px;
	border-radius: 50%;
	display: flex; align-items: center; justify-content: center;
	background: rgba(255,255,255,0.06);
	border: 1px solid rgba(255,255,255,0.08);
}
.act-circle:active { background: rgba(255,255,255,0.12); }
.act-circle-txt { font-size: 20px; font-weight: 700; color: rgba(255,255,255,0.8); }

.act-main {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 14px 28px;
	border-radius: 999px;
}
.act-main:active { transform: scale(0.96); }
.act-main.truth {
	background: linear-gradient(135deg, #00D4FF, #06B6D4);
	box-shadow: 0 4px 24px rgba(0,212,255,0.4);
}
.act-main.dare {
	background: linear-gradient(135deg, #FF006E, #EC4899);
	box-shadow: 0 4px 24px rgba(255,0,110,0.4);
}
.act-main-icon { font-size: 18px; color: #0B1120; }
.act-main-txt { font-size: 17px; font-weight: 800; color: #0B1120; }

/* ── 自定义输入 ── */
.add-row {
	flex-shrink: 0;
	display: flex;
	gap: 6px;
	padding: 0 12px 8px;
	position: relative;
	z-index: 2;
}
.add-input {
	flex: 1;
	border-radius: 10px;
	padding: 8px 12px;
	font-size: 12px;
	color: #E2E8F0;
	background: rgba(255,255,255,0.06);
	border: 1px solid rgba(255,255,255,0.1);
}
.add-btn {
	width: 34px; height: 34px;
	border-radius: 50%;
	display: flex; align-items: center; justify-content: center;
}
.add-btn.truth { background: linear-gradient(135deg, #00D4FF, #06B6D4); }
.add-btn.dare { background: linear-gradient(135deg, #FF006E, #EC4899); }
.add-btn-txt { font-size: 14px; color: #0B1120; }

/* ═══════════════════════════════════════════
   弹窗通用
   ═══════════════════════════════════════════ */
.overlay {
	position: fixed; inset: 0;
	background: rgba(0,0,0,0.7);
	z-index: 100;
	display: flex;
	align-items: flex-end;
	justify-content: center;
}
.overlay.center { align-items: center; }

/* ── 历史抽屉 ── */
.sheet {
	width: 100%;
	max-height: 70vh;
	background: #111827;
	border-radius: 20px 20px 0 0;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	animation: slide-up 0.3s ease;
}
@keyframes slide-up {
	from { transform: translateY(100%); }
	to { transform: translateY(0); }
}
.sheet-handle {
	width: 30px; height: 3px;
	border-radius: 2px;
	background: rgba(255,255,255,0.15);
	align-self: center;
	margin: 8px 0 4px;
}
.sheet-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 10px 16px 8px;
}
.sheet-title { font-size: 15px; font-weight: 800; color: #E2E8F0; }
.sheet-clear {
	padding: 4px 10px;
	border-radius: 999px;
	background: rgba(255,255,255,0.06);
}
.sheet-clear-txt { font-size: 15px; color: rgba(255,255,255,0.65); font-weight: 600; }
.sheet-list { flex: 1; padding: 8px 16px 16px; max-height: 50vh; }
.empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 6px;
	padding: 40px 0;
}
.empty-icon { font-size: 32px; opacity: 0.2; }
.empty-txt { font-size: 14px; color: rgba(255,255,255,0.5); }
.row {
	display: flex;
	align-items: flex-start;
	gap: 8px;
	padding: 10px;
	border-radius: 12px;
	background: rgba(255,255,255,0.03);
	margin-bottom: 6px;
}
.row-icon {
	width: 28px; height: 28px;
	border-radius: 8px;
	display: flex; align-items: center; justify-content: center;
	flex-shrink: 0;
}
.row-icon.truth { background: rgba(0,212,255,0.1); }
.row-icon.dare { background: rgba(255,0,110,0.1); }
.row-body { flex: 1; display: flex; flex-direction: column; gap: 3px; }
.row-q { font-size: 12px; color: rgba(255,255,255,0.7); line-height: 1.4; }
.row-meta { display: flex; gap: 6px; align-items: center; }
.row-lv { font-size: 11px; color: rgba(255,255,255,0.5); font-weight: 600; }
.row-time { font-size: 11px; color: rgba(255,255,255,0.5); }
.row-status {
	font-size: 9px; font-weight: 700;
	padding: 1px 6px; border-radius: 999px;
}
.row-status.answered { color: #00D4FF; background: rgba(0,212,255,0.1); }
.row-status.skipped { color: #94A3B8; background: rgba(148,163,184,0.15); }
.row-status.pending { color: #FFD700; background: rgba(255,215,0,0.1); }

/* ── 转盘弹窗 ── */
.wheel-popup {
	width: 280px;
	padding: 20px 16px;
	border-radius: 20px;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
	background: #111827;
	border: 1px solid rgba(255,255,255,0.08);
	box-shadow: 0 16px 48px rgba(0,0,0,0.5);
	animation: pop 0.3s ease;
}
@keyframes pop {
	from { transform: scale(0.85); opacity: 0; }
	to { transform: scale(1); opacity: 1; }
}
.wheel-title { font-size: 14px; font-weight: 800; color: #E2E8F0; }
.wheel-box {
	width: 180px; height: 180px;
	border-radius: 50%;
	position: relative;
	display: flex; align-items: center; justify-content: center;
}
.wheel-pointer {
	position: absolute;
	top: -4px; left: 50%;
	transform: translateX(-50%);
	width: 0; height: 0;
	border-left: 8px solid transparent;
	border-right: 8px solid transparent;
	border-top: 14px solid #FFD700;
	filter: drop-shadow(0 2px 6px rgba(255,215,0,0.5));
	z-index: 10;
}
.wheel-disc {
	width: 100%; height: 100%;
	border-radius: 50%;
	position: relative;
	transition: transform 4s cubic-bezier(0.05,0.9,0.2,1);
	border: 2px solid rgba(255,255,255,0.1);
	background: radial-gradient(circle, rgba(0,212,255,0.04), transparent 70%);
}
.wheel-p {
	position: absolute;
	top: 50%; left: 50%;
	transform-origin: 0 0;
	display: flex; flex-direction: column; align-items: center; gap: 1px;
}
.wheel-av {
	width: 30px; height: 30px;
	border-radius: 50%;
	background: rgba(255,255,255,0.08);
	border: 1px solid rgba(255,255,255,0.1);
	display: flex; align-items: center; justify-content: center;
	transition: all 0.3s;
}
.wheel-av.picked {
	border-color: #FFD700;
	background: rgba(255,215,0,0.2);
	transform: scale(1.15);
	box-shadow: 0 0 16px rgba(255,215,0,0.4);
}
.wheel-av-txt { font-size: 12px; font-weight: 700; color: #E2E8F0; }
.wheel-av.picked .wheel-av-txt { color: #FFD700; }
.wheel-nm { font-size: 9px; font-weight: 600; color: rgba(255,255,255,0.6); white-space: nowrap; }
.wheel-btns { display: flex; gap: 6px; width: 100%; }
.wbtn {
	flex: 1;
	padding: 8px;
	border-radius: 10px;
	display: flex; align-items: center; justify-content: center;
}
.wbtn:active { transform: scale(0.96); }
.wbtn-go {
	background: linear-gradient(135deg, #00D4FF, #06B6D4);
	box-shadow: 0 4px 12px rgba(0,212,255,0.3);
}
.wbtn-go.off { opacity: 0.5; }
.wbtn-txt { font-size: 12px; font-weight: 700; color: #0B1120; }
.wbtn-close {
	background: rgba(255,255,255,0.06);
	border: 1px solid rgba(255,255,255,0.08);
}
.wbtn-close .wbtn-txt { color: rgba(255,255,255,0.7); }
.wheel-result { font-size: 13px; font-weight: 800; color: #FFD700; }
</style>
