<!-- pages/dice/dice.vue -->
<!-- 骰子模块主入口：双Tab切换自由摇骰 / 大话骰遮罩 -->
<script setup>
import { ref } from 'vue'
import FreeMode from './free-mode.vue'
import CupMode from './cup-mode.vue'

const activeTab = ref('free')  // 'free' | 'cup'
</script>

<template>
	<view class="container">
		<!-- 顶部导航栏 -->
		<view class="nav-bar">
			<view class="nav-left">
				<text class="material-icons nav-back" @tap="uni.navigateBack()">←</text>
				<text class="nav-title">骰子</text>
			</view>
		</view>

		<!-- Tab 切换 -->
		<view class="tab-bar">
			<view class="tab" :class="{ active: activeTab === 'free' }" @tap="activeTab = 'free'">
				<text class="tab-icon">🎲</text>
				<text class="tab-text">自由摇骰</text>
			</view>
			<view class="tab" :class="{ active: activeTab === 'cup' }" @tap="activeTab = 'cup'">
				<text class="tab-icon">�</text>
				<text class="tab-text">大话骰遮罩</text>
			</view>
		</view>

		<!-- 内容区 -->
		<view class="content">
			<FreeMode v-if="activeTab === 'free'" />
			<CupMode v-else />
		</view>
	</view>
</template>

<style scoped>
.container {
	min-height: 100vh;
	background: #1a1a2e;
	padding: 16px;
	padding-top: calc(var(--safe-area-top, 24px) + 20px);
	padding-bottom: calc(var(--safe-area-bottom, 0px) + 24px);
	display: flex;
	flex-direction: column;
}

.nav-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding-top: 12px;
	margin-bottom: 20px;
}
.nav-left {
	display: flex;
	align-items: center;
	gap: 12px;
}
.nav-back {
	font-size: 22px;
	color: #F5EFF7;
	padding: 4px;
}
.nav-title {
	font-size: 22px;
	font-weight: 700;
	color: #F5EFF7;
}

.tab-bar {
	display: flex;
	background: rgba(30, 27, 35, 0.55);
	backdrop-filter: blur(14px) saturate(180%);
	-webkit-backdrop-filter: blur(14px) saturate(180%);
	border: 1px solid rgba(255, 255, 255, 0.10);
	border-radius: 999px;
	padding: 4px;
	gap: 4px;
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08);
	margin-bottom: 16px;
}
.tab {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	padding: 10px 0;
	border-radius: 999px;
	border: 1px solid transparent;
	transition: background 0.25s ease, transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.tab:active { transform: scale(0.96); }
.tab-icon { font-size: 18px; }
.tab-text {
	font-size: 14px;
	font-weight: 600;
	color: #CAC4D0;
	transition: color 0.25s;
}
.tab.active {
	background: rgba(208, 188, 255, 0.22);
	border: 1px solid rgba(208, 188, 255, 0.55);
	box-shadow: 0 2px 8px rgba(208, 188, 255, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.08);
}
.tab.active .tab-text {
	color: #F5EFF7;
	font-weight: 700;
}

.content {
	flex: 1;
	overflow: hidden;
}
</style>
