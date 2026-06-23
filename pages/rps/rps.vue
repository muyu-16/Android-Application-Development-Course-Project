﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿<script setup>
import { ref, computed } from 'vue'
import NavBar from '@/components/NavBar.vue'
import { useThemeAware } from '@/composables/useThemeAware'

const { isDark } = useThemeAware()

// 回合规则
const choices = [
	{ id: 'rock', icon: '✊', label: '石头', beats: 'scissors' },
	{ id: 'paper', icon: '🖐', label: '布', beats: 'rock' },
	{ id: 'scissors', icon: '✌️', label: '剪刀', beats: 'paper' }
]

const matchModes = [
	{ label: '3局2胜', value: 3 },
	{ label: '5局3胜', value: 5 }
]

// 状态
const playerScore = ref(0)
const computerScore = ref(0)
const playerChoice = ref('')
const computerChoice = ref('')
const roundResult = ref('')       // 'win' | 'lose' | 'draw'
const resultText = ref('')
const isPlaying = ref(false)
const countdown = ref(0)
const matchMode = ref(3)          // 3 or 5
const winnerPulse = ref('')       // 'player' | 'computer' | ''
const showResultModal = ref(false)
const finalMatchResult = ref('')
const selectedBtn = ref('')       // tracking button press animation

// 比分
const winTarget = computed(() => Math.ceil(matchMode.value / 2))

const isMatchOver = computed(() => {
	return playerScore.value >= winTarget.value || computerScore.value >= winTarget.value
})

const matchStatus = computed(() => {
	return `${playerScore.value} : ${computerScore.value} / ${winTarget.value}胜`
})

// 结果判断
function getRandomChoice() {
	return choices[Math.floor(Math.random() * choices.length)].id
}

function determineWinner(player, computer) {
	if (player === computer) return 'draw'
	const c = choices.find(x => x.id === player)
	return c.beats === computer ? 'win' : 'lose'
}

function setMode(val) {
	if (isPlaying.value) return
	matchMode.value = val
	resetAll()
}

function play(choice) {
	if (isPlaying.value || isMatchOver.value) return

	// 震动反馈
	uni.vibrateShort({ type: 'light' })

	selectedBtn.value = choice
	playerChoice.value = choice
	computerChoice.value = ''
	roundResult.value = ''
	resultText.value = ''
	winnerPulse.value = ''

	// 清除 scale 动画后 selectedBtn 状态
	setTimeout(() => { selectedBtn.value = '' }, 300)

	isPlaying.value = true

	// 倒计时3秒
	countdown.value = 3
	const countInterval = setInterval(() => {
		countdown.value--
		if (countdown.value <= 0) {
			clearInterval(countInterval)

			// AI 延迟 800ms 出拳
			setTimeout(() => {
				const aiChoice = getRandomChoice()
				computerChoice.value = aiChoice

				// 结果
				const res = determineWinner(choice, aiChoice)
				roundResult.value = res

				if (res === 'win') {
					resultText.value = '你赢了！'
					playerScore.value++
					winnerPulse.value = 'player'
					uni.vibrateShort({ type: 'medium' })
				} else if (res === 'lose') {
					resultText.value = '电脑赢了！'
					computerScore.value++
					winnerPulse.value = 'computer'
				} else {
					resultText.value = '平局！'
				}

				isPlaying.value = false

				// 检查比赛是否结束
				if (isMatchOver.value) {
					setTimeout(() => {
						const won = playerScore.value >= winTarget.value
						finalMatchResult.value = won ? '恭喜，你获胜！' : '太可惜了，你战败！'
						showResultModal.value = true
					}, 800)
				}
			}, 800)
		}
	}, 700)
}

function resetAll() {
	playerScore.value = 0
	computerScore.value = 0
	playerChoice.value = ''
	computerChoice.value = ''
	roundResult.value = ''
	resultText.value = ''
	isPlaying.value = false
	countdown.value = 0
	winnerPulse.value = ''
	showResultModal.value = false
	finalMatchResult.value = ''
	selectedBtn.value = ''
}

function closeModal() {
	showResultModal.value = false
	resetAll()
}

function playAgain() {
	showResultModal.value = false
	resetAll()
}
</script>

<template>
	<view class="container" :class="{ 'dark': isDark }">
		<!-- 背景装饰光晕 -->
		<view class="bg-decoration">
			<view class="bg-orb bg-orb-1"></view>
			<view class="bg-orb bg-orb-2"></view>
			<view class="bg-orb bg-orb-3"></view>
		</view>

		<!-- 导航栏 -->
		<NavBar title="猜拳">
			<template #right>
				<view class="segmented">
					<view
						v-for="mode in matchModes"
						:key="mode.value"
						class="seg-item"
						:class="{ active: matchMode === mode.value }"
						@tap="setMode(mode.value)"
					>
						<text>{{ mode.label }}</text>
					</view>
				</view>
			</template>
		</NavBar>

		<!-- 比分条 -->
		<view class="score-bar">
			<view class="score-side player-side">
				<text class="score-label">你</text>
				<text class="score-value num">{{ playerScore }}</text>
			</view>
			<view class="score-center">
				<text class="score-vs">VS</text>
				<text class="score-target num">BO{{ matchMode }}</text>
			</view>
			<view class="score-side computer-side">
				<text class="score-label">电脑</text>
				<text class="score-value num">{{ computerScore }}</text>
			</view>
		</view>

		<!-- 对战区 -->
		<view class="battle-area">
			<!-- 玩家卡片 -->
			<view class="fighter-card player-fighter" :class="{ winner: winnerPulse === 'player', loser: winnerPulse === 'computer' }">
				<view class="fighter-avatar">
					<text class="avatar-emoji">🧑</text>
				</view>
				<text class="fighter-name">你</text>
				<!-- 出拳显示 -->
				<view class="fighter-hand" v-if="playerChoice">
					<text class="hand-emoji" :class="{ 'hand-in': playerChoice }">{{ choices.find(c => c.id === playerChoice)?.icon }}</text>
				</view>
				<view class="fighter-idle" v-else-if="!isPlaying">
					<text class="idle-icon">✊</text>
				</view>
				<view class="fighter-thinking" v-else>
					<text class="dots">●●●</text>
				</view>
				<!-- 胜利光环 -->
				<view class="victory-ring" v-if="winnerPulse === 'player'"></view>
			</view>

			<!-- 中央对战信息 -->
			<view class="battle-center">
				<view class="center-line"></view>
				<view class="center-badge" v-if="!isPlaying && !resultText && !isMatchOver">
					<text class="badge-text">准备</text>
				</view>
				<view class="center-countdown" v-if="countdown > 0">
					<text class="countdown-num num" :key="countdown">{{ countdown }}</text>
				</view>
				<view class="center-result" v-if="resultText && !isPlaying">
					<text class="result-text" :class="roundResult">{{ resultText }}</text>
				</view>
				<view class="center-badge" v-if="isMatchOver && !showResultModal">
					<text class="badge-text">结束</text>
				</view>
			</view>

			<!-- 电脑卡片 -->
			<view class="fighter-card computer-fighter" :class="{ winner: winnerPulse === 'computer', loser: winnerPulse === 'player' }">
				<view class="fighter-avatar">
					<text class="avatar-emoji">🤖</text>
				</view>
				<text class="fighter-name">电脑</text>
				<!-- 出拳显示 -->
				<view class="fighter-hand" v-if="computerChoice">
					<text class="hand-emoji" :class="{ 'hand-in': computerChoice }">{{ choices.find(c => c.id === computerChoice)?.icon }}</text>
				</view>
				<view class="fighter-idle" v-else-if="!isPlaying">
					<text class="idle-icon">✊</text>
				</view>
				<view class="fighter-thinking" v-else>
					<text class="dots">●●●</text>
				</view>
				<!-- 胜利光环 -->
				<view class="victory-ring" v-if="winnerPulse === 'computer'"></view>
			</view>
		</view>

		<!-- 底部出拳区 -->
		<view class="action-area">
			<text class="action-hint" v-if="!isPlaying && !isMatchOver">选择你的出拳</text>
			<text class="action-hint" v-else-if="isPlaying">对战中...</text>
			<text class="action-hint" v-else-if="isMatchOver">比赛结束</text>

			<view class="action-row">
				<view
					v-for="choice in choices"
					:key="choice.id"
					class="action-btn"
					:class="{
						pressed: selectedBtn === choice.id,
						disabled: isPlaying || isMatchOver
					}"
					@tap="play(choice.id)"
				>
					<text class="btn-emoji">{{ choice.icon }}</text>
					<text class="btn-label">{{ choice.label }}</text>
				</view>
			</view>
		</view>

		<!-- 结果弹窗 -->
		<view class="modal-mask" v-if="showResultModal" @tap="closeModal">
			<view class="modal-card" @tap.stop>
				<view class="modal-icon-wrap">
					<text class="modal-icon">{{ finalMatchResult.includes('获') ? '🏆' : '😞' }}</text>
				</view>
				<text class="modal-title">{{ finalMatchResult }}</text>
				<view class="modal-score">
					<text class="modal-score-num num">{{ playerScore }}</text>
					<text class="modal-score-colon">:</text>
					<text class="modal-score-num num">{{ computerScore }}</text>
				</view>
				<view class="modal-actions">
					<view class="modal-btn primary-btn" @tap="playAgain">
						<text class="modal-btn-text">再来一局</text>
					</view>
					<view class="modal-btn secondary-btn" @tap="closeModal">
						<text class="modal-btn-text">关闭</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<style scoped>
/* ═══════════════════════════════════════════════════
   容器 — 橙红竞技渐变背景
   ═══════════════════════════════════════════════════ */
.container {
	flex: 1;
	padding: 0;
	padding-top: calc(var(--safe-area-top, 24px));
	padding-bottom: 0;
	background: linear-gradient(160deg, #FFF3E0 0%, #FFE0B2 30%, #FFCCBC 65%, #FCE4EC 100%);
	display: flex;
	flex-direction: column;
	position: relative;
	overflow: hidden;
	touch-action: manipulation;
	-webkit-overflow-scrolling: auto;
}
.container.dark {
	background: linear-gradient(160deg, #1E1410 0%, #2A1A14 30%, #2A1820 65%, #1E1420 100%);
}

/* ═══════════════════════════════════════════════════
   背景光晕
   ═══════════════════════════════════════════════════ */
.bg-decoration {
	position: fixed;
	top: 0; left: 0; right: 0; bottom: 0;
	pointer-events: none;
	z-index: 0;
}
.bg-orb {
	position: absolute;
	border-radius: 50%;
	filter: blur(40px);
}
.bg-orb-1 {
	width: 220px; height: 220px;
	background: radial-gradient(circle, rgba(255, 152, 0, 0.35) 0%, transparent 70%);
	top: -60px; right: -40px;
}
.bg-orb-2 {
	width: 180px; height: 180px;
	background: radial-gradient(circle, rgba(244, 67, 54, 0.25) 0%, transparent 70%);
	bottom: 100px; left: -60px;
}
.bg-orb-3 {
	width: 120px; height: 120px;
	background: radial-gradient(circle, rgba(255, 193, 7, 0.30) 0%, transparent 70%);
	top: 35%; left: 45%;
}
.dark .bg-orb-1 { background: radial-gradient(circle, rgba(255, 152, 0, 0.12) 0%, transparent 70%); }
.dark .bg-orb-2 { background: radial-gradient(circle, rgba(244, 67, 54, 0.10) 0%, transparent 70%); }
.dark .bg-orb-3 { background: radial-gradient(circle, rgba(255, 193, 7, 0.08) 0%, transparent 70%); }

/* ═══════════════════════════════════════════════════
   分段器（导航栏内）
   ═══════════════════════════════════════════════════ */
.segmented {
	display: flex;
	background: rgba(255, 255, 255, 0.65);
	backdrop-filter: blur(14px) saturate(180%);
	-webkit-backdrop-filter: blur(14px) saturate(180%);
	border: 1px solid rgba(255, 255, 255, 0.4);
	box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.6);
	border-radius: 999px;
	padding: 2px;
	gap: 2px;
}
.dark .segmented {
	background: rgba(255, 255, 255, 0.08);
	border-color: rgba(255, 255, 255, 0.12);
}
.seg-item {
	padding: 5px 11px;
	border-radius: 999px;
	font-size: 11px;
	font-weight: 600;
	color: var(--clr-text-secondary);
	transition: all 0.25s var(--ease-spring);
}
.seg-item.active {
	background: linear-gradient(135deg, #FF9800, #FF5722);
	color: #FFF;
	box-shadow: 0 2px 12px rgba(255, 87, 34, 0.35);
}
.dark .seg-item { color: rgba(255, 255, 255, 0.6); }
.dark .seg-item.active { color: #FFF; }

/* ═══════════════════════════════════════════════════
   比分条
   ═══════════════════════════════════════════════════ */
.score-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 4px 14px;
	border-radius: 18px;
	background: rgba(255, 255, 255, 0.55);
	backdrop-filter: blur(14px) saturate(180%);
	-webkit-backdrop-filter: blur(14px) saturate(180%);
	border: 1px solid rgba(255, 255, 255, 0.5);
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.6);
	position: relative;
	z-index: 1;
	margin-bottom: 2px;
}
.dark .score-bar {
	background: rgba(255, 255, 255, 0.06);
	border-color: rgba(255, 255, 255, 0.1);
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}
.score-side {
	display: flex;
	align-items: center;
	gap: 6px;
}
.score-label {
	font-size: 12px;
	font-weight: 600;
	color: var(--clr-text-secondary);
}
.dark .score-label { color: rgba(255, 255, 255, 0.5); }
.score-value {
	font-size: 22px;
	font-weight: 800;
}
.player-side .score-value { color: #FF6F00; }
.computer-side .score-value { color: #D32F2F; }
.dark .player-side .score-value { color: #FFB74D; }
.dark .computer-side .score-value { color: #EF9A9A; }
.score-center {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0;
}
.score-vs {
	font-size: 14px;
	font-weight: 900;
	color: var(--clr-text-secondary);
	letter-spacing: 1px;
}
.dark .score-vs { color: rgba(255, 255, 255, 0.4); }
.score-target {
	font-size: 10px;
	font-weight: 600;
	color: var(--clr-text-disabled);
}

/* ═══════════════════════════════════════════════════
   对战区
   ═══════════════════════════════════════════════════ */
.battle-area {
	flex: none;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 4px;
	position: relative;
	z-index: 1;
	min-height: 0;
	padding-top: 12px;
	margin-bottom: 0;
}

/* 战斗卡片 */
.fighter-card {
	width: 110px;
	height: 110px;
	max-width: 28vw;
	max-height: 28vw;
	border-radius: 22px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 2px;
	position: relative;
	overflow: visible;
	transition: all 0.4s var(--ease-spring);
	box-sizing: border-box;
}
.player-fighter {
	background: rgba(255, 255, 255, 0.55);
	backdrop-filter: blur(16px) saturate(180%);
	-webkit-backdrop-filter: blur(16px) saturate(180%);
	border: 1.5px solid rgba(255, 152, 0, 0.35);
	box-shadow: 0 8px 24px rgba(255, 152, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.7);
}
.computer-fighter {
	background: rgba(255, 255, 255, 0.55);
	backdrop-filter: blur(16px) saturate(180%);
	-webkit-backdrop-filter: blur(16px) saturate(180%);
	border: 1.5px solid rgba(244, 67, 54, 0.35);
	box-shadow: 0 8px 24px rgba(244, 67, 54, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.7);
}
.dark .player-fighter {
	background: rgba(255, 152, 0, 0.08);
	border-color: rgba(255, 152, 0, 0.25);
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}
.dark .computer-fighter {
	background: rgba(244, 67, 54, 0.08);
	border-color: rgba(244, 67, 54, 0.25);
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

/* 获胜状态 */
.fighter-card.winner {
	transform: scale(1.06);
	border-color: #FFD700 !important;
	border-width: 2.5px !important;
	box-shadow: 0 0 30px rgba(255, 215, 0, 0.45), inset 0 0 20px rgba(255, 215, 0, 0.08);
	animation: gold-pulse 1.2s ease-in-out 2;
}
.fighter-card.loser {
	opacity: 0.45;
	transform: scale(0.94);
}
@keyframes gold-pulse {
	0%, 100% { box-shadow: 0 0 16px rgba(255, 215, 0, 0.3); }
	50% { box-shadow: 0 0 40px rgba(255, 215, 0, 0.65); }
}

/* 胜利光环 */
.victory-ring {
	position: absolute;
	inset: -10px;
	border-radius: 32px;
	border: 3px solid #FFD700;
	opacity: 0;
	animation: ring-expand 0.7s ease-out 2;
	pointer-events: none;
}
@keyframes ring-expand {
	0% { transform: scale(0.85); opacity: 0.9; }
	100% { transform: scale(1.2); opacity: 0; }
}

/* 头像 */
.fighter-avatar {
	width: 32px;
	height: 32px;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.7);
	backdrop-filter: blur(10px);
	-webkit-backdrop-filter: blur(10px);
	border: 1px solid rgba(255, 255, 255, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
}
.dark .fighter-avatar {
	background: rgba(255, 255, 255, 0.1);
	border-color: rgba(255, 255, 255, 0.15);
}
.avatar-emoji {
	font-size: 18px;
}

/* 名称 */
.fighter-name {
	font-size: 13px;
	font-weight: 700;
	color: var(--clr-text-primary);
}
.dark .fighter-name { color: rgba(255, 255, 255, 0.85); }

/* 出拳手势 */
.fighter-hand {
	margin-top: 2px;
}
.hand-emoji {
	font-size: 26px;
	display: inline-block;
}
.hand-emoji.hand-in {
	animation: hand-pop 0.5s var(--ease-bounce);
}
@keyframes hand-pop {
	0% { transform: scale(0) rotate(-180deg); opacity: 0; }
	60% { transform: scale(1.2) rotate(10deg); opacity: 1; }
	100% { transform: scale(1) rotate(0deg); opacity: 1; }
}

/* 待机状态 */
.fighter-idle {
	margin-top: 2px;
}
.idle-icon {
	font-size: 22px;
	opacity: 0.35;
}

/* 思考中 */
.fighter-thinking {
	margin-top: 2px;
}
.dots {
	font-size: 14px;
	font-weight: 700;
	color: var(--clr-text-secondary);
	letter-spacing: 2px;
	animation: blink 0.6s ease-in-out infinite;
}
.dark .dots { color: rgba(255, 255, 255, 0.5); }
@keyframes blink {
	0%, 100% { opacity: 0.3; }
	50% { opacity: 1; }
}

/* ═══════════════════════════════════════════════════
   中央对战信息
   ═══════════════════════════════════════════════════ */
.battle-center {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	width: 48px;
	height: 110px;
	position: relative;
}
.center-line {
	position: absolute;
	top: 10px; bottom: 10px;
	width: 2px;
	background: linear-gradient(to bottom, transparent, rgba(255, 152, 0, 0.25) 20%, rgba(244, 67, 54, 0.25) 80%, transparent);
}
.dark .center-line {
	background: linear-gradient(to bottom, transparent, rgba(255, 152, 0, 0.12) 20%, rgba(244, 67, 54, 0.12) 80%, transparent);
}
.center-badge {
	width: 44px;
	height: 44px;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.75);
	backdrop-filter: blur(12px);
	-webkit-backdrop-filter: blur(12px);
	border: 1px solid rgba(255, 255, 255, 0.5);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1;
}
.dark .center-badge {
	background: rgba(255, 255, 255, 0.08);
	border-color: rgba(255, 255, 255, 0.12);
}
.badge-text {
	font-size: 11px;
	font-weight: 800;
	color: var(--clr-text-secondary);
	letter-spacing: 0.5px;
}
.dark .badge-text { color: rgba(255, 255, 255, 0.5); }

/* 倒计时 */
.center-countdown {
	position: absolute;
	inset: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 5;
}
.countdown-num {
	font-size: 56px;
	font-weight: 900;
	background: linear-gradient(135deg, #FF9800, #FF5722);
	-webkit-background-clip: text;
	background-clip: text;
	-webkit-text-fill-color: transparent;
	animation: count-pop 0.7s var(--ease-bounce) both;
	filter: drop-shadow(0 2px 8px rgba(255, 87, 34, 0.3));
}
@keyframes count-pop {
	0% { transform: scale(2.5); opacity: 0; }
	50% { transform: scale(0.85); opacity: 1; }
	100% { transform: scale(1); opacity: 1; }
}

/* 回合结果 */
.center-result {
	position: absolute;
	z-index: 1;
	background: rgba(255, 255, 255, 0.85);
	backdrop-filter: blur(12px);
	-webkit-backdrop-filter: blur(12px);
	border: 1px solid rgba(255, 255, 255, 0.5);
	border-radius: 999px;
	padding: 4px 12px;
	animation: fade-in-up 0.3s var(--ease-spring);
}
.dark .center-result {
	background: rgba(255, 255, 255, 0.1);
	border-color: rgba(255, 255, 255, 0.15);
}
.result-text {
	font-size: 12px;
	font-weight: 800;
}
.result-text.win { color: #FF8F00; }
.result-text.lose { color: #D32F2F; }
.result-text.draw { color: var(--clr-text-secondary); }
.dark .result-text.win { color: #FFB74D; }
.dark .result-text.lose { color: #EF9A9A; }
.dark .result-text.draw { color: rgba(255, 255, 255, 0.5); }

@keyframes fade-in-up {
	from { opacity: 0; transform: translateY(8px); }
	to { opacity: 1; transform: translateY(0); }
}

/* ═══════════════════════════════════════════════════
   底部出拳区
   ═══════════════════════════════════════════════════ */
.action-area {
	position: relative;
	z-index: 1;
	padding-top: 2px;
	margin-top: 0;
}
.action-hint {
	text-align: center;
	font-size: 11px;
	font-weight: 600;
	color: var(--clr-text-secondary);
	margin-bottom: 2px;
	display: block;
}
.dark .action-hint { color: rgba(255, 255, 255, 0.45); }

.action-row {
	display: flex;
	gap: 6px;
}

.action-btn {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 2px;
	padding: 8px 8px 6px;
	border-radius: 18px;
	background: rgba(255, 255, 255, 0.65);
	backdrop-filter: blur(14px) saturate(180%);
	-webkit-backdrop-filter: blur(14px) saturate(180%);
	border: 1px solid rgba(255, 255, 255, 0.5);
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.7);
	transition: all 0.2s var(--ease-spring);
	min-height: 56px;
}
.dark .action-btn {
	background: rgba(255, 255, 255, 0.06);
	border-color: rgba(255, 255, 255, 0.1);
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}
.action-btn:active {
	transform: scale(0.93);
}
.action-btn.pressed {
	transform: scale(0.93);
	background: rgba(255, 152, 0, 0.18);
	border-color: rgba(255, 152, 0, 0.5);
	box-shadow: 0 4px 20px rgba(255, 152, 0, 0.3);
}
.dark .action-btn.pressed {
	background: rgba(255, 152, 0, 0.12);
	border-color: rgba(255, 152, 0, 0.3);
}
.action-btn.disabled {
	opacity: 0.4;
	pointer-events: none;
}

.btn-emoji {
	font-size: 28px;
}
.btn-label {
	font-size: 11px;
	font-weight: 700;
	color: var(--clr-text-primary);
}
.dark .btn-label { color: rgba(255, 255, 255, 0.7); }

/* ═══════════════════════════════════════════════════
   结果弹窗
   ═══════════════════════════════════════════════════ */
.modal-mask {
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.5);
	backdrop-filter: blur(8px);
	-webkit-backdrop-filter: blur(8px);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 100;
	animation: fade-in 0.2s ease;
}
.modal-card {
	width: 280px;
	padding: 28px 24px 20px;
	background: rgba(255, 255, 255, 0.88);
	backdrop-filter: blur(24px) saturate(180%);
	-webkit-backdrop-filter: blur(24px) saturate(180%);
	border: 1px solid rgba(255, 255, 255, 0.6);
	border-radius: 28px;
	box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
	animation: spring-pop 0.35s var(--ease-bounce);
}
.dark .modal-card {
	background: rgba(30, 28, 35, 0.92);
	border-color: rgba(255, 255, 255, 0.1);
	box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
}
.modal-icon-wrap {
	width: 64px;
	height: 64px;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.6);
	display: flex;
	align-items: center;
	justify-content: center;
}
.dark .modal-icon-wrap {
	background: rgba(255, 255, 255, 0.08);
}
.modal-icon {
	font-size: 40px;
}
.modal-title {
	font-size: 18px;
	font-weight: 800;
	color: var(--clr-text-primary);
	text-align: center;
}
.dark .modal-title { color: rgba(255, 255, 255, 0.9); }
.modal-score {
	display: flex;
	align-items: center;
	gap: 8px;
}
.modal-score-num {
	font-size: 28px;
	font-weight: 900;
}
.modal-score-num:first-child { color: #FF6F00; }
.modal-score-num:last-child { color: #D32F2F; }
.dark .modal-score-num:first-child { color: #FFB74D; }
.dark .modal-score-num:last-child { color: #EF9A9A; }
.modal-score-colon {
	font-size: 22px;
	font-weight: 700;
	color: var(--clr-text-secondary);
}
.dark .modal-score-colon { color: rgba(255, 255, 255, 0.4); }

.modal-actions {
	display: flex;
	flex-direction: column;
	gap: 8px;
	width: 100%;
	margin-top: 4px;
}
.modal-btn {
	padding: 12px;
	border-radius: 999px;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: transform 0.15s var(--ease-spring);
}
.modal-btn:active { transform: scale(0.97); }
.primary-btn {
	background: linear-gradient(135deg, #FF9800, #FF5722);
	box-shadow: 0 4px 16px rgba(255, 87, 34, 0.35);
}
.primary-btn .modal-btn-text {
	font-size: 15px;
	font-weight: 700;
	color: #FFF;
}
.secondary-btn {
	background: rgba(255, 255, 255, 0.6);
	border: 1px solid rgba(0, 0, 0, 0.08);
}
.dark .secondary-btn {
	background: rgba(255, 255, 255, 0.08);
	border-color: rgba(255, 255, 255, 0.1);
}
.secondary-btn .modal-btn-text {
	font-size: 15px;
	font-weight: 600;
	color: var(--clr-text-primary);
}
.dark .secondary-btn .modal-btn-text { color: rgba(255, 255, 255, 0.7); }

@keyframes fade-in {
	from { opacity: 0; }
	to { opacity: 1; }
}
@keyframes spring-pop {
	0% { transform: scale(0.8); opacity: 0; }
	60% { transform: scale(1.05); opacity: 1; }
	100% { transform: scale(1); opacity: 1; }
}

/* ═══════════════════════════════════════════════════
   响应式
   ═══════════════════════════════════════════════════ */
@media screen and (max-height: 640px) {
	.fighter-card {
		width: 96px;
		height: 96px;
	}
	.battle-center { height: 96px; }
}
</style>
