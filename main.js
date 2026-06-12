import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { useThemeStore } from '@/stores/theme'

export function createApp() {
	const app = createSSRApp(App)
	const pinia = createPinia()
	app.use(pinia)

	// 初始化主题（确保在渲染前应用）
	const theme = useThemeStore()
	theme.resolveTheme()

	return {
		app,
		pinia
	}
}
