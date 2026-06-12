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

export const SECTOR_COLORS = [
	'#CE93D8', '#90CAF9', '#80DEEA', '#A5D6A7',
	'#FFE082', '#FFAB91', '#EF9A9A', '#F48FB1'
]

export const useRouletteStore = defineStore('roulette', () => {
	const sectors = ref(JSON.parse(JSON.stringify(DEFAULT_SECTORS)))
	const editMode = ref(false)
	const nextId = ref(9)

	const sectorCount = computed(() => sectors.value.length)
	const sectorAngle = computed(() => 360 / sectorCount.value)

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

	return {
		sectors, editMode, sectorCount, sectorAngle, nextId,
		addSector, updateSector, removeSector, resetDefaults, toggleEdit
	}
})
