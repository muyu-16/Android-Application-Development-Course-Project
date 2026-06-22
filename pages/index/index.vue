﻿﻿﻿﻿﻿﻿﻿﻿<script setup>
import { ref, computed, onMounted } from 'vue'
import { useChipStore } from '@/stores/chip'
import { useThemeStore } from '@/stores/theme'

const chip = useChipStore()
const theme = useThemeStore()

// ══════ 状态栏高度 ══════
const statusBarHeight = ref(0)

onMounted(() => {
	const sysInfo = uni.getSystemInfoSync()
	statusBarHeight.value = sysInfo.statusBarHeight || 0
})

// ══════ 副标题池 ══════
const taglines = [
	'聚会时间到', '今晚玩什么？', '一起来玩吧！',
	'游戏开始了', '谁是今晚的赢家？', '欢乐时光',
	'放松时刻', '来吧，玩一局！', '狂欢之夜'
]

const tagline = ref(taglines[Math.floor(Math.random() * taglines.length)])

// ══════ 用户信息 ══════
const user = computed(() => {
	const me = chip.players[0]
	return me ? { name: me.name, avatar: me.avatar } : { name: '游客', avatar: '👤' }
})

// ══════ 游戏卡片数据 ══════
const games = [
	{ id: 'dice',    title: '骰子',   icon: '🎲',   color: '#CE93D8', page: '/pages/dice/dice' },
	{ id: 'roulette', title: '轮盘',  icon: '🎯',   color: '#90CAF9', page: '/pages/roulette/roulette' },
	{ id: 'truth',   title: '真心话', icon: '🧠',   color: '#F48FB1', page: '/pages/truth/truth' },
	{ id: 'rps',     title: '猜拳',   icon: '✋',    color: '#80DEEA', page: '/pages/rps/rps' },
	{ id: 'chip',    title: '筹码',   icon: '💰',   color: '#A5D6A7', page: '/pages/chip/chip' }
]

// ══════ Tab ══════
const activeTab = ref(0)  // 0=首页, 1=我的

function navigateTo(url) {
	uni.navigateTo({ url })
}

function handleCustom() {
	uni.showToast({ title: '敬请期待', icon: 'none' })
}

function toggleTheme() {
	theme.toggle()
}
</script>

<template>
	<view class="container">
		<!-- ══════ 自定义导航栏 ══════ -->
		<view class="nav-bar" :style="{ paddingTop: (statusBarHeight + 8) + 'px' }">
			<view class="nav-left">
				<text class="nav-title">{{ activeTab === 0 ? '今晚玩什么' : '我的' }}</text>
				<text class="nav-subtitle" v-if="activeTab === 0">{{ tagline }}</text>
			</view>
			<view class="nav-avatar" @tap="navigateTo('/pages/chip/chip')">
				<text class="material-icons">{{ user.avatar }}</text>
			</view>
		</view>

		<!-- ══════ 首页：游戏网格 ══════ -->
		<view v-if="activeTab === 0" class="grid-wrapper">
			<view class="grid">
				<view
					v-for="(game, idx) in games"
					:key="game.id"
					class="game-card"
					:style="{ '--delay': idx * 0.08 + 's', '--tint': game.color + '14' }"
					@tap="navigateTo(game.page)"
					hover-class="card-press"
				>
					<view class="card-glow" :style="{ background: game.color + '08' }"></view>
					<view class="card-icon-wrap">
						<text class="material-icons card-icon">{{ game.icon }}</text>
					</view>
					<text class="card-label">{{ game.title }}</text>
				</view>

				<view
					class="game-card add-card"
					style="--delay: 0.48s; --tint: var(--clr-bg-secondary)"
					@tap="handleCustom"
					hover-class="card-press"
				>
					<view class="card-icon-wrap add">
						<text class="material-icons card-icon">＋</text>
					</view>
					<text class="card-label">自定义</text>
				</view>
			</view>
		</view>

		<!-- ══════ 我的：设置面板 ══════ -->
		<view v-else class="profile-wrapper">
			<!-- 用户卡片 -->
			<view class="profile-card glass-card">
				<view class="profile-avatar">
					<text>{{ user.avatar }}</text>
				</view>
				<view class="profile-info">
					<text class="profile-name">{{ user.name }}</text>
					<text class="profile-desc">聚会达人</text>
				</view>
			</view>

			<!-- 设置列表 -->
			<view class="settings-group">
				<view class="setting-item glass-card gbtn" @tap="toggleTheme">
					<view class="setting-left">
						<text class="setting-icon">{{ theme.effectiveTheme === 'dark' ? '🌙' : '☀️' }}</text>
						<text class="setting-label">深色模式</text>
					</view>
					<text class="setting-value">{{ theme.effectiveTheme === 'dark' ? '已开启' : '已关闭' }}</text>
				</view>

				<view class="setting-item glass-card gbtn" @tap="navigateTo('/pages/chip/chip')">
					<view class="setting-left">
						<text class="setting-icon">💰</text>
						<text class="setting-label">筹码管理</text>
					</view>
					<text class="setting-arrow">›</text>
				</view>

				<view class="setting-item glass-card gbtn" @tap="handleCustom">
					<view class="setting-left">
						<text class="setting-icon">📊</text>
						<text class="setting-label">游戏统计</text>
					</view>
					<text class="setting-arrow">›</text>
				</view>

				<view class="setting-item glass-card gbtn" @tap="handleCustom">
					<view class="setting-left">
						<text class="setting-icon">⚙️</text>
						<text class="setting-label">更多设置</text>
					</view>
					<text class="setting-arrow">›</text>
				</view>
			</view>

			<!-- 关于 -->
			<view class="about-section">
				<text class="about-text">PartyGlass v1.0</text>
				<text class="about-sub">让聚会更有趣</text>
			</view>
		</view>

		<!-- ══════ 底部 Tab Bar ══════ -->
		<view class="tab-bar">
			<view
				class="tab-item"
				:class="{ active: activeTab === 0 }"
				@tap="activeTab = 0"
			>
				<view class="tab-icon-wrap">
					<text class="tab-icon">🏠</text>
				</view>
				<text class="tab-label">首页</text>
				<view class="tab-indicator" v-if="activeTab === 0"></view>
			</view>
			<view
				class="tab-item"
				:class="{ active: activeTab === 1 }"
				@tap="activeTab = 1"
			>
				<view class="tab-icon-wrap">
					<text class="tab-icon">👤</text>
				</view>
				<text class="tab-label">我的</text>
				<view class="tab-indicator" v-if="activeTab === 1"></view>
			</view>
		</view>
	</view>
</template>

<style scoped>
/* ══════ 容器 ══════ */
.container {
	min-height: 100vh;
	background-color: var(--clr-bg-primary);
	padding-bottom: 80px;
	position: relative;
}

[data-theme="dark"] .container {
	background-color: var(--clr-bg-primary);
}

.container::after {
	content: '';
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	height: 30%;
	background: radial-gradient(ellipse at 50% 100%, rgba(103,80,164,0.05) 0%, transparent 70%);
	pointer-events: none;
	z-index: 0;
}

/* ══════ 导航栏 ══════ */
.nav-bar {
	padding: 0 16px;
	padding-top: 8px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	position: relative;
	z-index: 2;
}

.nav-left {
	display: flex;
	flex-direction: column;
	gap: 2px;
}

.nav-title {
	font-size: 32px;
	font-weight: 800;
	color: var(--clr-text-primary);
	line-height: 1.1;
	letter-spacing: -0.5px;
}

.nav-subtitle {
	font-size: 14px;
	color: var(--clr-text-secondary);
	margin-top: 2px;
}

.nav-avatar {
	width: 48px;
	height: 48px;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.72);
	backdrop-filter: blur(14px) saturate(180%);
	-webkit-backdrop-filter: blur(14px) saturate(180%);
	border: 1px solid rgba(255,255,255,0.45);
	box-shadow: 0 4px 16px rgba(31, 28, 48, 0.08), inset 0 1px 0 rgba(255,255,255,0.6);
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	transition: transform 0.15s var(--ease-spring), box-shadow 0.25s ease;
}

.nav-avatar:active {
	transform: scale(0.93);
}

.nav-avatar .material-icons {
	font-size: 24px;
	color: var(--clr-accent);
}

/* ══════ 网格 ══════ */
.grid-wrapper {
	padding: var(--sp-5);
	padding-top: var(--sp-4);
	position: relative;
	z-index: 1;
}

.grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 16px;
}

/* ══════ 游戏卡片 ══════ */
.game-card {
	position: relative;
	height: 180px;
	border-radius: 24px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 12px;
	cursor: pointer;
	overflow: hidden;
	background: rgba(255, 255, 255, 0.72);
	backdrop-filter: blur(20px) saturate(180%);
	-webkit-backdrop-filter: blur(20px) saturate(180%);
	border: 1px solid rgba(255,255,255,0.45);
	box-shadow: 0 4px 20px rgba(31, 28, 48, 0.10), inset 0 1px 0 rgba(255,255,255,0.6);
	transition: transform 0.2s var(--ease-spring), box-shadow 0.2s, background 0.25s ease;
	animation: card-in 0.35s var(--ease-spring) both;
	animation-delay: var(--delay);
}
.game-card:hover {
	box-shadow: 0 6px 24px rgba(31, 28, 48, 0.15), inset 0 1px 0 rgba(255,255,255,0.7);
}
.game-card::before {
	content: '';
	position: absolute;
	top: 0;
	left: 10%;
	right: 10%;
	height: 0.5px;
	background: linear-gradient(to right, transparent, rgba(255,255,255,0.6), transparent);
	z-index: 1;
}
.game-card::after {
	content: '';
	position: absolute;
	inset: 0;
	background: var(--tint, transparent);
	border-radius: 28px;
	pointer-events: none;
}

.card-press {
	transform: scale(0.97) !important;
	box-shadow: 0 2px 12px rgba(0,0,0,0.08) !important;
	backdrop-filter: blur(24px) saturate(200%) brightness(1.08) !important;
	-webkit-backdrop-filter: blur(24px) saturate(200%) brightness(1.08) !important;
}

.card-glow {
	position: absolute;
	inset: 0;
	border-radius: 28px;
	pointer-events: none;
}

.card-icon-wrap {
	width: 72px;
	height: 72px;
	border-radius: 24px;
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
	z-index: 1;
}

.card-icon {
	font-size: 48px;
	color: var(--clr-accent);
}

.card-icon-wrap.add {
	background: rgba(255, 255, 255, 0.55);
	backdrop-filter: blur(14px) saturate(180%);
	-webkit-backdrop-filter: blur(14px) saturate(180%);
	border: 1.5px dashed rgba(31, 28, 48, 0.25);
	box-shadow: inset 0 1px 0 rgba(255,255,255,0.6);
}

.card-icon-wrap.add .card-icon {
	color: var(--clr-text-secondary);
	font-size: 36px;
}

.card-label {
	font-size: 18px;
	font-weight: 600;
	color: var(--clr-text-primary);
	position: relative;
	z-index: 1;
}

.add-card .card-label {
	color: var(--clr-text-secondary);
}

@keyframes card-in {
	from {
		opacity: 0;
		transform: translateY(20px) scale(0.95);
	}
	to {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
}

/* ══════ 我的：设置面板 ══════ */
.profile-wrapper {
	padding: var(--sp-5);
	padding-top: var(--sp-3);
	position: relative;
	z-index: 1;
}

.profile-card {
	display: flex;
	align-items: center;
	gap: 16px;
	padding: 20px;
	border-radius: 24px;
	margin-bottom: 24px;
}

.profile-avatar {
	width: 56px;
	height: 56px;
	border-radius: 50%;
	background: rgba(103, 80, 164, 0.12);
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 28px;
	flex-shrink: 0;
}

.profile-info {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.profile-name {
	font-size: 20px;
	font-weight: 700;
	color: var(--clr-text-primary);
}

.profile-desc {
	font-size: 14px;
	color: var(--clr-text-secondary);
}

.settings-group {
	display: flex;
	flex-direction: column;
	gap: 8px;
	margin-bottom: 32px;
}

.setting-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 16px 20px;
	border-radius: 16px;
}

.setting-left {
	display: flex;
	align-items: center;
	gap: 12px;
}

.setting-icon {
	font-size: 22px;
}

.setting-label {
	font-size: 16px;
	font-weight: 600;
	color: var(--clr-text-primary);
}

.setting-value {
	font-size: 14px;
	color: var(--clr-text-secondary);
	font-weight: 500;
}

.setting-arrow {
	font-size: 20px;
	color: var(--clr-text-disabled);
	font-weight: 300;
}

.about-section {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 4px;
	padding: 24px 0;
}

.about-text {
	font-size: 14px;
	color: var(--clr-text-disabled);
	font-weight: 500;
}

.about-sub {
	font-size: 12px;
	color: var(--clr-text-disabled);
	opacity: 0.7;
}

/* ══════ 底部 Tab Bar ══════ */
.tab-bar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	height: calc(64px + var(--safe-area-bottom));
	padding-bottom: var(--safe-area-bottom);
	display: flex;
	align-items: center;
	background: rgba(255, 255, 255, 0.75);
	backdrop-filter: blur(24px) saturate(180%);
	-webkit-backdrop-filter: blur(24px) saturate(180%);
	border-top: 1px solid rgba(255,255,255,0.55);
	box-shadow: 0 -4px 20px rgba(31, 28, 48, 0.08), inset 0 1px 0 rgba(255,255,255,0.7);
	z-index: 50;
}

[data-theme="dark"] .tab-bar {
	background: rgba(28, 27, 31, 0.72);
	border-top-color: rgba(255, 255, 255, 0.08);
}

.tab-item {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 4px;
	height: 100%;
	min-height: 48px;
	position: relative;
	cursor: pointer;
	transition: transform 0.15s;
	padding: 6px 0;
}

.tab-item:active { transform: scale(0.94); }

.tab-icon-wrap {
	width: 28px;
	height: 28px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: background 0.25s;
}

.tab-item.active .tab-icon-wrap {
	background: rgba(103, 80, 164, 0.92);
	backdrop-filter: blur(14px) saturate(200%);
	-webkit-backdrop-filter: blur(14px) saturate(200%);
	box-shadow: 0 4px 20px rgba(103, 80, 164, 0.35), inset 0 1px 0 rgba(255,255,255,0.2);
}

.tab-icon {
	font-size: 22px;
	color: var(--clr-text-secondary);
	transition: color 0.25s;
}

.tab-item.active .tab-icon {
	color: #FFFFFF;
}

.tab-label {
	font-size: 10px;
	font-weight: 600;
	color: var(--clr-text-secondary);
	transition: color 0.25s;
}

.tab-item.active .tab-label {
	color: var(--clr-accent);
}

.tab-indicator {
	position: absolute;
	bottom: 6px;
	left: 50%;
	transform: translateX(-50%);
	width: 20px;
	height: 4px;
	border-radius: 2px;
	background: rgba(103, 80, 164, 0.92);
	box-shadow: 0 2px 8px rgba(103, 80, 164, 0.35);
}
</style>
