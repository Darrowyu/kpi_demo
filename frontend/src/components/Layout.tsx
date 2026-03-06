import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { cn } from '../lib/utils'

export function Layout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div 
      className="min-h-screen"
      style={{
        background: 'linear-gradient(135deg, #f0f9ff 0%, #f8fafc 50%, #f5f3ff 100%)',
      }}
    >
      <Sidebar collapsed={collapsed} onCollapse={setCollapsed} />
      <main
        className={cn(
          'transition-all duration-300 ease-in-out min-h-screen',
          collapsed ? 'ml-20' : 'ml-64'
        )}
      >
        <div className="p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 p-6 min-h-[calc(100vh-4rem)]">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}

export default Layout
