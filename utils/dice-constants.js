/**
 * 骰子公共常量 — DOTS / CUBE_FACES / FACE_OFFSET / CUP_LAYOUTS
 * 供 free-mode / cup-mode 等骰子页面共用
 */

// 标准骰面点数位置（归一化坐标 -1/0/1）
export const DOTS = {
	1: [[0, 0]],
	2: [[-1, -1], [1, 1]],
	3: [[-1, -1], [0, 0], [1, 1]],
	4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
	5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
	6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]]
}

// 3D 骰子六面变换（free-mode 使用）
export const CUBE_FACES = [
	{ num: 1, transform: 'rotateY(0deg) translateZ(56px) scale(1.04)' },
	{ num: 2, transform: 'rotateX(90deg) translateZ(56px) scale(1.04)' },
	{ num: 3, transform: 'rotateY(-90deg) translateZ(56px) scale(1.04)' },
	{ num: 4, transform: 'rotateY(90deg) translateZ(56px) scale(1.04)' },
	{ num: 5, transform: 'rotateX(-90deg) translateZ(56px) scale(1.04)' },
	{ num: 6, transform: 'rotateX(180deg) translateZ(56px) scale(1.04)' }
]

// 点数 → 3D 旋转角度（free-mode 使用）
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
