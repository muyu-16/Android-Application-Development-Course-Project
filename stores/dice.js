// stores/dice.js
// 骰子模块设置持久化：自由摇骰数量、大话骰数量、震动/音效开关
import { defineStore } from 'pinia'
import { ref } from 'vue'

const STORAGE_KEY = 'partyglass_dice'

function loadPersisted() {
	try {
		const raw = uni.getStorageSync(STORAGE_KEY)
		if (raw) return JSON.parse(raw)
	} catch (e) {}
	return null
}

export const useDiceStore = defineStore('dice', () => {
	const saved = loadPersisted() || {}

	// 自由摇骰：1-6，默认 1
	const freeCount = ref(saved.freeCount || 1)

	// 大话骰遮罩：3-6，默认 5
	const cupCount = ref(saved.cupCount || 5)

	// 反馈开关
	const vibrateEnabled = ref(saved.vibrateEnabled ?? true)
	const soundEnabled = ref(saved.soundEnabled ?? false)

	const persist = () => {
		try {
			uni.setStorageSync(STORAGE_KEY, JSON.stringify({
				freeCount: freeCount.value,
				cupCount: cupCount.value,
				vibrateEnabled: vibrateEnabled.value,
				soundEnabled: soundEnabled.value
			}))
		} catch (e) {}
	}

	const setFreeCount = (n) => {
		freeCount.value = Math.max(1, Math.min(6, n))
		persist()
	}

	const setCupCount = (n) => {
		cupCount.value = Math.max(3, Math.min(6, n))
		persist()
	}

	const toggleVibrate = () => {
		vibrateEnabled.value = !vibrateEnabled.value
		persist()
	}

	const toggleSound = () => {
		soundEnabled.value = !soundEnabled.value
		persist()
	}

	return {
		freeCount,
		cupCount,
		vibrateEnabled,
		soundEnabled,
		setFreeCount,
		setCupCount,
		toggleVibrate,
		toggleSound
	}
})
