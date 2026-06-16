# PartyGlass UI 组件库

放在 `pages/components/`，通过 `easycom` 自动注册。

**使用方式**（无需 import）：
```vue
<template>
  <GlassButton text="开始游戏" @tap="onStart" />
  <SegmentedControl :items="['A','B','C']" v-model="active" />
</template>
```

> ⚠️ 由于 easycom 规则是 `^g-(.*)`，组件名以 `g-` 开头才能免 import 自动加载。
> 当前文件名是 PascalCase，需要**重命名**或调整 easycom 规则。

## 两种解决方案

### 方案 A：重命名组件文件为 `g-` 前缀
```
GlassButton.vue  →  g-button.vue
SegmentedControl.vue  →  g-segment.vue
GlassCard.vue  →  g-card.vue
FabButton.vue  →  g-fab.vue
```

### 方案 B：改 easycom 规则匹配 PascalCase
```json
{
  "easycom": {
    "autoscan": true,
    "custom": {
      "^Glass(.*)": "@/pages/components/Glass$1.vue",
      "^Segmented(.*)": "@/pages/components/Segmented$1.vue",
      "^Fab(.*)": "@/pages/components/Fab$1.vue"
    }
  }
}
```

---

## 4 个组件

### 1. GlassButton（玻璃按钮）
```vue
<GlassButton
  text="再来一局"
  variant="primary"
  @tap="onRoll"
/>

<GlassButton
  text="跳过"
  variant="secondary"
  @tap="onSkip"
/>

<GlassButton
  icon="add"
  variant="primary"
  @tap="onAdd"
/>
```

**Props**：
- `text` — 按钮文字
- `icon` — Material Icons 名
- `variant` — `primary` / `secondary` / `ghost` / `danger`
- `loading` — 加载态
- `disabled` — 禁用

---

### 2. SegmentedControl（分段控件）
```vue
<SegmentedControl
  :items="['成员', '流水', '结算']"
  v-model="activeTab"
  @change="onTabChange"
/>
```

**Props**：
- `items` — 标签数组
- `modelValue` — 当前索引（v-model）

**特点**：
- 紫色滑块用 `transform: translateX` 跟随
- 350ms cubic-bezier 缓动
- 选中态：紫色实底 + 白字

---

### 3. GlassCard（玻璃卡片）
```vue
<GlassCard>
  <text class="txt-primary">标题</text>
  <text class="txt-secondary">副标题</text>
</GlassCard>

<GlassCard interactive @tap="onCardTap">
  可点击的卡片
</GlassCard>
```

**Props**：
- `level` — `g1` / `g2` / `g3`（玻璃深度）
- `interactive` — 是否可点击
- `padded` — 是否需要内边距

---

### 4. FabButton（浮动按钮）
```vue
<FabButton icon="add" @tap="onAdd" />
<FabButton icon="edit" :bottom="'calc(var(--safe-bottom) + 200rpx)'" />
<FabButton icon="notifications" :badge="3" />
```

**Props**：
- `icon` — Material Icons
- `bottom` — 距离底部距离（默认安全区 + 24rpx）
- `badge` — 角标数字

---

## 使用示例（在 chip.vue 里替换 Segmented）

```vue
<template>
  <SegmentedControl
    :items="['成员', '流水', '结算']"
    v-model="activeTab"
  />
</template>

<script setup>
import { ref } from 'vue'
const activeTab = ref(0)
</script>
```

> 替换原来 `chip.vue` 里的 `<view class="tab-bar">` 整块。
