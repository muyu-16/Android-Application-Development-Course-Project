import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STORAGE_KEY = 'partyglass_chip'

function loadPersisted() {
	try {
		const raw = uni.getStorageSync(STORAGE_KEY)
		if (raw) return JSON.parse(raw)
	} catch (e) {}
	return null
}

export const useChipStore = defineStore('chip', () => {
	const saved = loadPersisted()

	// ─── 状态 ───
	const players = ref(saved?.players || [
		{ id: 1, name: '玩家1', avatar: 'face', balance: 1000 },
		{ id: 2, name: '玩家2', avatar: 'face_2', balance: 1000 },
		{ id: 3, name: '玩家3', avatar: 'face_3', balance: 1000 },
		{ id: 4, name: '玩家4', avatar: 'face_4', balance: 1000 }
	])
	const transactions = ref(saved?.transactions || [])
	const nextPlayerId = ref(saved?.nextPlayerId || 5)

	// ─── 计算 ───
	const totalBalance = computed(() =>
		players.value.reduce((s, p) => s + p.balance, 0)
	)

	const sortedPlayers = computed(() =>
		[...players.value].sort((a, b) => b.balance - a.balance)
	)

	const recentTransactions = computed(() =>
		[...transactions.value].reverse().slice(0, 50)
	)

	// 最优结算（贪心算法 - 最少转账笔数）
	const settlements = computed(() => {
		const debts = players.value
			.map(p => ({ id: p.id, name: p.name, net: p.balance - 1000 }))
			.filter(d => Math.abs(d.net) > 1)
			.sort((a, b) => b.net - a.net)

		const result = []
		let i = 0, j = debts.length - 1
		while (i < j) {
			const credit = debts[i]  // 应收
			const debit = debts[j]   // 应付
			const amount = Math.min(credit.net, -debit.net)
			result.push({
				from: debit.name,
				fromId: debit.id,
				to: credit.name,
				toId: credit.id,
				amount: Math.round(amount)
			})
			credit.net -= amount
			debit.net += amount
			if (Math.abs(credit.net) <= 1) i++
			if (Math.abs(debit.net) <= 1) j--
		}
		return result.sort((a, b) => b.amount - a.amount)
	})

	// ─── 方法 ───
	function persist() {
		try {
			uni.setStorageSync(STORAGE_KEY, {
				players: players.value,
				transactions: transactions.value,
				nextPlayerId: nextPlayerId.value
			})
		} catch (e) {}
	}

	function addPlayer(name) {
		const id = nextPlayerId.value++
		players.value.push({ id, name: name || `玩家${id}`, avatar: 'face', balance: 1000 })
		persist()
		return id
	}

	function removePlayer(id) {
		if (players.value.length <= 2) return false
		players.value = players.value.filter(p => p.id !== id)
		persist()
		return true
	}

	function transfer(fromId, toId, amount, note = '') {
		if (amount <= 0) return false
		const from = players.value.find(p => p.id === fromId)
		const to = players.value.find(p => p.id === toId)
		if (!from || !to || from.balance < amount) return false

		from.balance -= amount
		to.balance += amount

		transactions.value.push({
			id: Date.now(),
			from: from.name,
			fromId,
			to: to.name,
			toId,
			amount,
			note: note || '转账',
			timestamp: Date.now()
		})
		persist()
		return true
	}

	function quickAdjust(id, delta) {
		const p = players.value.find(x => x.id === id)
		if (!p) return
		p.balance += delta
		transactions.value.push({
			id: Date.now(),
			from: delta > 0 ? '系统' : p.name,
			fromId: delta > 0 ? 0 : id,
			to: delta < 0 ? '系统' : p.name,
			toId: delta < 0 ? 0 : id,
			amount: Math.abs(delta),
			note: delta > 0 ? '收入' : '支出',
			timestamp: Date.now()
		})
		persist()
	}

	function resetAll() {
		players.value.forEach(p => { p.balance = 1000 })
		transactions.value = []
		persist()
	}

	return {
		players, transactions, nextPlayerId,
		totalBalance, sortedPlayers, recentTransactions, settlements,
		addPlayer, removePlayer, transfer, quickAdjust, resetAll, persist
	}
})
