// composables/useVibrate.js
// 统一震动反馈入口，兼容 uni-app 与 Web 环境
export function useVibrate() {
	const tap = () => {
		try {
			uni.vibrateShort?.({ type: 'light' })
		} catch (e) {
			// 静默失败
		}
	}

	const medium = () => {
		try {
			uni.vibrateShort?.({ type: 'medium' })
		} catch (e) {}
	}

	const long = () => {
		try {
			uni.vibrateLong?.()
		} catch (e) {}
	}

	return { tap, medium, long }
}
