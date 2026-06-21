<!-- components/NavBar.vue -->
<!-- 统一导航栏组件：返回按钮 + 标题 + 右侧插槽 -->
<script setup>
import { ref, onMounted } from 'vue'

defineProps({
	title: { type: String, default: '' },
	showBack: { type: Boolean, default: true }
})

const statusBarHeight = ref(0)

onMounted(() => {
	// 获取系统状态栏高度，确保导航条不被状态栏遮挡
	const sysInfo = uni.getSystemInfoSync()
	statusBarHeight.value = sysInfo.statusBarHeight || 0
})

const goBack = () => {
	uni.navigateBack({ delta: 1 })
}
</script>

<template>
	<view class="nav-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
		<view class="nav-content">
			<view class="nav-left">
				<text v-if="showBack" class="nav-back" @tap="goBack">&#8592;</text>
				<text class="nav-title">{{ title }}</text>
			</view>
			<view class="nav-right">
				<slot name="right"></slot>
			</view>
		</view>
	</view>
</template>

<style scoped>
.nav-bar {
	flex-shrink: 0;
}

.nav-content {
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 56px;
	padding: 0 16px;
}

.nav-left {
	display: flex;
	align-items: center;
	gap: 12px;
}

.nav-back {
	font-size: 22px;
	color: var(--clr-text-primary);
	padding: 4px;
	line-height: 1;
}

.nav-title {
	font-size: 22px;
	font-weight: 700;
	color: var(--clr-text-primary);
}

.nav-right {
	display: flex;
	align-items: center;
	gap: 8px;
}
</style>
