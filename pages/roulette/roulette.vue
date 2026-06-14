﻿<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouletteStore, SECTOR_COLORS } from '@/stores/roulette'

const store = useRouletteStore()

// ─── 旋转状态 ───
const isSpinning = ref(false)
const rotation = ref(0)
const selectedIdx = ref(-1)
const flashCount = ref(0)
const resultText = ref('')
const showResult = ref(false)
const resultTimer = ref(null)

// ─── 编辑状态 ───
const newLabel = ref('')
const editingId = ref(null)
const editingLabel = ref('')

// ─── 转盘 CSS 参数 ───
const WHEEL_SIZE = 290 // px

// ─── 扇区 conic-gradient ───
const wheelGradient = computed(() => {
	const total = store.sectorCount
	const angle = 360 / total
	const stops = store.sectors.map((_, i) => {
		const start = i * angle
		const end = (i + 1) * angle
		const color = SECTOR_COLORS[i % SECTOR_COLORS.length]
		return `${color} ${start}deg ${end}deg`
	})
	return `conic-gradient(${stops.join(', ')})`
})

// ─── 分隔线角度 ───
const sectorLines = computed(() => {
	const total = store.sectorCount
	return Array.from({ length: total }, (_, i) => ({
		angle: i * 360 / total
	}))
})

// ─── 扇区文字位置（CSS 百分比） ───
const sectorTexts = computed(() => {
	const total = store.sectorCount
	const textR = 0.55
	const radiusPct = 50 * textR
	return store.sectors.map((sec, i) => {
		const angle = (i * 360 / total + 360 / total / 2 - 90) * Math.PI / 180
		return {
			label: sec.label.length > 4 ? sec.label.slice(0, 4) + '..' : sec.label,
			x: 50 + radiusPct * Math.cos(angle),
			y: 50 + radiusPct * Math.sin(angle),
			rotate: i * 360 / total + 360 / total / 2
		}
	})
})

// ─── 选中闪烁层 ───
const flashStyle = computed(() => {
	if (selectedIdx.value < 0 || flashCount.value <= 0) return {}
	const total = store.sectorCount
	const angle = 360 / total
	const start = selectedIdx.value * angle
	const end = (selectedIdx.value + 1) * angle
	const opacity = flashCount.value % 2 === 0 ? 0.8 : 0.3
	return {
		background: `conic-gradient(transparent ${start}deg, rgba(103,80,164,${opacity}) ${start}deg ${end}deg, transparent ${end}deg 360deg)`,
		display: 'block'
	}
})

// ─── 旋转逻辑 ───
function spin() {
	if (isSpinning.value) return
	if (store.sectorCount < 2) {
		uni.showToast({ title: '至少需要 2 个选项', icon: 'none' })
		return
	}

	uni.vibrateShort?.({ type: 'light' })

	isSpinning.value = true
	selectedIdx.value = -1
	flashCount.value = 0
	showResult.value = false
	resultText.value = ''
	if (resultTimer.value) clearTimeout(resultTimer.value)

	const targetIdx = Math.floor(Math.random() * store.sectorCount)
	const segAngle = 360 / store.sectorCount
	const targetAngle = 6 * 360 + (360 - targetIdx * segAngle - segAngle / 2)
	const totalRotation = rotation.value + targetAngle

	rotation.value = totalRotation

	const tickCount = Math.floor(targetAngle / segAngle)
	let tickIdx = 0
	const tickInterval = setInterval(() => {
		if (tickIdx < tickCount) {
			uni.vibrateShort?.({ type: 'light' })
			tickIdx++
		} else {
			clearInterval(tickInterval)
		}
	}, 4500 / tickCount)

	setTimeout(() => {
		isSpinning.value = false
		selectedIdx.value = targetIdx

		flashCount.value = 3
		const flashInterval = setInterval(() => {
			flashCount.value--
			if (flashCount.value <= 0) {
				clearInterval(flashInterval)
				flashCount.value = 0

				const sector = store.sectors[targetIdx]
				resultText.value = `🎲 ${sector.label}`
				showResult.value = true

				resultTimer.value = setTimeout(() => {
					showResult.value = false
				}, 3000)

				uni.vibrateShort?.({ type: 'medium' })
			}
		}, 400)
	}, 4500)
}

// ─── 编辑 ───
function startEdit(id, label) {
	editingId.value = id
	editingLabel.value = label
}

function confirmEdit() {
	if (editingLabel.value.trim()) {
		store.updateSector(editingId.value, editingLabel.value.trim())
	}
	editingId.value = null
	editingLabel.value = ''
}

function cancelEdit() {
	editingId.value = null
	editingLabel.value = ''
}

function handleRemove(id) {
	if (store.sectorCount <= 2) {
		uni.showToast({ title: '至少保留 2 个选项', icon: 'none' })
		return
	}
	uni.showModal({
		title: '删除选项',
		content: '确定要删除这个选项吗？',
		success: (res) => {
			if (res.confirm) store.removeSector(id)
		}
	})
}

function handleAdd() {
	if (!newLabel.value.trim()) {
		uni.showToast({ title: '请输入选项名称', icon: 'none' })
		return
	}
	const ok = store.addSector(newLabel.value.trim())
	if (!ok) {
		uni.showToast({ title: '最多 12 个选项', icon: 'none' })
		return
	}
	newLabel.value = ''
}

// ─── 样式 ───
const spinStyle = computed(() => ({
	transform: `rotate(${rotation.value}deg)`,
	transition: isSpinning.value
		? 'transform 4.5s cubic-bezier(0.16, 1, 0.3, 1)'
		: 'none'
}))

const buttonScale = ref(1)

function onButtonPress() {
	buttonScale.value = 0.9
	setTimeout(() => { buttonScale.value = 1.05 }, 100)
}
</script>

<template>
	<view class="container">
		<view class="bg-glow"></view>

		<!-- 导航 -->
		<view class="nav-bar">
			<view class="nav-left">
				<text class="material-icons nav-back" @tap="uni.navigateBack()">arrow_back</text>
				<text class="nav-title">轮盘</text>
			</view>
			<view class="nav-right">
				<view class="nav-edit" @tap="store.toggleEdit()">
					<text>{{ store.editMode ? '完成' : '编辑' }}</text>
				</view>
			</view>
		</view>

		<!-- 结果 Toast -->
		<view class="result-toast" :class="{ visible: showResult }">
			<view class="toast-inner">
				<text class="toast-text">{{ resultText }}</text>
			</view>
		</view>

		<!-- 转盘 -->
		<view class="wheel-wrapper">
			<view class="wheel-shadow"></view>

			<!-- 指针 -->
			<view class="wheel-pointer">
				<view class="pointer-arrow"></view>
			</view>

			<!-- 转盘（CSS conic-gradient 替代 SVG） -->
			<view class="wheel-rotator" :style="spinStyle">
				<!-- 边缘高光 -->
				<view class="wheel-highlight"></view>

				<!-- 扇区背景 -->
				<view class="wheel-bg" :style="{ background: wheelGradient }"></view>

				<!-- 选中闪烁层 -->
				<view
					class="wheel-flash"
					v-if="selectedIdx >= 0 && flashCount > 0"
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
						transform: 'translate(-50%, -50%) rotate(' + st.rotate + 'deg)'
					}"
				>{{ st.label }}</text>
			</view>

			<!-- 中心按钮 -->
			<view
				class="center-btn"
				:class="{ spinning: isSpinning }"
				:style="{ transform: `translate(-50%, -50%) scale(${buttonScale})` }"
				@touchstart="onButtonPress"
				@touchend="spin()"
			>
				<text class="material-icons center-icon">autorenew</text>
			</view>
		</view>

		<!-- 底部编辑面板 -->
		<view class="edit-panel" v-if="store.editMode">
			<view class="edit-add">
				<input
					v-model="newLabel"
					class="edit-input"
					placeholder="添加新选项"
					@confirm="handleAdd"
				/>
				<view class="edit-add-btn" @tap="handleAdd">
					<text class="material-icons">add</text>
				</view>
			</view>

			<view class="edit-list">
				<view
					v-for="sec in store.sectors"
					:key="sec.id"
					class="edit-item"
				>
					<view
						class="edit-color"
						:style="{ background: SECTOR_COLORS[store.sectors.indexOf(sec) % SECTOR_COLORS.length] }"
					></view>

					<template v-if="editingId === sec.id">
						<input
							v-model="editingLabel"
							class="edit-item-input"
							@confirm="confirmEdit"
							@blur="cancelEdit"
						/>
						<view class="edit-item-ok" @tap="confirmEdit">
							<text class="material-icons">check</text>
						</view>
					</template>
					<template v-else>
						<text class="edit-item-label" @tap="startEdit(sec.id, sec.label)">{{ sec.label }}</text>
						<view class="edit-item-actions">
							<view class="edit-item-btn" @tap="startEdit(sec.id, sec.label)">
								<text class="material-icons">edit</text>
							</view>
							<view class="edit-item-btn remove" @tap="handleRemove(sec.id)">
								<text class="material-icons">close</text>
							</view>
						</view>
					</template>
				</view>
			</view>

			<view class="edit-reset" @tap="store.resetDefaults">
				<text>重置默认</text>
			</view>
		</view>
	</view>
</template>

<style scoped>
/* ─── 容器 ─── */
.container {
	min-height: 100vh;
	background: #000;
	padding: var(--sp-4);
	padding-top: calc(var(--safe-area-top) + 12px);
	padding-bottom: calc(var(--safe-area-bottom) + var(--sp-4));
	display: flex;
	flex-direction: column;
	position: relative;
	overflow: hidden;
}

.bg-glow {
	position: fixed;
	inset: 0;
	background: radial-gradient(circle at 50% 35%, rgba(255,255,255,0.08) 0%, transparent 70%);
	pointer-events: none;
	z-index: 0;
}

/* ─── 导航 ─── */
.nav-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
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
	font-size: 16px;
	font-weight: 700;
	color: var(--clr-text-primary);
}
.nav-right {
	display: flex;
	align-items: center;
}
.nav-edit {
	padding: 6px 14px;
	border-radius: 999px;
	background: var(--clr-bg-secondary);
}
.nav-edit text {
	font-size: 12px;
	font-weight: 600;
	color: var(--clr-text-primary);
}

/* ─── 结果 Toast ─── */
.result-toast {
	position: fixed;
	top: calc(var(--safe-area-top) + 60px);
	left: 50%;
	transform: translateX(-50%) translateY(-80px);
	z-index: 50;
	transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
	pointer-events: none;
}
.result-toast.visible {
	transform: translateX(-50%) translateY(0);
}
.toast-inner {
	background: rgba(255,255,255,0.12);
	backdrop-filter: blur(24px) saturate(180%);
	-webkit-backdrop-filter: blur(24px) saturate(180%);
	border: 1px solid rgba(255,255,255,0.15);
	border-radius: 999px;
	padding: 10px 24px;
	box-shadow: 0 4px 24px rgba(0,0,0,0.4);
}
.toast-text {
	font-size: 16px;
	font-weight: 700;
	color: var(--clr-text-primary);
}

/* ─── 转盘 ─── */
.wheel-wrapper {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
	z-index: 1;
}

.wheel-shadow {
	position: absolute;
	width: 300px;
	height: 300px;
	border-radius: 50%;
	box-shadow: 0 8px 60px rgba(103,80,164,0.3);
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
}

/* 指针 */
.wheel-pointer {
	position: absolute;
	top: 2px;
	left: 50%;
	transform: translateX(-50%);
	z-index: 10;
}
.pointer-arrow {
	width: 0;
	height: 0;
	border-left: 12px solid transparent;
	border-right: 12px solid transparent;
	border-top: 22px solid var(--clr-accent-on);
	filter: drop-shadow(0 2px 6px rgba(0,0,0,0.5));
}

/* 转盘旋转容器 */
.wheel-rotator {
	width: 290px;
	height: 290px;
	position: relative;
	border-radius: 50%;
	overflow: hidden;
}

/* 边缘高光 */
.wheel-highlight {
	position: absolute;
	inset: -2px;
	border-radius: 50%;
	background: conic-gradient(
		from 0deg,
		transparent 0%, rgba(255,255,255,0.12) 10%, transparent 20%,
		rgba(255,255,255,0.08) 30%, transparent 40%,
		rgba(255,255,255,0.12) 50%, transparent 60%,
		rgba(255,255,255,0.08) 70%, transparent 80%,
		rgba(255,255,255,0.1) 90%, transparent 100%
	);
	pointer-events: none;
	z-index: 3;
}

/* 扇区背景（conic-gradient） */
.wheel-bg {
	position: absolute;
	inset: 0;
	border-radius: 50%;
	z-index: 0;
}

/* 选中闪烁层 */
.wheel-flash {
	position: absolute;
	inset: 0;
	border-radius: 50%;
	z-index: 2;
	pointer-events: none;
	transition: opacity 0.1s;
}

/* 分隔线 */
.wheel-divider {
	position: absolute;
	top: 50%;
	left: 50%;
	width: 50%;
	height: 0.5px;
	background: rgba(255,255,255,0.3);
	transform-origin: 0 0;
	z-index: 1;
	pointer-events: none;
}

/* 扇区文字 */
.sector-label {
	position: absolute;
	font-size: 13px;
	font-weight: 700;
	color: #1C1B1F;
	font-family: sans-serif;
	white-space: nowrap;
	z-index: 1;
	text-shadow: 0 1px 2px rgba(255,255,255,0.3);
	pointer-events: none;
}

/* ─── 中心按钮 ─── */
.center-btn {
	position: absolute;
	top: 50%;
	left: 50%;
	width: 60px;
	height: 60px;
	border-radius: 50%;
	background: var(--clr-accent);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 5;
	cursor: pointer;
	transition: transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.3s;
	box-shadow: 0 2px 12px rgba(103,80,164,0.5);
	animation: pulse-glow 2s ease-in-out infinite;
}
.center-btn.spinning {
	animation: none;
	box-shadow: 0 2px 12px rgba(103,80,164,0.5);
}
.center-btn:active {
	transform: translate(-50%, -50%) scale(0.9) !important;
}

.center-icon {
	font-size: 28px;
	color: var(--clr-accent-on);
	animation: icon-rotate 1.5s linear infinite;
	animation-play-state: paused;
}
.center-btn.spinning .center-icon {
	animation-play-state: running;
}

@keyframes pulse-glow {
	0%, 100% { box-shadow: 0 2px 12px rgba(103,80,164,0.5); }
	50% { box-shadow: 0 2px 28px rgba(103,80,164,0.8); }
}
@keyframes icon-rotate {
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
}

/* ─── 编辑面板 ─── */
.edit-panel {
	margin-top: auto;
	padding-top: var(--sp-3);
	position: relative;
	z-index: 2;
	animation: fade-in-up 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
	max-height: 40vh;
	overflow-y: auto;
}

.edit-add {
	display: flex;
	gap: var(--sp-2);
	margin-bottom: var(--sp-3);
}
.edit-input {
	flex: 1;
	background: rgba(255,255,255,0.08);
	border: 1px solid rgba(255,255,255,0.15);
	border-radius: 20px;
	padding: 10px 14px;
	font-size: 14px;
	color: var(--clr-text-primary);
}
.edit-input::placeholder { color: var(--clr-text-disabled); }
.edit-add-btn {
	width: 44px;
	height: 44px;
	border-radius: 50%;
	background: var(--clr-accent);
	display: flex;
	align-items: center;
	justify-content: center;
}
.edit-add-btn .material-icons {
	color: var(--clr-accent-on);
	font-size: 22px;
}

.edit-list {
	display: flex;
	flex-direction: column;
	gap: var(--sp-2);
	margin-bottom: var(--sp-3);
}
.edit-item {
	display: flex;
	align-items: center;
	gap: var(--sp-2);
	padding: 8px 12px;
	background: var(--clr-bg-secondary);
	border-radius: 20px;
}
.edit-color {
	width: 12px;
	height: 12px;
	border-radius: 50%;
	flex-shrink: 0;
}
.edit-item-label {
	flex: 1;
	font-size: 14px;
	color: var(--clr-text-primary);
	font-weight: 500;
}
.edit-item-input {
	flex: 1;
	background: rgba(255,255,255,0.1);
	border: 1px solid var(--clr-accent);
	border-radius: 8px;
	padding: 6px 10px;
	font-size: 14px;
	color: var(--clr-text-primary);
}
.edit-item-ok {
	width: 28px;
	height: 28px;
	border-radius: 50%;
	background: var(--clr-accent);
	display: flex;
	align-items: center;
	justify-content: center;
}
.edit-item-ok .material-icons {
	font-size: 16px;
	color: var(--clr-accent-on);
}
.edit-item-actions {
	display: flex;
	gap: 4px;
}
.edit-item-btn {
	width: 28px;
	height: 28px;
	border-radius: 50%;
	background: var(--clr-bg-secondary);
	display: flex;
	align-items: center;
	justify-content: center;
}
.edit-item-btn .material-icons {
	font-size: 16px;
	color: var(--clr-text-secondary);
}
.edit-item-btn.remove .material-icons {
	color: var(--clr-danger);
}
.edit-reset {
	text-align: center;
	padding: 8px;
}
.edit-reset text {
	font-size: 12px;
	color: var(--clr-text-disabled);
}

@keyframes fade-in-up {
	from { opacity: 0; transform: translateY(16px); }
	to { opacity: 1; transform: translateY(0); }
}
</style>