<!-- pages/index/index.vue -->
<!-- 应用入口页：底部功能导航 + 内容区组件切换 -->
<script setup>
import { ref } from 'vue'
import DicePage from '@/pages/dice/dice.vue'
import RoulettePage from '@/pages/roulette/roulette.vue'
import TruthPage from '@/pages/truth/truth.vue'
import RpsPage from '@/pages/rps/rps.vue'
import ChipPage from '@/pages/chip/chip.vue'

// ══════ 底部导航配置 ══════
const tabs = [
	{ id: 'dice',     label: '骰子',   icon: '🎲' },
	{ id: 'roulette', label: '轮盘',   icon: '🎯' },
	{ id: 'truth',    label: '真心话', icon: '🧠' },
	{ id: 'rps',      label: '猜拳',   icon: '✋' },
	{ id: 'chip',     label: '筹码',   icon: '💰' }
]

const activeTab = ref('dice')

function onTabTap(tab) {
	activeTab.value = tab.id
}
</script>

<template>
	<view class="container">
		<!-- ══════ 内容区：根据 activeTab 切换组件 ══════ -->
		<view class="content-area">
			<DicePage v-if="activeTab === 'dice'" />
			<RoulettePage v-else-if="activeTab === 'roulette'" />
			<TruthPage v-else-if="activeTab === 'truth'" />
			<RpsPage v-else-if="activeTab === 'rps'" />
			<ChipPage v-else-if="activeTab === 'chip'" />
		</view>

		<!-- ══════ 底部功能导航栏 ══════ -->
		<view class="tab-bar">
			<view
				v-for="tab in tabs"
				:key="tab.id"
				class="tab-item"
				:class="{ active: activeTab === tab.id }"
				@tap="onTabTap(tab)"
			>
				<view class="tab-icon-wrap">
					<text class="tab-icon">{{ tab.icon }}</text>
				</view>
				<text class="tab-label">{{ tab.label }}</text>
				<view class="tab-indicator" v-if="activeTab === tab.id"></view>
			</view>
		</view>
	</view>
</template>

<style scoped>
/* ══════ 容器 ══════ */
.container {
	min-height: 100vh;
	background-color: var(--clr-bg-primary);
	display: flex;
	flex-direction: column;
	position: relative;
}

/* ══════ 内容区 ══════ */
.content-area {
	flex: 1;
	overflow: hidden;
	display: flex;
	flex-direction: column;
	/* 为底部导航栏预留空间，防止内容被遮挡 */
	padding-bottom: calc(72px + var(--safe-area-bottom, 0px));
}

/* ══════ 底部功能导航栏 ══════ */
.tab-bar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	height: calc(72px + var(--safe-area-bottom, 0px));
	padding-bottom: var(--safe-area-bottom, 0px);
	display: flex;
	align-items: center;
	background: rgba(255, 255, 255, 0.75);
	backdrop-filter: blur(24px) saturate(180%);
	-webkit-backdrop-filter: blur(24px) saturate(180%);
	border-top: 1px solid rgba(255,255,255,0.55);
	box-shadow: 0 -4px 20px rgba(31, 28, 48, 0.08), inset 0 1px 0 rgba(255,255,255,0.7);
	z-index: 50;
}

/* 真心话深色页面需要深色 Tab 栏 */
[data-theme="dark"] .tab-bar,
.dark-tab-bar {
	background: rgba(28, 27, 31, 0.72);
	border-top-color: rgba(255, 255, 255, 0.08);
}

.tab-item {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 6rpx;
	height: 100%;
	min-height: 52px;
	position: relative;
	transition: transform 0.15s;
	padding: 8rpx 0;
}

.tab-item:active { transform: scale(0.94); }

.tab-icon-wrap {
	width: 64rpx;
	height: 64rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: background 0.25s;
}

.tab-item.active .tab-icon-wrap {
	background: rgba(103, 80, 164, 0.92);
	box-shadow: 0 8rpx 40rpx rgba(103, 80, 164, 0.35), inset 0 2rpx 0 rgba(255,255,255,0.2);
}

.tab-icon {
	font-size: 52rpx;
	color: var(--clr-text-secondary);
	transition: color 0.25s;
}

.tab-item.active .tab-icon {
	color: #FFFFFF;
}

.tab-label {
	font-size: 24rpx;
	font-weight: 600;
	color: var(--clr-text-secondary);
	transition: color 0.25s;
}

.tab-item.active .tab-label {
	color: var(--clr-accent);
}

.tab-indicator {
	position: absolute;
	bottom: 12rpx;
	left: 50%;
	transform: translateX(-50%);
	width: 40rpx;
	height: 8rpx;
	border-radius: 4rpx;
	background: rgba(103, 80, 164, 0.92);
	box-shadow: 0 4rpx 16rpx rgba(103, 80, 164, 0.35);
}
</style>
