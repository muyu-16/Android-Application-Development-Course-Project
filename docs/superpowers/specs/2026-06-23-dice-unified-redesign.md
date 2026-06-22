# 骰子模块统一重构设计

日期: 2026-06-23

## 概述

将现有双 Tab（自由摇骰 + 大话骰遮罩）骰子模块重构为统一的多面骰界面，支持 D4/D6/D8/D10/D12/D20/D100 全类型骰子，集成投掷历史记录管理，采用 CSS 3D 动画模拟物理反馈。

## 架构决策

| 决策项 | 选择 | 理由 |
|--------|------|------|
| 页面架构 | 统一重构，合并双 Tab | 减少页面层级，操作集中 |
| 物理反馈 | CSS 3D 动画模拟 | 跨端兼容性好，性能优 |
| 历史存储 | 本地持久化 (uni.setStorageSync) | 无需后端，重启后保留 |
| UI 布局 | 单页紧凑布局 | 移动端单手操作友好 |

## 页面结构

```
dice.vue（统一入口）
├── NavBar（标题 "骰子" + 右侧历史按钮）
├── DiceTypeSelector（D4~D100 水平滚动芯片）
├── DiceDisplay（骰子展示区，3D/2D 自适应）
├── ResultStats（总和/最大/最小统计栏）
├── ControlBar（数量调节 [-/+] + 摇骰按钮）
└── HistoryDrawer（底部上滑历史抽屉）
```

### 移除的文件

- `pages/dice/free-mode.vue` — 功能合并入 dice.vue
- `pages/dice/cup-mode.vue` — 功能合并入 dice.vue

### 修改的文件

- `pages/dice/dice.vue` — 重写为统一多面骰界面
- `stores/dice.js` — 扩展状态（selectedType, diceCount, history）
- `composables/useDiceRoll.js` — 重构支持多面骰
- `utils/dice-constants.js` — 扩展多面骰常量定义

### 新增的文件

- `utils/dice-engine.js` — 骰子引擎（Mersenne Twister RNG + 多面骰掷骰逻辑）

## 数据模型

### 骰型定义

```javascript
const DICE_TYPES = [
  { sides: 4,   label: 'D4',   icon: '▲',  clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' },
  { sides: 6,   label: 'D6',   icon: '⬡',  clipPath: null },  // D6 用 3D 立方体
  { sides: 8,   label: 'D8',   icon: '◆',  clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' },
  { sides: 10,  label: 'D10',  icon: '⬠',  clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' },
  { sides: 12,  label: 'D12',  icon: '⬡',  clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)' },
  { sides: 20,  label: 'D20',  icon: '⬠',  clipPath: 'polygon(50% 0%, 97% 35%, 79% 91%, 21% 91%, 3% 35%)' },
  { sides: 100, label: 'D100', icon: '%',  clipPath: 'circle(50%)' }
]
```

### 投掷历史记录

```javascript
{
  id: Number,          // Date.now() 作为唯一标识
  diceType: String,   // 'D4' | 'D6' | ... | 'D100'
  count: Number,      // 骰子数量
  results: Number[],  // 每个骰子的结果值
  sum: Number,        // 总和
  max: Number,        // 最大值
  min: Number,        // 最小值
  timestamp: Number   // 投掷时间戳
}
```

## Store 扩展 (stores/dice.js)

### 新增状态

| 状态 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| selectedType | String | 'D6' | 当前骰型 |
| diceCount | Number | 1 | 骰子数量 (1-20) |
| history | Array | [] | 投掷历史 (最多 200 条) |

### 新增方法

| 方法 | 说明 |
|------|------|
| setSelectedType(type) | 切换骰型 |
| setDiceCount(n) | 设置骰子数量 (1-20) |
| addHistory(record) | 添加历史记录，超过 200 条时删除最旧的 |
| clearHistory() | 清空历史 |
| getHistoryByType(type) | 按骰型筛选历史 |

### 持久化

扩展 STORAGE_KEY 保存内容，新增 selectedType、diceCount、history 字段。

## 骰子引擎 (utils/dice-engine.js)

### Mersenne Twister RNG

移植 rpg-dice-roller 的 Mersenne Twister 实现，替换 Math.random()，确保：
- 可复现性（支持种子）
- 均匀分布
- 长周期 (2^19937-1)

### 掷骰核心

```javascript
function rollDice(sides, count) → { results: Number[], sum: Number, max: Number, min: Number }
```

- sides: 骰子面数 (4/6/8/10/12/20/100)
- count: 骰子数量
- 返回结果对象

## UI 详细设计

### 骰型选择器

- 水平滚动芯片组，玻璃态样式 (glass-card)
- 每个芯片：骰型标签 + 小图标
- 选中态：accent 色背景 + 白色文字
- 未选中态：透明背景 + 次要文字色
- 最小触控尺寸 44px

### 骰子展示区

布局策略：
- 1-3 颗：水平居中排列
- 4-6 颗：2 行网格
- 7+ 颗：3 行网格 + 可滚动

D6 渲染（保留现有 3D 立方体）：
- CSS transform-style: preserve-3d
- 六面 rotateX/Y + translateZ
- 点数用绝对定位圆点

其他骰型渲染（2D 多边形 + 数字）：
- clip-path 定义多边形轮廓
- 数字居中显示
- 翻转动画：perspective + rotateX 过渡 (0.6-0.9s)
- 摇骰中数字快速切换（80ms 间隔）

### 结果统计栏

- 玻璃态卡片 (glass-card)
- 水平三栏：总和（大号加粗）/ 最大值 / 最小值
- 摇骰中显示 "..." 占位
- 结果变化时 spring-pop 动画

### 数量调节 + 摇骰按钮

- 左侧步进器：`[-]` 数字 `[+]`
  - 范围 1-20
  - 长按 +/- 连续调节
  - 玻璃态按钮样式
- 右侧摇骰按钮：
  - accent 色主按钮 (gbtn-primary)
  - 摇骰中禁用 + 加载态
  - 支持摇一摇触发

### 历史抽屉

- 触发：NavBar 右侧历史按钮
- 从底部上滑，半屏高度
- 遮罩层：rgba(0,0,0,0.5) + blur
- 内容：
  - 顶部标题 "投掷历史" + 清空按钮
  - 筛选栏：骰型标签筛选（全部/D4/D6/...）
  - 记录列表：每条显示骰型+数量+结果+时间
  - 左滑删除单条
- 最多保留 200 条记录
- 空状态提示 "还没有投掷记录"

## 交互反馈

| 场景 | 视觉反馈 | 触觉反馈 |
|------|----------|----------|
| 点击骰型芯片 | 选中态切换 | vibrateShort(light) |
| 点击+/-按钮 | 数字变化 + scale 动画 | vibrateShort(light) |
| 点击摇骰 | 骰子翻转动画 | vibrateShort(medium) |
| 骰子翻转中 | 数字快速切换 | vibrateShort(light) 逐颗 |
| 结果锁定 | spring-pop 高亮 | vibrateShort(medium) |
| 摇一摇 | 同点击摇骰 | vibrateShort(medium) |
| 打开历史抽屉 | 底部上滑 | 无 |

## 兼容性

- 3D 支持：检测 transform-style: preserve-3d，不支持时 D6 降级为 2D
- backdrop-filter：检测支持情况，不支持时降级为不透明背景
- requestAnimationFrame：try/catch 安全检测，不可用时降级为 setTimeout
- 所有尺寸单位使用 rpx，确保跨设备适配

## 不在本期范围

- 音效系统（预留 soundEnabled 开关，后续实现）
- 骰子表达式解析器（如 "2D6+1D8"）
- 修饰符系统（爆炸/保留/重掷）
- 云端同步
