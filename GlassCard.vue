<template>
	<view
		class="g2-glass card"
		:class="[
			{ interactive: interactive, padded: padded },
			`card-${level}`
		]"
		:hover-class="interactive ? 'card-press' : ''"
		:hover-stay-time="50"
		@tap="onTap"
	>
		<view class="g2-scrim card-inner">
			<slot></slot>
		</view>
	</view>
</template>

<script setup>
const props = defineProps({
	level: { type: String, default: 'g2' },   // g1 | g2 | g3
	interactive: { type: Boolean, default: false },
	padded: { type: Boolean, default: true }
})
const emit = defineEmits(['tap'])

function onTap() {
	if (props.interactive) emit('tap')
}
</script>

<style scoped>
.card {
	position: relative;
	border-radius: 28rpx;
	overflow: hidden;
	background: transparent;
	transition: transform 200ms cubic-bezier(0.2, 0, 0, 1);
}

/* 装饰层（::before 来自全局 .g2-glass） */
.card::before {
	background: rgba(255, 255, 255, 0.75) !important;
	border-radius: 28rpx;
}
[data-theme="dark"] .card::before {
	background: rgba(30, 27, 35, 0.78) !important;
}

/* g3 更不透明 */
.card-g3::before {
	background: rgba(255, 255, 255, 0.88) !important;
	backdrop-filter: blur(24rpx) saturate(180%) !important;
}
[data-theme="dark"] .card-g3::before {
	background: rgba(30, 27, 35, 0.90) !important;
}

/* 文字垫底（用全局 .g2-scrim 的 base） */
.card-inner {
	padding: 24rpx;
}

/* 不需要内边距 */
.card:not(.padded) .card-inner {
	padding: 0;
}

/* 交互态 */
.interactive {
	cursor: pointer;
	user-select: none;
}
.card-press {
	transform: scale(0.98);
	filter: brightness(1.05);
}
</style>
