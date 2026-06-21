﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿<script setup>
/**
 * 转盘页面 — 基于 vue-wheel-spinner 官方 Demo 视觉风格
 *
 * 架构映射：
 *   vue-wheel-spinner              本实现
 *   ─────────────────────────────────────────────
 *   slices (props)          ←→    store.slices (computed)
 *   spinWheel(winnerIndex)  ←→    spinWheel(winnerIndex)
 *   @spin-start             ←→    onSpinStart()
 *   @spin-end               ←→    onSpinEnd(winnerIndex)
 *   #cursor slot            ←→    wheel-pointer
 *   #default slot           ←→    spin-button
 *   spinDuration (props)    ←→    SPIN_DURATION
 *   sliceFontStyle (props)  ←→    SLICE_FONT_STYLE
 *   sliceTextPosition (props)←→   'edge'
 */
import { ref, computed, onBeforeUnmount } from 'vue'
import NavBar from '@/components/NavBar.vue'
import { useRouletteStore, SECTOR_COLORS, SECTOR_TEXT_COLORS } from '@/stores/roulette'

const store = useRouletteStore()

// ══════════════════════════════════════
// vue-wheel-spinner 核心参数
// ══════════════════════════════════════
const SPIN_DURATION = 4000
const SLICE_FONT_STYLE = 'bold 16px Arial'
const CURSOR_ANGLE = 0
const CURSOR_POSITION = 'edge'

// ══════════════════════════════════════
// 旋转状态
// ══════════════════════════════════════
const isSpinning = ref(false)
const rotation = ref(0)
const winnerIndex = ref(-1)
const flashCount = ref(0)
const showResult = ref(false)
const resultText = ref('')

// ══════════════════════════════════════
// 编辑状态
// ══════════════════════════════════════
const newLabel = ref('')
const editingId = ref(null)
const editingLabel = ref('')
const showDrawer = ref(false)

// ══════════════════════════════════════
// 物理动画引擎（rAF 驱动，三段式缓动）
// ══════════════════════════════════════
let animFrameId = null
let lastTickSector = -1

const raf = typeof requestAnimationFrame !== 'undefined'
	? requestAnimationFrame
	: (cb) => setTimeout(cb, 16)
const caf = typeof cancelAnimationFrame !== 'undefined'
	? cancelAnimationFrame
	: clearTimeout

/**
 * spinWheel(winnerIndex) — vue-wheel-spinner 核心 API
 */
function spinWheel(targetIdx) {
	if (isSpinning.value) return
	if (store.sectorCount < 2) {
		uni.showToast({ title: '至少需要 2 个选项', icon: 'none' })
		return
	}

	onSpinStart()

	if (targetIdx === undefined || targetIdx === null || targetIdx < 0) {
		targetIdx = Math.floor(Math.random() * store.sectorCount)
	}

	const segAngle = 360 / store.sectorCount
	const startRotation = rotation.value

	const desiredRemainder = ((360 - targetIdx * segAngle - segAngle / 2) % 360 + 360) % 360
	const currentRemainder = ((startRotation % 360) + 360) % 360
	let delta = desiredRemainder - currentRemainder
	if (delta < 0) delta += 360

	const extraSpins = 5 + Math.floor(Math.random() * 3)
	const totalDelta = extraSpins * 360 + delta
	const endRotation = startRotation + totalDelta

	const startTime = Date.now()
	lastTickSector = -1

	// ══════════════════════════════════════
	// 三段式物理动画引擎
	//
	// 模拟真实转盘物理运动：
	//   第一段（0 ~ T1）：加速 — 施力启动，线性增速（模拟推力）
	//   第二段（T1 ~ T2）：匀速 — 惯性运动，角速度恒定
	//   第三段（T2 ~ 1.0）：减速 — 阻尼摩擦，二次方衰减至零
	//
	// 速度 v(t) 在 T1、T2 处连续，无跳跃
	// 最终位置 easedT(1) = 1，精确停在目标角度
	// ══════════════════════════════════════
	const T1 = 0.08   // 加速段结束（8%）
	const T2 = 0.65   // 匀速段结束（65%）
	// 减速段：65% ~ 100%（35%）

	// 由归一化条件 ∫v(t)dt = 1 求解峰值速度 v_max
	// s1 = v_max * T1 / 2
	// s2 = v_max * (T2 - T1)
	// s3 = v_max * (1 - T2) / 3    （二次衰减积分）
	// v_max = 1 / (T1/2 + T2 - T1 + (1-T2)/3)
	const vMax = 1 / (T1 / 2 + T2 - T1 + (1 - T2) / 3)

	// 预计算匀速段结束时的累积位移
	const sAtT1 = vMax * T1 / 2
	const sAtT2 = sAtT1 + vMax * (T2 - T1)
	const decelSpan = 1 - T2

	function animate() {
		const now = Date.now()
		const elapsed = now - startTime
		const t = Math.min(elapsed / SPIN_DURATION, 1)

		let easedT
		if (t <= T1) {
			// 第一段：加速 — v(t) = vMax * (t / T1)
			// s(t) = vMax * t² / (2 * T1)
			easedT = vMax * t * t / (2 * T1)
		} else if (t <= T2) {
			// 第二段：匀速 — v(t) = vMax
			// s(t) = sAtT1 + vMax * (t - T1)
			easedT = sAtT1 + vMax * (t - T1)
		} else {
			// 第三段：减速 — v(t) = vMax * ((1-t) / decelSpan)²
			// 二次方衰减模拟阻尼摩擦，速度平滑降至零
			const p = (1 - t) / decelSpan   // p: 1 → 0
			easedT = sAtT2 + vMax * decelSpan / 3 * (1 - p * p * p)
		}

		const currentRotation = startRotation + totalDelta * easedT
		rotation.value = currentRotation

		// 跑马灯偏移 — 与转盘角速度线性比例
		// totalDelta 对应 SPIN_DURATION ms，easedT 是归一化位移
		// 转盘每转 360° 对应 DOT_COUNT 个灯位
		marqueeOffset.value = (totalDelta * easedT / 360) * DOT_COUNT

		const currentSector = Math.floor(((currentRotation % 360) + 360) % 360 / segAngle)
		if (currentSector !== lastTickSector) {
			lastTickSector = currentSector
			// 减速段振动逐渐减弱，模拟物理减速
			if (t > T2) {
				uni.vibrateShort?.({ type: 'light' })
			} else {
				uni.vibrateShort?.({ type: 'medium' })
			}
		}

		if (t < 1) {
			animFrameId = raf(animate)
		} else {
			rotation.value = endRotation
			isSpinning.value = false
			winnerIndex.value = targetIdx
			flashCount.value = 4
			const flashInterval = setInterval(() => {
				flashCount.value--
				if (flashCount.value <= 0) {
					clearInterval(flashInterval)
					flashCount.value = 0
					onSpinEnd(targetIdx)
				}
			}, 300)
		}
	}

	animFrameId = raf(animate)
}

function onSpinStart() {
	isSpinning.value = true
	winnerIndex.value = -1
	flashCount.value = 0
	showResult.value = false
	resultText.value = ''
	uni.vibrateShort?.({ type: 'medium' })
	startMarquee()
}

function onSpinEnd(winnerIdx) {
	const sector = store.sectors[winnerIdx]
	resultText.value = sector.label
	showResult.value = true
	store.addHistory(sector.label)
	uni.vibrateShort?.({ type: 'heavy' })
	stopMarquee()
}

onBeforeUnmount(() => {
	if (animFrameId) caf(animFrameId)
	if (marqueeFadeTimer) { clearTimeout(marqueeFadeTimer); marqueeFadeTimer = null }
})

// ══════════════════════════════════════
// 装饰灯（Marquee Lights）— 跑马灯动态效果
//
// 与转盘旋转精确同步：
//   - 旋转时：灯光按序流动，速度与角速度线性比例
//   - 停止时：灯光按衰减曲线渐灭（800ms）
//   - 流动方向与转盘旋转方向一致
// ══════════════════════════════════════
const DOT_COUNT = 24
const MARQUEE_TAIL = 6       // 跑马灯尾迹长度（同时点亮的灯数）
const FADE_DURATION = 800    // 停止后渐灭时长（ms）

const marqueeOffset = ref(0)       // 跑马灯当前偏移（连续浮点数）
const marqueeBrightness = ref(0)   // 全局亮度 0~1（停止后衰减）
let marqueeFadeTimer = null

// 装饰灯位置（静态）
const dotPositions = computed(() => {
	return Array.from({ length: DOT_COUNT }, (_, i) => {
		const angle = (i * 360 / DOT_COUNT) * Math.PI / 180
		return {
			x: 50 + 48.5 * Math.cos(angle),
			y: 50 + 48.5 * Math.sin(angle)
		}
	})
})

// 计算每个灯的亮度（0~1），基于跑马灯偏移和尾迹
const dotStyles = computed(() => {
	const offset = marqueeOffset.value
	const brightness = marqueeBrightness.value
	return dotPositions.value.map((pos, i) => {
		// 计算灯 i 与跑马灯头部的角度距离
		let dist = ((offset % DOT_COUNT) - i + DOT_COUNT) % DOT_COUNT
		if (dist > DOT_COUNT / 2) dist = DOT_COUNT - dist
		// 尾迹内：亮度从 1 衰减到 0
		let intensity = dist < MARQUEE_TAIL ? 1 - dist / MARQUEE_TAIL : 0
		intensity *= brightness
		return {
			left: pos.x + '%',
			top: pos.y + '%',
			opacity: 0.3 + 0.7 * intensity,
			background: intensity > 0.5 ? '#ffe066' : '#ffffff',
			boxShadow: intensity > 0.5
				? `0 0 ${12 * intensity}rpx rgba(255, 224, 102, ${intensity}), 0 0 ${6 * intensity}rpx rgba(255, 200, 50, ${intensity * 0.6})`
				: `0 0 4rpx rgba(0, 0, 0, 0.15)`
		}
	})
})

// 启动跑马灯
function startMarquee() {
	marqueeBrightness.value = 1
	if (marqueeFadeTimer) { clearTimeout(marqueeFadeTimer); marqueeFadeTimer = null }
}

// 停止跑马灯 — 渐灭衰减
function stopMarquee() {
	const fadeStart = Date.now()
	const startBrightness = marqueeBrightness.value
	function fadeTick() {
		const elapsed = Date.now() - fadeStart
		const p = Math.min(elapsed / FADE_DURATION, 1)
		// 三次方缓出衰减
		marqueeBrightness.value = startBrightness * (1 - p * p * p)
		if (p < 1) {
			marqueeFadeTimer = setTimeout(fadeTick, 16)
		} else {
			marqueeBrightness.value = 0
			marqueeFadeTimer = null
		}
	}
	marqueeFadeTimer = setTimeout(fadeTick, 16)
}

// ══════════════════════════════════════
// 转盘渲染
// ══════════════════════════════════════
const wheelGradient = computed(() => {
	const total = store.sectorCount
	const angle = 360 / total
	const stops = store.slices.map((slice, i) => {
		const start = i * angle
		const end = (i + 1) * angle
		return `${slice.color} ${start}deg ${end}deg`
	})
	return `conic-gradient(${stops.join(', ')})`
})

const sectorLines = computed(() => {
	const total = store.sectorCount
	return Array.from({ length: total }, (_, i) => ({
		angle: i * 360 / total
	}))
})

// vue-wheel-spinner Demo: sliceTextPosition = 'edge'
// 文字靠近扇区外边缘
const sectorTexts = computed(() => {
	const total = store.sectorCount
	const textR = 0.65  // edge 位置
	const radiusPct = 50 * textR
	return store.slices.map((slice, i) => {
		const angle = (i * 360 / total + 360 / total / 2 - 90) * Math.PI / 180
		return {
			label: slice.text.length > 5 ? slice.text.slice(0, 5) + '..' : slice.text,
			x: 50 + radiusPct * Math.cos(angle),
			y: 50 + radiusPct * Math.sin(angle),
			rotate: i * 360 / total + 360 / total / 2,
			textColor: slice.textColor
		}
	})
})

const flashStyle = computed(() => {
	if (winnerIndex.value < 0 || flashCount.value <= 0) return {}
	const total = store.sectorCount
	const angle = 360 / total
	const start = winnerIndex.value * angle
	const end = (winnerIndex.value + 1) * angle
	const opacity = flashCount.value % 2 === 0 ? 0.6 : 0.2
	return {
		background: `conic-gradient(transparent ${start}deg, rgba(255,255,255,${opacity}) ${start}deg ${end}deg, transparent ${end}deg 360deg)`,
		display: 'block'
	}
})

const spinStyle = computed(() => ({
	transform: `rotate(${rotation.value}deg)`
}))

// ══════════════════════════════════════
// 中心按钮（对应 #default slot）
// ══════════════════════════════════════
const buttonScale = ref(1)

function onButtonPress() {
	buttonScale.value = 0.92
	setTimeout(() => { buttonScale.value = 1 }, 120)
}

function handleSpin() {
	const targetIdx = Math.floor(Math.random() * store.sectorCount)
	spinWheel(targetIdx)
}

function closeResult() {
	showResult.value = false
}

// ══════════════════════════════════════
// 编辑
// ══════════════════════════════════════
function openDrawer() { showDrawer.value = true }
function closeDrawer() { showDrawer.value = false; editingId.value = null; editingLabel.value = '' }
function startEdit(id, label) { editingId.value = id; editingLabel.value = label }
function confirmEdit() {
	if (editingLabel.value.trim()) store.updateSector(editingId.value, editingLabel.value.trim())
	editingId.value = null; editingLabel.value = ''
}
function cancelEdit() { editingId.value = null; editingLabel.value = '' }
function handleRemove(id) {
	if (store.sectorCount <= 2) { uni.showToast({ title: '至少保留 2 个选项', icon: 'none' }); return }
	store.removeSector(id)
}
function handleAdd() {
	if (!newLabel.value.trim()) { uni.showToast({ title: '请输入选项名称', icon: 'none' }); return }
	const ok = store.addSector(newLabel.value.trim())
	if (!ok) { uni.showToast({ title: '最多 12 个选项', icon: 'none' }); return }
	newLabel.value = ''
}
function applyPreset(preset) { store.applyPreset(preset) }
</script>

<template>
	<view class="container">
		<!-- 导航 -->
		<NavBar title="轮盘">
			<template #right>
				<view class="nav-btn" @tap="openDrawer">
					<text class="nav-btn-text">编辑</text>
				</view>
			</template>
		</NavBar>

		<!-- ══════ 结果弹窗 ══════ -->
		<view class="result-overlay" v-if="showResult" @tap="closeResult">
			<view class="result-card" @tap.stop>
				<text class="result-emoji">&#127881;</text>
				<text class="result-label">恭喜获得</text>
				<text class="result-value">{{ resultText }}</text>
				<view class="result-close" @tap="closeResult">
					<text class="result-close-text">OK</text>
				</view>
			</view>
		</view>

		<!-- ══════ 转盘区域 ══════ -->
		<view class="wheel-stage">
			<!-- 指针（对应 #cursor slot）— 官方 Demo cursor.svg 风格 -->
			<view class="wheel-pointer">
				<view class="pointer-svg">
					<view class="pointer-body"></view>
				</view>
			</view>

			<!-- 转盘外框 + 装饰圆点 -->
			<view class="wheel-frame">
				<!-- 装饰灯（Marquee Lights）— 跑马灯动态效果 -->
				<view
					v-for="(ds, i) in dotStyles"
					:key="'d'+i"
					class="marquee-dot"
					:style="ds"
				></view>

				<!-- 转盘旋转体 -->
				<view class="wheel-rotator" :style="spinStyle">
					<!-- 扇区背景 -->
					<view class="wheel-bg" :style="{ background: wheelGradient }"></view>

					<!-- 选中闪烁层 -->
					<view
						class="wheel-flash"
						v-if="winnerIndex >= 0 && flashCount > 0"
						:style="flashStyle"
					></view>

					<!-- 分隔线 -->
					<view
						v-for="(line, i) in sectorLines"
						:key="'l'+i"
						class="wheel-divider"
						:style="{ transform: `rotate(${line.angle}deg)` }"
					></view>

					<!-- 扇区文字 -->
					<text
						v-for="(st, i) in sectorTexts"
						:key="'t'+i"
						class="sector-label"
						:style="{
							left: st.x + '%',
							top: st.y + '%',
							transform: 'translate(-50%, -50%) rotate(' + st.rotate + 'deg)',
							color: st.textColor
						}"
					>{{ st.label }}</text>
				</view>
			</view>

			<!-- 中心按钮（对应 #default slot） -->
			<view
				class="spin-button"
				:class="{ disabled: isSpinning }"
				:style="{ transform: `translate(-50%, -50%) scale(${buttonScale})` }"
				@touchstart="onButtonPress"
				@touchend="handleSpin"
			>
				<text class="spin-button-text">{{ isSpinning ? '...' : 'Spin' }}</text>
			</view>
		</view>

		<!-- ══════ 底部快捷区 ══════ -->
		<view class="bottom-bar">
			<!-- 历史记录 -->
			<view class="history-strip" v-if="store.history.length > 0">
				<text class="history-label">最近</text>
				<scroll-view scroll-x class="history-scroll">
					<view class="history-tags">
						<view v-for="(h, i) in store.history.slice(0, 8)" :key="i" class="history-tag">
							<text class="history-tag-text">{{ h }}</text>
						</view>
					</view>
				</scroll-view>
			</view>

			<!-- 预设快捷 -->
			<view class="preset-row">
				<view
					v-for="p in store.presets"
					:key="p.name"
					class="preset-chip"
					@tap="applyPreset(p)"
				>
					<text class="preset-chip-text">{{ p.emoji }} {{ p.name }}</text>
				</view>
			</view>
		</view>

		<!-- ══════ 底部抽屉编辑面板 ══════ -->
		<view class="drawer-mask" :class="{ visible: showDrawer }" @tap="closeDrawer"></view>
		<view class="drawer" :class="{ visible: showDrawer }">
			<view class="drawer-handle" @tap="closeDrawer">
				<view class="handle-bar"></view>
			</view>

			<view class="drawer-header">
				<text class="drawer-title">编辑选项</text>
				<view class="drawer-reset" @tap="store.resetDefaults">
					<text class="drawer-reset-text">重置</text>
				</view>
			</view>

			<view class="drawer-add">
				<input
					v-model="newLabel"
					class="drawer-input"
					placeholder="添加新选项"
					@confirm="handleAdd"
				/>
				<view class="drawer-add-btn" @tap="handleAdd">
					<text class="drawer-add-btn-text">＋</text>
				</view>
			</view>

			<scroll-view scroll-y class="drawer-list">
				<view
					v-for="sec in store.sectors"
					:key="sec.id"
					class="drawer-item"
				>
					<view
						class="item-color"
						:style="{ background: SECTOR_COLORS[store.sectors.indexOf(sec) % SECTOR_COLORS.length] }"
					></view>

					<template v-if="editingId === sec.id">
						<input
							v-model="editingLabel"
							class="item-input"
							@confirm="confirmEdit"
							@blur="cancelEdit"
						/>
						<view class="item-ok" @tap="confirmEdit">
							<text class="item-ok-text">✓</text>
						</view>
					</template>
					<template v-else>
						<text class="item-label" @tap="startEdit(sec.id, sec.label)">{{ sec.label }}</text>
						<view class="item-actions">
							<view class="item-btn" @tap="startEdit(sec.id, sec.label)">
								<text class="item-btn-text">✎</text>
							</view>
							<view class="item-btn remove" @tap="handleRemove(sec.id)">
								<text class="item-btn-text">✕</text>
							</view>
						</view>
					</template>
				</view>
			</scroll-view>
		</view>
	</view>
</template>

<style scoped>
/* ══════════════════════════════════════
   容器 — vue-wheel-spinner Demo 风格
   明亮背景，干净现代
   ══════════════════════════════════════ */
.container {
	min-height: 100vh;
	background: #f0f0f5;
	display: flex;
	flex-direction: column;
	position: relative;
	overflow: hidden;
}

/* ══════════════════════════════════════
   导航栏按钮
   ══════════════════════════════════════ */
.nav-btn {
	padding: 8rpx 28rpx;
	border-radius: 999rpx;
	background: #eb4d4b;
}
.nav-btn-text {
	font-size: 28rpx;
	font-weight: 600;
	color: #ffffff;
}

/* ══════════════════════════════════════
   结果弹窗
   ══════════════════════════════════════ */
.result-overlay {
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.50);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 100;
	animation: overlay-in 0.3s ease-out;
}

.result-card {
	width: 520rpx;
	padding: 48rpx 40rpx;
	border-radius: 24rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 16rpx;
	background: #ffffff;
	box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.15);
	animation: card-pop 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.result-emoji { font-size: 64rpx; }
.result-label { font-size: 28rpx; color: #888888; font-weight: 500; }
.result-value { font-size: 48rpx; font-weight: 800; color: #eb4d4b; text-align: center; line-height: 1.2; }

.result-close {
	padding: 16rpx 64rpx;
	border-radius: 999rpx;
	margin-top: 12rpx;
	background: #eb4d4b;
}
.result-close-text { font-size: 28rpx; font-weight: 600; color: #ffffff; }

@keyframes overlay-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes card-pop { from { opacity: 0; transform: scale(0.85) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }

/* ══════════════════════════════════════
   转盘区域
   ══════════════════════════════════════ */
.wheel-stage {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
	z-index: 1;
}

/* 指针（对应 #cursor slot）— 官方 Demo cursor.svg 风格
   官方: <img class="cursor-img" :src="cursorImage">
   cursor-img { width: 50px; aspect-ratio: 1/1; filter: drop-shadow(3px 3px 2px rgba(0,0,0,0.19)); }
   官方 cursor.svg 是一个三角形指针，顶部朝下指向转盘边缘
*/
.wheel-pointer {
	position: absolute;
	top: calc(50% - 340rpx);
	left: 50%;
	transform: translateX(-50%);
	z-index: 10;
}

.pointer-svg {
	width: 80rpx;
	height: 80rpx;
	display: flex;
	align-items: flex-start;
	justify-content: center;
	filter: drop-shadow(3px 3px 2px rgba(0, 0, 0, 0.19));
}

.pointer-body {
	width: 0;
	height: 0;
	border-left: 28rpx solid transparent;
	border-right: 28rpx solid transparent;
	border-top: 56rpx solid #2c3e50;
}

/* ══════════════════════════════════════
   转盘外框 — 官方 Demo 带装饰圆点和边框
   ══════════════════════════════════════ */
.wheel-frame {
	width: 620rpx;
	height: 620rpx;
	border-radius: 50%;
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #2c3e50;
	box-shadow:
		0 8rpx 32rpx rgba(0, 0, 0, 0.20),
		0 2rpx 8rpx rgba(0, 0, 0, 0.12);
}

/* 装饰灯（Marquee Lights）— 跑马灯动态效果
   旋转时：灯光按序流动，速度与角速度线性比例
   停止时：灯光按衰减曲线渐灭（800ms）
*/
.marquee-dot {
	position: absolute;
	width: 16rpx;
	height: 16rpx;
	border-radius: 50%;
	transform: translate(-50%, -50%);
	z-index: 5;
	will-change: opacity, background, box-shadow;
}

/* 转盘旋转容器 */
.wheel-rotator {
	width: 560rpx;
	height: 560rpx;
	position: relative;
	border-radius: 50%;
	overflow: hidden;
	will-change: transform;
}

.wheel-bg {
	position: absolute;
	inset: 0;
	border-radius: 50%;
	z-index: 0;
}

.wheel-flash {
	position: absolute;
	inset: 0;
	border-radius: 50%;
	z-index: 2;
	pointer-events: none;
}

.wheel-divider {
	position: absolute;
	top: 50%;
	left: 50%;
	width: 50%;
	height: 2rpx;
	background: rgba(0, 0, 0, 0.12);
	transform-origin: 0 0;
	z-index: 1;
	pointer-events: none;
}

.sector-label {
	position: absolute;
	font-size: 26rpx;
	font-weight: 700;
	white-space: nowrap;
	z-index: 4;
	pointer-events: none;
	text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.10);
}

/* ══════════════════════════════════════
   中心按钮（对应 #default slot）
   vue-wheel-spinner Demo: 精确匹配官方样式
   官方: width:100px; height:100px; font-size:20px; background:#eb4d4b;
         border-radius:50%; border:10px solid white; font-weight:600;
         color:white!important;
         box-shadow: inset -3px -3px 2px 2px rgba(0,0,0,0.19),
                     3px 3px 2px 2px rgba(0,0,0,0.19);
   ══════════════════════════════════════ */
.spin-button {
	position: absolute;
	top: 50%;
	left: 50%;
	width: 140rpx;
	height: 140rpx;
	border-radius: 50%;
	background: #eb4d4b;
	border: 20rpx solid #ffffff;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 11;
	cursor: pointer;
	transition: all 150ms;
	box-shadow:
		inset -6rpx -6rpx 4rpx 4rpx rgba(0, 0, 0, 0.19),
		6rpx 6rpx 4rpx 4rpx rgba(0, 0, 0, 0.19);
	user-select: none;
}

.spin-button:active {
	box-shadow:
		inset 6rpx 6rpx 4rpx 4rpx rgba(0, 0, 0, 0.19),
		6rpx 6rpx 4rpx 4rpx rgba(0, 0, 0, 0.19);
}

.spin-button.disabled {
	background: #cccccc;
	pointer-events: none;
}

.spin-button-text {
	font-size: 32rpx;
	font-weight: 600;
	color: #ffffff;
	letter-spacing: 1rpx;
}

/* ══════════════════════════════════════
   底部快捷区
   ══════════════════════════════════════ */
.bottom-bar {
	padding: 0 32rpx 32rpx;
	padding-bottom: calc(var(--safe-area-bottom, 0px) + 32rpx);
	position: relative;
	z-index: 2;
}

.history-strip {
	display: flex;
	align-items: center;
	gap: 12rpx;
	margin-bottom: 20rpx;
}

.history-label { font-size: 24rpx; color: #888888; font-weight: 500; flex-shrink: 0; }
.history-scroll { flex: 1; overflow: hidden; }
.history-tags { display: flex; gap: 8rpx; flex-wrap: nowrap; }

.history-tag {
	padding: 8rpx 20rpx;
	border-radius: 999rpx;
	flex-shrink: 0;
	background: #ffffff;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
}
.history-tag-text { font-size: 24rpx; color: #555555; font-weight: 500; }

.preset-row {
	display: flex;
	gap: 12rpx;
	overflow-x: auto;
	flex-wrap: nowrap;
	-webkit-overflow-scrolling: touch;
}

.preset-chip {
	padding: 12rpx 24rpx;
	border-radius: 999rpx;
	flex-shrink: 0;
	background: #ffffff;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
}
.preset-chip-text { font-size: 24rpx; font-weight: 600; color: #333333; }

/* ══════════════════════════════════════
   底部抽屉
   ══════════════════════════════════════ */
.drawer-mask {
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0);
	pointer-events: none;
	z-index: 50;
	transition: background 0.3s ease;
}

.drawer-mask.visible {
	background: rgba(0, 0, 0, 0.40);
	pointer-events: auto;
}

.drawer {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	max-height: 70vh;
	background: #ffffff;
	border-radius: 32rpx 32rpx 0 0;
	box-shadow: 0 -8rpx 40rpx rgba(0, 0, 0, 0.10);
	z-index: 60;
	transform: translateY(100%);
	transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
	display: flex;
	flex-direction: column;
	padding-bottom: var(--safe-area-bottom, 0px);
}

.drawer.visible { transform: translateY(0); }

.drawer-handle { display: flex; justify-content: center; padding: 16rpx 0 8rpx; cursor: pointer; }
.handle-bar { width: 64rpx; height: 8rpx; border-radius: 4rpx; background: #dddddd; }

.drawer-header { display: flex; align-items: center; justify-content: space-between; padding: 16rpx 32rpx 20rpx; }
.drawer-title { font-size: 32rpx; font-weight: 700; color: #222222; }

.drawer-reset { padding: 8rpx 24rpx; border-radius: 999rpx; background: #f0f0f5; }
.drawer-reset-text { font-size: 24rpx; font-weight: 600; color: #888888; }

.drawer-add { display: flex; gap: 16rpx; padding: 0 32rpx 20rpx; }
.drawer-input {
	flex: 1;
	background: #f5f5fa;
	border: 2rpx solid #e0e0e0;
	border-radius: 999rpx;
	padding: 20rpx 28rpx;
	font-size: 28rpx;
	color: #222222;
}
.drawer-input::placeholder { color: #bbbbbb; }

.drawer-add-btn {
	width: 80rpx;
	height: 80rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	background: #eb4d4b;
}
.drawer-add-btn-text { font-size: 36rpx; color: #ffffff; font-weight: 700; }

.drawer-list { flex: 1; padding: 0 32rpx 32rpx; overflow-y: auto; }

.drawer-item {
	display: flex;
	align-items: center;
	gap: 16rpx;
	padding: 20rpx 24rpx;
	border-radius: 16rpx;
	margin-bottom: 12rpx;
	background: #f8f8fc;
}

.item-color { width: 20rpx; height: 20rpx; border-radius: 50%; flex-shrink: 0; }
.item-label { flex: 1; font-size: 28rpx; color: #222222; font-weight: 500; }

.item-input {
	flex: 1;
	background: #ffffff;
	border: 2rpx solid #eb4d4b;
	border-radius: 12rpx;
	padding: 10rpx 16rpx;
	font-size: 28rpx;
	color: #222222;
}

.item-ok {
	width: 52rpx;
	height: 52rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #eb4d4b;
}
.item-ok-text { font-size: 28rpx; color: #ffffff; font-weight: 700; }

.item-actions { display: flex; gap: 8rpx; }
.item-btn {
	width: 52rpx;
	height: 52rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #e8e8ee;
}
.item-btn-text { font-size: 24rpx; color: #555555; }
.item-btn.remove .item-btn-text { color: #eb4d4b; }
</style>
