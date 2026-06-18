// composables/useShake.js
// 加速度感应：检测摇一摇动作并触发回调
// threshold 越小越灵敏
export function useShake(options = {}) {
	const { threshold = 1.8, cooldown = 800, onShake } = options

	let lastX = 0, lastY = 0, lastZ = 0
	let lastTime = 0
	let primed = false
	let running = false

	const handler = (e) => {
		if (!running) return
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

	const start = () => {
		if (running) return
		running = true
		uni.onAccelerometerChange?.(handler)
	}

	const stop = () => {
		running = false
		uni.offAccelerometerChange?.(handler)
	}

	return { start, stop }
}
