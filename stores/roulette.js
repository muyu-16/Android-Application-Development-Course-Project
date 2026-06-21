import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const DEFAULT_SECTORS = [
	{ id: 1, label: '选项 1' },
	{ id: 2, label: '选项 2' },
	{ id: 3, label: '选项 3' },
	{ id: 4, label: '选项 4' },
	{ id: 5, label: '选项 5' },
	{ id: 6, label: '选项 6' },
	{ id: 7, label: '选项 7' },
	{ id: 8, label: '选项 8' }
]

// vue-wheel-spinner Demo 配色
export const SECTOR_COLORS = [
	'#eb4d4b', '#f0932b', '#f9ca24', '#badc58',
	'#7ed6df', '#e056fd', '#ff6b81', '#f8a5c2',
	'#63cdda', '#cf6a87', '#e77f67', '#786fa6'
]

// vue-wheel-spinner Demo 文字色：与官方 Demo 精确匹配，交替黑白
// 官方 Demo: Slice 1=#000000, Slice 2=#ffffff, Slice 3=#000000, Slice 4=#ffffff...
export const SECTOR_TEXT_COLORS = [
	'#000000', '#ffffff', '#000000', '#ffffff',
	'#000000', '#ffffff', '#000000', '#ffffff',
	'#000000', '#ffffff', '#000000', '#ffffff'
]

// 预设模板
export const PRESETS = [
	{
		name: '决定吃什么',
		emoji: '🍜',
		items: ['火锅', '烧烤', '日料', '西餐', '麻辣烫', '炸鸡', '面馆', '自助餐']
	},
	{
		name: '真心话大冒险',
		emoji: '🔥',
		items: ['真心话', '大冒险', '真心话', '大冒险', '真心话', '大冒险']
	},
	{
		name: '谁先来',
		emoji: '👆',
		items: ['玩家1', '玩家2', '玩家3', '玩家4']
	},
	{
		name: '是或否',
		emoji: '✅',
		items: ['是', '否']
	},
	{
		name: '数字1-6',
		emoji: '🎲',
		items: ['1', '2', '3', '4', '5', '6']
	}
]

export const useRouletteStore = defineStore('roulette', () => {
	const sectors = ref(JSON.parse(JSON.stringify(DEFAULT_SECTORS)))
	const editMode = ref(false)
	const nextId = ref(9)
	const history = ref([])

	const sectorCount = computed(() => sectors.value.length)
	const sectorAngle = computed(() => 360 / sectorCount.value)
	const presets = computed(() => PRESETS)

	// vue-wheel-spinner 兼容的 slices 格式
	const slices = computed(() =>
		sectors.value.map((sec, i) => ({
			color: SECTOR_COLORS[i % SECTOR_COLORS.length],
			text: sec.label,
			textColor: SECTOR_TEXT_COLORS[i % SECTOR_TEXT_COLORS.length]
		}))
	)

	function addSector(label) {
		if (sectorCount.value >= 12) return false
		sectors.value.push({ id: nextId.value++, label: label || `选项 ${nextId.value}` })
		return true
	}

	function updateSector(id, label) {
		const s = sectors.value.find(x => x.id === id)
		if (s) s.label = label
	}

	function removeSector(id) {
		if (sectorCount.value <= 2) return false
		sectors.value = sectors.value.filter(x => x.id !== id)
		return true
	}

	function resetDefaults() {
		sectors.value = JSON.parse(JSON.stringify(DEFAULT_SECTORS))
		nextId.value = 9
	}

	function toggleEdit() {
		editMode.value = !editMode.value
	}

	function applyPreset(preset) {
		sectors.value = preset.items.map((label, i) => ({
			id: nextId.value++,
			label
		}))
	}

	function addHistory(label) {
		history.value.unshift(label)
		if (history.value.length > 20) {
			history.value = history.value.slice(0, 20)
		}
	}

	function clearHistory() {
		history.value = []
	}

	return {
		sectors, editMode, nextId, history,
		sectorCount, sectorAngle, presets, slices,
		addSector, updateSector, removeSector,
		resetDefaults, toggleEdit, applyPreset,
		addHistory, clearHistory, SECTOR_TEXT_COLORS
	}
})
