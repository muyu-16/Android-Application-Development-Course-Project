---
name: "mobile-ui-readability"
description: "移动端UI可读性审查与优化。覆盖WCAG AA对比度、玻璃效果文字可读性、暗色模式、字体排版。在审查UI可读性或修复文字看不清问题时必须调用此skill。"
---

# 移动端 UI 可读性审查指南

## 适用场景
- 用户反馈"字看不清"、"对比度不够"、"太暗了"
- UI 可读性审查任务
- 暗色模式适配
- 文字在玻璃层上的显示优化

## 核心检查清单

### 1. 文字颜色禁止半透明
```
❌ color: rgba(255,255,255,0.5)
❌ color: rgba(0,0,0,0.6)
✅ color: var(--clr-text-primary)        /* 100% 实色 */
✅ color: var(--clr-text-secondary)      /* 100% 实色 */
```

### 2. 文字容器禁止 backdrop-filter
```
❌ .card { backdrop-filter: blur(16px); color: #fff; }
✅ .card { /* 玻璃效果在 ::before 上 */ }
✅ .card-text { color: var(--clr-text-primary); }
```

### 3. 玻璃 + 文字的正确结构
```vue
<template>
  <view class="g2-glass">
    <view class="g2-scrim">
      <text class="txt-primary">文字内容</text>
    </view>
  </view>
</template>
```

### 4. 对比度标准 (WCAG AA)
| 类型 | 亮色模式 | 暗色模式 |
|------|---------|---------|
| 主文字 | ≥ 4.5:1 | ≥ 7:1 |
| 大字体(≥18px/≥14px粗体) | ≥ 3:1 | ≥ 4.5:1 |
| 禁用文字 | ≥ 3:1 | ≥ 4.5:1 |

### 5. 暗色模式颜色取值
```
❌ #FFFFFF（纯白刺眼）
✅ #F5EFF7（暖白，暗色主文字）
✅ #CAC4D0（暗色次要文字）
✅ #938F99（暗色禁用文字）
```

### 6. 数字排版
```
.num {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
```

### 7. 文字在亮色/暗色背景下的取值
| Token | 亮色值 | 暗色值 | 用途 |
|-------|--------|--------|------|
| `--clr-text-primary` | #1C1B1F | #F5EFF7 | 主内容 |
| `--clr-text-secondary` | #49454F | #CAC4D0 | 辅助说明 |
| `--clr-text-disabled` | #9E9E9E | #938F99 | 禁用态 |

### 8. 审查步骤
1. 找所有 `rgba(_,_,_,0.x)` 颜色 → 标 ❌
2. 找 `.glass-*` 内部的文字元素 → 检查是否有独立 color
3. 找 `<text>` 标签 → 检查是否有明确 color
4. 找所有 `font-weight` < 600 的 `num` → 标 ❌
5. 暗色模式用 `#FFFFFF` 的 → 标 ⚠️
