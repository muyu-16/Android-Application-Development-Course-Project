/**
 * useDiceRoll — 通用摇骰逻辑 composable
 * 供 free-mode / cup-mode 等骰子页面共用
 */
import { ref, computed } from 'vue'
import { FACE_OFFSET } from '@/utils/dice-constants'

export function useDiceRoll(options = {}) {
	const { count, vibrateEnabled, vibrate } = options

	const values = ref(Array(count.value).fill(1))
	const rolling = ref(false)
	const rotX = ref(Array(count.value).fill(0))
	const rotY = ref(Array(count.value).fill(0))
	const trans = ref(Array(count.value).fill('none'))
	const flipping = ref(Array(count.value).fill(false))
	const bouncing = ref(Array(count.value).fill(''))

	const resetAnimState = (n) => {
		rotX.value = Array(n).fill(0)
		rotY.value = Array(n).fill(0)
		trans.value = Array(n).fill('none')
		flipping.value = Array(n).fill(false)
		bouncing.value = Array(n).fill('')
	}

	// 同步骰子数量变化
	const syncCount = (n) => {
		values.value = Array(n).fill(1)
		resetAnimState(n)
	}

	// 核心摇骰
	const roll = () => {
		if (rolling.value) return false
		rolling.value = true
		if (vibrateEnabled?.value && vibrate) vibrate.medium()

		const results = []
		for (let i = 0; i < count.value; i++) {
			results.push(Math.floor(Math.random() * 6) + 1)
		}

		for (let i = 0; i < count.value; i++) {
			setTimeout(() => rollSingle(i, results[i]), i * 150)
		}

		const totalDuration = count.value * 150 + 1100
		setTimeout(() => {
			rolling.value = false
			values.value = [...results]
			for (let i = 0; i < count.value; i++) {
				flipping.value[i] = false
				bouncing.value[i] = ''
			}
		}, totalDuration)

		return results
	}

	const rollSingle = (index, targetValue) => {
		trans.value[index] = 'none'
		rotX.value[index] = 0
		rotY.value[index] = 0
		flipping.value[index] = true
		bouncing.value[index] = ''

		const flipId = setInterval(() => {
			if (!flipping.value[index]) { clearInterval(flipId); return }
			const tmp = [...values.value]
			tmp[index] = Math.floor(Math.random() * 6) + 1
			values.value = tmp
		}, 80)

		setTimeout(() => clearInterval(flipId), 1500)

		const spins = 1 + Math.floor(Math.random() * 3)
		const offset = FACE_OFFSET[targetValue]
		const endX = spins * 360 + offset.x
		const endY = spins * 360 + offset.y
		const duration = 0.6 + Math.random() * 0.3
		trans.value[index] = 'transform ' + duration + 's cubic-bezier(0.05, 0.7, 0.1, 1.0)'
		rotX.value[index] = endX
		rotY.value[index] = endY
		setTimeout(() => bouncing.value[index] = 'bounce-settle 0.3s ease-out 0.05s both', 30)
		if (vibrateEnabled?.value && vibrate) vibrate.tap()
	}

	const totalSum = computed(() => values.value.reduce((s, v) => s + v, 0))

	return {
		values, rolling, rotX, rotY, trans, flipping, bouncing,
		totalSum, roll, rollSingle, syncCount, resetAnimState
	}
}
