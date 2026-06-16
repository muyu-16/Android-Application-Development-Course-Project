<template>
	<view class="seg">
		<view
			v-for="(item, idx) in items"
			:key="idx"
			class="seg-item"
			:class="{ active: modelValue === idx }"
			@tap="select(idx)"
		>
			<text class="seg-text" :class="{ 'seg-text-active': modelValue === idx }">
				{{ item }}
			</text>
		</view>
		<!-- 滑动指示器 -->
		<view
			class="seg-thumb"
			:style="thumbStyle"
		></view>
	</view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
	items: { type: Array, required: true },           // ['成员','流水','结算']
	modelValue: { type: Number, default: 0 }
})
const emit = defineEmits(['update:modelValue', 'change'])

function select(idx) {
	if (props.modelValue === idx) return
	emit('update:modelValue', idx)
	emit('change', idx)
}

// 关键：滑动 thumb 用 transform + cubic-bezier 强调缓动
const thumbStyle = computed(() => {
	const w = `calc((100% - 8rpx) / ${props.items.length})`
	return {
		width: w,
		transform: `translateX(${props.modelValue * 100}%)`
	}
})
</script>

<style scoped>
.seg {
	position: relative;
	display: flex;
	width: 100%;
	height: 72rpx;
	padding: 6rpx;
	background: var(--clr-bg-secondary);
	border-radius: 999rpx;
	border: 1rpx solid var(--clr-border);
	box-sizing: border-box;
}

.seg-item {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
	z-index: 1;
	cursor: pointer;
	user-select: none;
	transition: transform 100ms ease;
}
.seg-item:active {
	transform: scale(0.96);
}

.seg-text {
	font-size: 28rpx;
	font-weight: 600;
	color: var(--clr-text-primary);
	transition: color 200ms ease;
	white-space: nowrap;
}
.seg-text-active {
	color: var(--clr-accent-on);
	font-weight: 700;
}

/* 紫色滑块 */
.seg-thumb {
	position: absolute;
	top: 6rpx;
	left: 6rpx;
	height: calc(100% - 12rpx);
	background: var(--clr-accent);
	border-radius: 999rpx;
	box-shadow: 0 2rpx 8rpx rgba(103, 80, 164, 0.32),
				inset 0 1rpx 0 rgba(255, 255, 255, 0.25);
	transition: transform 350ms cubic-bezier(0.2, 0.8, 0.2, 1);
	z-index: 0;
	will-change: transform;
}

/* 暗色微调 */
[data-theme="dark"] .seg-thumb {
	background: var(--clr-accent);
	box-shadow: 0 2rpx 12rpx rgba(208, 188, 255, 0.28);
}
</style>
