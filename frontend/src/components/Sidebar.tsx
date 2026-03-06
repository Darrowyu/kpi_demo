import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Upload,
  Users,
  Settings,
  Calculator,
  FileText,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Sun,
  Moon,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { useState } from 'react'

type Theme = 'light' | 'dark'

interface MenuItem {
  key: string
  label: string
  icon: React.ElementType
  path: string
}

const menuItems: MenuItem[] = [
  { key: 'dashboard', label: '仪表盘', icon: LayoutDashboard, path: '/' },
  { key: 'upload', label: '数据上传', icon: Upload, path: '/upload' },
  { key: 'employees', label: '员工管理', icon: Users, path: '/employees' },
  { key: 'standards', label: '标准参数', icon: Settings, path: '/standards' },
  { key: 'kpi-calc', label: 'KPI计算', icon: Calculator, path: '/kpi-calculation' },
  { key: 'kpi-report', label: 'KPI报告', icon: FileText, path: '/kpi-report' },
]

interface SidebarProps {
  collapsed: boolean
  onCollapse: (collapsed: boolean) => void
  theme: Theme
  onToggleTheme: () => void
}

export function Sidebar({ collapsed, onCollapse, theme, onToggleTheme }: SidebarProps) {
  const location = useLocation()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen flex flex-col bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transition-all duration-300 ease-in-out',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo区域 */}
      <div
        className={cn(
          'flex h-16 items-center flex-shrink-0 border-b border-zinc-200 dark:border-zinc-800 transition-all duration-300',
          collapsed ? 'justify-center px-4' : 'justify-between px-4'
        )}
      >
        {/* 折叠状态：仅显示图标 */}
        {collapsed && (
          <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-zinc-700 dark:text-zinc-100" />
          </div>
        )}

        {/* 展开状态：显示完整Logo和折叠按钮 */}
        {!collapsed && (
          <>
            <div className="flex items-center gap-3">
              {/* Logo图标 */}
              <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-zinc-700 dark:text-zinc-100" />
              </div>
              {/* 标题区域 */}
              <div>
                <span className="text-base font-semibold block leading-tight text-zinc-900 dark:text-zinc-100">
                  KPI绩效
                </span>
                <span className="text-xs text-zinc-500">管理系统</span>
              </div>
            </div>
            {/* 折叠按钮 */}
            <button
              onClick={() => onCollapse(true)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200"
            >
              <ChevronLeft size={18} />
            </button>
          </>
        )}
      </div>

      {/* 菜单区域 */}
      <nav className="flex-1 space-y-1 p-2 mt-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path))
          const Icon = item.icon
          const isHovered = hoveredItem === item.key

          return (
            <NavLink
              key={item.key}
              to={item.path}
              onMouseEnter={() => setHoveredItem(item.key)}
              onMouseLeave={() => setHoveredItem(null)}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200',
                collapsed ? 'justify-center p-3' : 'px-3 py-2.5',
                isActive
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/50'
              )}
            >
              {/* 激活指示器 - 左侧白条 */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-zinc-900 dark:bg-zinc-100 rounded-r" />
              )}

              {/* 图标容器 */}
              <div
                className={cn(
                  'flex items-center justify-center transition-all duration-200',
                  collapsed ? 'w-9 h-9' : 'w-8 h-8',
                  isActive
                    ? 'text-zinc-900 dark:text-zinc-100'
                    : 'text-zinc-400 group-hover:text-zinc-700 dark:text-zinc-500 dark:group-hover:text-zinc-300'
                )}
              >
                <Icon size={collapsed ? 20 : 18} />
              </div>

              {/* 标签 */}
              {!collapsed && (
                <span className={cn(
                  'transition-all duration-200',
                  isActive ? 'font-medium' : ''
                )}>
                  {item.label}
                </span>
              )}

              {/* 悬停提示（仅折叠时显示） */}
              {collapsed && isHovered && (
                <div className="absolute left-full ml-2 px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap z-50 bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-lg">
                  {item.label}
                </div>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* 底部区域 - 展开按钮 / 主题切换 / 系统状态 */}
      <div className="flex-shrink-0 p-3 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
        {/* 展开按钮（仅折叠时显示） */}
        {collapsed && (
          <div className="flex justify-center">
            <button
              onClick={() => onCollapse(false)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200 border border-zinc-200 dark:border-zinc-800"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* 主题切换按钮 */}
        <button
          onClick={onToggleTheme}
          className={cn(
            'w-full flex items-center gap-3 rounded-lg transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
            collapsed ? 'justify-center p-2' : 'px-3 py-2',
            'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200',
            'hover:bg-zinc-100 dark:hover:bg-zinc-800'
          )}
          title={theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}
        >
          <div className="relative w-4 h-4">
            <Sun
              className={cn(
                'w-4 h-4 absolute inset-0 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]',
                theme === 'dark'
                  ? 'opacity-100 rotate-0 scale-100'
                  : 'opacity-0 rotate-90 scale-0'
              )}
            />
            <Moon
              className={cn(
                'w-4 h-4 absolute inset-0 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]',
                theme === 'light'
                  ? 'opacity-100 rotate-0 scale-100'
                  : 'opacity-0 -rotate-90 scale-0'
              )}
            />
          </div>
          {!collapsed && (
            <span className="text-sm transition-opacity duration-300">
              {theme === 'dark' ? '亮色模式' : '暗色模式'}
            </span>
          )}
        </button>

      </div>
    </aside>
  )
}

export default Sidebar
