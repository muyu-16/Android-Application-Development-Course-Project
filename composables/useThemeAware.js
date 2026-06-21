// composables/useThemeAware.js
// 让页面组件响应主题变化（兼容 App 端无 DOM 的情况）
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useThemeStore } from '@/stores/theme'

export function useThemeAware() {
	const theme = useThemeStore()
	const isDark = ref(theme.effectiveTheme === 'dark')

	const onThemeChanged = (newTheme) => {
		isDark.value = newTheme === 'dark'
	}

	onMounted(() => {
		// H5 端：通过 CSS 变量 / data-theme 自动响应
		// App 端：通过 uni.$emit 事件手动响应
		uni.$on('themeChanged', onThemeChanged)
		// 初始同步
		isDark.value = theme.effectiveTheme === 'dark'
	})

	onBeforeUnmount(() => {
		uni.$off('themeChanged', onThemeChanged)
	})

	return { isDark, effectiveTheme: theme.effectiveTheme }
}
