﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import NavBar from '@/components/NavBar.vue'
import { useThemeAware } from '@/composables/useThemeAware'

const { isDark } = useThemeAware()

// 游戏模式
const gameModes = [
	{ id: 'pvc', label: '人机对战', icon: '🤖' },
	{ id: 'pvp', label: '双人对战', icon: '👥' }
]
const activeMode = ref('pvc')

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
const opponentScore = ref(0)
const playerChoice = ref('')
const opponentChoice = ref('')
const roundResult = ref('')
const resultText = ref('')
const isPlaying = ref(false)
const countdown = ref(0)
const matchMode = ref(3)
const winnerPulse = ref('')
const showResultModal = ref(false)
const finalMatchResult = ref('')
const selectedBtn = ref('')
const showRules = ref(false)

// 双人对战状态
const pvpPhase = ref('p1') // 'p1' → 'p2' → 'result'
const p1Choice = ref('')
const p2Choice = ref('')
const showP2Prompt = ref(false) // 遮挡P2选择

// 比分
const winTarget = computed(() => Math.ceil(matchMode.value / 2))
const playerScoreBump = ref(false)
const opponentScoreBump = ref(false)

watch(playerScore, () => {
	playerScoreBump.value = true
	setTimeout(() => { playerScoreBump.value = false }, 400)
})
watch(opponentScore, () => {
	opponentScoreBump.value = true
	setTimeout(() => { opponentScoreBump.value = false }, 400)
})

const isMatchOver = computed(() => {
	return playerScore.value >= winTarget.value || opponentScore.value >= winTarget.value
})

const matchStatus = computed(() => {
	return `${playerScore.value} : ${opponentScore.value} / ${winTarget.value}胜`
})

const opponentLabel = computed(() => activeMode.value === 'pvc' ? '电脑' : '玩家2')
const opponentAvatar = computed(() => activeMode.value === 'pvc' ? '🤖' : '🧑')
const playerLabel = computed(() => activeMode.value === 'pvc' ? '你' : '玩家1')

// 结果判断
function getRandomChoice() {
	return choices[Math.floor(Math.random() * choices.length)].id
}

function determineWinner(p1, p2) {
	if (p1 === p2) return 'draw'
	const c = choices.find(x => x.id === p1)
	return c.beats === p2 ? 'win' : 'lose'
}

function setMode(val) {
	if (isPlaying.value) return
	matchMode.value = val
	resetAll()
}

function switchMode(modeId) {
	if (isPlaying.value) return
	activeMode.value = modeId
	resetAll()
}

// 人机对战
function playPvc(choice) {
	if (isPlaying.value || isMatchOver.value) return

	uni.vibrateShort({ type: 'light' })
	selectedBtn.value = choice
	playerChoice.value = choice
	opponentChoice.value = ''
	roundResult.value = ''
	resultText.value = ''
	winnerPulse.value = ''

	setTimeout(() => { selectedBtn.value = '' }, 300)
	isPlaying.value = true

	countdown.value = 3
	const countInterval = setInterval(() => {
		countdown.value--
		if (countdown.value <= 0) {
			clearInterval(countInterval)
			setTimeout(() => {
				const aiChoice = getRandomChoice()
				opponentChoice.value = aiChoice
				const res = determineWinner(choice, aiChoice)
				roundResult.value = res

				if (res === 'win') {
					resultText.value = '你赢了！'
					playerScore.value++
					winnerPulse.value = 'player'
					uni.vibrateShort({ type: 'medium' })
				} else if (res === 'lose') {
					resultText.value = '电脑赢了！'
					opponentScore.value++
					winnerPulse.value = 'opponent'
				} else {
					resultText.value = '平局！'
				}

				isPlaying.value = false
				checkMatchEnd()
			}, 800)
		}
	}, 700)
}

// 双人对战
function playPvp(choice) {
	if (isPlaying.value || isMatchOver.value) return
	uni.vibrateShort({ type: 'light' })

	if (pvpPhase.value === 'p1') {
		p1Choice.value = choice
		selectedBtn.value = choice
		setTimeout(() => {
			selectedBtn.value = ''
			pvpPhase.value = 'p2'
			showP2Prompt.value = true
		}, 300)
	} else if (pvpPhase.value === 'p2') {
		p2Choice.value = choice
		selectedBtn.value = choice
		showP2Prompt.value = false
		isPlaying.value = true

		setTimeout(() => {
			selectedBtn.value = ''
			playerChoice.value = p1Choice.value
			opponentChoice.value = p2Choice.value

			const res = determineWinner(p1Choice.value, p2Choice.value)
			roundResult.value = res

			if (res === 'win') {
				resultText.value = `${playerLabel.value}赢了！`
				playerScore.value++
				winnerPulse.value = 'player'
				uni.vibrateShort({ type: 'medium' })
			} else if (res === 'lose') {
				resultText.value = `${opponentLabel.value}赢了！`
				opponentScore.value++
				winnerPulse.value = 'opponent'
			} else {
				resultText.value = '平局！'
			}

			isPlaying.value = false
			pvpPhase.value = 'result'
			checkMatchEnd()
		}, 500)
	} else if (pvpPhase.value === 'result') {
		// 点击进入下一轮
		nextRound()
	}
}

function nextRound() {
	playerChoice.value = ''
	opponentChoice.value = ''
	p1Choice.value = ''
	p2Choice.value = ''
	roundResult.value = ''
	resultText.value = ''
	winnerPulse.value = ''
	pvpPhase.value = 'p1'
}

function play(choice) {
	if (activeMode.value === 'pvc') {
		playPvc(choice)
	} else {
		playPvp(choice)
	}
}

function checkMatchEnd() {
	if (isMatchOver.value) {
		setTimeout(() => {
			const won = playerScore.value >= winTarget.value
			finalMatchResult.value = won
				? `${playerLabel.value}获胜！`
				: `${opponentLabel.value}获胜！`
			showResultModal.value = true
		}, 800)
	}
}

function resetAll() {
	playerScore.value = 0
	opponentScore.value = 0
	playerChoice.value = ''
	opponentChoice.value = ''
	p1Choice.value = ''
	p2Choice.value = ''
	roundResult.value = ''
	resultText.value = ''
	isPlaying.value = false
	countdown.value = 0
	winnerPulse.value = ''
	showResultModal.value = false
	finalMatchResult.value = ''
	selectedBtn.value = ''
	pvpPhase.value = 'p1'
	showP2Prompt.value = false
}

function closeModal() {
	showResultModal.value = false
	resetAll()
}

function playAgain() {
	showResultModal.value = false
	resetAll()
}

// 出拳按钮是否可点击
const canPlay = computed(() => {
	if (isMatchOver.value) return false
	if (activeMode.value === 'pvc') return !isPlaying.value
	// PvP: p1选择时可点击, p2选择时可点击, result时不可
	return !isPlaying.value && pvpPhase.value !== 'result'
})

// 提示文字
const actionHint = computed(() => {
	if (isMatchOver.value) return '比赛结束'
	if (activeMode.value === 'pvc') {
		if (isPlaying.value) return '对战中...'
		return '选择你的出拳'
	}
	// PvP
	if (pvpPhase.value === 'p1') return `${playerLabel.value}出拳`
	if (pvpPhase.value === 'p2') return `${opponentLabel.value}出拳`
	if (pvpPhase.value === 'result') return '点击继续下一轮'
	return ''
})
</script>

<template>
	<view class="container" :class="{ dark: isDark }">
		<!-- 背景装饰 -->
		<view class="bg-decoration">
			<view class="bg-orb bg-orb-1"></view>
			<view class="bg-orb bg-orb-2"></view>
			<view class="bg-orb bg-orb-3"></view>
		</view>

		<!-- 导航栏 -->
		<NavBar title="猜拳" :showBack="false">
			<template #right>
				<view class="nav-right">
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
					<view class="rule-btn" @tap="showRules = true">
						<text class="rule-icon">?</text>
					</view>
				</view>
			</template>
		</NavBar>

		<!-- 模式切换 -->
		<view class="mode-tabs">
			<view
				v-for="mode in gameModes"
				:key="mode.id"
				class="mode-tab"
				:class="{ active: activeMode === mode.id }"
				@tap="switchMode(mode.id)"
			>
				<text class="mode-icon">{{ mode.icon }}</text>
				<text class="mode-label">{{ mode.label }}</text>
			</view>
		</view>

		<!-- 比分条 -->
		<view class="score-bar">
			<view class="score-side player-side">
				<text class="score-label">{{ playerLabel }}</text>
				<text class="score-value num" :class="{ bump: playerScoreBump }">{{ playerScore }}</text>
				<view class="score-dots">
					<view class="dot" v-for="n in winTarget" :key="'p'+n" :class="{ filled: n <= playerScore }"></view>
				</view>
			</view>
			<view class="score-center">
				<text class="score-vs">VS</text>
				<text class="score-target num">BO{{ matchMode }}</text>
			</view>
			<view class="score-side opponent-side">
				<view class="score-dots">
					<view class="dot" v-for="n in winTarget" :key="'o'+n" :class="{ filled: n <= opponentScore }"></view>
				</view>
				<text class="score-label">{{ opponentLabel }}</text>
				<text class="score-value num" :class="{ bump: opponentScoreBump }">{{ opponentScore }}</text>
			</view>
		</view>

		<!-- 对战区 -->
		<view class="battle-area">
			<!-- 玩家1卡片 -->
			<view class="fighter-card player-fighter" :class="{ winner: winnerPulse === 'player', loser: winnerPulse === 'opponent' }">
				<view class="sparkles" v-if="winnerPulse === 'player'">
					<text class="sparkle s1">✨</text>
					<text class="sparkle s2">⭐</text>
					<text class="sparkle s3">✨</text>
				</view>
				<view class="fighter-avatar">
					<text class="avatar-emoji">{{ activeMode === 'pvc' ? '🧑' : '🧑' }}</text>
				</view>
				<text class="fighter-name">{{ playerLabel }}</text>
				<view class="fighter-hand" v-if="playerChoice">
					<text class="hand-emoji hand-in">{{ choices.find(c => c.id === playerChoice)?.icon }}</text>
				</view>
				<view class="fighter-idle" v-else-if="!isPlaying && pvpPhase !== 'result'">
					<text class="idle-icon">✊</text>
				</view>
				<view class="fighter-thinking" v-else-if="isPlaying">
					<text class="dots">●●●</text>
				</view>
				<view class="victory-ring" v-if="winnerPulse === 'player'"></view>
			</view>

			<!-- 中央信息 -->
			<view class="battle-center">
				<view class="center-line"></view>
				<view class="center-badge" v-if="!isPlaying && !resultText && !isMatchOver && pvpPhase === 'p1'">
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
				<view class="center-badge" v-if="activeMode === 'pvp' && pvpPhase === 'p2' && showP2Prompt">
					<text class="badge-text">换人</text>
				</view>
			</view>

			<!-- 对手卡片 -->
			<view class="fighter-card opponent-fighter" :class="{ winner: winnerPulse === 'opponent', loser: winnerPulse === 'player' }">
				<view class="sparkles" v-if="winnerPulse === 'opponent'">
					<text class="sparkle s1">✨</text>
					<text class="sparkle s2">⭐</text>
					<text class="sparkle s3">✨</text>
				</view>
				<view class="fighter-avatar">
					<text class="avatar-emoji">{{ opponentAvatar }}</text>
				</view>
				<text class="fighter-name">{{ opponentLabel }}</text>
				<view class="fighter-hand" v-if="opponentChoice">
					<text class="hand-emoji hand-in">{{ choices.find(c => c.id === opponentChoice)?.icon }}</text>
				</view>
				<view class="fighter-idle" v-else-if="!isPlaying && pvpPhase !== 'result'">
					<text class="idle-icon">✊</text>
				</view>
				<view class="fighter-thinking" v-else-if="isPlaying">
					<text class="dots">●●●</text>
				</view>
				<view class="victory-ring" v-if="winnerPulse === 'opponent'"></view>
			</view>
		</view>

		<!-- P2遮挡层（双人模式专用） -->
		<view class="p2-cover" v-if="showP2Prompt" @tap.stop>
			<view class="p2-cover-card">
				<text class="p2-cover-icon">📱</text>
				<text class="p2-cover-title">请将手机交给{{ opponentLabel }}</text>
				<text class="p2-cover-desc">{{ playerLabel }}已出拳，请{{ opponentLabel }}选择</text>
				<view class="p2-cover-btn" @tap="showP2Prompt = false">
					<text class="p2-cover-btn-text">准备好了</text>
				</view>
			</view>
		</view>

		<!-- 出拳区 -->
		<view class="action-area">
			<text class="action-hint">{{ actionHint }}</text>
			<view class="action-row">
				<view
					v-for="choice in choices"
					:key="choice.id"
					class="action-btn"
					:class="{
						pressed: selectedBtn === choice.id,
						disabled: !canPlay
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
					<text class="modal-icon">{{ playerScore >= winTarget ? '🏆' : '😞' }}</text>
				</view>
				<text class="modal-title">{{ finalMatchResult }}</text>
				<view class="modal-score">
					<text class="modal-score-num num">{{ playerScore }}</text>
					<text class="modal-score-colon">:</text>
					<text class="modal-score-num num">{{ opponentScore }}</text>
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

		<!-- 规则弹窗 -->
		<view class="modal-mask" v-if="showRules" @tap="showRules = false">
			<view class="modal-card rules-card" @tap.stop>
				<text class="rules-title">游戏规则</text>
				<view class="rules-content">
					<view class="rule-item">
						<text class="rule-emoji">✊</text>
						<text class="rule-arrow">→</text>
						<text class="rule-emoji">✌️</text>
						<text class="rule-desc">石头胜剪刀</text>
					</view>
					<view class="rule-item">
						<text class="rule-emoji">✌️</text>
						<text class="rule-arrow">→</text>
						<text class="rule-emoji">🖐</text>
						<text class="rule-desc">剪刀胜布</text>
					</view>
					<view class="rule-item">
						<text class="rule-emoji">🖐</text>
						<text class="rule-arrow">→</text>
						<text class="rule-emoji">✊</text>
						<text class="rule-desc">布胜石头</text>
					</view>
				</view>
				<view class="rules-mode-desc">
					<text class="rules-mode-title">人机对战</text>
					<text class="rules-mode-text">与电脑AI对决，选择出拳后倒计时揭晓结果</text>
				</view>
				<view class="rules-mode-desc">
					<text class="rules-mode-title">双人对战</text>
					<text class="rules-mode-text">两人轮流在同一设备上出拳，互不偷看</text>
				</view>
				<view class="modal-btn primary-btn rules-close-btn" @tap="showRules = false">
					<text class="modal-btn-text">明白了</text>
				</view>
			</view>
		</view>
	</view>
</template>

<style scoped>
/* ═══════════════════════════════════════════
   Arctic Duel 配色方案
   玩家：电光青 #06B6D4
   对手：炽玫红 #F43F5E
   胜利：琥珀金 #FBBF24
   背景：极地深海 → 冰蓝
   ═══════════════════════════════════════════ */
.container {
	flex: 1;
	padding: 0;
	padding-top: calc(var(--safe-area-top, 24px));
	padding-bottom: 0;
	background: linear-gradient(160deg, #F0F9FF 0%, #E0F2FE 28%, #BAE6FD 62%, #A5F3FC 100%);
	display: flex;
	flex-direction: column;
	position: relative;
	overflow: hidden;
	touch-action: manipulation;
	-webkit-overflow-scrolling: auto;
}
.container.dark {
	background: linear-gradient(160deg, #020617 0%, #0C1E3A 30%, #0E2A4A 65%, #022C33 100%);
}

/* 背景光晕 */
.bg-decoration { position: fixed; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 0; }
.bg-orb { position: absolute; border-radius: 50%; filter: blur(42px); }
.bg-orb-1 { width: 230px; height: 230px; background: radial-gradient(circle, rgba(6,182,212,0.38) 0%, transparent 70%); top: -60px; right: -50px; }
.bg-orb-2 { width: 190px; height: 190px; background: radial-gradient(circle, rgba(244,63,94,0.28) 0%, transparent 70%); bottom: 90px; left: -60px; }
.bg-orb-3 { width: 130px; height: 130px; background: radial-gradient(circle, rgba(251,191,36,0.22) 0%, transparent 70%); top: 38%; left: 45%; }
.dark .bg-orb-1 { background: radial-gradient(circle, rgba(6,182,212,0.18) 0%, transparent 70%); }
.dark .bg-orb-2 { background: radial-gradient(circle, rgba(244,63,94,0.14) 0%, transparent 70%); }
.dark .bg-orb-3 { background: radial-gradient(circle, rgba(251,191,36,0.10) 0%, transparent 70%); }

/* 导航栏右侧 */
.nav-right { display: flex; align-items: center; gap: 8px; }
.segmented {
	display: flex;
	background: rgba(255,255,255,0.65);
	backdrop-filter: blur(14px) saturate(180%);
	-webkit-backdrop-filter: blur(14px) saturate(180%);
	border: 1px solid rgba(255,255,255,0.5);
	box-shadow: 0 2px 10px rgba(8,47,73,0.08), inset 0 1px 0 rgba(255,255,255,0.7);
	border-radius: 999px;
	padding: 2px;
	gap: 2px;
}
.dark .segmented { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.12); }
.seg-item { padding: 5px 11px; border-radius: 999px; font-size: 11px; font-weight: 600; color: var(--clr-text-secondary); transition: all 0.25s var(--ease-spring); }
.seg-item.active { background: linear-gradient(135deg, #06B6D4, #0E7490); color: #FFF; box-shadow: 0 2px 12px rgba(6,182,212,0.4); }
.dark .seg-item { color: rgba(255,255,255,0.6); }
.dark .seg-item.active { color: #FFF; }

.rule-btn {
	width: 28px; height: 28px;
	border-radius: 50%;
	background: rgba(255,255,255,0.65);
	backdrop-filter: blur(10px);
	-webkit-backdrop-filter: blur(10px);
	border: 1px solid rgba(255,255,255,0.5);
	display: flex; align-items: center; justify-content: center;
}
.dark .rule-btn { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.12); }
.rule-icon { font-size: 14px; font-weight: 800; color: var(--clr-text-secondary); }
.dark .rule-icon { color: rgba(255,255,255,0.6); }

/* 模式切换 */
.mode-tabs {
	display: flex;
	gap: 6px;
	padding: 6px 10px 2px;
	position: relative;
	z-index: 1;
}
.mode-tab {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	padding: 8px 0;
	border-radius: 14px;
	background: rgba(255,255,255,0.5);
	backdrop-filter: blur(12px);
	-webkit-backdrop-filter: blur(12px);
	border: 1.5px solid rgba(255,255,255,0.5);
	transition: all 0.3s var(--ease-spring);
	position: relative;
	overflow: hidden;
}
.mode-tab::after {
	content: '';
	position: absolute;
	inset: 0;
	background: linear-gradient(135deg, rgba(6,182,212,0.22), rgba(14,116,144,0.14));
	opacity: 0;
	transition: opacity 0.3s var(--ease-spring);
}
.mode-tab.active::after { opacity: 1; }
.mode-tab > * { position: relative; z-index: 1; }
.dark .mode-tab { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.08); }
.mode-tab.active {
	background: linear-gradient(135deg, rgba(6,182,212,0.20), rgba(14,116,144,0.12));
	border-color: rgba(6,182,212,0.55);
	box-shadow: 0 4px 16px rgba(6,182,212,0.18);
}
.dark .mode-tab.active { background: linear-gradient(135deg, rgba(6,182,212,0.14), rgba(14,116,144,0.08)); border-color: rgba(6,182,212,0.35); }
.mode-icon { font-size: 18px; }
.mode-label { font-size: 13px; font-weight: 700; color: var(--clr-text-primary); }
.dark .mode-label { color: rgba(255,255,255,0.7); }
.mode-tab.active .mode-label { color: #0E7490; }
.dark .mode-tab.active .mode-label { color: #67E8F9; }

/* 比分条 */
.score-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 4px 14px;
	border-radius: 18px;
	background: rgba(255,255,255,0.6);
	backdrop-filter: blur(14px) saturate(180%);
	-webkit-backdrop-filter: blur(14px) saturate(180%);
	border: 1px solid rgba(255,255,255,0.6);
	box-shadow: 0 4px 16px rgba(8,47,73,0.08), inset 0 1px 0 rgba(255,255,255,0.7);
	position: relative;
	z-index: 1;
	margin: 4px 10px 0;
}
.dark .score-bar { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.1); box-shadow: 0 4px 16px rgba(0,0,0,0.3); }
.score-side { display: flex; align-items: center; gap: 6px; }
.opponent-side { flex-direction: row-reverse; }
.score-label { font-size: 12px; font-weight: 600; color: var(--clr-text-secondary); }
.dark .score-label { color: rgba(255,255,255,0.5); }
.score-value { font-size: 22px; font-weight: 800; transition: transform 0.3s var(--ease-bounce); }
.score-value.bump { animation: score-bump 0.4s var(--ease-bounce); }
@keyframes score-bump {
	0% { transform: scale(1); }
	40% { transform: scale(1.4); }
	100% { transform: scale(1); }
}
.score-dots { display: flex; gap: 3px; }
.dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(8,47,73,0.14); transition: all 0.3s var(--ease-spring); }
.dark .dot { background: rgba(255,255,255,0.15); }
.dot.filled { transform: scale(1.3); }
.player-side .dot.filled { background: #06B6D4; box-shadow: 0 0 6px rgba(6,182,212,0.6); }
.opponent-side .dot.filled { background: #F43F5E; box-shadow: 0 0 6px rgba(244,63,94,0.6); }
.player-side .score-value { color: #0E7490; }
.opponent-side .score-value { color: #E11D48; }
.dark .player-side .score-value { color: #67E8F9; }
.dark .opponent-side .score-value { color: #FDA4AF; }
.score-center { display: flex; flex-direction: column; align-items: center; gap: 0; }
.score-vs { font-size: 14px; font-weight: 900; color: var(--clr-text-secondary); letter-spacing: 1px; }
.dark .score-vs { color: rgba(255,255,255,0.4); }
.score-target { font-size: 10px; font-weight: 600; color: var(--clr-text-disabled); }

/* 对战区 */
.battle-area {
	flex: 1;
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

.fighter-card {
	width: 110px; height: 110px;
	max-width: 28vw; max-height: 28vw;
	border-radius: 22px;
	display: flex; flex-direction: column;
	align-items: center; justify-content: center;
	gap: 2px; position: relative;
	overflow: visible;
	transition: all 0.4s var(--ease-spring);
	box-sizing: border-box;
	animation: idle-float 3s ease-in-out infinite;
}
@keyframes idle-float {
	0%, 100% { transform: translateY(0); }
	50% { transform: translateY(-4px); }
}
.fighter-card.winner, .fighter-card.loser { animation: none; }
.player-fighter {
	background: rgba(255,255,255,0.58);
	backdrop-filter: blur(16px) saturate(180%);
	-webkit-backdrop-filter: blur(16px) saturate(180%);
	border: 1.5px solid rgba(6,182,212,0.4);
	box-shadow: 0 8px 24px rgba(6,182,212,0.16), inset 0 1px 0 rgba(255,255,255,0.7);
}
.opponent-fighter {
	background: rgba(255,255,255,0.58);
	backdrop-filter: blur(16px) saturate(180%);
	-webkit-backdrop-filter: blur(16px) saturate(180%);
	border: 1.5px solid rgba(244,63,94,0.4);
	box-shadow: 0 8px 24px rgba(244,63,94,0.16), inset 0 1px 0 rgba(255,255,255,0.7);
}
.dark .player-fighter { background: rgba(6,182,212,0.10); border-color: rgba(6,182,212,0.3); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
.dark .opponent-fighter { background: rgba(244,63,94,0.10); border-color: rgba(244,63,94,0.3); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }

.fighter-card.winner { transform: scale(1.06); border-color: #FBBF24 !important; border-width: 2.5px !important; box-shadow: 0 0 30px rgba(251,191,36,0.5), inset 0 0 20px rgba(251,191,36,0.1); animation: gold-pulse 1.2s ease-in-out 2; }
.fighter-card.loser { opacity: 0.45; transform: scale(0.94); }
@keyframes gold-pulse { 0%,100% { box-shadow: 0 0 16px rgba(251,191,36,0.35); } 50% { box-shadow: 0 0 40px rgba(251,191,36,0.7); } }

.victory-ring { position: absolute; inset: -10px; border-radius: 32px; border: 3px solid #FBBF24; opacity: 0; animation: ring-expand 0.7s ease-out 2; pointer-events: none; }
@keyframes ring-expand { 0% { transform: scale(0.85); opacity: 0.9; } 100% { transform: scale(1.2); opacity: 0; } }

.sparkles { position: absolute; inset: 0; pointer-events: none; z-index: 3; }
.sparkle { position: absolute; font-size: 14px; opacity: 0; animation: sparkle-burst 1s ease-out 2; }
.s1 { top: -8px; left: 10%; animation-delay: 0s; }
.s2 { top: 20%; right: -10px; font-size: 16px; animation-delay: 0.2s; }
.s3 { bottom: -6px; left: 30%; animation-delay: 0.4s; }
@keyframes sparkle-burst {
	0% { transform: scale(0) rotate(0deg); opacity: 0; }
	50% { transform: scale(1.3) rotate(180deg); opacity: 1; }
	100% { transform: scale(0.8) rotate(360deg); opacity: 0; }
}

.fighter-avatar { width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.7); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.5); display: flex; align-items: center; justify-content: center; }
.dark .fighter-avatar { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.15); }
.avatar-emoji { font-size: 18px; }
.fighter-name { font-size: 13px; font-weight: 700; color: var(--clr-text-primary); }
.dark .fighter-name { color: rgba(255,255,255,0.85); }
.fighter-hand { margin-top: 2px; }
.hand-emoji { font-size: 26px; display: inline-block; }
.hand-emoji.hand-in { animation: hand-pop 0.5s var(--ease-bounce); }
@keyframes hand-pop { 0% { transform: scale(0) rotate(-180deg); opacity: 0; } 60% { transform: scale(1.2) rotate(10deg); opacity: 1; } 100% { transform: scale(1) rotate(0deg); opacity: 1; } }
.fighter-idle { margin-top: 2px; }
.idle-icon { font-size: 22px; opacity: 0.35; }
.fighter-thinking { margin-top: 2px; animation: thinking-shake 0.5s ease-in-out infinite; }
.dots { font-size: 14px; font-weight: 700; color: var(--clr-text-secondary); letter-spacing: 2px; animation: blink 0.6s ease-in-out infinite; }
.dark .dots { color: rgba(255,255,255,0.5); }
@keyframes blink { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }
@keyframes thinking-shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-2px); } 75% { transform: translateX(2px); } }

/* 中央信息 */
.battle-center { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 48px; height: 110px; position: relative; }
.center-line { position: absolute; top: 10px; bottom: 10px; width: 2px; background: linear-gradient(to bottom, transparent, rgba(6,182,212,0.3) 20%, rgba(244,63,94,0.3) 80%, transparent); }
.dark .center-line { background: linear-gradient(to bottom, transparent, rgba(6,182,212,0.15) 20%, rgba(244,63,94,0.15) 80%, transparent); }
.center-badge { width: 44px; height: 44px; border-radius: 50%; background: rgba(255,255,255,0.78); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.5); box-shadow: 0 4px 12px rgba(8,47,73,0.1); display: flex; align-items: center; justify-content: center; z-index: 1; animation: badge-pulse 2s ease-in-out infinite; }
@keyframes badge-pulse {
	0%, 100% { box-shadow: 0 4px 12px rgba(8,47,73,0.1), 0 0 0 0 rgba(6,182,212,0.25); }
	50% { box-shadow: 0 4px 12px rgba(8,47,73,0.1), 0 0 0 8px rgba(6,182,212,0); }
}
.dark .center-badge { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.12); }
.badge-text { font-size: 11px; font-weight: 800; color: var(--clr-text-secondary); letter-spacing: 0.5px; }
.dark .badge-text { color: rgba(255,255,255,0.5); }
.center-countdown { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 5; }
.countdown-num { font-size: 56px; font-weight: 900; background: linear-gradient(135deg, #06B6D4, #0E7490); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; animation: count-pop 0.7s var(--ease-bounce) both; filter: drop-shadow(0 2px 8px rgba(6,182,212,0.4)); }
@keyframes count-pop { 0% { transform: scale(2.5); opacity: 0; } 50% { transform: scale(0.85); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
.center-result { position: absolute; z-index: 1; background: rgba(255,255,255,0.88); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.5); border-radius: 999px; padding: 4px 12px; animation: fade-in-up 0.3s var(--ease-spring); }
.dark .center-result { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.12); }
.result-text { font-size: 12px; font-weight: 800; }
.result-text.win { color: #0E7490; }
.result-text.lose { color: #E11D48; }
.result-text.draw { color: var(--clr-text-secondary); }
.dark .result-text.win { color: #67E8F9; }
.dark .result-text.lose { color: #FDA4AF; }
.dark .result-text.draw { color: rgba(255,255,255,0.5); }
@keyframes fade-in-up { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

/* P2遮挡层 */
.p2-cover {
	position: absolute;
	inset: 0;
	z-index: 50;
	background: rgba(2,6,23,0.78);
	backdrop-filter: blur(20px);
	-webkit-backdrop-filter: blur(20px);
	display: flex;
	align-items: center;
	justify-content: center;
	animation: fade-in 0.2s ease;
}
.p2-cover-card {
	width: 260px;
	padding: 28px 22px;
	background: rgba(240,249,255,0.92);
	backdrop-filter: blur(24px);
	-webkit-backdrop-filter: blur(24px);
	border: 1px solid rgba(255,255,255,0.6);
	border-radius: 28px;
	box-shadow: 0 12px 40px rgba(8,47,73,0.25);
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 10px;
	animation: spring-pop 0.35s var(--ease-bounce);
}
.dark .p2-cover-card { background: rgba(12,30,58,0.94); border-color: rgba(255,255,255,0.1); }
.p2-cover-icon { font-size: 36px; }
.p2-cover-title { font-size: 16px; font-weight: 800; color: var(--clr-text-primary); }
.dark .p2-cover-title { color: rgba(255,255,255,0.9); }
.p2-cover-desc { font-size: 12px; color: var(--clr-text-secondary); text-align: center; }
.dark .p2-cover-desc { color: rgba(255,255,255,0.5); }
.p2-cover-btn { margin-top: 6px; padding: 10px 28px; border-radius: 999px; background: linear-gradient(135deg, #06B6D4, #0E7490); box-shadow: 0 4px 16px rgba(6,182,212,0.4); }
.p2-cover-btn-text { font-size: 14px; font-weight: 700; color: #FFF; }

/* 出拳区 */
.action-area { position: relative; z-index: 1; padding-top: 2px; padding-bottom: 12px; }
.action-hint { text-align: center; font-size: 11px; font-weight: 600; color: var(--clr-text-secondary); margin-bottom: 2px; display: block; }
.dark .action-hint { color: rgba(255,255,255,0.45); }
.action-row { display: flex; gap: 6px; }
.action-btn {
	flex: 1;
	display: flex; flex-direction: column;
	align-items: center; gap: 2px;
	padding: 8px 8px 6px;
	border-radius: 18px;
	background: linear-gradient(160deg, rgba(255,255,255,0.78), rgba(255,255,255,0.58));
	backdrop-filter: blur(14px) saturate(180%);
	-webkit-backdrop-filter: blur(14px) saturate(180%);
	border: 1px solid rgba(255,255,255,0.65);
	box-shadow: 0 4px 16px rgba(8,47,73,0.08), inset 0 1px 0 rgba(255,255,255,0.8);
	transition: all 0.2s var(--ease-spring);
	min-height: 56px;
	position: relative;
	overflow: hidden;
}
.action-btn::before {
	content: '';
	position: absolute;
	top: 0; left: 0; right: 0;
	height: 50%;
	background: linear-gradient(180deg, rgba(255,255,255,0.4), transparent);
	pointer-events: none;
}
.dark .action-btn { background: linear-gradient(160deg, rgba(255,255,255,0.1), rgba(255,255,255,0.04)); border-color: rgba(255,255,255,0.12); box-shadow: 0 4px 16px rgba(0,0,0,0.3); }
.action-btn:active { transform: scale(0.93); box-shadow: 0 2px 8px rgba(8,47,73,0.12), inset 0 2px 6px rgba(8,47,73,0.1); }
.action-btn.pressed { transform: scale(0.93); background: linear-gradient(160deg, rgba(6,182,212,0.28), rgba(14,116,144,0.16)); border-color: rgba(6,182,212,0.65); box-shadow: 0 4px 20px rgba(6,182,212,0.45), inset 0 1px 0 rgba(255,255,255,0.4); }
.dark .action-btn.pressed { background: linear-gradient(160deg, rgba(6,182,212,0.2), rgba(14,116,144,0.1)); border-color: rgba(6,182,212,0.45); }
.action-btn.disabled { opacity: 0.4; pointer-events: none; }
.btn-emoji { font-size: 28px; position: relative; z-index: 1; transition: transform 0.2s var(--ease-spring); }
.action-btn:active .btn-emoji { transform: scale(1.15) rotate(-8deg); }
.btn-label { font-size: 11px; font-weight: 700; color: var(--clr-text-primary); position: relative; z-index: 1; }
.dark .btn-label { color: rgba(255,255,255,0.7); }

/* 弹窗 */
.modal-mask { position: fixed; inset: 0; background: rgba(2,6,23,0.55); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 100; animation: fade-in 0.2s ease; }
.modal-card { width: 280px; padding: 28px 24px 20px; background: rgba(240,249,255,0.92); backdrop-filter: blur(24px) saturate(180%); -webkit-backdrop-filter: blur(24px) saturate(180%); border: 1px solid rgba(255,255,255,0.6); border-radius: 28px; box-shadow: 0 12px 40px rgba(8,47,73,0.2); display: flex; flex-direction: column; align-items: center; gap: 12px; animation: spring-pop 0.35s var(--ease-bounce); }
.dark .modal-card { background: rgba(12,30,58,0.94); border-color: rgba(255,255,255,0.1); box-shadow: 0 12px 40px rgba(0,0,0,0.5); }
.modal-icon-wrap { width: 64px; height: 64px; border-radius: 50%; background: rgba(255,255,255,0.65); display: flex; align-items: center; justify-content: center; }
.dark .modal-icon-wrap { background: rgba(255,255,255,0.08); }
.modal-icon { font-size: 40px; }
.modal-title { font-size: 18px; font-weight: 800; color: var(--clr-text-primary); text-align: center; }
.dark .modal-title { color: rgba(255,255,255,0.9); }
.modal-score { display: flex; align-items: center; gap: 8px; }
.modal-score-num { font-size: 28px; font-weight: 900; }
.modal-score-num:first-child { color: #0E7490; }
.modal-score-num:last-child { color: #E11D48; }
.dark .modal-score-num:first-child { color: #67E8F9; }
.dark .modal-score-num:last-child { color: #FDA4AF; }
.modal-score-colon { font-size: 22px; font-weight: 700; color: var(--clr-text-secondary); }
.dark .modal-score-colon { color: rgba(255,255,255,0.4); }
.modal-actions { display: flex; flex-direction: column; gap: 8px; width: 100%; margin-top: 4px; }
.modal-btn { padding: 12px; border-radius: 999px; display: flex; align-items: center; justify-content: center; transition: transform 0.15s var(--ease-spring); }
.modal-btn:active { transform: scale(0.97); }
.primary-btn { background: linear-gradient(135deg, #06B6D4, #0E7490); box-shadow: 0 4px 16px rgba(6,182,212,0.4); }
.primary-btn .modal-btn-text { font-size: 15px; font-weight: 700; color: #FFF; }
.secondary-btn { background: rgba(255,255,255,0.65); border: 1px solid rgba(8,47,73,0.1); }
.dark .secondary-btn { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.1); }
.secondary-btn .modal-btn-text { font-size: 15px; font-weight: 600; color: var(--clr-text-primary); }
.dark .secondary-btn .modal-btn-text { color: rgba(255,255,255,0.7); }

/* 规则弹窗 */
.rules-card { width: 300px; gap: 10px; }
.rules-title { font-size: 18px; font-weight: 800; color: var(--clr-text-primary); }
.dark .rules-title { color: rgba(255,255,255,0.9); }
.rules-content { display: flex; flex-direction: column; gap: 6px; width: 100%; }
.rule-item { display: flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 12px; background: rgba(255,255,255,0.45); }
.dark .rule-item { background: rgba(255,255,255,0.05); }
.rule-emoji { font-size: 22px; }
.rule-arrow { font-size: 14px; color: var(--clr-text-disabled); }
.rule-desc { font-size: 13px; font-weight: 600; color: var(--clr-text-primary); margin-left: 4px; }
.dark .rule-desc { color: rgba(255,255,255,0.7); }
.rules-mode-desc { display: flex; flex-direction: column; gap: 2px; width: 100%; padding: 8px 12px; border-radius: 12px; background: rgba(6,182,212,0.08); }
.dark .rules-mode-desc { background: rgba(6,182,212,0.05); }
.rules-mode-title { font-size: 13px; font-weight: 800; color: #0E7490; }
.dark .rules-mode-title { color: #67E8F9; }
.rules-mode-text { font-size: 11px; color: var(--clr-text-secondary); }
.dark .rules-mode-text { color: rgba(255,255,255,0.5); }
.rules-close-btn { margin-top: 4px; }

@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes spring-pop { 0% { transform: scale(0.8); opacity: 0; } 60% { transform: scale(1.05); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }

/* 响应式 - 小高度屏幕 */
@media screen and (max-height: 640px) {
	.fighter-card { width: 96px; height: 96px; }
	.battle-center { height: 96px; }
	.action-btn { min-height: 50px; }
	.btn-emoji { font-size: 26px; }
}

/* 响应式 - 超小高度屏幕 */
@media screen and (max-height: 560px) {
	.fighter-card { width: 88px; height: 88px; }
	.battle-center { height: 88px; }
	.avatar-emoji { font-size: 16px; }
	.hand-emoji { font-size: 22px; }
	.countdown-num { font-size: 48px; }
	.mode-tab { padding: 6px 0; }
	.score-value { font-size: 20px; }
}

/* 响应式 - 窄屏设备 */
@media screen and (max-width: 360px) {
	.fighter-card { width: 96px; height: 96px; max-width: 26vw; }
	.battle-center { width: 40px; }
	.action-btn { padding: 6px 6px 4px; }
	.btn-emoji { font-size: 24px; }
	.seg-item { padding: 5px 9px; font-size: 10px; }
}

/* 深色模式增强 - 提升对比度 */
.container.dark .action-btn { border-color: rgba(255,255,255,0.14); }
.container.dark .score-bar { box-shadow: 0 4px 16px rgba(0,0,0,0.4); }

/* 减少动画偏好 */
@media (prefers-reduced-motion: reduce) {
	.fighter-card { animation: none; }
	.center-badge { animation: none; }
	.bg-orb { filter: blur(42px); }
}
</style>
