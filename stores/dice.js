// stores/dice.js
// 骰子模块状态管理：骰型选择、数量、历史记录、反馈开关
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { rollDice } from '@/utils/dice-engine'

const STORAGE_KEY = 'partyglass_dice'
const MAX_HISTORY = 200

function loadPersisted() {
	try {
		const raw = uni.getStorageSync(STORAGE_KEY)
		if (raw) return JSON.parse(raw)
	} catch (e) {}
	return null
}

export const useDiceStore = defineStore('dice', () => {
	const saved = loadPersisted() || {}

	// ── 骰型与数量 ──
	const selectedType = ref(saved.selectedType || 'D6')
	const diceCount = ref(saved.diceCount || 1)

	// ── 反馈开关 ──
	const vibrateEnabled = ref(saved.vibrateEnabled ?? true)
	const soundEnabled = ref(saved.soundEnabled ?? false)

	// ── 投掷历史 ──
	const history = ref(saved.history || [])

	// ── 持久化 ──
	const persist = () => {
		try {
			uni.setStorageSync(STORAGE_KEY, JSON.stringify({
				selectedType: selectedType.value,
				diceCount: diceCount.value,
				vibrateEnabled: vibrateEnabled.value,
				soundEnabled: soundEnabled.value,
				history: history.value.slice(0, MAX_HISTORY)
			}))
		} catch (e) {}
	}

	// ── 骰型切换 ──
	const setSelectedType = (type) => {
		selectedType.value = type
		persist()
	}

	// ── 数量调节 (1-20) ──
	const setDiceCount = (n) => {
		diceCount.value = Math.max(1, Math.min(20, n))
		persist()
	}

	// ── 反馈开关 ──
	const toggleVibrate = () => {
		vibrateEnabled.value = !vibrateEnabled.value
		persist()
	}

	const toggleSound = () => {
		soundEnabled.value = !soundEnabled.value
		persist()
	}

	// ── 历史管理 ──
	const addHistory = (record) => {
		history.value.unshift(record)
		if (history.value.length > MAX_HISTORY) {
			history.value = history.value.slice(0, MAX_HISTORY)
		}
		persist()
	}

	const clearHistory = () => {
		history.value = []
		persist()
	}

	const getHistoryByType = (type) => {
		if (!type || type === 'ALL') return history.value
		return history.value.filter(r => r.diceType === type)
	}

	// ── 兼容旧代码 ──
	const freeCount = computed(() => diceCount.value)
	const cupCount = ref(saved.cupCount || 5)
	const setFreeCount = (n) => setDiceCount(n)
	const setCupCount = (n) => {
		cupCount.value = Math.max(3, Math.min(6, n))
		persist()
	}

	return {
		selectedType,
		diceCount,
		vibrateEnabled,
		soundEnabled,
		history,
		setSelectedType,
		setDiceCount,
		toggleVibrate,
		toggleSound,
		addHistory,
		clearHistory,
		getHistoryByType,
		// 兼容旧代码
		freeCount,
		cupCount,
		setFreeCount,
		setCupCount
	}
})
