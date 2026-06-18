// composables/useShake.js
// 加速度感应：检测摇一摇动作并触发回调
// 灵敏度：low(2.5) / medium(1.8) / high(1.2) 数字越小越灵敏
export function useShake(options = {}) {
	const { threshold = 1.8, cooldown = 800, onShake } = options

	let lastX = 0, lastY = 0, lastZ = 0
	let lastTime = 0
	let primed = false
	let handle = null

	const start = () => {
		uni.onAccelerometerChange?.(handler)
	}

	const stop = () => {
		uni.offAccelerometerChange?.(handler)
	}

	const handler = (e) => {
		const { x = 0, y = 0, z = 0 } = e || {}
		const now = Date.now()
		if (now - lastTime < cooldown) return

		if (!primed) {
			lastX = x; lastY = y; lastZ = z
			primed = true
			lastTime = now
			return
		}

		const delta = Math.abs(x - lastX) + Math.abs(y - lastY) + Math.abs(z - lastZ)
		if (delta > threshold) {
			primed = false
			lastTime = now
			onShake?.()
		}
		lastX = x; lastY = y; lastZ = z
	}

	return { start, stop }
}
