﻿﻿﻿﻿<script setup>
import { onLaunch } from '@dcloudio/uni-app'

onLaunch(() => {
	console.log('PartyGlass App Launch')
})
</script>

<style>
/* ══════════════════════════════════════════════════════════════
   强制系统字体栈 — 修复中文豆腐块
   !important 确保覆盖 uni-app 各组件默认字体
   ══════════════════════════════════════════════════════════════ */
page, view, text, button, input, textarea, scroll-view, swiper, swiper-item {
	font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
	             "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei",
	             "Source Han Sans CN", "Noto Sans CJK SC", "WenQuanYi Micro Hei",
	             "Helvetica Neue", Arial, sans-serif !important;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
}

/* ══════════════════════════════════════════════════════════════
   Material Icons — 多 CDN 源（Google 国内不可用时走 cdnjs）
   ══════════════════════════════════════════════════════════════ */
@font-face {
	font-family: 'Material Icons';
	font-style: normal;
	font-weight: 400;
	src: url(https://fonts.gstatic.com/s/materialicons/v143/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2) format('woff2');
	src: url(https://cdnjs.cloudflare.com/ajax/libs/material-design-icons/4.0.0/iconfont/MaterialIcons-Regular.woff2) format('woff2'),
	     url(https://fonts.gstatic.com/s/materialicons/v143/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2) format('woff2');
}

.material-icons {
	font-family: 'Material Icons', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji', sans-serif;
	font-weight: normal;
	font-style: normal;
	font-size: 24px;
	line-height: 1;
	letter-spacing: normal;
	text-transform: none;
	display: inline-block;
	white-space: nowrap;
	word-wrap: normal;
	direction: ltr;
	-webkit-font-smoothing: antialiased;
	font-variant: none;
}

/* ══════════════════════════════════════════════════════════════
   设计系统 — 亮色主题
   WCAG AA: 文字 4.5:1 / 大字体 3:1
   ══════════════════════════════════════════════════════════════ */
:root, page {

	/* ── 颜色 tokens ── */
	--clr-bg-primary: #FAF8FF;       /* 页面主背景 */
	--clr-bg-secondary: #F5F3F9;     /* 二级背景 / 灰底 */
	--clr-bg-tertiary: #EADDFF;      /* 三级背景 / 浅紫底 */

	--clr-surface: #FFFFFF;          /* 卡片/浮层表面色 */

	--clr-text-primary: #1C1B1F;     /* 主文字 — #FAF8FF 上对比度 ~20:1 ✓ */
	--clr-text-secondary: #49454F;   /* 次要文字 — #FAF8FF 上对比度 ~6.5:1 ✓ */
	--clr-text-disabled: #9E9E9E;    /* 禁用文字 — #FAF8FF 上对比度 ~3.5:1 */

	--clr-accent: #6750A4;           /* 强调色 / 紫色 */
	--clr-accent-on: #FFFFFF;        /* 强调色上的文字 */
	--clr-on-accent: #FFFFFF;        /* 别名，兼容旧代码 */
	--clr-gold: #B8860B;             /* 金色 */

	--clr-success: #2E7D32;          /* 成功 */
	--clr-border: #CAC4D0;           /* 边框/分隔线 */
	--clr-danger: #B3261E;           /* 危险 */
	--clr-warning: #8D6E00;          /* 警告 — 比纯黄更易读 */

	/* ── 阴影 tokens ── */
	--shadow-sm: 0 1rpx 3rpx rgba(0,0,0,0.06), 0 1rpx 2rpx rgba(0,0,0,0.04);
	--shadow-md: 0 4rpx 6rpx rgba(0,0,0,0.05), 0 2rpx 4rpx rgba(0,0,0,0.04);
	--shadow-lg: 0 10rpx 15rpx rgba(0,0,0,0.05), 0 4rpx 6rpx rgba(0,0,0,0.04);
	--shadow-xl: 0 20rpx 25rpx rgba(0,0,0,0.06), 0 8rpx 10rpx rgba(0,0,0,0.04);
	--shadow-glass: 0 4rpx 24rpx rgba(0,0,0,0.06);

	/* ── 圆角 tokens ── */
	--rd-1: 8rpx;
	--rd-2: 16rpx;
	--rd-3: 24rpx;   /* = Material 3 卡片 */
	--rd-4: 32rpx;
	--rd-full: 999rpx;
	--rd-pill: 999rpx;   /* 别名，兼容旧代码 */
	--rd-button: 20rpx;  /* 按钮圆角 */

	/* ── 间距 tokens ── */
	--sp-1: 4rpx;
	--sp-2: 8rpx;
	--sp-3: 12rpx;
	--sp-4: 16rpx;
	--sp-5: 24rpx;
	--sp-6: 32rpx;

	/* ── 字号 tokens ── */
	--fs-12: 12rpx;
	--fs-14: 14rpx;
	--fs-16: 16rpx;
	--fs-22: 22rpx;
	--fs-32: 32rpx;
	/* 别名，兼容旧代码 */
	--fs-body: 16rpx;
	--fs-label: 14rpx;
	--fs-caption: 12rpx;
	--fs-title: 22rpx;

	/* ── 动效 ── */
	--ease-spring: cubic-bezier(0.20, 0.80, 0.20, 1);
	--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);

	/* ── 安全区域（px 单位，兼容 Android 状态栏） ── */
	--safe-area-top: env(safe-area-inset-top, 24px);
	--safe-area-bottom: env(safe-area-inset-bottom, 0px);
	/* 兼容别名 */
	--safe-top: env(safe-area-inset-top, 24px);
	--safe-bottom: env(safe-area-inset-bottom, 0px);

	/* ── 行高 ── */
	--lh-tight: 1.15;
	--lh-normal: 1.4;
	--lh-loose: 1.6;

	/* ── 触控最小尺寸 ── */
	--touch-min: 44px;
}

/* ══════════════════════════════════════════════════════════════
   设计系统 — 暗色主题
   WCAG AA: 文字 7:1
   ══════════════════════════════════════════════════════════════ */
[data-theme="dark"] {
	--clr-bg-primary: #141218;
	--clr-bg-secondary: #211F26;
	--clr-bg-tertiary: #2B2930;

	--clr-surface: #211F26;

	--clr-text-primary: #F5EFF7;     /* #141218 上对比度 ~13:1 ✓ */
	--clr-text-secondary: #CAC4D0;   /* #141218 上对比度 ~8:1 ✓ */
	--clr-text-disabled: #938F99;    /* #141218 上对比度 ~5:1 ✓ */

	--clr-accent: #D0BCFF;
	--clr-accent-on: #381E72;
	--clr-on-accent: #381E72;        /* 别名 */
	--clr-gold: #FFD740;

	--clr-success: #81C784;
	--clr-border: #49454F;
	--clr-danger: #F2B8B5;
	--clr-warning: #FFD54F;

	/* 暗色阴影更重 */
	--shadow-sm: 0 1rpx 3rpx rgba(0,0,0,0.3), 0 1rpx 2rpx rgba(0,0,0,0.2);
	--shadow-md: 0 4rpx 6rpx rgba(0,0,0,0.3), 0 2rpx 4rpx rgba(0,0,0,0.2);
	--shadow-lg: 0 10rpx 15rpx rgba(0,0,0,0.3), 0 4rpx 6rpx rgba(0,0,0,0.2);
	--shadow-xl: 0 20rpx 25rpx rgba(0,0,0,0.4), 0 8rpx 10rpx rgba(0,0,0,0.2);
	--shadow-glass: 0 4rpx 24rpx rgba(0,0,0,0.3);
}

/* 暗色 page 背景兜底 */
[data-theme="dark"] page {
	background-color: #141218;
}

page {
	background-color: var(--clr-bg-primary);
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
	-webkit-font-smoothing: antialiased;
	color: var(--clr-text-primary);
}

/* ══════════════════════════════════════════════════════════════
   玻璃材质 3 档
   ══════════════════════════════════════════════════════════════ */

/*
   G1 — 装饰层（背景氛围、光晕）
   blur 24px，最透
*/
.g1-glass {
	position: relative;
}
.g1-glass::before {
	content: '';
	position: absolute;
	inset: 0;
	background: rgba(255,255,255,0.50);
	backdrop-filter: blur(24px) saturate(180%);
	-webkit-backdrop-filter: blur(24px) saturate(180%);
	border: 1rpx solid rgba(255,255,255,0.20);
	pointer-events: none;
	z-index: 0;
}
[data-theme="dark"] .g1-glass::before {
	background: rgba(30,27,35,0.55);
	border-color: rgba(255,255,255,0.06);
}

/*
   G2 — 卡片层（列表行、功能卡）
   blur 16px，主用
*/
.g2-glass {
	position: relative;
}
.g2-glass::before {
	content: '';
	position: absolute;
	inset: 0;
	border-radius: inherit;
	background: rgba(255,255,255,0.75);
	backdrop-filter: blur(16px) saturate(180%);
	-webkit-backdrop-filter: blur(16px) saturate(180%);
	border: 1rpx solid rgba(255,255,255,0.30);
	box-shadow: var(--shadow-glass), inset 0 1rpx 0 rgba(255,255,255,0.60);
	pointer-events: none;
	z-index: 0;
}
[data-theme="dark"] .g2-glass::before {
	background: rgba(30,27,35,0.78);
	border-color: rgba(255,255,255,0.08);
	box-shadow: 0 4rpx 24rpx rgba(0,0,0,0.20), inset 0 1rpx 0 rgba(255,255,255,0.12);
}

/*
   G3 — 浮层（弹窗、sheet、toast）
   blur 24px，最高不透明度
*/
.g3-glass {
	position: relative;
}
.g3-glass::before {
	content: '';
	position: absolute;
	inset: 0;
	border-radius: inherit;
	background: rgba(255,255,255,0.88);
	backdrop-filter: blur(24px) saturate(180%);
	-webkit-backdrop-filter: blur(24px) saturate(180%);
	border: 1rpx solid rgba(255,255,255,0.30);
	box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.08), inset 0 1rpx 0 rgba(255,255,255,0.60);
	pointer-events: none;
	z-index: 0;
}
[data-theme="dark"] .g3-glass::before {
	background: rgba(30,27,35,0.90);
	border-color: rgba(255,255,255,0.08);
	box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.30), inset 0 1rpx 0 rgba(255,255,255,0.12);
}

/* 文字垫底 scrim — 放在 G2/G3 的 ::before 之上，确保文字不直接落在 blur 中 */
.g2-scrim,
.g3-scrim {
	position: relative;
	z-index: 1;
	border-radius: inherit;
	background: rgba(255,255,255,0.25);
}
[data-theme="dark"] .g2-scrim,
[data-theme="dark"] .g3-scrim {
	background: rgba(30,27,35,0.20);
}

/* backdrop-filter 降级 */
@supports not (backdrop-filter: blur(1px)) {
	.g1-glass::before { background: rgba(255,255,255,0.85) !important; backdrop-filter: none !important; }
	.g2-glass::before { background: rgba(255,255,255,0.92) !important; backdrop-filter: none !important; }
	.g3-glass::before { background: rgba(255,255,255,0.96) !important; backdrop-filter: none !important; }
	[data-theme="dark"] .g1-glass::before { background: rgba(30,27,35,0.85) !important; }
	[data-theme="dark"] .g2-glass::before { background: rgba(30,27,35,0.92) !important; }
	[data-theme="dark"] .g3-glass::before { background: rgba(30,27,35,0.96) !important; }
}

/* ══════════════════════════════════════════════════════════════
   文字工具类
   ══════════════════════════════════════════════════════════════ */
.txt-primary  { color: var(--clr-text-primary) !important; }
.txt-secondary { color: var(--clr-text-secondary) !important; }
.txt-disabled { color: var(--clr-text-disabled) !important; }
.txt-accent   { color: var(--clr-accent) !important; }
.txt-on-accent { color: var(--clr-accent-on) !important; }
.txt-border   { color: var(--clr-border) !important; }
.txt-gold     { color: var(--clr-gold) !important; }
.txt-success  { color: var(--clr-success) !important; }
.txt-danger   { color: var(--clr-danger) !important; }
.txt-warning  { color: var(--clr-warning) !important; }

/* 数字排版 */
.num {
	font-weight: 700;
	font-variant-numeric: tabular-nums;
}

/* ══════════════════════════════════════════════════════════════
   动画
   ══════════════════════════════════════════════════════════════ */
@keyframes fade-in-up {
	from { opacity: 0; transform: translateY(16rpx); }
	to { opacity: 1; transform: translateY(0); }
}
.fade-in-up {
	animation: fade-in-up 0.35s var(--ease-spring) both;
}

@keyframes fade-in {
	from { opacity: 0; }
	to { opacity: 1; }
}
.fade-in {
	animation: fade-in 0.20s ease both;
}

@keyframes press {
	0% { transform: scale(1); }
	50% { transform: scale(0.97); }
	100% { transform: scale(1); }
}
.press { animation: press 0.1s ease-out; }

@keyframes spring-pop {
	0% { transform: scale(0.9); opacity: 0; }
	100% { transform: scale(1); opacity: 1; }
}
.spring-pop { animation: spring-pop 0.30s var(--ease-bounce) both; }

/* reduced-motion — 低端机缩短动效 */
@media (prefers-reduced-motion: reduce) {
	* { animation-duration: 0.25s !important; transition-duration: 0.25s !important; }
}

/* ══════════════════════════════════════════════════════════════
   布局工具
   ══════════════════════════════════════════════════════════════ */
.flex-safe {
	display: flex;
	flex-direction: column;
	min-height: 0;
	flex: 1;
}
.text-safe {
	overflow-wrap: break-word;
	word-break: break-word;
	max-width: 100%;
}
.status-bar {
	height: var(--safe-top);
	min-height: 24rpx;
	width: 100%;
}

/* ══════════════════════════════════════════════════════════════
   统一页面布局
   ══════════════════════════════════════════════════════════════ */
.page-safe {
	padding-left: 16px;
	padding-right: 16px;
}
.page-safe-top {
	padding-top: calc(var(--safe-area-top, 24rpx) + 12px);
}
.page-safe-bottom {
	padding-bottom: calc(var(--safe-area-bottom, 0rpx) + 24px);
}

/* 导航栏统一高度 */
.nav-bar-lg {
	height: 56px;
	padding: 0 16px;
	display: flex;
	align-items: center;
	justify-content: space-between;
}

/* 卡片统一间距栈 */
.stack-2 { gap: 4px; display: flex; flex-direction: column; }
.stack-3 { gap: 8px; display: flex; flex-direction: column; }
.stack-4 { gap: 12px; display: flex; flex-direction: column; }
.stack-5 { gap: 16px; display: flex; flex-direction: column; }
</style>

<template>
	<view>
		<slot />
	</view>
</template>