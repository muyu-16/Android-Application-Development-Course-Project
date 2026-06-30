# PartyGlass

基于 Vue 3 + uni-app 的移动端派对游戏集合，采用毛玻璃 (Glassmorphism) 设计语言，支持 H5 / Android 多端运行。

## 功能模块

| 模块 | 说明 |
|------|------|
| **骰子** | CSS 3D 立方体骰子，支持 1-20 颗同时投掷，摇一摇触发，实时统计总和/最大/最小值，投掷历史记录 |
| **轮盘** | 自定义选项转盘，rAF 驱动三段式物理减速动画（匀速 → 快减速 → 弹跳微调），支持编辑/添加/删除扇区 |
| **真心话大冒险** | 5 级强度题目库，转盘抽取玩家，答案揭晓动画，自定义题目导入，历史统计 |
| **猜拳** | 人机对战 / 双人对战两种模式，支持 3 局 2 胜 / 5 局 3 胜，倒计时出拳，比分弹跳动效 |
| **筹码记账** | 多人筹码管理，成员/流水/结算三栏切换，筹码转账，快捷加减，批量操作，多选模式 |

## 技术栈

- **框架**: Vue 3 (Composition API) + uni-app
- **状态管理**: Pinia
- **动画**: GSAP 3.15、CSS 3D Transform、requestAnimationFrame 物理动画
- **UI 设计**: 毛玻璃材质系统 (G1/G2/G3 三层)、Material Design 3 色彩体系
- **图标**: Material Icons (多 CDN 源，含国内降级)
- **依赖**: 仅 `gsap` 和 `vue-wheel-spinner`，零其他运行时依赖

## 设计系统

### 毛玻璃材质

| 层级 | 用途 | 模糊度 | 透明度 |
|------|------|--------|--------|
| G1 | 装饰层（背景氛围、光晕） | blur(24px) | 50% |
| G2 | 卡片层（列表行、功能卡） | blur(16px) | 75% |
| G3 | 浮层（弹窗、sheet、toast） | blur(24px) | 88% |

### 主题

支持亮色 / 暗色 / 跟随系统三种模式，通过 `data-theme` 属性切换。所有颜色、阴影、玻璃材质均通过 CSS Custom Properties 实现主题响应。

### 无障碍

- 文字对比度符合 WCAG AA 标准（亮色 4.5:1，暗色 7:1）
- 触控最小尺寸 44px
- 支持 `prefers-reduced-motion` 减少动画
- 中文字体栈覆盖 PingFang SC / Microsoft YaHei / Noto Sans CJK SC 等

## 项目结构

```
├── App.vue                 # 全局样式（设计系统、玻璃材质、工具类）
├── main.js                 # 入口（Pinia 初始化、主题解析）
├── pages.json              # 路由配置
├── manifest.json           # uni-app 应用配置
├── pages/
│   ├── index/index.vue     # 主页（底部 Tab 导航）
│   ├── dice/dice.vue       # 骰子
│   ├── roulette/roulette.vue # 轮盘
│   ├── truth/truth.vue     # 真心话大冒险
│   ├── rps/rps.vue         # 猜拳
│   └── chip/chip.vue       # 筹码记账
├── components/
│   └── NavBar.vue          # 统一导航栏组件
├── composables/
│   ├── useDiceRoll.js      # 骰子投掷逻辑
│   ├── useShake.js         # 摇一摇检测
│   ├── useThemeAware.js    # 主题感知
│   └── useVibrate.js       # 振动反馈
├── stores/
│   ├── theme.js            # 主题状态
│   ├── dice.js             # 骰子状态
│   ├── roulette.js         # 轮盘状态
│   ├── questions.js        # 真心话题库
│   └── chip.js             # 筹码状态
└── utils/
    ├── dice-constants.js   # 骰子面位置常量
    └── dice-engine.js      # 骰子引擎
```

## 快速开始

```bash
# 安装依赖
npm install

# H5 开发
npm run dev

# 构建
npm run build
```

## 组件库

项目内置 4 个毛玻璃 UI 组件，通过 easycom 自动注册（无需 import）：

```vue
<GlassButton text="开始游戏" variant="primary" @tap="onStart" />
<SegmentedControl :items="['A','B','C']" v-model="active" />
<GlassCard level="g2" interactive @tap="onTap">卡片内容</GlassCard>
<FabButton icon="add" :badge="3" @tap="onAdd" />
```

## License

MIT
