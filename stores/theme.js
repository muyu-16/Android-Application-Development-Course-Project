import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

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
			// system: 尝试获取系统主题偏好
			try {
				const sysInfo = uni.getSystemInfoSync()
				effectiveTheme.value = sysInfo.theme || 'light'
			} catch (e) {
				effectiveTheme.value = 'light'
			}
		}
		applyTheme(effectiveTheme.value)
	}

	function applyTheme(theme) {
		// 持久化用户选择
		try {
			uni.setStorageSync(STORAGE_KEY, themeMode.value)
		} catch (e) {}

		// H5 端：通过 document.documentElement 设置 data-theme
		try {
			if (typeof document !== 'undefined' && document.documentElement) {
				if (theme === 'dark') {
					document.documentElement.setAttribute('data-theme', 'dark')
				} else {
					document.documentElement.removeAttribute('data-theme')
				}
			}
		} catch (e) {}

		// App 端：通过 uni 事件通知各页面（Android/iOS 无 DOM）
		uni.$emit('themeChanged', theme)

		// App 端：设置导航栏和页面背景色（H5 端不支持，需 catch 异步 reject）
		const bgColor = theme === 'dark' ? '#141218' : '#FAF8FF'
		const textColor = theme === 'dark' ? '#F5EFF7' : '#1C1B1F'
		uni.setNavigationBarColor({
			frontColor: textColor === '#F5EFF7' ? '#ffffff' : '#000000',
			backgroundColor: bgColor,
			animation: { duration: 300, timingFunc: 'easeIn' }
		}).catch(() => {})
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
