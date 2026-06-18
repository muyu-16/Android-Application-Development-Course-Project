<!-- pages/dice/cup-mode.vue -->
<!-- 大话骰遮罩：模拟实体骰盅，扣放状态不显示点数，长按掀开查看 -->
<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useDiceStore } from '@/stores/dice'
import { useShake } from '@/composables/useShake'
import { useVibrate } from '@/composables/useVibrate'

const store = useDiceStore()
const vibrate = useVibrate()

// 骰子数据
const CUBE_FACES = [
	{ num: 1, transform: 'rotateY(0deg) translateZ(40px) scale(1.04)' },
	{ num: 2, transform: 'rotateX(90deg) translateZ(40px) scale(1.04)' },
	{ num: 3, transform: 'rotateY(-90deg) translateZ(40px) scale(1.04)' },
	{ num: 4, transform: 'rotateY(90deg) translateZ(40px) scale(1.04)' },
	{ num: 5, transform: 'rotateX(-90deg) translateZ(40px) scale(1.04)' },
	{ num: 6, transform: 'rotateX(180deg) translateZ(40px) scale(1.04)' }
]
const DOTS = {
	1: [[0, 0]],
	2: [[-1, -1], [1, 1]],
	3: [[-1, -1], [0, 0], [1, 1]],
	4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
	5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
	6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]]
}

// 状态
const cupCount = computed(() => store.cupCount)
const values = ref(Array(cupCount.value).fill(1))  // 骰子点数（掀开后才可见）
const rolling = ref(false)        // 摇骰中
const revealing = ref(false)      // 长按掀开中
const cupLifted = ref(false)      // 骰盅抬起动画
const shakeAnim = ref(false)      // 晃动动画

// 骰盅设置面板
const showSettings = ref(false)
const draftCount = ref(cupCount.value)
const openSettings = () => {
	draftCount.value = store.cupCount
	showSettings.value = true
}
const closeSettings = () => { showSettings.value = false }
const confirmSettings = () => {
	store.setCupCount(draftCount.value)
	values.value = Array(draftCount.value).fill(1)
	closeSettings()
}

// 摇骰
const roll = () => {
	if (rolling.value || revealing.value) return
	rolling.value = true
	cupLifted.value = false
	shakeAnim.value = true
	if (store.vibrateEnabled) vibrate.medium()

	const results = []
	for (let i = 0; i < cupCount.value; i++) {
		results.push(Math.floor(Math.random() * 6) + 1)
	}

	// 晃动 1200ms 后停止，骰子落定
	setTimeout(() => {
		values.value = [...results]
		shakeAnim.value = false
		rolling.value = false
	}, 1200)
}

// 重摇：直接复位，无弹窗
const reset = () => {
	if (rolling.value) return
	cupLifted.value = false
	revealing.value = false
	values.value = Array(cupCount.value).fill(0)
	if (store.vibrateEnabled) vibrate.tap()
}

// 长按掀开
let pressTimer = null
const onPressStart = () => {
	if (rolling.value) return
	pressTimer = setTimeout(() => {
		cupLifted.value = true
		revealing.value = true
		if (store.vibrateEnabled) vibrate.medium()
	}, 250)
}
const onPressEnd = () => {
	clearTimeout(pressTimer)
	if (revealing.value) {
		setTimeout(() => {
			cupLifted.value = false
			revealing.value = false
		}, 100)
	}
}

// 摇一摇
const { start: startShake, stop: stopShake } = useShake({ onShake: roll })
onMounted(() => startShake())
onBeforeUnmount(() => stopShake())
</script>

<template>
	<view class="cup-mode">
		<!-- 顶部设置按钮 -->
		<view class="top-bar">
			<text class="title">大话骰遮罩</text>
			<view class="settings-btn" @tap="openSettings">
				<text>⚙️</text>
			</view>
		</view>

		<!-- 骰盅区域 -->
		<view class="cup-stage">
			<view class="cup-container" :class="{ shaking: shakeAnim }">
				<!-- 骰盅盖子（覆盖在骰子上） -->
				<view class="cup-lid" :class="{ lifted: cupLifted }">
					<!-- 顶面开口（椭圆形洞口） -->
					<view class="cup-opening"></view>
					<!-- 杯身主体（圆柱形 + 渐变光泽） -->
					<view class="cup-body"></view>
					<!-- 杯底阴影 -->
					<view class="cup-base"></view>
					<!-- 杯身左侧高光 -->
					<view class="cup-hl cup-hl-left"></view>
					<!-- 杯身右侧高光 -->
					<view class="cup-hl cup-hl-right"></view>
				</view>

				<!-- 骰子们 -->
				<view class="dice-row">
					<view v-for="(val, idx) in values" :key="idx" class="mini-dice"
						:style="{ marginLeft: idx > 0 ? '8px' : '0' }">
						<view class="mini-cube">
							<view v-for="(face, fi) in CUBE_FACES" :key="fi" class="mini-face"
								:style="{ transform: face.transform }">
								<view v-for="(pos, pi) in DOTS[face.num]" :key="pi" class="mini-dot"
									:style="{ left: 'calc(50% + ' + pos[0] * 10 + 'px)', top: 'calc(50% + ' + pos[1] * 10 + 'px)' }"></view>
							</view>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 操作区 -->
		<view class="action-bar">
			<view class="action-row">
				<view class="action-btn roll-btn" @tap="roll">
					<text class="action-icon">🎲</text>
					<text class="action-text">{{ rolling ? '摇动中...' : '摇骰' }}</text>
				</view>
				<view class="action-btn reset-btn" @tap="reset">
					<text class="action-icon">🔄</text>
					<text class="action-text">重摇</text>
				</view>
			</view>
			<view class="press-hint" v-if="!rolling && !revealing">
				<text>长按下方按钮查看点数</text>
			</view>
			<view class="reveal-btn" :class="{ active: revealing }"
				@touchstart="onPressStart" @touchend="onPressEnd" @touchcancel="onPressEnd">
				<text class="reveal-icon">👁</text>
				<text class="reveal-text">{{ revealing ? '查看中...' : '长按掀开' }}</text>
			</view>
		</view>

		<!-- 设置弹窗 -->
		<view v-if="showSettings" class="modal-mask" @tap="closeSettings">
			<view class="modal-panel" @tap.stop>
				<text class="modal-title">骰子数量</text>
				<text class="modal-desc">3 - 6 颗可调</text>
				<view class="count-picker">
					<view v-for="n in [3, 4, 5, 6]" :key="n"
						class="pick-btn" :class="{ active: draftCount === n }"
						@tap="draftCount = n">
						<text>{{ n }}</text>
					</view>
				</view>
				<view class="modal-actions">
					<view class="modal-btn primary" @tap="confirmSettings">
						<text>确认</text>
					</view>
					<view class="modal-btn secondary" @tap="closeSettings">
						<text>取消</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<style scoped>
.cup-mode {
	display: flex;
	flex-direction: column;
	height: 100%;
	padding: 16px;
}

/* ─── 顶部 ─── */
.top-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 12px;
}
.title {
	font-size: 18px;
	font-weight: 700;
	color: #F5EFF7;
}
.settings-btn {
	width: 36px;
	height: 36px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(30, 27, 35, 0.55);
	backdrop-filter: blur(14px) saturate(180%);
	-webkit-backdrop-filter: blur(14px) saturate(180%);
	border: 1px solid rgba(255, 255, 255, 0.10);
	border-radius: 50%;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08);
}
.settings-btn:active { transform: scale(0.92); }
.settings-btn text { font-size: 18px; }

/* ─── 骰盅舞台 ─── */
.cup-stage {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 20px 0;
}
.cup-container {
	position: relative;
	width: 280px;
	height: 280px;
	background: rgba(30, 27, 35, 0.55);
	backdrop-filter: blur(14px) saturate(180%);
	-webkit-backdrop-filter: blur(14px) saturate(180%);
	border: 1px solid rgba(255, 255, 255, 0.10);
	border-radius: 24px;
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.08);
	display: flex;
	align-items: center;
	justify-content: center;
	perspective: 800px;
	transition: transform 0.1s ease;
}
.cup-container.shaking {
	animation: cup-shake 0.1s linear infinite;
}
@keyframes cup-shake {
	0% { transform: translate(0, 0) rotate(0deg); }
	25% { transform: translate(-3px, 2px) rotate(-1deg); }
	50% { transform: translate(3px, -2px) rotate(1deg); }
	75% { transform: translate(-2px, 3px) rotate(-0.5deg); }
	100% { transform: translate(0, 0) rotate(0deg); }
}

/* ─── 骰盅盖子（实体黑色骰盅） ─── */
.cup-lid {
	position: absolute;
	width: 200px;
	height: 240px;
	left: 50%;
	top: 50%;
	transform: translate(-50%, -50%);
	z-index: 10;
	transform-origin: bottom center;
	transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.cup-lid.lifted {
	transform: translate(-50%, -50%) translateY(-180px) rotateX(25deg);
}

/* 杯身：圆柱形（顶部宽、底部略窄），黑色光泽渐变 */
.cup-body {
	position: absolute;
	inset: 8% 0 0 0;
	background:
		/* 顶部边缘高光环 */
		linear-gradient(180deg,
			rgba(255,255,255,0.22) 0%,
			rgba(255,255,255,0.06) 4%,
			transparent 8%
		),
		/* 杯身光泽：中间微亮，两侧深 */
		linear-gradient(90deg,
			#000 0%,
			#1c1c1c 8%,
			#2a2a2a 25%,
			#1a1a1a 50%,
			#2a2a2a 75%,
			#1c1c1c 92%,
			#000 100%
		),
		/* 垂直渐变（顶部略亮，底部深） */
		linear-gradient(180deg,
			#1a1a1a 0%,
			#0a0a0a 40%,
			#000 100%
		);
	/* 顶部圆弧（俯视椭圆效果），底部微圆 */
	border-radius: 50% 50% 35% 35% / 18% 18% 6% 6%;
	/* 杯壁立体感：上沿白色微高光，内壁深黑阴影 */
	box-shadow:
		inset 0 6px 0 -2px rgba(255,255,255,0.25),
		inset 0 -30px 40px -20px rgba(0,0,0,0.95),
		inset 0 0 0 1px rgba(255,255,255,0.05),
		0 12px 30px rgba(0,0,0,0.65),
		0 2px 6px rgba(0,0,0,0.5);
}

/* 顶面开口：椭圆形深色"洞口"，杯身顶部叠加显示 */
.cup-opening {
	position: absolute;
	top: 4%;
	left: 50%;
	transform: translateX(-50%);
	width: 76%;
	height: 12%;
	background: radial-gradient(ellipse at center,
		#000 0%,
		#050505 50%,
		#1a1a1a 90%,
		#2a2a2a 100%
	);
	border-radius: 50%;
	z-index: 3;
	box-shadow:
		inset 0 3px 8px rgba(0,0,0,0.95),
		inset 0 -1px 2px rgba(255,255,255,0.08),
		0 1px 0 rgba(255,255,255,0.15);
}

/* 杯底：略宽的底环，模拟接触面 */
.cup-base {
	position: absolute;
	bottom: 0;
	left: 4%;
	right: 4%;
	height: 8px;
	background: linear-gradient(180deg, #0a0a0a 0%, #000 100%);
	border-radius: 50%;
	filter: blur(0.5px);
	box-shadow:
		0 4px 12px rgba(0,0,0,0.6),
		inset 0 1px 0 rgba(255,255,255,0.06);
	z-index: 1;
}

/* 杯身侧高光带（玻璃反光） */
.cup-hl {
	position: absolute;
	top: 12%;
	bottom: 6%;
	width: 14px;
	z-index: 2;
	pointer-events: none;
}
.cup-hl-left {
	left: 10%;
	background: linear-gradient(90deg,
		rgba(255,255,255,0.18) 0%,
		rgba(255,255,255,0.05) 60%,
		transparent 100%
	);
	border-radius: 50%;
	filter: blur(2px);
}
.cup-hl-right {
	right: 10%;
	background: linear-gradient(270deg,
		rgba(255,255,255,0.14) 0%,
		rgba(255,255,255,0.04) 60%,
		transparent 100%
	);
	border-radius: 50%;
	filter: blur(2px);
}

/* ─── 骰子们 ─── */
.dice-row {
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
	z-index: 1;
}
.mini-dice {
	width: 80px;
	height: 80px;
	perspective: 800px;
}
.mini-cube {
	width: 80px;
	height: 80px;
	position: relative;
	transform-style: preserve-3d;
	-webkit-transform-style: preserve-3d;
}
.mini-face {
	position: absolute;
	width: 80px;
	height: 80px;
	border-radius: 12px;
	backface-visibility: hidden;
	-webkit-backface-visibility: hidden;
	background: #F5F5F7;
	box-shadow:
		inset 0 0 0 1px #E0E0E0,
		inset 0 1px 0 rgba(255, 255, 255, 1);
	transform-style: preserve-3d;
}
.mini-dot {
	position: absolute;
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: #1C1B1F;
	transform: translate(-50%, -50%);
}

/* ─── 操作区 ─── */
.action-bar {
	padding: 0 8px;
}
.action-row {
	display: flex;
	gap: 12px;
	margin-bottom: 16px;
}
.action-btn {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	padding: 14px 16px;
	border-radius: 999px;
	transition: transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.action-btn:active { transform: scale(0.94); }
.roll-btn {
	background: rgba(208, 188, 255, 0.28);
	border: 1px solid rgba(208, 188, 255, 0.55);
	box-shadow: 0 4px 24px rgba(208, 188, 255, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2);
}
.reset-btn {
	background: rgba(255, 255, 255, 0.10);
	border: 1px solid rgba(255, 255, 255, 0.20);
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08);
}
.action-icon { font-size: 20px; }
.action-text {
	font-size: 15px;
	font-weight: 700;
	color: #F5EFF7;
}

.press-hint {
	text-align: center;
	font-size: 12px;
	color: #CAC4D0;
	margin-bottom: 8px;
}
.reveal-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	padding: 18px 24px;
	background: rgba(255, 255, 255, 0.10);
	border: 1px solid rgba(255, 255, 255, 0.20);
	border-radius: 999px;
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08);
	transition: background 0.2s, transform 0.15s;
}
.reveal-btn.active {
	background: rgba(208, 188, 255, 0.35);
	border: 1px solid rgba(208, 188, 255, 0.65);
	transform: scale(0.96);
}
.reveal-icon { font-size: 20px; }
.reveal-text {
	font-size: 15px;
	font-weight: 700;
	color: #F5EFF7;
}

/* ─── 设置弹窗 ─── */
.modal-mask {
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.45);
	backdrop-filter: blur(8px);
	-webkit-backdrop-filter: blur(8px);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 100;
}
.modal-panel {
	width: 300px;
	background: rgba(30, 27, 35, 0.85);
	backdrop-filter: blur(24px) saturate(180%);
	-webkit-backdrop-filter: blur(24px) saturate(180%);
	border: 1px solid rgba(255, 255, 255, 0.12);
	border-radius: 24px;
	padding: 24px;
	display: flex;
	flex-direction: column;
	gap: 16px;
	box-shadow: 0 8px 32px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.12);
}
.modal-title {
	font-size: 18px;
	font-weight: 700;
	color: #F5EFF7;
	text-align: center;
}
.modal-desc {
	font-size: 13px;
	color: #CAC4D0;
	text-align: center;
}
.count-picker {
	display: flex;
	gap: 8px;
}
.pick-btn {
	flex: 1;
	padding: 12px 0;
	text-align: center;
	border-radius: 999px;
	background: rgba(255, 255, 255, 0.06);
	border: 1px solid transparent;
}
.pick-btn text {
	font-size: 16px;
	font-weight: 600;
	color: #CAC4D0;
}
.pick-btn.active {
	background: rgba(208, 188, 255, 0.28);
	border: 1px solid rgba(208, 188, 255, 0.55);
}
.pick-btn.active text { color: #F5EFF7; }
.modal-actions {
	display: flex;
	gap: 8px;
}
.modal-btn {
	flex: 1;
	padding: 12px;
	border-radius: 999px;
	text-align: center;
}
.modal-btn text {
	font-size: 14px;
	font-weight: 700;
}
.modal-btn.primary {
	background: rgba(208, 188, 255, 0.28);
	border: 1px solid rgba(208, 188, 255, 0.55);
}
.modal-btn.primary text { color: #F5EFF7; }
.modal-btn.secondary {
	background: rgba(255, 255, 255, 0.06);
}
.modal-btn.secondary text { color: #CAC4D0; }
</style>
