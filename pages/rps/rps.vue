﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿<script setup>
import { ref, computed } from 'vue'
import NavBar from '@/components/NavBar.vue'

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

const computerEmoji = {
	rock: '🪨',
	paper: '📄',
	scissors: '✂️'
}

const playerEmoji = {
	rock: '🪨',
	paper: '📄',
	scissors: '✂️'
}

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

function getPlayerCardClass() {
	return {
		'glass-card': true,
		'player-card': true,
		'winner': winnerPulse.value === 'player',
		'loser': winnerPulse.value === 'computer'
	}
}

function getComputerCardClass() {
	return {
		'glass-card': true,
		'computer-card': true,
		'winner': winnerPulse.value === 'computer',
		'loser': winnerPulse.value === 'player'
	}
}
</script>

<template>
	<view class="container">
		<!-- 背景装饰 -->
		<view class="bg-decoration">
			<view class="bg-circle bg-circle-1"></view>
			<view class="bg-circle bg-circle-2"></view>
			<view class="bg-circle bg-circle-3"></view>
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

		<!-- 比赛状态 -->
		<view class="match-status glass-card">
			<text class="match-status-text num">{{ matchStatus }}</text>
		</view>

		<!-- 对战区 -->
		<view class="battle-area">
			<!-- 玩家 -->
			<view :class="getPlayerCardClass()">
				<view class="card-avatar">
					<text class="avatar-icon">👤</text>
				</view>
				<text class="card-name">你</text>
				<view class="chip-score">
					<text class="chip-text num">{{ playerScore }}分</text>
				</view>
				<!-- 玩家出拳 -->
				<view class="card-hand" v-if="playerChoice">
					<text
						class="material-icons hand-icon"
						:class="{ 'hand-spin': playerChoice }"
					>{{ choices.find(c => c.id === playerChoice)?.icon }}</text>
				</view>
				<!-- 胜利光环 -->
				<view class="glow-ring" v-if="winnerPulse === 'player'"></view>
			</view>

			<!-- VS 文字 + 倒计时 -->
			<view class="vs-column" @tap="isPlaying || isMatchOver ? null : null">
				<view class="vs-divider"></view>
				<view class="vs-circle" v-if="!isPlaying && !playerChoice && !isMatchOver">
					<text class="vs-text">对战</text>
				</view>
				<!-- 倒计时 -->
				<view class="countdown-overlay" v-if="countdown > 0">
					<text class="countdown-num num" :key="countdown">{{ countdown }}</text>
				</view>
				<!-- 回合结果 -->
				<view class="round-result" v-if="resultText && !isPlaying">
					<text class="round-text" :class="roundResult">{{ resultText }}</text>
				</view>
			</view>

			<!-- 电脑 -->
			<view :class="getComputerCardClass()">
				<view class="card-avatar">
					<text class="material-icons avatar-icon">📱</text>
				</view>
				<text class="card-name">电脑</text>
				<view class="chip-score">
					<text class="chip-text num">{{ computerScore }}分</text>
				</view>
				<!-- 电脑出拳 -->
				<view class="card-hand" v-if="computerChoice">
					<text
						class="material-icons hand-icon"
						:class="{ 'hand-spin': computerChoice }"
					>{{ choices.find(c => c.id === computerChoice)?.icon }}</text>
				</view>
				<!-- 思考中 -->
				<view class="card-thinking" v-if="isPlaying && !computerChoice">
					<text class="thinking-dots">...</text>
				</view>
				<!-- 胜利光环 -->
				<view class="glow-ring" v-if="winnerPulse === 'computer'"></view>
			</view>
		</view>

		<!-- 底部操作区 -->
		<view class="bottom-area">
			<text class="action-hint" v-if="!isPlaying && !isMatchOver">选择你的出拳</text>
			<text class="action-hint" v-else-if="isMatchOver">比赛已结束</text>

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
					<text class="material-icons btn-icon">{{ choice.icon }}</text>
					<text class="btn-label">{{ choice.label }}</text>
				</view>
			</view>
		</view>

		<!-- 结果弹窗 -->
		<view class="modal-mask" v-if="showResultModal" @tap="closeModal">
			<view class="modal-glass glass-card" @tap.stop>
				<view class="modal-icon">
					<text class="material-icons" :style="{ color: finalMatchResult.includes('获') ? '#FFD740' : '#B3261E' }">
						{{ finalMatchResult.includes('获') ? '🏆' : '😞' }}
					</text>
				</view>
				<text class="modal-title">{{ finalMatchResult }}</text>
				<text class="modal-desc num">最终比分 {{ playerScore }} : {{ computerScore }}</text>
				<view class="modal-actions">
					<view class="modal-btn primary" @tap="playAgain">
						<text>重新开始</text>
					</view>
					<view class="modal-btn secondary" @tap="closeModal">
						<text>返回首页</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<style scoped>
/* 容器 */
.container {
	min-height: 100vh;
	padding: 16px;
	padding-top: calc(var(--safe-area-top, 24px) + 20px);
	padding-bottom: calc(var(--safe-area-bottom, 0px) + 20px);
	background: linear-gradient(135deg, #E0F2F1 0%, #F3E5F5 50%, #FFF5F5 100%);
	display: flex;
	flex-direction: column;
	position: relative;
	overflow: hidden;
}

/* 背景装饰 */
.bg-decoration {
	position: fixed;
	top: 0; left: 0; right: 0; bottom: 0;
	pointer-events: none;
	z-index: 0;
}
.bg-circle {
	position: absolute;
	border-radius: 50%;
	opacity: 0.15;
}
.bg-circle-1 {
	width: 260px; height: 260px;
	background: radial-gradient(circle, #6750A4 0%, transparent 70%);
	top: -80px; right: -60px;
}
.bg-circle-2 {
	width: 200px; height: 200px;
	background: radial-gradient(circle, #00897B 0%, transparent 70%);
	bottom: 120px; left: -80px;
}
.bg-circle-3 {
	width: 140px; height: 140px;
	background: radial-gradient(circle, #FFD740 0%, transparent 70%);
	top: 40%; left: 50%;
}

/* 分段器 */
.segmented {
	display: flex;
	background: rgba(255, 255, 255, 0.72);
	backdrop-filter: blur(14px) saturate(180%);
	-webkit-backdrop-filter: blur(14px) saturate(180%);
	border: 1px solid rgba(255,255,255,0.45);
	box-shadow: 0 4px 16px rgba(31, 28, 48, 0.08), inset 0 1px 0 rgba(255,255,255,0.6);
	border-radius: 999px;
	padding: 2px;
	gap: 2px;
}
.seg-item {
	padding: 6px 12px;
	border-radius: 999px;
	font-size: 12px;
	font-weight: 600;
	color: var(--clr-text-secondary);
	transition: background 0.25s ease, transform 0.15s cubic-bezier(0.2,0.8,0.2,1);
	cursor: pointer;
}
.seg-item:active { transform: scale(0.96); }
.seg-item.active {
	background: rgba(103, 80, 164, 0.92);
	backdrop-filter: blur(14px) saturate(200%);
	-webkit-backdrop-filter: blur(14px) saturate(200%);
	border: 1px solid rgba(103, 80, 164, 1);
	color: var(--clr-text-primary);
	box-shadow: 0 4px 20px rgba(103, 80, 164, 0.35), inset 0 1px 0 rgba(255,255,255,0.2);
}

/* 比赛状态 */
.match-status {
	padding: 6px var(--sp-4);
	border-radius: var(--rd-pill) !important;
	align-self: center;
	margin-bottom: var(--sp-3);
	position: relative;
	z-index: 1;
}
.match-status-text {
	font-size: var(--fs-caption);
	font-weight: 600;
	color: var(--clr-accent);
}

/* 对战区 */
.battle-area {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: var(--sp-3);
	flex: 1;
	position: relative;
	z-index: 1;
	padding: var(--sp-2) 0;
}

/* 卡片 */
.player-card,
.computer-card {
	width: 150px;
	height: 150px;
	border-radius: 50% !important;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 6px;
	position: relative;
	overflow: hidden;
	transition: all 0.4s var(--ease-spring);
	box-sizing: border-box;
}

.player-card {
	background: rgba(103, 80, 164, 0.12) !important;
	backdrop-filter: blur(14px) saturate(180%);
	-webkit-backdrop-filter: blur(14px) saturate(180%);
	border: 1px solid rgba(255,255,255,0.55);
	box-shadow: 0 4px 16px rgba(103, 80, 164, 0.18), inset 0 1px 0 rgba(255,255,255,0.6);
}
.computer-card {
	background: rgba(233, 30, 99, 0.10) !important;
	backdrop-filter: blur(14px) saturate(180%);
	-webkit-backdrop-filter: blur(14px) saturate(180%);
	border: 1px solid rgba(255,255,255,0.55);
	box-shadow: 0 4px 16px rgba(233, 30, 99, 0.18), inset 0 1px 0 rgba(255,255,255,0.6);
}

/* 获胜 */
.player-card.winner {
	border-color: var(--clr-gold) !important;
	border-width: 2px !important;
	transform: scale(1.05);
	box-shadow: 0 0 24px rgba(255, 215, 64, 0.4), inset 0 0 20px rgba(255, 215, 64, 0.08);
	animation: gold-pulse 1.2s ease-in-out 2;
}
.computer-card.winner {
	border-color: var(--clr-gold) !important;
	border-width: 2px !important;
	transform: scale(1.05);
	box-shadow: 0 0 24px rgba(255, 215, 64, 0.4), inset 0 0 20px rgba(255, 215, 64, 0.08);
	animation: gold-pulse 1.2s ease-in-out 2;
}

/* 战败 */
.player-card.loser,
.computer-card.loser {
	opacity: 0.5;
	transform: scale(0.95);
}

/* 胜利光环 */
.glow-ring {
	position: absolute;
	inset: -8px;
	border-radius: 50%;
	border: 3px solid #FFD740;
	opacity: 0;
	animation: ring-expand 0.6s ease-out 2;
	pointer-events: none;
}

@keyframes ring-expand {
	0% { transform: scale(0.8); opacity: 0.8; }
	100% { transform: scale(1.15); opacity: 0; }
}

@keyframes gold-pulse {
	0%, 100% { box-shadow: 0 0 16px rgba(255, 215, 64, 0.3); }
	50% { box-shadow: 0 0 36px rgba(255, 215, 64, 0.6); }
}

/* 头像 */
.card-avatar {
	width: 36px;
	height: 36px;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.72);
	backdrop-filter: blur(14px) saturate(180%);
	-webkit-backdrop-filter: blur(14px) saturate(180%);
	border: 1px solid rgba(255,255,255,0.45);
	box-shadow: inset 0 1px 0 rgba(255,255,255,0.6);
	display: flex;
	align-items: center;
	justify-content: center;
}
.avatar-icon {
	font-size: 20px;
	color: var(--clr-text-secondary);
}

/* 名称 */
.card-name {
	font-size: 13px;
	font-weight: 700;
	color: var(--clr-text-primary);
}

/* 分数 chip */
.chip-score {
	padding: 1px 10px;
	border-radius: 999px;
	background: rgba(255, 255, 255, 0.72);
	backdrop-filter: blur(14px) saturate(180%);
	-webkit-backdrop-filter: blur(14px) saturate(180%);
	border: 1px solid rgba(255,255,255,0.45);
	box-shadow: inset 0 1px 0 rgba(255,255,255,0.6);
}
.chip-text {
	font-size: 11px;
	font-weight: 600;
	color: var(--clr-text-secondary);
}

/* 出拳手势 */
.card-hand {
	margin-top: 4px;
}
.hand-icon {
	font-size: 28px;
	color: var(--clr-accent);
}
.hand-icon.hand-spin {
	animation: icon-spin-in 0.4s var(--ease-bounce);
}
@keyframes icon-spin-in {
	0% { transform: rotate(0deg) scale(0.3); opacity: 0; }
	60% { transform: rotate(360deg) scale(1.15); opacity: 1; }
	100% { transform: rotate(360deg) scale(1); }
}

/* 思考中 */
.card-thinking {
	margin-top: 4px;
}
.thinking-dots {
	font-size: 24px;
	font-weight: 700;
	color: var(--clr-accent);
	animation: blink 0.6s ease-in-out infinite;
}
@keyframes blink {
	0%, 100% { opacity: 0.3; }
	50% { opacity: 1; }
}

/* VS 区域 */
.vs-column {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 140px;
	width: 40px;
	position: relative;
}
.vs-divider {
	position: absolute;
	top: 0; bottom: 0;
	width: 1px;
	background: linear-gradient(to bottom, transparent, rgba(103,80,164,0.3) 30%, rgba(103,80,164,0.3) 70%, transparent);
}
.vs-circle {
	width: 40px;
	height: 40px;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.85);
	backdrop-filter: blur(14px) saturate(180%);
	-webkit-backdrop-filter: blur(14px) saturate(180%);
	border: 1px solid rgba(255,255,255,0.55);
	box-shadow: 0 4px 16px rgba(31, 28, 48, 0.10), inset 0 1px 0 rgba(255,255,255,0.7);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1;
}
.vs-text {
	font-size: 12px;
	font-weight: 800;
	color: var(--clr-accent);
	letter-spacing: 1px;
}

/* 倒计时 */
.countdown-overlay {
	position: absolute;
	inset: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 5;
}
.countdown-num {
	font-size: 64px;
	font-weight: 700;
	color: var(--clr-accent);
	animation: count-pop 0.7s var(--ease-bounce) both;
	text-shadow: 0 2px 12px rgba(103,80,164,0.3);
}
@keyframes count-pop {
	0% { transform: scale(2); opacity: 0; }
	50% { transform: scale(0.9); opacity: 1; }
	100% { transform: scale(1); opacity: 1; }
}

/* 回合结果 */
.round-result {
	position: absolute;
	z-index: 1;
	background: var(--clr-surface);
	border: 1px solid rgba(255,255,255,0.3);
	border-radius: var(--rd-pill);
	padding: 4px 14px;
	animation: fade-in-up 0.3s var(--ease-spring);
}
.round-text {
	font-size: 13px;
	font-weight: 700;
}
.round-text.win { color: var(--clr-gold); }
.round-text.lose { color: var(--clr-danger); }
.round-text.draw { color: var(--clr-accent); }

/* 底部操作区 */
.bottom-area {
	margin-top: auto;
	position: relative;
	z-index: 1;
}
.action-hint {
	text-align: center;
	font-size: var(--fs-caption);
	color: var(--clr-text-secondary);
	margin-bottom: var(--sp-2);
	display: block;
}

.action-row {
	display: flex;
	gap: 12px;
}

.action-btn {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;
	padding: 16px 12px 14px;
	border-radius: 999px;
	background: rgba(255, 255, 255, 0.85);
	backdrop-filter: blur(14px) saturate(180%);
	-webkit-backdrop-filter: blur(14px) saturate(180%);
	border: 1px solid rgba(255,255,255,0.55);
	box-shadow: 0 4px 16px rgba(31, 28, 48, 0.10), inset 0 1px 0 rgba(255,255,255,0.7);
	transition: transform 0.15s cubic-bezier(0.2,0.8,0.2,1), background 0.25s ease, box-shadow 0.25s ease;
	cursor: pointer;
	min-height: 72px;
}
.action-btn:hover {
	box-shadow: 0 6px 24px rgba(31, 28, 48, 0.15), inset 0 1px 0 rgba(255,255,255,0.8);
}
.action-btn:active {
	transform: scale(0.94);
}
.action-btn.pressed {
	transform: scale(0.94);
	background: rgba(103, 80, 164, 0.15);
	backdrop-filter: blur(14px) saturate(200%);
	-webkit-backdrop-filter: blur(14px) saturate(200%);
	border: 1px solid rgba(103, 80, 164, 0.55);
	box-shadow: 0 4px 20px rgba(103, 80, 164, 0.35), inset 0 1px 0 rgba(255,255,255,0.2);
}
.action-btn.disabled {
	opacity: 0.45;
	pointer-events: none;
	backdrop-filter: blur(6px);
	-webkit-backdrop-filter: blur(6px);
}

.btn-icon {
	font-size: 28px;
	color: var(--clr-accent);
}
.btn-label {
	font-size: 12px;
	font-weight: 700;
	color: var(--clr-text-primary);
	letter-spacing: 0.3px;
}

/* 结果弹窗 */
.modal-mask {
	position: fixed;
	inset: 0;
	background: rgba(0,0,0,0.45);
	backdrop-filter: blur(8px);
	-webkit-backdrop-filter: blur(8px);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 100;
	animation: fade-in 0.2s ease;
}
.modal-glass {
	width: 300px;
	padding: var(--sp-6);
	background: rgba(255, 255, 255, 0.85);
	backdrop-filter: blur(24px) saturate(180%);
	-webkit-backdrop-filter: blur(24px) saturate(180%);
	border: 1px solid rgba(255,255,255,0.55);
	border-radius: 24px;
	box-shadow: 0 8px 32px rgba(31, 28, 48, 0.20), inset 0 1px 0 rgba(255,255,255,0.8);
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--sp-3);
	animation: spring-pop 0.35s var(--ease-bounce);
}
.modal-icon span {
	font-size: 56px;
}
.modal-title {
	font-size: var(--fs-title);
	font-weight: 700;
	color: var(--clr-text-primary);
	text-align: center;
}
.modal-desc {
	font-size: var(--fs-label);
	color: var(--clr-text-secondary);
	text-align: center;
}
.modal-actions {
	display: flex;
	flex-direction: column;
	gap: var(--sp-2);
	width: 100%;
	margin-top: var(--sp-2);
}
.modal-btn {
	padding: 12px;
	border-radius: 999px;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	transition: transform 0.15s cubic-bezier(0.2,0.8,0.2,1), background 0.25s ease, box-shadow 0.25s ease;
}
.modal-btn:active { transform: scale(0.97); }
.modal-btn.primary {
	background: rgba(103, 80, 164, 0.92);
	backdrop-filter: blur(14px) saturate(200%);
	-webkit-backdrop-filter: blur(14px) saturate(200%);
	border: 1px solid rgba(103, 80, 164, 1);
	box-shadow: 0 4px 20px rgba(103, 80, 164, 0.35), inset 0 1px 0 rgba(255,255,255,0.2);
}
.modal-btn.primary text {
	font-size: var(--fs-body);
	font-weight: 700;
	color: var(--clr-text-primary);
}
.modal-btn.secondary {
	background: rgba(255, 255, 255, 0.72);
	backdrop-filter: blur(14px) saturate(180%);
	-webkit-backdrop-filter: blur(14px) saturate(180%);
	border: 1px solid rgba(255,255,255,0.45);
	box-shadow: 0 4px 16px rgba(31, 28, 48, 0.08), inset 0 1px 0 rgba(255,255,255,0.6);
}
.modal-btn.secondary text {
	font-size: var(--fs-body);
	font-weight: 600;
	color: var(--clr-text-primary);
}

@keyframes fade-in {
	from { opacity: 0; }
	to { opacity: 1; }
}

/* 响应式 */
@media screen and (max-height: 640px) {
	.player-card,
	.computer-card {
		width: 120px;
		height: 120px;
	}
}
</style>
