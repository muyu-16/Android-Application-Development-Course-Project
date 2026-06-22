/**
 * 骰子公共常量
 * 供 dice.vue / useDiceRoll 等骰子模块共用
 */

// ══════════════════════════════════════
// 多面骰类型定义
// ══════════════════════════════════════
export const DICE_TYPES = [
	{ sides: 4,   label: 'D4',   icon: '\u25B2',  clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)', depth: 10 },
	{ sides: 6,   label: 'D6',   icon: '\u2B21',  clipPath: null, depth: null },
	{ sides: 8,   label: 'D8',   icon: '\u25C6',  clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', depth: 10 },
	{ sides: 10,  label: 'D10',  icon: '\u2B20',  clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)', depth: 10 },
	{ sides: 12,  label: 'D12',  icon: '\u2B21',  clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)', depth: 12 },
	{ sides: 20,  label: 'D20',  icon: '\u2B20',  clipPath: 'polygon(50% 0%, 97% 35%, 79% 91%, 21% 91%, 3% 35%)', depth: 12 },
	{ sides: 100, label: 'D100', icon: '%',        clipPath: 'circle(50%)', depth: 8 }
]

// 根据 label 获取骰型定义
export const getDiceType = (label) => DICE_TYPES.find(d => d.label === label) || DICE_TYPES[1]

// ══════════════════════════════════════
// D6 专属常量（3D 立方体渲染）
// ══════════════════════════════════════

// 标准骰面点数位置（归一化坐标 -1/0/1）
export const DOTS = {
	1: [[0, 0]],
	2: [[-1, -1], [1, 1]],
	3: [[-1, -1], [0, 0], [1, 1]],
	4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
	5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
	6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]]
}

// 3D 骰子六面变换
export const CUBE_FACES = [
	{ num: 1, transform: 'rotateY(0deg) translateZ(56px) scale(1.04)' },
	{ num: 2, transform: 'rotateX(90deg) translateZ(56px) scale(1.04)' },
	{ num: 3, transform: 'rotateY(-90deg) translateZ(56px) scale(1.04)' },
	{ num: 4, transform: 'rotateY(90deg) translateZ(56px) scale(1.04)' },
	{ num: 5, transform: 'rotateX(-90deg) translateZ(56px) scale(1.04)' },
	{ num: 6, transform: 'rotateX(180deg) translateZ(56px) scale(1.04)' }
]

// 点数 → 3D 旋转角度
export const FACE_OFFSET = {
	1: { x: 0, y: 0 },
	2: { x: -90, y: 0 },
	3: { x: 0, y: 90 },
	4: { x: 0, y: -90 },
	5: { x: 90, y: 0 },
	6: { x: 180, y: 0 }
}

// 大话骰散落布局（相对于圆心偏移，单位 rpx）
export const CUP_LAYOUTS = {
	3: [[0, -48], [-56, 36], [56, 36]],
	4: [[-44, -44], [44, -44], [-44, 44], [44, 44]],
	5: [[0, -66], [-62, -20], [-40, 54], [40, 54], [62, -20]],
	6: [[-50, -56], [0, -62], [50, -56], [-50, 50], [0, 56], [50, 50]]
}
