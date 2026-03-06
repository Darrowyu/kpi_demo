import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { cn } from '../lib/utils'

type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'kpi-theme-preference'

// 同步获取初始主题（避免闪烁）
const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light'
  const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null
  if (saved === 'light' || saved === 'dark') return saved
  // 默认使用亮色主题
  return 'light'
}

export function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const [theme, setTheme] = useState<Theme>(getInitialTheme)
  const [mounted, setMounted] = useState(false)

  // 标记初始化完成
  useEffect(() => {
    setMounted(true)
  }, [])

  // 切换主题并保存到 localStorage
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem(THEME_STORAGE_KEY, newTheme)
  }

  // 防止hydration不匹配，初始渲染使用透明背景
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div
      data-theme={theme}
      className={cn(
        'min-h-screen transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]',
        theme === 'dark' ? 'bg-zinc-950' : 'bg-gray-50'
      )}
    >
      <Sidebar collapsed={collapsed} onCollapse={setCollapsed} theme={theme} onToggleTheme={toggleTheme} />
      <main
        className={cn(
          'transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] min-h-screen',
          collapsed ? 'ml-20' : 'ml-64'
        )}
      >
        <div className="p-6">
          <div
            className={cn(
              'border rounded-xl p-6 min-h-[calc(100vh-3rem)] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]',
              theme === 'dark'
                ? 'bg-zinc-900 border-zinc-800'
                : 'bg-white border-gray-200 shadow-sm'
            )}
          >
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}

export default Layout
