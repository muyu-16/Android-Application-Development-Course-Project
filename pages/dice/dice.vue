﻿﻿﻿﻿﻿﻿<script>
// 标准骰子：对面之和=7
const CUBE_FACES = [
  { num: 1, transform: 'rotateY(0deg) translateZ(60rpx)' },
  { num: 2, transform: 'rotateX(90deg) translateZ(60rpx)' },
  { num: 3, transform: 'rotateY(-90deg) translateZ(60rpx)' },
  { num: 4, transform: 'rotateY(90deg) translateZ(60rpx)' },
  { num: 5, transform: 'rotateX(-90deg) translateZ(60rpx)' },
  { num: 6, transform: 'rotateX(180deg) translateZ(60rpx)' }
]
// 各点数对应的终止旋转
const FACE_OFFSET = {
  1: { x: 0, y: 0 },
  2: { x: -90, y: 0 },
  3: { x: 0, y: 90 },
  4: { x: 0, y: -90 },
  5: { x: 90, y: 0 },
  6: { x: 180, y: 0 }
}
// 点数排列坐标（相对于面中心的倍数，乘 28rpx）
const DOTS = {
  1: [[0,0]],
  2: [[-1,-1],[1,1]],
  3: [[-1,-1],[0,0],[1,1]],
  4: [[-1,-1],[1,-1],[-1,1],[1,1]],
  5: [[-1,-1],[1,-1],[0,0],[-1,1],[1,1]],
  6: [[-1,-1],[1,-1],[-1,0],[1,0],[-1,1],[1,1]]
}
export default {
  data() {
    return {
      diceCount: 1,
      diceValues: [1],
      rolling: false,
      history: [],
      MAX_HISTORY: 20,
      showCoach: false,
      tiltX: 0, tiltY: 0,
      lastX: 0, lastY: 0, lastZ: 0,
      shakeTimer: null,
      containerTilt: null,
      diceTrans: ['none'],
      diceRotX: [0],
      diceRotY: [0],
      diceFlipping: [false],
      diceBounce: [''],
    }
  },
  mounted() {
    uni.onAccelerometerChange?.(this.onShake)
    if (!uni.getStorageSync('coach_dismissed')) this.showCoach = true
  },
  beforeDestroy() { uni.offAccelerometerChange?.(this.onShake) },
  methods: {
    roll() {
      if (this.rolling) return
      this.rolling = true
      uni.vibrateShort?.({ type: 'medium' })
      const results = []
      for (let i = 0; i < this.diceCount; i++) results.push(Math.floor(Math.random() * 6) + 1)
      for (let i = 0; i < this.diceCount; i++) setTimeout(() => this.rollSingle(i, results[i]), i * 150)
      setTimeout(() => {
        this.rolling = false
        this.diceValues = [...results]
        for (let i = 0; i < this.diceCount; i++) { this.$set(this.diceFlipping, i, false); this.$set(this.diceBounce, i, '') }
        const entry = { id: Date.now(), values: [...results], time: new Date().toLocaleTimeString() }
        this.history.unshift(entry)
        if (this.history.length > this.MAX_HISTORY) this.history.pop()
      }, this.diceCount * 150 + 1000)
    },
    rollSingle(index, targetValue) {
      this.$set(this.diceTrans, index, 'none')
      this.$set(this.diceRotX, index, 0)
      this.$set(this.diceRotY, index, 0)
      this.$set(this.diceFlipping, index, true)
      this.$set(this.diceBounce, index, '')
      const flipId = setInterval(() => {
        if (!this.diceFlipping[index]) { clearInterval(flipId); return }
        this.$set(this.diceValues, index, Math.floor(Math.random() * 6) + 1)
      }, 80)
      setTimeout(() => clearInterval(flipId), 1500)
      this.$nextTick(() => {
        const spins = 1 + Math.floor(Math.random() * 3)
        const offset = FACE_OFFSET[targetValue]
        const endX = spins * 360 + offset.x
        const endY = spins * 360 + offset.y
        const duration = 0.6 + Math.random() * 0.3
        this.$set(this.diceTrans, index, 'transform ' + duration + 's cubic-bezier(0.05, 0.7, 0.1, 1.0)')
        this.$set(this.diceRotX, index, endX)
        this.$set(this.diceRotY, index, endY)
        setTimeout(() => this.$set(this.diceBounce, index, 'bounce-settle 0.3s ease-out 0.05s both'), 30)
      })
      uni.vibrateShort?.({ type: 'light' })
    },
    onShake(e) {
      if (this.rolling) return; const { x, y, z } = e
      if (!this.lastX && !this.lastY && !this.lastZ) {
        if (!this.shakeTimer) { this.lastX = x; this.lastY = y; this.lastZ = z; this.shakeTimer = setTimeout(() => { this.shakeTimer = null }, 300); return }
      }
      if (Math.abs(x - this.lastX) + Math.abs(y - this.lastY) + Math.abs(z - this.lastZ) > 1.5) this.roll()
      this.lastX = x; this.lastY = y; this.lastZ = z
    },
    onTouchStart(e) {
      if (this.containerTilt) return; const touch = e.touches[0]
      this.containerTilt = { startX: touch.clientX, startY: touch.clientY }
    },
    onTouchMove(e) {
      if (!this.containerTilt) return; const touch = e.touches[0]; const dx = touch.clientX - this.containerTilt.startX; const dy = touch.clientY - this.containerTilt.startY
      this.tiltX = Math.max(-15, Math.min(15, dy / 8)); this.tiltY = Math.max(-15, Math.min(15, -dx / 8))
    },
    onTouchEnd() { this.containerTilt = null; this.tiltX = 0; this.tiltY = 0 },
    setCount(n) { if (this.rolling) return; this.diceCount = n; this.diceValues = Array(n).fill(1) },
    dismissCoach() { this.showCoach = false; uni.setStorageSync('coach_dismissed', true) }
  }
}
</script>

<template>
  <view class="container" :style="{ transform: 'perspective(600px) rotateX(' + tiltX + 'deg) rotateY(' + tiltY + 'deg)' }"
    @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd">
    <view class="nav-bar">
      <view class="nav-left"><text class="material-icons nav-back" @tap="uni.navigateBack()">←</text><text class="nav-title">骰子</text></view>
      <view class="nav-right">
        <view class="seg-control">
          <view v-for="n in [1,2,3]" :key="n" class="seg-item" :class="{ active: diceCount === n }" @tap="setCount(n)"><text>{{ n }}</text></view>
        </view>
      </view>
    </view>
    <view class="dice-area">
      <view v-for="(val, idx) in diceValues" :key="idx" class="dice"
        :style="{ zIndex: diceValues.length - idx, marginTop: idx > 0 ? '28rpx' : '0', animation: diceBounce[idx] }" @tap="roll">
        <view class="dice-cube" :style="{ transform: 'rotateX(' + diceRotX[idx] + 'deg) rotateY(' + diceRotY[idx] + 'deg)', transition: diceTrans[idx] }">
          <view v-for="(face, fi) in CUBE_FACES" :key="fi" class="dice-face" :style="{ transform: face.transform }">
            <view v-for="(pos, pi) in DOTS[face.num]" :key="pi" class="dice-dot"
              :style="{ left: 'calc(50% + ' + pos[0] * 28 + 'rpx)', top: 'calc(50% + ' + pos[1] * 28 + 'rpx)' }"></view>
          </view>
          <view class="dice-flip-overlay" v-if="diceFlipping[idx]">
            <text class="dice-flip-num">{{ diceValues[idx] }}</text>
          </view>
        </view>
        <view class="dice-shadow"></view>
      </view>
    </view>
    <view class="history-wrap" v-if="history.length > 0">
      <view class="history-hint"><text class="history-hint-text">投掷记录</text></view>
      <scroll-view class="history-scroll" scroll-x>
        <view v-for="(h, i) in history" :key="h.id" class="history-chip" :class="{ faded: i >= 5 }">
          <text class="material-icons history-icon">🎲</text><text class="history-text">{{ h.values.join(',') }}</text>
        </view>
      </scroll-view>
    </view>
    <view class="coach-mask" v-if="showCoach" @tap="dismissCoach">
      <view class="coach-content"><view class="coach-arrow"></view><view class="coach-bubble"><text class="coach-title">点击骰子开始</text><text class="coach-desc">摇动手机也能触发哦~</text><view class="coach-btn" @tap.stop="dismissCoach"><text>知道了</text></view></view></view>
    </view>
  </view>
</template>

<style scoped>
.container { min-height: 100vh; background: #1a1a2e; padding: 16px; padding-top: calc(var(--safe-area-top) + 12px); padding-bottom: calc(var(--safe-area-bottom) + 24px); display: flex; flex-direction: column; transition: transform 0.05s; }
.nav-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.nav-left { display: flex; align-items: center; gap: 12px; }
.nav-back { font-size: 22px; color: #F5EFF7; padding: 4px; }
.nav-title { font-size: 22px; font-weight: 700; color: #F5EFF7; }
.nav-right { display: flex; align-items: center; gap: 8px; }
.seg-control { display: flex; background: rgba(255,255,255,0.08); border-radius: 20px; padding: 3px; gap: 2px; }
.seg-item { width: 36px; padding: 6px 0; text-align: center; border-radius: 999px; transition: all 0.25s; }
.seg-item text { font-size: 14px; font-weight: 600; color: #CAC4D0; }
.seg-item.active { background: rgba(255,255,255,0.15); }
.seg-item.active text { color: #F5EFF7; }

.dice-area { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px 0; }

/* ─── 骰子 120×120rpx ─── */
.dice { position: relative; width: 120rpx; height: 120rpx; perspective: 1000rpx; cursor: pointer; }

/* 3D 立方体 */
.dice-cube { width: 120rpx; height: 120rpx; position: relative; transform-style: preserve-3d; will-change: transform; }

/* 6 个面 — 纯白磨砂 #F5F5F7 */
.dice-face {
  position: absolute; width: 120rpx; height: 120rpx; border-radius: 20rpx;
  backface-visibility: hidden; -webkit-backface-visibility: hidden;
  background: #F5F5F7;
  border: 1rpx solid #E0E0E0;
  box-shadow:
    inset 0 1rpx 0 rgba(255,255,255,1),
    inset 0 -1rpx 0 rgba(0,0,0,0.05);
  overflow: hidden;
}

/* 点数 — 纯黑 #1C1B1F */
.dice-dot {
  position: absolute; width: 16rpx; height: 16rpx; border-radius: 50%;
  background: #1C1B1F;
  transform: translate(-50%, -50%);
}

/* 地面阴影 */
.dice-shadow {
  position: absolute; bottom: -12rpx; left: 10%; right: 10%; height: 20rpx;
  background: radial-gradient(ellipse at center, rgba(0,0,0,0.30) 0%, transparent 100%);
  filter: blur(8rpx); z-index: -1; pointer-events: none;
}

/* 翻面数字 */
.dice-flip-overlay { position: absolute; inset: 0; z-index: 10; display: flex; align-items: center; justify-content: center; pointer-events: none; }
.dice-flip-num { font-size: 52rpx; font-weight: 900; color: #1C1B1F; text-shadow: 0 2rpx 8rpx rgba(0,0,0,0.15); animation: flip-pop 0.15s ease-out; }
@keyframes flip-pop { 0%{transform:scale(0.8);opacity:0.5} 100%{transform:scale(1);opacity:1} }

/* 落地弹跳 */
@keyframes bounce-settle { 0%{transform:translateY(0)} 30%{transform:translateY(-20px)} 60%{transform:translateY(0)} 75%{transform:translateY(-8px)} 100%{transform:translateY(0)} }

.history-wrap { margin-top: 12px; }
.history-hint { margin-bottom: 8px; padding-left: 2px; }
.history-hint-text { font-size: 13px; color: #CAC4D0; font-weight: 600; letter-spacing: 0.5px; }
.history-scroll { display: flex; flex-direction: row; white-space: nowrap; overflow-x: auto; padding-bottom: 4px; }
.history-chip { display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.08); border-radius: 999px; padding: 8px 16px; margin-right: 10px; }
.history-icon { font-size: 16px; color: #CAC4D0; }
.history-text { font-size: 13px; font-weight: 700; color: #F5EFF7; font-variant-numeric: tabular-nums; }

.coach-mask { position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 100; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 120px; }
.coach-content { position: relative; display: flex; flex-direction: column; align-items: center; }
.coach-arrow { width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-bottom: 10px solid rgba(255,255,255,0.12); }
.coach-bubble { background: rgba(255,255,255,0.12); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.15); border-radius: 16px; padding: 16px 24px; text-align: center; }
.coach-title { font-size: 16px; font-weight: 700; color: #F5EFF7; display: block; margin-bottom: 4px; }
.coach-desc { font-size: 13px; color: #CAC4D0; display: block; margin-bottom: 8px; }
.coach-btn { padding: 8px 20px; border-radius: 999px; background: #6750A4; display: inline-block; }
.coach-btn text { font-size: 14px; font-weight: 600; color: #FFFFFF; }
</style>
