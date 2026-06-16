<template>
	<view
		class="btn"
		:class="[
			`btn-${variant}`,
			{ 'btn-loading': loading, 'btn-disabled': disabled }
		]"
		:hover-class="!disabled && !loading ? 'btn-press' : ''"
		:hover-stay-time="50"
		@tap="onTap"
	>
		<view v-if="loading" class="btn-spinner"></view>
		<text v-else-if="icon" class="material-icons btn-icon">{{ icon }}</text>
		<text v-if="!loading" class="btn-text">{{ text }}</text>
	</view>
</template>

<script setup>
const props = defineProps({
	text: { type: String, default: '' },
	icon: { type: String, default: '' },
	variant: { type: String, default: 'primary' }, // primary | secondary | ghost | danger
	loading: { type: Boolean, default: false },
	disabled: { type: Boolean, default: false }
})
const emit = defineEmits(['tap'])

function onTap() {
	if (props.disabled || props.loading) return
	emit('tap')
}
</script>

<style scoped>
.btn {
	min-height: 96rpx;
	padding: 0 48rpx;
	border-radius: 999rpx;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 12rpx;
	font-size: 32rpx;
	font-weight: 600;
	letter-spacing: 0.3px;
	transition: transform 150ms cubic-bezier(0.2, 0, 0, 1),
				box-shadow 150ms cubic-bezier(0.2, 0, 0, 1),
				background 150ms ease;
	cursor: pointer;
	user-select: none;
}

/* 文字 + 图标 */
.btn-text {
	font: inherit;
	color: inherit;
	line-height: 1;
}
.btn-icon {
	font-size: 36rpx;
	color: inherit;
	line-height: 1;
}

/* ── Variants ── */
.btn-primary {
	background: var(--clr-accent);
	color: var(--clr-accent-on);
	box-shadow: 0 6rpx 16rpx rgba(103, 80, 164, 0.28),
				inset 0 1rpx 0 rgba(255, 255, 255, 0.25);
}

.btn-secondary {
	background: var(--clr-bg-secondary);
	color: var(--clr-text-primary);
	border: 1rpx solid var(--clr-border);
}

.btn-ghost {
	background: transparent;
	color: var(--clr-accent);
}

.btn-danger {
	background: var(--clr-danger);
	color: #FFFFFF;
	box-shadow: 0 6rpx 16rpx rgba(198, 40, 40, 0.25);
}

/* ── States ── */
.btn-press {
	transform: scale(0.97);
	box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.12) !important;
}

.btn-disabled {
	opacity: 0.4;
	cursor: not-allowed;
	filter: grayscale(0.3);
}

/* 加载动画 */
.btn-loading {
	pointer-events: none;
	opacity: 0.85;
}
.btn-spinner {
	width: 32rpx;
	height: 32rpx;
	border: 4rpx solid currentColor;
	border-top-color: transparent;
	border-radius: 50%;
	animation: spin 0.8s linear infinite;
}
@keyframes spin {
	to { transform: rotate(360deg); }
}
</style>
