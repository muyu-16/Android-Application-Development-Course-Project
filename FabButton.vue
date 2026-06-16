<template>
	<view
		class="fab"
		:style="{ bottom: bottom }"
		hover-class="fab-press"
		:hover-stay-time="50"
		@tap="onTap"
	>
		<text class="material-icons fab-icon">{{ icon }}</text>
		<view v-if="badge" class="fab-badge">
			<text class="fab-badge-text">{{ badge }}</text>
		</view>
	</view>
</template>

<script setup>
const props = defineProps({
	icon: { type: String, default: 'add' },
	bottom: { type: String, default: 'calc(var(--safe-bottom) + 24rpx)' },
	badge: { type: [String, Number], default: '' }
})
const emit = defineEmits(['tap'])

function onTap() {
	emit('tap')
}
</script>

<style scoped>
.fab {
	position: fixed;
	right: 24rpx;
	width: 112rpx;
	height: 112rpx;
	border-radius: 50%;
	background: var(--clr-surface);
	backdrop-filter: blur(20rpx) saturate(180%);
	-webkit-backdrop-filter: blur(20rpx) saturate(180%);
	border: 1rpx solid rgba(255, 255, 255, 0.40);
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.10),
				inset 0 1rpx 0 rgba(255, 255, 255, 0.50);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 60;
	cursor: pointer;
	user-select: none;
	transition: transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1),
				box-shadow 200ms ease;
}

[data-theme="dark"] .fab {
	background: rgba(40, 38, 47, 0.85);
	border-color: rgba(255, 255, 255, 0.10);
}

.fab-icon {
	font-size: 56rpx;
	color: var(--clr-accent);
	line-height: 1;
}

.fab-press {
	transform: scale(0.92);
	box-shadow: 0 3rpx 10rpx rgba(0, 0, 0, 0.18);
}

/* 角标 */
.fab-badge {
	position: absolute;
	top: 4rpx;
	right: 4rpx;
	min-width: 32rpx;
	height: 32rpx;
	padding: 0 8rpx;
	background: var(--clr-danger);
	border-radius: 999rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border: 2rpx solid var(--clr-bg-primary);
}
.fab-badge-text {
	font-size: 20rpx;
	font-weight: 700;
	color: #FFFFFF;
	line-height: 1;
}
</style>
