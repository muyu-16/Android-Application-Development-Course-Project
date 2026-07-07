<!-- components/NavBar.vue -->
<!-- 统一导航栏组件：返回按钮 + 标题 + 右侧插槽 -->
<!-- 适配微信小程序：状态栏高度 + 胶囊按钮避让 -->
<script setup>
import { ref, onMounted } from 'vue'

defineProps({
	title: { type: String, default: '' },
	showBack: { type: Boolean, default: false }
})

const statusBarHeight = ref(0)
const navBarHeight = ref(0)
const capsuleWidth = ref(0)

onMounted(() => {
	const sysInfo = uni.getSystemInfoSync()
	statusBarHeight.value = sysInfo.statusBarHeight || 0

	// #ifdef MP-WEIXIN
	try {
		const rect = uni.getMenuButtonBoundingClientRect()
		navBarHeight.value = (rect.top - sysInfo.statusBarHeight) * 2 + rect.height
		// 右侧避让宽度 = 胶囊右侧到屏幕右侧的距离 + 胶囊宽度
		capsuleWidth.value = (sysInfo.windowWidth - rect.right) + rect.width
	} catch (e) {
		navBarHeight.value = 44
	}
	// #endif

	// #ifndef MP-WEIXIN
	navBarHeight.value = 44
	// #endif
})

const goBack = () => {
	uni.navigateBack({ delta: 1 })
}
</script>

<template>
	<view class="nav-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
		<view class="nav-content" :style="{ height: navBarHeight + 'px', paddingRight: capsuleWidth ? capsuleWidth + 'px' : undefined }">
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
	/* height 由内联 style 动态控制 */
	min-height: 44px;
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
