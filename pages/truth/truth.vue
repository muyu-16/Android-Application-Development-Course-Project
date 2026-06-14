﻿﻿﻿﻿<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useQuestionStore } from '@/stores/questions'

const store = useQuestionStore()

// 题库配置
const currentText = ref('')
const isFlipped = ref(false)
const flipResponse = ref('')
const prevText = ref('')
const isTransitioning = ref(false)
const showWheel = ref(false)
const wheelRotation = ref(0)
const selectedPlayer = ref(null)
const isSpinning = ref(false)
const showCustomInput = ref(false)
const customInput = ref('')

// 3D 倾斜
const tiltX = ref(0)
const tiltY = ref(0)
let tiltTimer = null

// 真心话/大冒险回应
const goodResponses = [
	'干得漂亮！', '你太厉害了！', '完全正确！',
	'真有趣！', '大家鼓掌！', '太棒了！',
	'精彩！', '好样的！', '厉害了！',
	'完美！', '不错哦！', '真给力！'
]

const badResponses = [
	'有点遗憾', '还需要努力', '再试试吧',
	'不太行哦', '哎哟喂', '翻车了',
	'差一点点', '加油啊', '尴尬了',
	'下次一定', '6', '不行哦'
]

function getRandomResponse(isGood) {
	const pool = isGood ? goodResponses : badResponses
	return pool[Math.floor(Math.random() * pool.length)]
}

// 模式 Segmented Control 标签
const segments = [
	{ key: 'truth', label: '真心话' },
	{ key: 'dare', label: '大冒险' }
]

function setMode(key) {
	if (isTransitioning.value) return
	store.setMode(key)
	resetFlip()
	nextDraw()
}

// 强度等级配置
const intensityIcons = ['face', 'face_3', 'sentiment_neutral', 'whatshot', 'whatshot']

const intensityLabels = ['温和', '适中', '较强', '强烈', '极限']

function setIntensity(val) {
	store.setIntensity(val)
}

// 抽取题目
function nextDraw() {
	if (isTransitioning.value) return
	prevText.value = currentText.value
	isTransitioning.value = true

	setTimeout(() => {
		currentText.value = store.getRandomWithHistory()
		nextTick(() => {
			setTimeout(() => {
				isTransitioning.value = false
			}, 50)
		})
	}, 250)
}

function handleSkip() {
	if (isTransitioning.value) return
	nextDraw()
}

function handleComplete() {
	if (isFlipped.value) {
		// 翻回正面
		isFlipped.value = false
		return
	}
	// 翻转显示回应
	const isGood = Math.random() > 0.3
	flipResponse.value = getRandomResponse(isGood)
	isFlipped.value = true
}

function resetFlip() {
	isFlipped.value = false
	flipResponse.value = ''
}

// 加速度计 3D 倾斜监听
function onAccelerometer(e) {
	if (tiltTimer) cancelAnimationFrame(tiltTimer)
	tiltTimer = requestAnimationFrame(() => {
		// uni-app 加速度计回调参数
		const { x, y } = e
		tiltX.value = Math.max(-5, Math.min(5, y * 3))
		tiltY.value = Math.max(-5, Math.min(5, -x * 3))
	})
}

onMounted(() => {
	// 监听加速度计 - uni-app API
	try {
		uni.onAccelerometerChange(onAccelerometer)
	} catch (e) {
		console.log('加速度计不可用')
	}
	currentText.value = store.getRandomWithHistory()
})

onUnmounted(() => {
	try {
		uni.offAccelerometerChange(onAccelerometer)
	} catch (e) {}
})

// 转盘玩家选择
const wheelPlayerIds = computed(() => {
	const ps = store.players
	if (ps.length <= 8) return ps
	return ps.slice(0, 8)
})

const wheelAngle = computed(() => 360 / wheelPlayerIds.value.length)

function openWheel() {
	showWheel.value = true
	selectedPlayer.value = null
	wheelRotation.value = 0
}

function spinWheel() {
	if (isSpinning.value) return
	isSpinning.value = true
	selectedPlayer.value = null

	const targetIdx = Math.floor(Math.random() * wheelPlayerIds.value.length)
	const extraSpins = 4 + Math.floor(Math.random() * 2)
	const targetAngle = extraSpins * 360 + (360 - targetIdx * wheelAngle.value - wheelAngle.value / 2)
	wheelRotation.value += targetAngle

	setTimeout(() => {
		selectedPlayer.value = wheelPlayerIds.value[targetIdx]
		isSpinning.value = false
		uni.vibrateShort({ type: 'medium' })
	}, 4200)
}

function closeWheel() {
	showWheel.value = false
	wheelRotation.value = 0
	selectedPlayer.value = null
	isSpinning.value = false
}

// 自定义添加问题
function addCustom() {
	if (!customInput.value.trim()) return
	store.addCustomQuestion(customInput.value)
	customInput.value = ''
	showCustomInput.value = false
	uni.showToast({ title: '已添加自定义问题', icon: 'success' })
}

// 滑块渐变色计算
const sliderBg = computed(() => {
	const colors = ['#4CAF50', '#8BC34A', '#FFC107', '#FF9800', '#F44336']
	return colors[store.intensity - 1]
})
</script>

<template>
	<view class="container">
		<!-- 背景 -->
		<view class="bg-decoration">
			<view class="bg-circle bg-circle-1"></view>
			<view class="bg-circle bg-circle-2"></view>
		</view>

		<!-- ====== 导航栏 ====== -->
		<view class="nav-bar glass-card">
			<view class="nav-left">
				<text class="material-icons nav-back" @tap="uni.navigateBack()">arrow_back</text>
				<text class="nav-title">真心话大冒险</text>
			</view>
		</view>

		<!-- ====== Segmented Control ====== -->
		<view class="segmented-wrapper">
			<view class="segmented">
				<view
					v-for="seg in segments"
					:key="seg.key"
					class="seg-item"
					:class="{ active: store.mode === seg.key }"
					@tap="setMode(seg.key)"
				>
					<text>{{ seg.label }}</text>
				</view>
				<!-- 滑动指示器 -->
				<view
					class="seg-indicator"
					:style="{ transform: `translateX(${store.mode === 'truth' ? 0 : 100}%)` }"
				></view>
			</view>
		</view>

		<!-- ====== 3D 倾斜卡片 + 翻牌 ====== -->
		<view class="card-scene" @tap="openWheel">
			<view
				class="card-3d"
				:class="{ flipped: isFlipped }"
				:style="{
					transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`
				}"
			>
				<!-- 正面 -->
				<view class="card-face card-front glass-card">
					<view class="card-label">
						<text class="material-icons">{{ store.mode === 'truth' ? 'psychology' : 'whatshot' }}</text>
						<text>{{ store.mode === 'truth' ? '真心话' : '大冒险' }}</text>
					</view>

					<view class="card-content-area">
						<text
							class="card-text"
							:class="{ 'text-out': isTransitioning, 'text-in': !isTransitioning }"
							:key="currentText"
						>{{ currentText }}</text>
					</view>

					<view class="card-intensity">
						<text class="intensity-label">强度 {{ store.intensity }}/5</text>
						<view class="intensity-dots">
							<view
								v-for="i in 5"
								:key="i"
								class="dot"
								:class="{ filled: i <= store.intensity }"
								:style="{ background: i <= store.intensity ? sliderBg : '' }"
							></view>
						</view>
					</view>
				</view>

				<!-- 背面 -->
				<view class="card-face card-back glass-card">
					<view class="back-emoji">
						<text class="material-icons" style="font-size: 48px; color: var(--clr-gold);">auto_awesome</text>
					</view>
					<text class="back-text">{{ flipResponse }}</text>
					<text class="back-hint">点击下方按钮继续</text>
				</view>
			</view>
		</view>

		<!-- ====== 强度滑块 ====== -->
		<view class="slider-section">
			<view class="slider-header">
				<text
					class="material-icons slider-icon"
					:style="{ color: store.intensity <= 2 ? '#6750A4' : 'var(--clr-text-disabled)' }"
				>face</text>
				<view class="slider-track">
					<view
						class="slider-fill"
						:style="{ width: (store.intensity - 1) * 25 + '%', background: sliderBg }"
					></view>
					<view
						v-for="i in 5"
						:key="i"
						class="slider-dot"
						:class="{ active: i <= store.intensity }"
						:style="{
							left: (i - 1) * 25 + '%',
							background: i <= store.intensity ? sliderBg : ''
						}"
						@tap="setIntensity(i)"
					>
						<text class="dot-label">{{ intensityLabels[i - 1] }}</text>
					</view>
				</view>
				<text
					class="material-icons slider-icon"
					:style="{ color: store.intensity >= 4 ? '#FF6F00' : 'var(--clr-text-disabled)' }"
				>whatshot</text>
			</view>
		</view>

		<!-- ====== 底部操作栏 ====== -->
		<view class="bottom-bar">
			<view class="bottom-left">
				<view class="btn-skip" @tap="handleSkip">
					<text>跳过</text>
				</view>
				<view class="btn-custom" @tap="showCustomInput = !showCustomInput">
					<text class="material-icons">add</text>
				</view>
			</view>

			<view class="btn-done glass-card" @tap="handleComplete">
				<text class="material-icons">{{ isFlipped ? 'flip_to_back' : 'check' }}</text>
				<text>{{ isFlipped ? '知道了' : '完成✓' }}</text>
			</view>
		</view>

		<!-- 自定义添加 -->
		<view class="custom-panel" v-if="showCustomInput">
			<view class="custom-row">
				<input
					v-model="customInput"
					class="custom-input"
					:placeholder="'输入自定义问题（' + (store.mode === 'truth' ? '真心话' : '大冒险') + '）'"
					@confirm="addCustom"
				/>
				<view class="custom-add" @tap="addCustom">
					<text class="material-icons">send</text>
				</view>
			</view>
		</view>

		<!-- ====== 转盘弹窗 ====== -->
		<view class="wheel-mask" v-if="showWheel" @tap="closeWheel">
			<view class="wheel-overlay glass-card" @tap.stop>
				<text class="wheel-title">随机抽人</text>

				<view class="wheel-container">
					<view class="wheel-pointer"></view>
					<view
						class="wheel-ring"
						:style="{ transform: `rotate(${wheelRotation}deg)` }"
					>
						<view
							v-for="(player, idx) in wheelPlayerIds"
							:key="player.id"
							class="wheel-player"
							:style="{
								transform: `rotate(${idx * wheelAngle}deg) translateY(-95px)`
							}"
						>
							<view
								class="wheel-avatar"
								:class="{ selected: selectedPlayer?.id === player.id }"
							>
								<text class="material-icons">{{ player.avatar }}</text>
							</view>
							<text class="wheel-name">{{ player.name }}</text>
						</view>
					</view>
				</view>

				<view class="wheel-actions">
					<view
						class="wheel-btn spin"
						:class="{ disabled: isSpinning }"
						@tap="spinWheel"
					>
						<text class="material-icons">{{ isSpinning ? 'autorenew' : 'casino' }}</text>
						<text>{{ isSpinning ? '转动中...' : '开始' }}</text>
					</view>
					<view class="wheel-btn close" @tap="closeWheel">
						<text>知道了</text>
					</view>
				</view>

				<text class="wheel-result" v-if="selectedPlayer">
					已选中 {{ selectedPlayer.name }} 人
				</text>
			</view>
		</view>
	</view>
</template>

<style scoped>
/* ====== 全局容器 ====== */
.container {
	min-height: 100vh;
	padding: var(--sp-4);
	padding-top: calc(var(--safe-area-top) + 12px);
	padding-bottom: calc(var(--safe-area-bottom) + var(--sp-4));
	background: linear-gradient(135deg, #FFF8E1 0%, #F3E5F5 50%, #FFF5F5 100%);
	display: flex;
	flex-direction: column;
	position: relative;
	overflow: hidden;
}

.bg-decoration {
	position: fixed;
	top: 0; left: 0; right: 0; bottom: 0;
	pointer-events: none;
	z-index: 0;
}
.bg-circle {
	position: absolute;
	border-radius: 50%;
	opacity: 0.15;
}
.bg-circle-1 {
	width: 240px; height: 240px;
	background: radial-gradient(circle, #FF6F00 0%, transparent 70%);
	top: -60px; right: -50px;
}
.bg-circle-2 {
	width: 200px; height: 200px;
	background: radial-gradient(circle, #6750A4 0%, transparent 70%);
	bottom: 60px; left: -60px;
}

/* ====== 导航栏 ====== */
.nav-bar {
	display: flex;
	align-items: center;
	padding: var(--sp-2) var(--sp-3);
	border-radius: 18px !important;
	margin-bottom: var(--sp-2);
	position: relative;
	z-index: 2;
}
.nav-left {
	display: flex;
	align-items: center;
	gap: var(--sp-2);
}
.nav-back {
	font-size: 22px;
	color: var(--clr-text-primary);
	padding: 4px;
}
.nav-title {
	font-size: var(--fs-body);
	font-weight: 700;
	color: var(--clr-text-primary);
}

/* ====== Segmented Control ====== */
.segmented-wrapper {
	position: relative;
	z-index: 2;
	margin-bottom: var(--sp-3);
}
.segmented {
	display: flex;
	background: var(--clr-bg-secondary);
	border-radius: var(--rd-pill);
	padding: 3px;
	position: relative;
}
.seg-item {
	flex: 1;
	padding: 8px 0;
	text-align: center;
	border-radius: var(--rd-pill);
	font-size: var(--fs-label);
	font-weight: 600;
	color: var(--clr-text-secondary);
	z-index: 1;
	transition: color 0.3s;
	cursor: pointer;
}
.seg-item.active {
	color: var(--clr-accent-on);
}
.seg-indicator {
	position: absolute;
	top: 3px; left: 3px;
	width: calc(50% - 3px);
	height: calc(100% - 6px);
	background: var(--clr-accent);
	border-radius: var(--rd-pill);
	transition: transform 0.3s var(--ease-spring);
	z-index: 0;
}

/* ====== 3D 卡片 ====== */
.card-scene {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	perspective: 800px;
	position: relative;
	z-index: 1;
	min-height: 0;
}

.card-3d {
	width: 100%;
	height: 56vh;
	max-height: 460px;
	position: relative;
	transition: transform 0.15s ease-out;
	transform-style: preserve-3d;
}

.card-3d.flipped {
	transform: rotateY(180deg) !important;
}

.card-face {
	position: absolute;
	inset: 0;
	border-radius: 28px !important;
	backface-visibility: hidden;
	-webkit-backface-visibility: hidden;
	display: flex;
	flex-direction: column;
	padding: var(--sp-5);
}

.card-front {
	background: var(--clr-surface) !important;
}

.card-back {
	background: var(--clr-accent) !important;
	transform: rotateY(180deg);
	align-items: center;
	justify-content: center;
	gap: var(--sp-3);
}

/* 卡片标签 */
.card-label {
	display: flex;
	align-items: center;
	gap: var(--sp-2);
	margin-bottom: var(--sp-4);
	background: var(--clr-surface);
	align-self: flex-start;
	padding: 4px 14px;
	border-radius: var(--rd-pill);
}
.card-label .material-icons {
	font-size: 18px;
	color: var(--clr-accent);
}
.card-label text {
	font-size: var(--fs-caption);
	font-weight: 600;
	color: var(--clr-accent);
}

/* 卡片内容 */
.card-content-area {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: var(--sp-3) 0;
}
.card-text {
	font-size: 24px;
	font-weight: 700;
	line-height: 1.6;
	text-align: center;
	color: var(--clr-text-primary);
	transition: opacity 0.25s, transform 0.25s;
}
.card-text.text-out {
	opacity: 0;
	transform: scale(0.9);
}
.card-text.text-in {
	opacity: 1;
	transform: scale(1);
}

/* 强度指示 */
.card-intensity {
	display: flex;
	align-items: center;
	justify-content: space-between;
}
.intensity-label {
	font-size: var(--fs-caption);
	color: var(--clr-text-secondary);
}
.intensity-dots {
	display: flex;
	gap: 4px;
}
.dot {
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: var(--clr-bg-secondary);
}
.dot.filled {
	background: var(--clr-accent);
}

/* 背面图标 */
.back-emoji {
	width: 72px;
	height: 72px;
	border-radius: 50%;
	background: var(--clr-surface);
	display: flex;
	align-items: center;
	justify-content: center;
}
.back-text {
	font-size: var(--fs-title);
	font-weight: 700;
	color: var(--clr-accent-on);
	text-align: center;
}
.back-hint {
	font-size: var(--fs-caption);
	color: var(--clr-text-secondary);
}

/* ====== 强度滑块 ====== */
.slider-section {
	margin: var(--sp-3) 0;
	position: relative;
	z-index: 1;
}
.slider-header {
	display: flex;
	align-items: center;
	gap: var(--sp-2);
}
.slider-icon {
	font-size: 22px;
	transition: color 0.3s;
}
.slider-track {
	flex: 1;
	height: 6px;
	background: var(--clr-bg-secondary);
	border-radius: 3px;
	position: relative;
	margin: 16px 0;
}
.slider-fill {
	height: 100%;
	border-radius: 3px;
	transition: width 0.3s var(--ease-spring);
}
.slider-dot {
	position: absolute;
	top: 50%;
	transform: translate(-50%, -50%);
	width: 20px;
	height: 20px;
	border-radius: 50%;
	background: var(--clr-bg-secondary);
	border: 2px solid var(--clr-surface);
	box-shadow: 0 1px 4px rgba(0,0,0,0.15);
	transition: all 0.25s var(--ease-spring);
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	z-index: 1;
}
.slider-dot.active {
	width: 24px;
	height: 24px;
	border-color: var(--clr-accent);
}
.dot-label {
	position: absolute;
	top: -24px;
	white-space: nowrap;
	font-size: 10px;
	font-weight: 600;
	color: var(--clr-text-secondary);
	opacity: 0;
	transition: opacity 0.2s;
}
.slider-dot.active .dot-label {
	opacity: 1;
}

/* ====== 底部操作栏 ====== */
.bottom-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	position: relative;
	z-index: 1;
	margin-top: auto;
	padding-top: var(--sp-2);
}
.bottom-left {
	display: flex;
	align-items: center;
	gap: var(--sp-3);
}
.btn-skip {
	padding: 10px 16px;
}
.btn-skip text {
	font-size: var(--fs-body);
	color: var(--clr-text-secondary);
	font-weight: 600;
}
.btn-custom {
	width: 36px;
	height: 36px;
	border-radius: 50%;
	background: var(--clr-bg-secondary);
	display: flex;
	align-items: center;
	justify-content: center;
}
.btn-custom .material-icons {
	font-size: 20px;
	color: var(--clr-text-secondary);
}

.btn-done {
	padding: 10px 24px;
	border-radius: var(--rd-pill) !important;
	display: flex;
	align-items: center;
	gap: var(--sp-2);
	cursor: pointer;
	transition: all 0.2s var(--ease-spring);
	background: var(--clr-bg-secondary) !important;
}
.btn-done:active { transform: scale(0.96); }
.btn-done .material-icons {
	font-size: 20px;
	color: var(--clr-accent);
}
.btn-done text {
	font-size: var(--fs-body);
	font-weight: 700;
	color: var(--clr-accent);
}

/* ====== 自定义输入面板 ====== */
.custom-panel {
	margin-top: var(--sp-2);
	position: relative;
	z-index: 1;
	animation: fade-in-up 0.25s var(--ease-spring);
}
.custom-row {
	display: flex;
	gap: var(--sp-2);
}
.custom-input {
	flex: 1;
	background: var(--clr-surface);
	border: 1px solid var(--clr-border);
	border-radius: var(--rd-button);
	padding: 10px 14px;
	font-size: var(--fs-label);
	color: var(--clr-text-primary);
}
.custom-add {
	width: 44px;
	height: 44px;
	background: var(--clr-accent);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
}
.custom-add .material-icons {
	color: var(--clr-accent-on);
	font-size: 22px;
}

/* ====== 转盘弹窗 ====== */
.wheel-mask {
	position: fixed;
	inset: 0;
	background: rgba(0,0,0,0.45);
	backdrop-filter: blur(10px);
	-webkit-backdrop-filter: blur(10px);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 100;
	animation: fade-in 0.2s ease;
}
.wheel-overlay {
	width: 320px;
	padding: var(--sp-5);
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--sp-4);
	border-radius: 28px !important;
	animation: spring-pop 0.35s var(--ease-bounce);
}
.wheel-title {
	font-size: var(--fs-body);
	font-weight: 700;
	color: var(--clr-text-primary);
}

.wheel-container {
	width: 210px;
	height: 210px;
	border-radius: 50%;
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
}
.wheel-pointer {
	position: absolute;
	top: -6px;
	left: 50%;
	transform: translateX(-50%);
	width: 0; height: 0;
	border-left: 12px solid transparent;
	border-right: 12px solid transparent;
	border-top: 18px solid var(--clr-accent);
	filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
	z-index: 10;
}

.wheel-ring {
	width: 100%;
	height: 100%;
	border-radius: 50%;
	position: relative;
	transition: transform 4s cubic-bezier(0.05, 0.9, 0.2, 1);
}

.wheel-player {
	position: absolute;
	top: 50%;
	left: 50%;
	transform-origin: 0 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 2px;
}
.wheel-avatar {
	width: 38px;
	height: 38px;
	border-radius: 50%;
	background: var(--clr-surface);
	border: 2px solid var(--clr-border);
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.3s;
}
.wheel-avatar.selected {
	border-color: var(--clr-gold);
	background: rgba(255,215,64,0.2);
	transform: scale(1.15);
	box-shadow: 0 0 16px rgba(255,215,64,0.4);
}
.wheel-avatar .material-icons {
	font-size: 18px;
	color: var(--clr-text-secondary);
}
.wheel-avatar.selected .material-icons {
	color: #FFD740;
}
.wheel-name {
	font-size: 9px;
	font-weight: 600;
	color: var(--clr-text-secondary);
	white-space: nowrap;
}

.wheel-actions {
	display: flex;
	gap: var(--sp-2);
	width: 100%;
}
.wheel-btn {
	flex: 1;
	padding: 10px;
	border-radius: var(--rd-button);
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	cursor: pointer;
	transition: all 0.2s var(--ease-spring);
}
.wheel-btn:active { transform: scale(0.96); }
.wheel-btn.spin {
	background: var(--clr-accent);
}
.wheel-btn.spin .material-icons,
.wheel-btn.spin text {
	color: var(--clr-accent-on);
	font-size: 18px;
	font-weight: 700;
}
.wheel-btn.spin.disabled { opacity: 0.6; }
.wheel-btn.close {
	background: var(--clr-bg-secondary);
}
.wheel-btn.close text {
	font-size: var(--fs-label);
	font-weight: 600;
	color: var(--clr-text-primary);
}

.wheel-result {
	font-size: var(--fs-body);
	font-weight: 700;
	color: var(--clr-gold);
	text-align: center;
}

@keyframes fade-in {
	from { opacity: 0; }
	to { opacity: 1; }
}
</style>
