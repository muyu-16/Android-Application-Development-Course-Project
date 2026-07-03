<script setup>
import { ref } from 'vue'
import NavBar from '@/components/NavBar.vue'
import { useChipStore } from '@/stores/chip'

const store = useChipStore()

const activeTab = ref(0)
const heroExpanded = ref(false)
const showTransfer = ref(false)
const transferFrom = ref(null)
const transferTo = ref(null)
const transferAmount = ref(0)
const transferNote = ref('')
const multiSelectMode = ref(false)
const selectedIds = ref(new Set())
const quickAmounts = [10, 50, 100]
const tabs = ['成员', '流水', '结算']

function toggleHero() { heroExpanded.value = !heroExpanded.value }

function handleAddPlayer() {
	uni.showModal({
		title: '添加成员',
		editable: true,
		placeholderText: '输入名称',
		success: (r) => { if (r.confirm && r.content) store.addPlayer(r.content.trim()) }
	})
}

function handleRemovePlayer(id) {
	if (!store.removePlayer(id)) uni.showToast({ title: '至少保留 2 人', icon: 'none' })
}

function onLongPress(id) {
	if (multiSelectMode.value) return
	multiSelectMode.value = true
	selectedIds.value = new Set([id])
	uni.vibrateShort?.({ type: 'light' })
}

function toggleSelect(id) {
	if (!multiSelectMode.value) return
	const s = new Set(selectedIds.value)
	s.has(id) ? s.delete(id) : s.add(id)
	selectedIds.value = s
	if (s.size === 0) multiSelectMode.value = false
}

function exitMultiSelect() { multiSelectMode.value = false; selectedIds.value = new Set() }

function batchQuickAdd(delta) {
	selectedIds.value.forEach(id => store.quickAdjust(id, delta))
	multiSelectMode.value = false; selectedIds.value = new Set()
}

function openTransfer(fromId) {
	transferFrom.value = fromId; transferTo.value = null
	transferAmount.value = 0; transferNote.value = ''; showTransfer.value = true
}

function confirmTransfer() {
	if (!transferFrom.value || !transferTo.value || transferAmount.value <= 0)
		return uni.showToast({ title: '请完善信息', icon: 'none' })
	if (transferFrom.value === transferTo.value)
		return uni.showToast({ title: '不能转给自己', icon: 'none' })
	if (store.transfer(transferFrom.value, transferTo.value, transferAmount.value, transferNote.value)) {
		uni.showToast({ title: '转账成功', icon: 'success' }); showTransfer.value = false
	} else uni.showToast({ title: '余额不足', icon: 'error' })
}

function confirmSettlement() {
	uni.showModal({
		title: '确认结算',
		content: '确认结算所有账目，确定吗？',
		success: (r) => {
			if (r.confirm) {
				store.settlements.forEach(s => store.transfer(s.fromId, s.toId, s.amount, '结算'))
				uni.showToast({ title: '结算完成', icon: 'success' })
			}
		}
	})
}

function formatTime(ts) {
	const d = new Date(ts)
	return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

function handleResetAll() {
	uni.showModal({
		title: '重置全部',
		content: '将所有玩家余额恢复为 1000，并清空所有流水记录，确定吗？',
		success: (r) => {
			if (r.confirm) {
				store.resetAll()
				uni.showToast({ title: '已重置', icon: 'success' })
			}
		}
	})
}
</script>

<template>
	<view class="container">
		<!-- 导航栏 -->
		<NavBar title="筹码">
			<template #right>
				<view class="nav-btn" @tap="handleResetAll">
					<text class="nav-btn-text">重置</text>
				</view>
			</template>
		</NavBar>

		<!-- Hero 卡片 -->
		<view class="hero-card" :class="{ expanded: heroExpanded }" @tap="toggleHero">
			<view class="hero-inner">
				<view class="hero-top">
					<text class="hero-sub-label">总筹码</text>
					<text class="hero-number">{{ store.totalBalance.toLocaleString() }}</text>
					<text class="hero-meta">{{ store.players.length }} 位玩家</text>
				</view>

				<view class="hero-expand" v-if="heroExpanded">
					<view class="hero-divider"></view>
					<view v-for="p in store.sortedPlayers" :key="p.id" class="hero-player-row">
						<view class="hero-player-left">
							<view class="hero-avatar">
								<text class="hero-avatar-icon">{{ p.avatar }}</text>
							</view>
							<text class="hero-player-name">{{ p.name }}</text>
						</view>
						<text class="hero-player-delta">{{ (p.balance - 1000) >= 0 ? '+' : '' }}{{ p.balance - 1000 }}</text>
					</view>
				</view>

				<view class="hero-indicator">
					<view class="indicator-dot" :class="{ expanded: heroExpanded }"></view>
				</view>
			</view>
		</view>

		<!-- Tab 栏 -->
		<view class="tab-bar">
			<view class="tab-inner">
				<view v-for="(tab, idx) in tabs" :key="idx"
					class="tab-item" :class="{ active: activeTab === idx }"
					@tap="activeTab = idx">
					<text class="tab-text">{{ tab }}</text>
				</view>
				<view class="tab-indicator" :style="{ transform: `translateX(${activeTab * 100}%)` }"></view>
			</view>
		</view>

		<!-- ═══ 成员 Tab ═══ -->
		<view v-if="activeTab === 0" class="tab-content">
			<!-- 多选操作栏 -->
			<view class="multi-bar" v-if="multiSelectMode">
				<text class="multi-info">已选 <text class="multi-num">{{ selectedIds.size }}</text> 人</text>
				<view class="multi-btns">
					<view v-for="amt in quickAmounts" :key="amt" class="chip-btn" @tap="batchQuickAdd(amt)">
						<text class="chip-btn-txt plus">+{{ amt }}</text>
					</view>
					<view v-for="amt in quickAmounts" :key="'n'+amt" class="chip-btn neg" @tap="batchQuickAdd(-amt)">
						<text class="chip-btn-txt minus">-{{ amt }}</text>
					</view>
					<view class="chip-btn cancel" @tap="exitMultiSelect">
						<text class="chip-btn-txt cancel-txt">取消</text>
					</view>
				</view>
			</view>

			<!-- 成员列表 -->
			<view v-for="p in store.sortedPlayers" :key="p.id"
				class="member-row"
				:class="{ selected: selectedIds.has(p.id) }"
				@longpress="onLongPress(p.id)"
				@tap="multiSelectMode ? toggleSelect(p.id) : undefined">
				<view class="member-row-inner">
					<view class="member-check" v-if="multiSelectMode" @tap.stop="toggleSelect(p.id)">
						<text class="check-icon">{{ selectedIds.has(p.id) ? '✓' : '○' }}</text>
					</view>
					<view class="member-avatar">
						<text class="avatar-icon">{{ p.avatar }}</text>
					</view>
					<view class="member-info">
						<text class="member-name">{{ p.name }}</text>
						<text class="member-balance-label">余额</text>
					</view>
					<text class="member-balance" :class="{ positive: p.balance >= 1000, negative: p.balance < 1000 }">
						{{ p.balance.toLocaleString() }}
					</text>
					<view class="member-actions" v-if="!multiSelectMode">
						<view class="icon-btn" @tap.stop="openTransfer(p.id)">
							<text class="icon-btn-txt accent">➤</text>
						</view>
						<view class="icon-btn" @tap.stop="handleRemovePlayer(p.id)">
							<text class="icon-btn-txt danger">⊖</text>
						</view>
					</view>
				</view>
			</view>

			<view class="empty-state" v-if="store.players.length === 0">
				<text class="empty-icon">👥</text>
				<text class="empty-text">点击 + 添加第一个成员</text>
			</view>
		</view>

		<!-- ═══ 流水 Tab ═══ -->
		<view v-if="activeTab === 1" class="tab-content">
			<view v-for="(tx, idx) in store.recentTransactions" :key="tx.id" class="tl-item">
				<view class="tl-line" v-if="idx < store.recentTransactions.length - 1"></view>
				<view class="tl-dot" :class="{ income: tx.from === '系统', expense: tx.to === '系统' }"></view>
				<view class="tl-card">
					<view class="tl-info">
						<text class="tl-note">{{ tx.note }}</text>
						<text class="tl-meta">{{ tx.from }} 至 {{ tx.to }} · {{ formatTime(tx.timestamp) }}</text>
					</view>
					<text class="tl-amount" :class="{ income: tx.from === '系统', expense: tx.to === '系统' }">
						{{ tx.from === '系统' ? '+' : tx.to === '系统' ? '-' : '' }}{{ tx.amount }}
					</text>
				</view>
			</view>
			<view class="empty-state" v-if="store.recentTransactions.length === 0">
				<text class="empty-icon">📋</text>
				<text class="empty-text">暂无流水记录</text>
			</view>
		</view>

		<!-- ═══ 结算 Tab ═══ -->
		<view v-if="activeTab === 2" class="tab-content">
			<text class="settle-summary">共 <text class="settle-count">{{ store.settlements.length }}</text> 笔转账</text>
			<view v-for="s in store.settlements" :key="s.fromId+s.toId" class="settle-row">
				<view class="settle-people">
					<view class="settle-person">
						<text class="settle-person-icon">👤</text>
						<text class="settle-person-name">{{ s.from }}</text>
					</view>
					<text class="settle-arrow">→</text>
					<view class="settle-person">
						<text class="settle-person-icon">👤</text>
						<text class="settle-person-name">{{ s.to }}</text>
					</view>
				</view>
				<text class="settle-amount">{{ s.amount.toLocaleString() }}</text>
			</view>
			<view class="empty-state" v-if="store.settlements.length === 0">
				<text class="empty-icon">⚖</text>
				<text class="empty-text">所有人账目已平</text>
			</view>
			<view class="primary-btn" @tap="confirmSettlement" v-if="store.settlements.length > 0">
				<text class="primary-btn-txt">确认结算</text>
			</view>
		</view>

		<!-- FAB -->
		<view class="fab" @tap="handleAddPlayer">
			<text class="fab-icon">＋</text>
		</view>

		<!-- 转账 Sheet -->
		<view class="sheet-mask" v-if="showTransfer" @tap="showTransfer = false">
			<view class="sheet" @tap.stop>
				<text class="sheet-title">转账</text>

				<view class="sheet-section">
					<text class="sheet-label">从</text>
					<view class="chip-row">
						<view v-for="p in store.players" :key="'f'+p.id"
							class="sheet-chip" :class="{ active: transferFrom === p.id }"
							@tap="transferFrom = p.id">
							<text class="sheet-chip-txt" :class="{ active: transferFrom === p.id }">{{ p.name }}</text>
						</view>
					</view>
				</view>

				<view class="sheet-section">
					<text class="sheet-label">至</text>
					<view class="chip-row">
						<view v-for="p in store.players" :key="'t'+p.id"
							class="sheet-chip" :class="{ active: transferTo === p.id }"
							@tap="transferTo = p.id">
							<text class="sheet-chip-txt" :class="{ active: transferTo === p.id }">{{ p.name }}</text>
						</view>
					</view>
				</view>

				<view class="sheet-section">
					<text class="sheet-label">金额</text>
					<view class="chip-row">
						<view v-for="a in [10,50,100,200,500]" :key="a"
							class="sheet-chip" :class="{ active: transferAmount === a }"
							@tap="transferAmount = a">
							<text class="sheet-chip-txt" :class="{ active: transferAmount === a }">{{ a }}</text>
						</view>
					</view>
					<view class="amt-input-row">
						<text class="amt-symbol">¥</text>
						<input v-model="transferAmount" type="number" class="amt-input" placeholder="0" />
					</view>
				</view>

				<view class="sheet-section">
					<text class="sheet-label">备注</text>
					<input v-model="transferNote" class="note-input" placeholder="可选备注" />
				</view>

				<view class="sheet-btns">
					<view class="sheet-btn cancel" @tap="showTransfer = false">
						<text class="sheet-btn-txt cancel">取消</text>
					</view>
					<view class="sheet-btn confirm" @tap="confirmTransfer">
						<text class="sheet-btn-txt confirm">确认转账</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<style scoped>
/* ============================================================
   基础布局
   ============================================================ */
.container {
	min-height: 100vh;
	background: var(--clr-bg-primary);
	padding: 16px;
	padding-top: calc(var(--safe-area-top, 24px) + 12px);
	padding-bottom: 16px;
}

/* ============================================================
   导航栏按钮
   ============================================================ */
.nav-btn {
	padding: 8px 20px;
	border-radius: 999px;
	background: rgba(208, 188, 255, 0.28);
	border: 1px solid rgba(208, 188, 255, 0.55);
	transition: transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.nav-btn:active { transform: scale(0.95); }
.nav-btn-text {
	font-size: 14px;
	font-weight: 600;
	color: var(--clr-accent);
}

/* ============================================================
   Hero 卡片
   ============================================================ */
.hero-card {
	position: relative;
	height: 200px;
	border-radius: 24px;
	margin-bottom: 14px;
	cursor: pointer;
	overflow: hidden;
	transition: height 0.4s cubic-bezier(0.2,0.8,0.2,1);
	background: linear-gradient(135deg, #2D1B69, #6750A4);
}
.hero-card.expanded { height: 340px; }

.hero-inner {
	padding: 20px;
	height: 100%;
	position: relative;
	z-index: 1;
}

.hero-sub-label {
	font-size: 15px;
	font-weight: 600;
	color: rgba(255, 255, 255, 0.85);
	letter-spacing: 0.5px;
	margin-bottom: 2px;
}

.hero-number {
	font-size: 44px;
	font-weight: 700;
	color: #FFFFFF;
	font-variant-numeric: tabular-nums;
	line-height: 1.1;
	margin-bottom: 4px;
}

.hero-meta {
	font-size: 15px;
	color: rgba(255, 255, 255, 0.88);
}

.hero-divider {
	height: 1px;
	background: rgba(255,255,255,0.15);
	margin: 10px 0;
}

.hero-player-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 5px 0;
}

.hero-player-left {
	display: flex;
	align-items: center;
	gap: 10px;
}

.hero-avatar {
	width: 32px;
	height: 32px;
	border-radius: 50%;
	background: rgba(255,255,255,0.15);
	display: flex;
	align-items: center;
	justify-content: center;
}

.hero-avatar-icon { font-size: 18px; color: #FFFFFF; }
.hero-player-name { font-size: 16px; font-weight: 600; color: #FFFFFF; }
.hero-player-delta { font-size: 16px; font-weight: 700; color: #FFFFFF; font-variant-numeric: tabular-nums; }

.hero-indicator {
	position: absolute;
	bottom: 12px;
	left: 50%;
	transform: translateX(-50%);
}

.indicator-dot {
	width: 6px;
	height: 6px;
	border-radius: 50%;
	background: rgba(255,255,255,0.3);
	transition: all 0.3s;
}
.indicator-dot.expanded {
	width: 20px;
	border-radius: 3px;
	background: var(--clr-accent);
}

/* ============================================================
   Tab 栏
   ============================================================ */
.tab-bar {
	background: rgba(255,255,255,0.08);
	border-radius: 999px;
	padding: 4px;
	margin-bottom: 14px;
	position: relative;
}

.tab-inner {
	display: flex;
	position: relative;
}

.tab-item {
	flex: 1;
	padding: 10px 0;
	text-align: center;
	border-radius: 999px;
	z-index: 1;
	cursor: pointer;
}

.tab-text {
	font-size: 16px;
	font-weight: 600;
	color: var(--clr-text-secondary);
}

.tab-item.active .tab-text {
	color: var(--clr-text-primary);
}

.tab-indicator {
	position: absolute;
	top: 0; left: 0;
	width: 33.33%;
	height: 100%;
	background: rgba(255,255,255,0.15);
	border-radius: 999px;
	transition: transform 0.3s cubic-bezier(0.2,0.8,0.2,1);
	z-index: 0;
}

/* ============================================================
   Tab 内容区
   ============================================================ */
.tab-content {
	flex: 1;
	min-height: 0;
}

/* ============================================================
   多选栏
   ============================================================ */
.multi-bar {
	background: rgba(255,255,255,0.06);
	border-radius: 16px;
	padding: 12px 16px;
	margin-bottom: 12px;
	display: flex;
	align-items: center;
	justify-content: space-between;
}
.multi-info { font-size: 15px; font-weight: 600; color: var(--clr-accent); }
.multi-num { font-weight: 800; font-variant-numeric: tabular-nums; }
.multi-btns { display: flex; gap: 6px; flex-wrap: wrap; }

.chip-btn {
	padding: 6px 14px;
	border-radius: 999px;
	background: rgba(30, 27, 35, 0.55);
	border: 1px solid rgba(255,255,255,0.10);
	transition: transform 0.15s cubic-bezier(0.2,0.8,0.2,1);
	cursor: pointer;
}
.chip-btn:active { transform: scale(0.96); }
.chip-btn.neg { background: rgba(225, 110, 90, 0.18); border-color: rgba(247,141,124,0.35); }
.chip-btn.cancel { background: rgba(30, 27, 35, 0.45); border-color: rgba(255,255,255,0.08); }
.chip-btn-txt { font-size: 14px; font-weight: 700; }
.chip-btn-txt.plus { color: var(--clr-accent); }
.chip-btn-txt.minus { color: var(--clr-danger); }
.chip-btn-txt.cancel-txt { color: rgba(255,255,255,0.7); font-weight: 500; }

/* ============================================================
   成员列表
   ============================================================ */
.member-row {
	background: rgba(255,255,255,0.06);
	border-radius: 16px;
	margin-bottom: 10px;
	cursor: pointer;
	transition: all 0.2s;
}
.member-row.selected { background: rgba(208,188,255,0.10); }

.member-row-inner {
	display: flex;
	align-items: center;
	gap: 14px;
	padding: 0 16px;
	height: 76px;
}

.member-check { flex-shrink: 0; }
.check-icon { font-size: 24px; color: var(--clr-text-primary); }

.member-avatar {
	width: 40px;
	height: 40px;
	border-radius: 50%;
	background: rgba(255,255,255,0.10);
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}
.avatar-icon { font-size: 22px; color: var(--clr-text-primary); }

.member-info { flex: 1; min-width: 0; }
.member-name {
	font-size: 17px;
	font-weight: 600;
	color: var(--clr-text-primary);
	display: block;
}
.member-balance-label {
	font-size: 13px;
	color: var(--clr-text-secondary);
	font-weight: 500;
}

.member-balance {
	font-size: 18px;
	font-weight: 700;
	font-variant-numeric: tabular-nums;
}
.member-balance.positive { color: var(--clr-success); }
.member-balance.negative { color: var(--clr-danger); }

.member-actions { display: flex; gap: 6px; }

.icon-btn {
	width: 36px;
	height: 36px;
	border-radius: 50%;
	background: rgba(30, 27, 35, 0.55);
	border: 1px solid rgba(255,255,255,0.10);
	display: flex;
	align-items: center;
	justify-content: center;
	transition: transform 0.15s cubic-bezier(0.2,0.8,0.2,1);
	cursor: pointer;
}
.icon-btn:active { transform: scale(0.92); }
.icon-btn-txt { font-size: 20px; }
.icon-btn-txt.accent { color: var(--clr-accent); }
.icon-btn-txt.danger { color: var(--clr-danger); }

/* ============================================================
   流水
   ============================================================ */
.tl-item {
	position: relative;
	padding-left: 22px;
	padding-bottom: 10px;
	display: flex;
	align-items: flex-start;
	gap: 10px;
}

.tl-line {
	position: absolute;
	left: 7px;
	top: 22px;
	bottom: 0;
	width: 1px;
	background: var(--clr-text-disabled);
	opacity: 0.2;
}

.tl-dot {
	width: 12px;
	height: 12px;
	border-radius: 50%;
	background: var(--clr-accent);
	border: 2px solid var(--clr-accent-on);
	flex-shrink: 0;
	margin-top: 16px;
}
.tl-dot.income { background: var(--clr-success); }
.tl-dot.expense { background: var(--clr-danger); }

.tl-card {
	flex: 1;
	background: rgba(30, 27, 35, 0.55);
	border-radius: 16px;
	padding: 14px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	min-height: 60px;
	border: 1px solid rgba(255,255,255,0.10);
}

.tl-info { flex: 1; min-width: 0; }
.tl-note {
	font-size: 16px;
	font-weight: 600;
	color: var(--clr-text-primary);
	display: block;
}
.tl-meta {
	font-size: 13px;
	color: var(--clr-text-secondary);
}

.tl-amount {
	font-size: 18px;
	font-weight: 700;
	font-variant-numeric: tabular-nums;
	color: var(--clr-text-primary);
}
.tl-amount.income { color: var(--clr-success); }
.tl-amount.expense { color: var(--clr-danger); }

/* ============================================================
   结算
   ============================================================ */
.settle-summary {
	font-size: 15px;
	color: var(--clr-text-secondary);
	display: block;
	margin-bottom: 14px;
	font-weight: 500;
}
.settle-count { font-weight: 800; font-variant-numeric: tabular-nums; }

.settle-row {
	background: rgba(30, 27, 35, 0.60);
	border-radius: 16px;
	padding: 14px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 10px;
	border: 1px solid rgba(255,255,255,0.12);
}

.settle-people { display: flex; align-items: center; gap: 8px; }
.settle-person { display: flex; align-items: center; gap: 6px; }
.settle-person-icon { font-size: 20px; color: var(--clr-text-secondary); }
.settle-person-name { font-size: 16px; font-weight: 600; color: var(--clr-text-primary); }
.settle-arrow { font-size: 20px; color: var(--clr-accent); }

.settle-amount {
	font-size: 18px;
	font-weight: 700;
	color: var(--clr-danger);
	font-variant-numeric: tabular-nums;
}

.primary-btn {
	width: 100%;
	padding: 16px;
	border-radius: 20px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(208, 188, 255, 0.28);
	border: 1px solid rgba(208,188,255,0.55);
	transition: transform 0.15s cubic-bezier(0.2,0.8,0.2,1);
	margin-top: 10px;
	cursor: pointer;
}
.primary-btn:active { transform: scale(0.97); }
.primary-btn-txt {
	font-size: 18px;
	font-weight: 700;
	color: var(--clr-accent-on);
}

/* ============================================================
   空状态
   ============================================================ */
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
	padding: 48px 0;
}
.empty-icon { font-size: 64px; color: var(--clr-text-disabled); }
.empty-text { font-size: 16px; color: var(--clr-text-secondary); }

/* ============================================================
   FAB
   ============================================================ */
.fab {
	position: fixed;
	bottom: calc(env(safe-area-inset-bottom, 0px) + 72px + 24px);
	right: 16px;
	width: 56px;
	height: 56px;
	border-radius: 50%;
	background: rgba(208, 188, 255, 0.32);
	border: 1px solid rgba(208,188,255,0.55);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 50;
	cursor: pointer;
	transition: transform 0.15s cubic-bezier(0.2,0.8,0.2,1);
}
.fab:active { transform: scale(0.92); }
.fab-icon { font-size: 28px; color: var(--clr-accent); }

/* ============================================================
   转账 Sheet
   ============================================================ */
.sheet-mask {
	position: fixed;
	inset: 0;
	background: rgba(0,0,0,0.4);
	z-index: 100;
	display: flex;
	align-items: flex-end;
}

.sheet {
	width: 100%;
	max-width: 420px;
	margin: 0 auto;
	background: rgba(30, 27, 35, 0.92);
	border: 1px solid rgba(255,255,255,0.12);
	border-radius: 28px 28px 0 0;
	padding: 24px 20px 32px;
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.sheet-title {
	font-size: 22px;
	font-weight: 700;
	color: #E2E8F0;
	text-align: center;
}

.sheet-section {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.sheet-label {
	font-size: 15px;
	font-weight: 600;
	color: rgba(255,255,255,0.7);
}

.chip-row {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.sheet-chip {
	padding: 10px 18px;
	border-radius: 999px;
	background: rgba(30, 27, 35, 0.55);
	border: 1px solid rgba(255,255,255,0.10);
	transition: transform 0.15s cubic-bezier(0.2,0.8,0.2,1);
	cursor: pointer;
}
.sheet-chip:active { transform: scale(0.96); }
.sheet-chip-txt {
	font-size: 16px;
	font-weight: 600;
	color: #D0BCFF;
}
.sheet-chip-txt.active {
	color: #381E72;
	font-weight: 700;
}
.sheet-chip.active {
	background: rgba(208, 188, 255, 0.28);
	border-color: rgba(208,188,255,0.55);
}

.amt-input-row {
	display: flex;
	align-items: center;
	gap: 10px;
	background: rgba(30, 27, 35, 0.55);
	border: 1px solid rgba(255,255,255,0.10);
	border-radius: 16px;
	padding: 14px 18px;
}
.amt-symbol {
	font-size: 20px;
	font-weight: 700;
	color: rgba(255,255,255,0.88);
}
.amt-input {
	flex: 1;
	font-size: 24px;
	font-weight: 700;
	color: #FFFFFF;
	background: transparent;
	border: none;
}

.note-input {
	background: rgba(30, 27, 35, 0.55);
	border: 1px solid rgba(255,255,255,0.10);
	border-radius: 16px;
	padding: 14px 18px;
	font-size: 16px;
	color: #FFFFFF;
	width: 100%;
}

.sheet-btns {
	display: flex;
	gap: 10px;
	margin-top: 4px;
}

.sheet-btn {
	flex: 1;
	padding: 16px;
	border-radius: 16px;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	transition: transform 0.15s cubic-bezier(0.2,0.8,0.2,1);
}
.sheet-btn:active { transform: scale(0.97); }

.sheet-btn.cancel {
	background: rgba(30, 27, 35, 0.55);
	border: 1px solid rgba(255,255,255,0.10);
}
.sheet-btn-txt { font-size: 17px; font-weight: 600; }
.sheet-btn-txt.cancel { color: #E2E8F0; }

.sheet-btn.confirm {
	background: var(--clr-accent);
	border: 1px solid var(--clr-accent);
}
.sheet-btn-txt.confirm { color: var(--clr-accent-on); font-weight: 700; }
</style>
