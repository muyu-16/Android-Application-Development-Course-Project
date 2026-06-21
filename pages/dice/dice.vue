<!-- pages/dice/dice.vue -->
<!-- 骰子模块主入口：双Tab切换自由摇骰 / 大话骰遮罩 -->
<script setup>
import { ref } from 'vue'
import NavBar from '@/components/NavBar.vue'
import FreeMode from './free-mode.vue'
import CupMode from './cup-mode.vue'

const activeTab = ref('free')  // 'free' | 'cup'
</script>

<template>
	<view class="container">
		<!-- 顶部导航栏 -->
		<NavBar title="骰子" />

		<!-- Tab 切换 -->
		<view class="tab-bar glass-card">
			<view class="tab" :class="{ active: activeTab === 'free' }" @tap="activeTab = 'free'">
				<text class="tab-icon">🎲</text>
				<text class="tab-text">自由摇骰</text>
			</view>
			<view class="tab" :class="{ active: activeTab === 'cup' }" @tap="activeTab = 'cup'">
				<text class="tab-icon">🎭</text>
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
	background: var(--clr-bg-primary);
	padding: 0 16px;
	padding-top: calc(var(--safe-area-top, 24px) + 12px);
	padding-bottom: calc(var(--safe-area-bottom, 0px) + 24px);
	display: flex;
	flex-direction: column;
}

.tab-bar {
	display: flex;
	border-radius: 999px;
	padding: 4px;
	gap: 4px;
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
	transition: background 0.25s ease, transform 0.15s var(--ease-spring);
}
.tab:active { transform: scale(0.96); }
.tab-icon { font-size: 18px; }
.tab-text {
	font-size: 14px;
	font-weight: 600;
	color: var(--clr-text-secondary);
	transition: color 0.25s;
}
.tab.active {
	background: var(--clr-bg-tertiary);
	border-color: var(--clr-border);
}
.tab.active .tab-text {
	color: var(--clr-text-primary);
	font-weight: 700;
}

.content {
	flex: 1;
	overflow: hidden;
}
</style>
