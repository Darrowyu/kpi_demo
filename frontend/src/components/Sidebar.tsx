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
} from 'lucide-react'
import { cn } from '../lib/utils'
import { useState } from 'react'

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
}

export function Sidebar({ collapsed, onCollapse }: SidebarProps) {
  const location = useLocation()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen flex flex-col transition-all duration-300 ease-in-out',
        collapsed ? 'w-20' : 'w-64'
      )}
      style={{
        background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        borderRight: '1px solid rgba(226, 232, 240, 0.8)',
        boxShadow: '4px 0 24px rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* Logo区域 */}
      <div
        className={cn(
          'flex h-20 items-center flex-shrink-0 transition-all duration-300',
          collapsed ? 'justify-center px-4' : 'justify-between px-6'
        )}
        style={{
          borderBottom: '1px solid rgba(226, 232, 240, 0.6)',
        }}
      >
        {/* 折叠状态：仅显示图标 */}
        {collapsed && (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #0891b2 0%, #4f46e5 100%)',
              boxShadow: '0 4px 14px rgba(8, 145, 178, 0.35)',
            }}
          >
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
        )}

        {/* 展开状态：显示完整Logo和折叠按钮 */}
        {!collapsed && (
          <>
            <div className="flex items-center gap-3">
              {/* Logo图标 */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #0891b2 0%, #4f46e5 100%)',
                  boxShadow: '0 4px 14px rgba(8, 145, 178, 0.35)',
                }}
              >
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              {/* 标题区域 */}
              <div>
                <span
                  className="text-lg font-bold block leading-tight"
                  style={{
                    background: 'linear-gradient(135deg, #0e7490 0%, #4f46e5 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  KPI绩效
                </span>
                <span className="text-xs text-slate-400 font-medium">管理系统</span>
              </div>
            </div>
            {/* 折叠按钮 */}
            <button
              onClick={() => onCollapse(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200"
            >
              <ChevronLeft size={18} />
            </button>
          </>
        )}
      </div>

      {/* 菜单区域 */}
      <nav className="flex-1 space-y-1 p-3 mt-2 overflow-y-auto">
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
                'group relative flex items-center gap-3 rounded-[12px] text-sm font-medium transition-all duration-200',
                collapsed ? 'justify-center p-3' : 'px-4 py-3 mx-1',
                isActive
                  ? 'text-cyan-700'
                  : 'text-slate-600 hover:text-slate-900'
              )}
              style={{
                background: isActive
                  ? 'linear-gradient(135deg, rgba(8, 145, 178, 0.12) 0%, rgba(79, 70, 229, 0.06) 100%)'
                  : isHovered
                    ? 'rgba(241, 245, 249, 0.8)'
                    : 'transparent',
              }}
            >
              {/* 激活指示器 - 左侧渐变条 */}
              {isActive && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 rounded-r-full"
                  style={{
                    background: 'linear-gradient(180deg, #0891b2, #4f46e5)',
                  }}
                />
              )}

              {/* 图标容器 */}
              <div
                className={cn(
                  'flex items-center justify-center transition-all duration-200',
                  collapsed ? 'w-10 h-10' : 'w-10 h-10'
                )}
                style={{
                  borderRadius: '10px',
                  background: isActive
                    ? 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)'
                    : isHovered
                      ? 'rgba(8, 145, 178, 0.1)'
                      : 'rgba(241, 245, 249, 0.5)',
                  boxShadow: isActive ? '0 4px 12px rgba(8, 145, 178, 0.3)' : 'none',
                  transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                <Icon
                  size={collapsed ? 20 : 18}
                  className={cn(
                    'transition-colors duration-200',
                    isActive ? 'text-white' : 'text-slate-500 group-hover:text-cyan-600'
                  )}
                />
              </div>

              {/* 标签 */}
              {!collapsed && (
                <span className={cn(
                  'transition-all duration-200',
                  isActive ? 'font-semibold' : ''
                )}>
                  {item.label}
                </span>
              )}

              {/* 悬停提示（仅折叠时显示） */}
              {collapsed && isHovered && (
                <div
                  className="absolute left-full ml-3 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap z-50"
                  style={{
                    background: 'rgba(15, 23, 42, 0.9)',
                    color: 'white',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                  }}
                >
                  {item.label}
                </div>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* 展开按钮（仅折叠时显示） */}
      {collapsed && (
        <div className="flex-shrink-0 p-4 flex justify-center">
          <button
            onClick={() => onCollapse(false)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200"
            style={{
              background: 'rgba(255, 255, 255, 0.8)',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* 底部状态区（仅展开时显示） */}
      {!collapsed && (
        <div
          className="flex-shrink-0 p-4"
          style={{
            borderTop: '1px solid rgba(226, 232, 240, 0.6)',
          }}
        >
          {/* 玻璃态效果卡片 */}
          <div
            className="rounded-xl p-4"
            style={{
              background: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.8)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              {/* 绿色状态指示点（带发光效果） */}
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  boxShadow: '0 0 8px rgba(16, 185, 129, 0.6), 0 0 16px rgba(16, 185, 129, 0.3)',
                }}
              />
              <span className="text-xs font-medium text-slate-500">系统状态</span>
            </div>
            <p className="text-sm font-semibold text-slate-700">运行正常</p>
          </div>
        </div>
      )}
    </aside>
  )
}

export default Sidebar
