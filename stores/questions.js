import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// ─── 问题库：按强度 1-5 分级 ───
const TRUTH_BANK = {
	1: [
		'你最喜欢什么颜色？',
		'你早餐通常吃什么？',
		'你最近看过的一部电影是什么？',
		'你养过宠物吗？叫什么名字？',
		'你最想去哪个城市旅行？'
	],
	2: [
		'你最近一次说谎是什么时候？',
		'你最喜欢的歌手是谁？',
		'你小时候的梦想是什么？',
		'你最拿手的一道菜是什么？',
		'你手机里最常用的 app 是什么？'
	],
	3: [
		'你暗恋过在座的谁吗？',
		'你做过的最大胆的事是什么？',
		'你最害怕什么？',
		'你小时候做过的最后悔的事？',
		'你觉得自己最大的缺点是什么？'
	],
	4: [
		'你偷偷做过最糗的事是什么？',
		'你上一次哭是什么时候？为什么？',
		'你最想和谁交换人生一天？',
		'你做过最叛逆的一件事？',
		'最让你尴尬的一次经历？'
	],
	5: [
		'你心底最大的秘密是什么？挑了就别后悔！',
		'你手机里最不想给人看的东西是什么？',
		'你做过最疯狂的事是什么？',
		'你有过最让你后悔的一段关系吗？',
		'如果明天是世界末日，你最想做什么？'
	]
}

const DARE_BANK = {
	1: [
		'模仿一个在场的人，让大家猜是谁',
		'学一种动物叫 5 秒钟',
		'用搞笑的表情拍一张自拍',
		'对着镜子说 3 遍"我最棒"',
		'站起来转一圈再坐下'
	],
	2: [
		'用最夸张的语气说"我是最棒的！"',
		'闭眼原地转 5 圈后走直线',
		'单脚站立唱一首儿歌',
		'倒着说出自己的名字和年龄',
		'用胳膊夹着筷子吃一口东西'
	],
	3: [
		'给通讯录第 5 个人打电话说"我想你"',
		'做 10 个俯卧撑（或深蹲）',
		'对着窗外大喊"我想要脱单！"',
		'用舌头舔自己的手肘（做不到就认罚）',
		'假装是新闻主播报道一件身边趣事'
	],
	4: [
		'把手机交给下一个人发一条朋友圈',
		'闭眼让人喂你吃一样东西',
		'用方言读一段绕口令',
		'在房间里爬一圈学狗叫',
		'给前任（或最近联系的人）发"在吗"'
	],
	5: [
		'在楼下大喊"我是 XXX，我做错事了对不起！"',
		'给爸妈打电话说"我爱你们"并哭出来',
		'用身体写自己的名字',
		'让在场的人往你脸上画东西并保持 10 分钟',
		'做一件在场所有人一致同意的事（不能拒绝）'
	]
}

const DEFAULT_PLAYERS = [
	{ id: 1, name: '玩家1', avatar: 'face' },
	{ id: 2, name: '玩家2', avatar: 'face_2' },
	{ id: 3, name: '玩家3', avatar: 'face_3' },
	{ id: 4, name: '玩家4', avatar: 'face_4' },
	{ id: 5, name: '玩家5', avatar: 'face_5' },
	{ id: 6, name: '玩家6', avatar: 'face_6' },
	{ id: 7, name: '玩家7', avatar: 'face_7' },
	{ id: 8, name: '玩家8', avatar: 'face_8' }
]

export const useQuestionStore = defineStore('questions', () => {
	// ─── 状态 ───
	const mode = ref('truth')         // 'truth' | 'dare'
	const intensity = ref(3)          // 1-5
	const history = ref([])
	const players = ref([...DEFAULT_PLAYERS])
	const customTruths = ref([])
	const customDares = ref([])

	// ─── 计算属性 ───
	const currentPool = computed(() => {
		const bank = mode.value === 'truth' ? TRUTH_BANK : DARE_BANK
		const customs = mode.value === 'truth' ? customTruths.value : customDares.value
		const pool = [...(bank[intensity.value] || bank[3]), ...customs]
		return pool.length > 0 ? pool : (mode.value === 'truth' ? TRUTH_BANK[3] : DARE_BANK[3])
	})

	const historyRecent = computed(() => history.value.slice(-10).reverse())

	// ─── 方法 ───
	function getRandom() {
		const pool = currentPool.value
		if (pool.length === 0) return '题库为空~'
		const idx = Math.floor(Math.random() * pool.length)
		return pool[idx]
	}

	function getRandomWithHistory() {
		const content = getRandom()
		const record = {
			id: Date.now(),
			mode: mode.value,
			intensity: intensity.value,
			content,
			status: 'pending', // 'pending' | 'answered' | 'skipped'
			timestamp: Date.now()
		}
		history.value.push(record)
		return content
	}

	// 更新最近一条记录的答题状态
	function updateLastStatus(status) {
		if (history.value.length === 0) return
		const last = history.value[history.value.length - 1]
		// 仅当当前状态为 pending 时才更新，避免重复统计
		if (last.status === 'pending') {
			last.status = status
		}
	}

	function clearHistory() {
		history.value = []
	}

	function addCustomQuestion(text) {
		if (!text.trim()) return
		if (mode.value === 'truth') {
			customTruths.value.push(text.trim())
		} else {
			customDares.value.push(text.trim())
		}
	}

	function setMode(m) {
		mode.value = m
	}

	function setIntensity(val) {
		intensity.value = Math.max(1, Math.min(5, val))
	}

	function resetPlayers() {
		players.value = [...DEFAULT_PLAYERS]
	}

	return {
		mode,
		intensity,
		history,
		players,
		customTruths,
		customDares,
		currentPool,
		historyRecent,
		getRandom,
		getRandomWithHistory,
		updateLastStatus,
		clearHistory,
		addCustomQuestion,
		setMode,
		setIntensity,
		resetPlayers
	}
})
