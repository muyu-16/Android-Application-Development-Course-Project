import { defineStore } from 'pinia'
import { ref } from 'vue'

const STORAGE_KEY = 'partyglass_theme'

export const useThemeStore = defineStore('theme', () => {
	const saved = (() => {
		try { return uni.getStorageSync(STORAGE_KEY) } catch (e) { return null }
	})()

	const themeMode = ref(saved || 'system')    // 'system' | 'light' | 'dark'
	const effectiveTheme = ref('light')

	function resolveTheme() {
		if (themeMode.value === 'dark') {
			effectiveTheme.value = 'dark'
		} else if (themeMode.value === 'light') {
			effectiveTheme.value = 'light'
		} else {
			effectiveTheme.value = 'light'
		}
		applyTheme(effectiveTheme.value)
	}

	function applyTheme(theme) {
		// uni-app 中使用 wx 或 uni 设置页面背景
		try {
			uni.setStorageSync(STORAGE_KEY, themeMode.value)
		} catch (e) {}

		// 通过全局事件通知各页面切换主题
		// 各页面通过监听 data-theme 属性变化来响应
		try {
			if (typeof document !== 'undefined' && document.documentElement) {
				if (theme === 'dark') {
					document.documentElement.setAttribute('data-theme', 'dark')
				} else {
					document.documentElement.removeAttribute('data-theme')
				}
			}
		} catch (e) {}
	}

	function setTheme(mode) {
		themeMode.value = mode
		resolveTheme()
	}

	function onThemeChange(res) {
		if (themeMode.value === 'system') {
			effectiveTheme.value = res.theme || 'light'
			applyTheme(effectiveTheme.value)
		}
	}

	// 初始化
	resolveTheme()

	// 注册系统主题变化监听
	try {
		uni.onThemeChange?.(onThemeChange)
	} catch (e) {}

	return {
		themeMode,
		effectiveTheme,
		setTheme,
		resolveTheme
	}
})