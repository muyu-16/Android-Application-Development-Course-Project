---
name: "uni-app-glass-ui"
description: "uni-app + Vue3 Material Design 3 + Liquid Glass 融合 UI 设计系统。涉及玻璃材质(G1/G2/G3)、跨端兼容(无DOM API)、CSS变量设计系统。在开发 uni-app 跨端玻璃风格 UI 时必须调用此 skill。"
---

# uni-app Glass UI 设计系统

## 适用场景
当你在 uni-app(Vue3) 项目中需要：
- 实现 Liquid Glass / Glassmorphism 视觉效果
- 确保代码在 Android App / H5 端正常工作
- 使用 CSS 变量设计系统
- 处理跨端兼容性问题（无 document/window）
- 实现 Material Design 3 设计语言

## 核心原则

### 1. 绝对不要使用 Web DOM API
uni-app 非 H5 端（Android App）**没有** `document`、`window`、`querySelectorAll` 等浏览器 API。

| ❌ 不要用 | ✅ 改用 |
|-----------|---------|
| `document.querySelectorAll` | `:ref` 函数 + `el.$el \|\| el` |
| `document.createElement` | `uni.createSelectorQuery` |
| `window.addEventListener` | `uni.onAccelerometerChange` |
| `canvas.getContext` | uni-app canvas API |
| `parentNode/children` | Vue 模板 ref 数组 |

### 2. 获取 DOM 引用的正确方式
```vue
<script setup>
import { ref } from 'vue'

const itemRefs = ref([])

function setRef(el, idx) {
  if (el) itemRefs.value[idx] = el.$el || el
}
</script>

<template>
  <view
    v-for="(item, idx) in list"
    :key="idx"
    :ref="(el) => setRef(el, idx)"
  >
    {{ item }}
  </view>
</template>
```

### 3. 玻璃材质 3 档标准
```css
/* G1 — 装饰层（背景氛围）blur 24px */
:root {
  /* 见 App.vue --clr-* 变量体系 */
}
```

| 级别 | 用途 | background | blur | 不透明度 |
|------|------|-----------|------|----------|
| G1 | 装饰/氛围 | `rgba(255,255,255,0.50)` | 24px | 最透 |
| G2 | 卡片/列表行 | `rgba(255,255,255,0.75)` | 16px | 常用 |
| G3 | 浮层/弹窗 | `rgba(255,255,255,0.88)` | 24px | 最高 |

### 4. 文字可读性规则
- **文字容器禁止 `backdrop-filter`** — blur 会降低文字对比度
- 所有文字用 100% 实色（`var(--clr-text-primary)`）
- 玻璃层与文字之间加 scrim 垫底：`.g2-scrim { background: rgba(255,255,255,0.25); }`
- WCAG AA: 文字 4.5:1，暗色模式 7:1

### 5. 动画策略
| 需求 | 方案 |
|------|------|
| 简单过渡 | CSS transition |
| 关键帧动画 | CSS @keyframes |
| 复杂序列 | GSAP (需 npm 安装) |
| 滚动驱动 | CSS animation + IntersectionObserver |

GSAP 在 uni-app H5 模式可用。使用 `gsap.context()` + `onUnmounted` 清理。

### 6. 颜色系统变量
```css
--clr-bg-primary     /* 页面主背景 */
--clr-bg-secondary   /* 二级背景 */
--clr-text-primary   /* 主文字 */
--clr-text-secondary /* 次要文字 */
--clr-accent         /* 强调色 */
--clr-accent-on      /* 强调色上的文字 */
```

### 7. 单位使用
- 字体大小: 用 `px` (相对于基准)
- 间距/宽高: 用 `rpx` (响应式)
- 圆角: 用 `rpx`
- 避免: `vh`/`vw`（Android App 端可能不支持）

### 8. SCSS 注意
- uni-app vue3 使用 `dart-sass`（非 `node-sass`）
- `/deep/` → `::v-deep`
- 除法运算 → `math.div()`
