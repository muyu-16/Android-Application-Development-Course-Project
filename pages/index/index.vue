<!-- pages/index/index.vue -->
<!-- 首页：重定向到骰子页面（微信小程序 tabBar 入口） -->
<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  // 微信小程序 tabBar 模式下，首页重定向到第一个 tabBar 页面
  // #ifdef MP-WEIXIN
  uni.switchTab({
    url: '/pages/dice/dice'
  })
  // #endif
})
</script>

<template>
  <view class="redirect-page">
    <text class="redirect-text">PartyGlass</text>
  </view>
</template>

<style scoped>
.redirect-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(160deg, #F3EDF7 0%, #E8DEF8 40%, #FCE4EC 100%);
}

.redirect-text {
  font-size: 48rpx;
  font-weight: 700;
  color: #6750A4;
}
</style>
