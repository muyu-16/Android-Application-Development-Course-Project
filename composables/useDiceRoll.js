/**
 * useDiceRoll — 通用摇骰逻辑 composable
 * 支持 D4~D100 全类型骰子
 * D6: 3D 立方体旋转
 * 其他: 3D Token 翻转动画（多轴旋转 + 边缘厚度）
 */
import { ref, computed } from 'vue'
import { rollDice } from '@/utils/dice-engine'
import { FACE_OFFSET } from '@/utils/dice-constants'

export function useDiceRoll(options = {}) {
	const { sides, count, vibrateEnabled, vibrate } = options

	const values = ref(Array(count.value).fill(1))
	const rolling = ref(false)
	const rotX = ref(Array(count.value).fill(0))
	const rotY = ref(Array(count.value).fill(0))
	const rotZ = ref(Array(count.value).fill(0))
	const trans = ref(Array(count.value).fill('none'))
	const flipping = ref(Array(count.value).fill(false))
	const bouncing = ref(Array(count.value).fill(''))

	// 当前骰型是否为 D6（3D 立方体渲染）
	const isD6 = computed(() => sides.value === 6)

	const resetAnimState = (n) => {
		rotX.value = Array(n).fill(0)
		rotY.value = Array(n).fill(0)
		rotZ.value = Array(n).fill(0)
		trans.value = Array(n).fill('none')
		flipping.value = Array(n).fill(false)
		bouncing.value = Array(n).fill('')
	}

	// 同步骰子数量变化
	const syncCount = (n) => {
		values.value = Array(n).fill(isD6.value ? 1 : 0)
		resetAnimState(n)
	}

	// 核心摇骰
	const roll = () => {
		if (rolling.value) return false
		rolling.value = true
		if (vibrateEnabled?.value && vibrate) vibrate.medium()

		const result = rollDice(sides.value, count.value)
		const results = result.results

		for (let i = 0; i < count.value; i++) {
			setTimeout(() => rollSingle(i, results[i]), i * 150)
		}

		const totalDuration = count.value * 150 + 1400
		setTimeout(() => {
			rolling.value = false
			values.value = [...results]
			for (let i = 0; i < count.value; i++) {
				flipping.value[i] = false
				bouncing.value[i] = ''
				// 非 D6 骰子动画结束后归零旋转，确保正面水平清晰
				if (!isD6.value) {
					rotX.value[i] = 0
					rotY.value[i] = 0
					rotZ.value[i] = 0
					trans.value[i] = 'transform 0.35s ease-out'
				}
			}
		}, totalDuration)

		return result
	}

	const rollSingle = (index, targetValue) => {
		trans.value[index] = 'none'
		rotX.value[index] = 0
		rotY.value[index] = 0
		rotZ.value[index] = 0
		flipping.value[index] = true
		bouncing.value[index] = ''

		// 翻转中数字快速切换
		const flipId = setInterval(() => {
			if (!flipping.value[index]) { clearInterval(flipId); return }
			const tmp = [...values.value]
			tmp[index] = Math.floor(Math.random() * sides.value) + 1
			values.value = tmp
		}, 80)

		setTimeout(() => clearInterval(flipId), 1500)

		if (isD6.value) {
			// D6: 3D 立方体旋转
			const spins = 1 + Math.floor(Math.random() * 3)
			const offset = FACE_OFFSET[targetValue]
			const endX = spins * 360 + offset.x
			const endY = spins * 360 + offset.y
			const duration = 0.6 + Math.random() * 0.3
			trans.value[index] = 'transform ' + duration + 's cubic-bezier(0.05, 0.7, 0.1, 1.0)'
			rotX.value[index] = endX
			rotY.value[index] = endY
		} else {
			// 多面骰: 3D Token 多轴翻转动画
			const duration = 0.8 + Math.random() * 0.4
			trans.value[index] = 'transform ' + duration + 's cubic-bezier(0.05, 0.7, 0.1, 1.0)'
			rotX.value[index] = 720 + Math.random() * 720
			rotY.value[index] = 720 + Math.random() * 720
			rotZ.value[index] = 360 + Math.random() * 360
		}

		setTimeout(() => bouncing.value[index] = 'bounce-settle 0.3s ease-out 0.05s both', 30)
		if (vibrateEnabled?.value && vibrate) vibrate.tap()
	}

	const totalSum = computed(() => values.value.reduce((s, v) => s + v, 0))
	const maxVal = computed(() => values.value.length ? Math.max(...values.value) : 0)
	const minVal = computed(() => values.value.length ? Math.min(...values.value) : 0)

	return {
		values, rolling, rotX, rotY, rotZ, trans, flipping, bouncing,
		isD6,
		totalSum, maxVal, minVal,
		roll, rollSingle, syncCount, resetAnimState
	}
}
