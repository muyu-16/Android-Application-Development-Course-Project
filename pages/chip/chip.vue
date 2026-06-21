﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿<script setup>
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
</script>

<template>
	<view class="container">
		<!-- 导航栏 -->
		<NavBar title="筹码" />
		<view class="hero-card" :class="{ expanded: heroExpanded }" @tap="toggleHero">
			<view class="hero-inner">
				<view class="hero-top">
					<text class="hero-sub-label">总筹码</text>
					<text class="hero-number">4,000</text>
					<text class="hero-meta">{{ store.players.length }} 位玩家</text>
				</view>

				<view class="hero-expand" v-if="heroExpanded">
					<view class="hero-divider"></view>
					<view v-for="p in store.sortedPlayers" :key="p.id" class="hero-player-row">
						<view style="display:flex;align-items:center;gap:8px">
							<view class="hero-avatar">
								<text style="font-size:16px;color:#000000">{{ p.avatar }}</text>
							</view>
							<text style="font-size:14px;font-weight:600;color:#000000">{{ p.name }}</text>
						</view>
						<text class="num" style="font-size:14px;font-weight:700;color:#000000">{{ (p.balance - 1000) >= 0 ? '+' : '' }}{{ p.balance - 1000 }}</text>
					</view>
				</view>

				<view class="hero-indicator">
					<view class="indicator-dot" :class="{ expanded: heroExpanded }"></view>
				</view>
			</view>
		</view>

		<!-- ====== Tab 栏 ====== -->
		<view class="tab-bar">
			<view class="tab-inner">
				<view v-for="(tab, idx) in tabs" :key="idx"
					class="tab-item" :class="{ active: activeTab === idx }"
					@tap="activeTab = idx">
					<text>{{ tab }}</text>
				</view>
				<view class="tab-indicator" :style="{ transform: `translateX(${activeTab * 33.33}%)` }"></view>
			</view>
		</view>

		<!-- ====== 成员 Tab ====== -->
		<view v-if="activeTab === 0">
			<!-- 多选操作栏 -->
			<view class="multi-bar" v-if="multiSelectMode">
				<text style="font-size:12px;font-weight:600;color:var(--clr-accent)">已选 <text class="num">{{ selectedIds.size }}</text> 人</text>
				<view style="display:flex;gap:4px;flex-wrap:wrap">
					<view v-for="amt in quickAmounts" :key="amt" class="chip-btn" @tap="batchQuickAdd(amt)">
						<text style="color:var(--clr-accent);font-weight:600">+{{ amt }}</text>
					</view>
					<view v-for="amt in quickAmounts" :key="'n'+amt" class="chip-btn neg" @tap="batchQuickAdd(-amt)">
						<text style="color:var(--clr-danger);font-weight:600">-{{ amt }}</text>
					</view>
					<view class="chip-btn cancel" @tap="exitMultiSelect">
						<text style="color:var(--clr-text-secondary);font-weight:500">取消</text>
					</view>
				</view>
			</view>

			<!-- 成员行 -->
			<view v-for="p in store.sortedPlayers" :key="p.id"
				class="member-row"
				:class="{ selected: selectedIds.has(p.id) }"
				@longpress="onLongPress(p.id)"
				@tap="multiSelectMode ? toggleSelect(p.id) : undefined">
				<view class="member-row-inner">
					<view class="member-check" v-if="multiSelectMode" @tap.stop="toggleSelect(p.id)">
						<text class="material-icons" style="font-size:22px;color:var(--clr-text-primary)">{{ selectedIds.has(p.id) ? '✓' : '○' }}</text>
					</view>
					<view class="member-avatar">
						<text class="material-icons" style="font-size:20px;color:var(--clr-text-primary)">{{ p.avatar }}</text>
					</view>
					<view style="flex:1;min-width:0">
						<text style="font-size:16px;font-weight:600;color:var(--clr-text-primary);display:block">{{ p.name }}</text>
						<text style="font-size:11px;color:var(--clr-text-secondary)">余额</text>
					</view>
					<text class="num" style="font-size:16px;font-weight:700"
						:style="{ color: p.balance >= 1000 ? 'var(--clr-success)' : 'var(--clr-danger)' }">
						{{ p.balance.toLocaleString() }}
					</text>
					<view class="member-actions" v-if="!multiSelectMode">
						<view class="icon-btn" @tap.stop="openTransfer(p.id)">
							<text class="material-icons" style="font-size:18px;color:var(--clr-accent)">➤</text>
						</view>
						<view class="icon-btn" @tap.stop="handleRemovePlayer(p.id)">
							<text class="material-icons" style="font-size:18px;color:var(--clr-danger)">⊖</text>
						</view>
					</view>
				</view>
			</view>

			<view class="empty-state" v-if="store.players.length === 0">
				<text class="material-icons" style="font-size:96px;color:var(--clr-text-disabled)">👥</text>
				<text style="font-size:14px;color:var(--clr-text-secondary)">点击 + 添加第一个成员</text>
			</view>
		</view>

		<!-- ====== 流水 Tab ====== -->
		<view v-if="activeTab === 1">
			<view v-for="(tx, idx) in store.recentTransactions" :key="tx.id" class="tl-item">
				<view class="tl-line" v-if="idx < store.recentTransactions.length - 1"></view>
				<view class="tl-dot" :class="{ income: tx.from === '系统', expense: tx.to === '系统' }"></view>
				<view class="tl-card">
					<view style="flex:1;min-width:0">
						<text style="font-size:14px;font-weight:600;color:var(--clr-text-primary);display:block">{{ tx.note }}</text>
						<text style="font-size:11px;color:var(--clr-text-secondary)">{{ tx.from }} 至 {{ tx.to }} · {{ formatTime(tx.timestamp) }}</text>
					</view>
					<text class="num" style="font-size:16px;font-weight:700"
						:style="{ color: tx.from === '系统' ? 'var(--clr-success)' : tx.to === '系统' ? 'var(--clr-danger)' : 'var(--clr-text-primary)' }">
						{{ tx.from === '系统' ? '+' : tx.to === '系统' ? '-' : '' }}{{ tx.amount }}
					</text>
				</view>
			</view>
			<view class="empty-state" v-if="store.recentTransactions.length === 0">
				<text class="material-icons" style="font-size:96px;color:var(--clr-text-disabled)">📋</text>
				<text style="font-size:14px;color:var(--clr-text-secondary)">暂无流水记录</text>
			</view>
		</view>

		<!-- ====== 结算 Tab ====== -->
		<view v-if="activeTab === 2">
			<text style="font-size:12px;color:var(--clr-text-secondary);display:block;margin-bottom:12px">共 <text class="num">{{ store.settlements.length }}</text> 笔转账</text>
			<view v-for="s in store.settlements" :key="s.fromId+s.toId" class="settle-row">
				<view style="display:flex;align-items:center;gap:8px">
					<view style="display:flex;align-items:center;gap:4px">
						<text class="material-icons" style="font-size:18px;color:var(--clr-text-secondary)">👤</text>
						<text style="font-size:14px;font-weight:600;color:var(--clr-text-primary)">{{ s.from }}</text>
					</view>
					<text class="material-icons" style="font-size:18px;color:var(--clr-accent)">→</text>
					<view style="display:flex;align-items:center;gap:4px">
						<text class="material-icons" style="font-size:18px;color:var(--clr-text-secondary)">👤</text>
						<text style="font-size:14px;font-weight:600;color:var(--clr-text-primary)">{{ s.to }}</text>
					</view>
				</view>
				<text class="num" style="font-size:16px;font-weight:700;color:var(--clr-danger)">{{ s.amount.toLocaleString() }}</text>
			</view>
			<view class="empty-state" v-if="store.settlements.length === 0">
				<text class="material-icons" style="font-size:96px;color:var(--clr-text-disabled)">⚖</text>
				<text style="font-size:14px;color:var(--clr-text-secondary)">所有人账目已平</text>
			</view>
			<view class="primary-btn" @tap="confirmSettlement" v-if="store.settlements.length > 0">
				<text style="font-size:16px;font-weight:700;color:var(--clr-accent-on)">确认结算</text>
			</view>
		</view>

		<!-- FAB -->
		<view class="fab" @tap="handleAddPlayer">
			<text class="material-icons" style="font-size:28px;color:var(--clr-accent)">＋</text>
		</view>

		<!-- 转账 Sheet -->
		<view class="sheet-mask" v-if="showTransfer" @tap="showTransfer = false">
			<view class="sheet" @tap.stop>
				<text style="font-size:22px;font-weight:700;color:var(--clr-text-primary);text-align:center">转账</text>
				<view class="sheet-section">
					<text style="font-size:12px;font-weight:600;color:var(--clr-text-secondary)">从</text>
					<view class="chip-row">
						<view v-for="p in store.players" :key="'f'+p.id"
							class="sheet-chip" :class="{ active: transferFrom === p.id }"
							@tap="transferFrom = p.id">
							<text :style="{ color: transferFrom === p.id ? 'var(--clr-accent-on)' : 'var(--clr-accent)', fontWeight:600 }">{{ p.name }}</text>
						</view>
					</view>
				</view>
				<view class="sheet-section">
					<text style="font-size:12px;font-weight:600;color:var(--clr-text-secondary)">至</text>
					<view class="chip-row">
						<view v-for="p in store.players" :key="'t'+p.id"
							class="sheet-chip" :class="{ active: transferTo === p.id }"
							@tap="transferTo = p.id">
							<text :style="{ color: transferTo === p.id ? 'var(--clr-accent-on)' : 'var(--clr-accent)', fontWeight:600 }">{{ p.name }}</text>
						</view>
					</view>
				</view>
				<view class="sheet-section">
					<text style="font-size:12px;font-weight:600;color:var(--clr-text-secondary)">金额</text>
					<view class="chip-row">
						<view v-for="a in [10,50,100,200,500]" :key="a"
							class="sheet-chip" :class="{ active: transferAmount === a }"
							@tap="transferAmount = a">
							<text :style="{ color: transferAmount === a ? 'var(--clr-accent-on)' : 'var(--clr-accent)', fontWeight:600 }">{{ a }}</text>
						</view>
					</view>
					<view class="amt-input-row">
						<text style="font-weight:700;color:var(--clr-text-secondary)">¥</text>
						<input v-model="transferAmount" type="number" style="flex:1;font-size:22px;font-weight:700;color:var(--clr-text-primary);background:transparent;border:none" placeholder="0" />
					</view>
				</view>
				<view class="sheet-section">
					<text style="font-size:12px;font-weight:600;color:var(--clr-text-secondary)">备注</text>
					<input v-model="transferNote" class="note-input" placeholder="可选备注" />
				</view>
				<view style="display:flex;gap:8px;margin-top:8px">
					<view class="sheet-btn" style="background:var(--clr-bg-secondary)" @tap="showTransfer = false">
						<text style="font-size:16px;font-weight:600;color:var(--clr-text-primary)">取消</text>
					</view>
					<view class="sheet-btn" style="background:var(--clr-accent)" @tap="confirmTransfer">
						<text style="font-size:16px;font-weight:700;color:var(--clr-accent-on)">确认转账</text>
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
	padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 80px);
}

[data-theme="dark"] .container {
	background: var(--clr-bg-primary);
}

/* ============================================================
   Hero 卡片
   ============================================================ */
.hero-card {
	position: relative;
	height: 220px;
	border-radius: 28px;
	margin-bottom: 16px;
	cursor: pointer;
	overflow: hidden;
	transition: height 0.4s cubic-bezier(0.2,0.8,0.2,1);
	background: linear-gradient(135deg, #2D1B69, #6750A4);
}

.hero-card.expanded { height: 360px }

.hero-inner {
	padding: 24px;
	height: 100%;
	position: relative;
	z-index: 1;
}

.hero-sub-label {
	font-size: 13px;
	font-weight: 600;
	color: rgba(255, 255, 255, 0.85);
	letter-spacing: 0.5px;
	margin-bottom: 4px;
}

.hero-number {
	font-size: 48px;
	font-weight: 700;
	color: #FFFFFF;
	font-variant-numeric: tabular-nums;
	line-height: 1.1;
	margin-bottom: 6px;
}

.hero-meta {
	font-size: 13px;
	color: rgba(255, 255, 255, 0.7);
}

.hero-divider {
	height: 1px;
	background: rgba(255,255,255,0.15);
	margin: 12px 0;
}

.hero-player-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 6px 0;
}

.hero-avatar {
	width: 28px;
	height: 28px;
	border-radius: 50%;
	background: rgba(255,255,255,0.15);
	display: flex;
	align-items: center;
	justify-content: center;
}

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
   Tab
   ============================================================ */
.tab-bar {
	background: rgba(255,255,255,0.08);
	border-radius: 999px;
	padding: 3px;
	margin-bottom: 16px;
	position: relative;
}

.tab-inner {
	display: flex;
	position: relative;
}

.tab-item {
	flex: 1;
	padding: 8px 0;
	text-align: center;
	border-radius: 999px;
	z-index: 1;
	cursor: pointer;
}

.tab-item text {
	font-size: 14px;
	font-weight: 600;
	color: var(--clr-text-secondary);
}

.tab-item.active text {
	color: var(--clr-text-primary);
}

.tab-indicator {
	position: absolute;
	top: 0;
	left: 0;
	width: calc(33.33%);
	height: 100%;
	background: rgba(255,255,255,0.15);
	border-radius: 999px;
	transition: transform 0.3s cubic-bezier(0.2,0.8,0.2,1);
	z-index: 0;
}

/* ============================================================
   多选栏
   ============================================================ */
.multi-bar {
	background: rgba(255,255,255,0.06);
	border-radius: 16px;
	padding: 10px 14px;
	margin-bottom: 12px;
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.chip-btn {
	padding: 4px 10px;
	border-radius: 999px;
	background: rgba(30, 27, 35, 0.55);
	backdrop-filter: blur(14px) saturate(180%);
	-webkit-backdrop-filter: blur(14px) saturate(180%);
	border: 1px solid rgba(255,255,255,0.10);
	box-shadow: 0 4px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08);
	transition: transform 0.15s cubic-bezier(0.2,0.8,0.2,1), background 0.25s ease;
	cursor: pointer;
}
.chip-btn:active { transform: scale(0.96); }

.chip-btn.neg { background: rgba(225, 110, 90, 0.18); border: 1px solid rgba(247,141,124,0.35); box-shadow: 0 4px 16px rgba(247,141,124,0.15), inset 0 1px 0 rgba(255,255,255,0.08); }
.chip-btn.cancel { background: rgba(30, 27, 35, 0.45); border: 1px solid rgba(255,255,255,0.08); box-shadow: inset 0 1px 0 rgba(255,255,255,0.06); }

.member-row {
	background: rgba(255,255,255,0.06);
	border-radius: 16px;
	margin-bottom: 10px;
	cursor: pointer;
	transition: all 0.2s;
}

.member-row.selected {
	background: rgba(208,188,255,0.10);
}

.member-row-inner {
	display: flex;
	align-items: center;
	gap: 16px;
	padding: 0 16px;
	height: 72px;
}

.member-avatar {
	width: 36px;
	height: 36px;
	border-radius: 50%;
	background: rgba(255,255,255,0.10);
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.member-actions {
	display: flex;
	gap: 4px;
}

.icon-btn {
	width: 28px;
	height: 28px;
	border-radius: 50%;
	background: rgba(30, 27, 35, 0.55);
	backdrop-filter: blur(14px) saturate(180%);
	-webkit-backdrop-filter: blur(14px) saturate(180%);
	border: 1px solid rgba(255,255,255,0.10);
	box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
	display: flex;
	align-items: center;
	justify-content: center;
	transition: transform 0.15s cubic-bezier(0.2,0.8,0.2,1), background 0.25s ease;
	cursor: pointer;
}
.icon-btn:active { transform: scale(0.92); }

/* ============================================================
   流水
   ============================================================ */
.tl-item {
	position: relative;
	padding-left: 20px;
	padding-bottom: 8px;
	display: flex;
	align-items: flex-start;
	gap: 8px;
}

.tl-line {
	position: absolute;
	left: 7px;
	top: 20px;
	bottom: 0;
	width: 1px;
	background: var(--clr-text-disabled);
	opacity: 0.2;
}

.tl-dot {
	width: 10px;
	height: 10px;
	border-radius: 50%;
	background: var(--clr-accent);
	border: 2px solid var(--clr-accent-on);
	flex-shrink: 0;
	margin-top: 14px;
}

.tl-dot.income { background: var(--clr-success) }
.tl-dot.expense { background: var(--clr-danger) }

.tl-card {
	flex: 1;
	background: rgba(30, 27, 35, 0.55);
	backdrop-filter: blur(14px) saturate(180%);
	-webkit-backdrop-filter: blur(14px) saturate(180%);
	border-radius: 16px;
	padding: 12px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	min-height: 56px;
	border: 1px solid rgba(255,255,255,0.10);
	box-shadow: 0 4px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08);
}

/* ============================================================
   结算
   ============================================================ */
.settle-row {
	background: rgba(30, 27, 35, 0.60);
	backdrop-filter: blur(16px) saturate(180%);
	-webkit-backdrop-filter: blur(16px) saturate(180%);
	border-radius: 16px;
	padding: 12px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 8px;
	border: 1px solid rgba(255,255,255,0.12);
	box-shadow: 0 4px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08);
}

.primary-btn {
	width: 100%;
	padding: 14px;
	border-radius: 20px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(208, 188, 255, 0.28);
	backdrop-filter: blur(14px) saturate(200%);
	-webkit-backdrop-filter: blur(14px) saturate(200%);
	border: 1px solid rgba(208,188,255,0.55);
	box-shadow: 0 4px 20px rgba(208,188,255,0.35), inset 0 1px 0 rgba(255,255,255,0.2);
	transition: transform 0.15s cubic-bezier(0.2,0.8,0.2,1), background 0.25s ease;
	margin-top: 8px;
	cursor: pointer;
}
.primary-btn:active { transform: scale(0.97); background: rgba(208, 188, 255, 0.38); }

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

/* ============================================================
   FAB
   ============================================================ */
.fab {
	position: fixed;
	bottom: calc(env(safe-area-inset-bottom, 0px) + 24px);
	right: 16px;
	width: 56px;
	height: 56px;
	border-radius: 50%;
	background: rgba(208, 188, 255, 0.32);
	backdrop-filter: blur(14px) saturate(200%);
	-webkit-backdrop-filter: blur(14px) saturate(200%);
	border: 1px solid rgba(208,188,255,0.55);
	box-shadow: 0 4px 24px rgba(208,188,255,0.35), inset 0 1px 0 rgba(255,255,255,0.2);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 50;
	cursor: pointer;
	transition: transform 0.15s cubic-bezier(0.2,0.8,0.2,1), box-shadow 0.25s, background 0.25s;
}
.fab:active { transform: scale(0.92); background: rgba(208, 188, 255, 0.42); }

/* ============================================================
   Sheet
   ============================================================ */
.sheet-mask {
	position: fixed;
	inset: 0;
	background: rgba(0,0,0,0.35);
	z-index: 100;
	display: flex;
	align-items: flex-end;
}

.sheet {
	width: 100%;
	max-width: 420px;
	margin: 0 auto;
	background: rgba(30, 27, 35, 0.78);
	backdrop-filter: blur(24px) saturate(180%);
	-webkit-backdrop-filter: blur(24px) saturate(180%);
	border: 1px solid rgba(255,255,255,0.12);
	border-radius: 28px 28px 0 0;
	padding: 24px 20px 32px;
	display: flex;
	flex-direction: column;
	gap: 14px;
	box-shadow: 0 -4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08);
}

.sheet-section {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.chip-row {
	display: flex;
	flex-wrap: wrap;
	gap: 4px;
}

.sheet-chip {
	padding: 6px 14px;
	border-radius: 999px;
	background: rgba(30, 27, 35, 0.55);
	backdrop-filter: blur(14px) saturate(180%);
	-webkit-backdrop-filter: blur(14px) saturate(180%);
	border: 1px solid rgba(255,255,255,0.10);
	box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
	color: var(--clr-text-primary);
	font-size: 14px;
	font-weight: 600;
	transition: transform 0.15s cubic-bezier(0.2,0.8,0.2,1), background 0.25s ease;
	cursor: pointer;
}
.sheet-chip:active { transform: scale(0.96); }

.sheet-chip.active {
	background: rgba(208, 188, 255, 0.28);
	backdrop-filter: blur(14px) saturate(200%);
	-webkit-backdrop-filter: blur(14px) saturate(200%);
	border: 1px solid rgba(208,188,255,0.55);
	box-shadow: 0 2px 12px rgba(208,188,255,0.35), inset 0 1px 0 rgba(255,255,255,0.2);
	color: var(--clr-accent);
	font-weight: 700;
}

.amt-input-row {
	display: flex;
	align-items: center;
	gap: 8px;
	background: rgba(30, 27, 35, 0.55);
	backdrop-filter: blur(14px) saturate(180%);
	-webkit-backdrop-filter: blur(14px) saturate(180%);
	border: 1px solid rgba(255,255,255,0.10);
	border-radius: 16px;
	padding: 12px 16px;
	box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
}

.note-input {
	background: rgba(30, 27, 35, 0.55);
	backdrop-filter: blur(14px) saturate(180%);
	-webkit-backdrop-filter: blur(14px) saturate(180%);
	border: 1px solid rgba(255,255,255,0.10);
	border-radius: 16px;
	padding: 12px 16px;
	font-size: 14px;
	color: var(--clr-text-primary);
	width: 100%;
	box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
}

.sheet-btn {
	flex: 1;
	padding: 14px;
	border-radius: 16px;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	transition: transform 0.15s cubic-bezier(0.2,0.8,0.2,1), background 0.25s ease, box-shadow 0.25s;
}
.sheet-btn:active { transform: scale(0.97); }

.sheet-btn.primary {
	background: rgba(208, 188, 255, 0.32);
	backdrop-filter: blur(14px) saturate(200%);
	-webkit-backdrop-filter: blur(14px) saturate(200%);
	border: 1px solid rgba(208,188,255,0.55);
	box-shadow: 0 4px 20px rgba(208,188,255,0.35), inset 0 1px 0 rgba(255,255,255,0.2);
}
.sheet-btn.primary text {
	font-size: 16px;
	font-weight: 700;
	color: var(--clr-accent);
}

.sheet-btn.secondary {
	background: rgba(30, 27, 35, 0.55);
	backdrop-filter: blur(14px) saturate(180%);
	-webkit-backdrop-filter: blur(14px) saturate(180%);
	border: 1px solid rgba(255,255,255,0.10);
	box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
}
.sheet-btn.secondary text {
	font-size: 16px;
	font-weight: 600;
	color: var(--clr-text-secondary);
}
</style>
