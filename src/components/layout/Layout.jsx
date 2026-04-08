import { useState, useEffect, useCallback } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'
import Footer from './Footer'
import ScrollToTop from '../ui/ScrollToTop'
import AuthModal from '../auth/AuthModal'
export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const location = useLocation()

  const closeSidebar = useCallback(() => setSidebarOpen(false), [])

  // 侧边栏打开时锁定 body 滚动，防止触摸被误判为滚动
  useEffect(() => {
    if (sidebarOpen && window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [sidebarOpen])

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onCloseSidebar={closeSidebar}
        onOpenAuth={() => setAuthOpen(true)}
        sidebarOpen={sidebarOpen}
      />

      <div className="flex flex-1">
        {/* 桌面端：固定侧边栏，推挤内容 */}
        <aside
          className={`hidden lg:block shrink-0 bg-stone-sidebar border-r border-stone-border sticky top-14 h-[calc(100vh-3.5rem)] overflow-hidden transition-[width] duration-300 ease-out ${
            sidebarOpen ? 'w-60' : 'w-0'
          }`}
        >
          <div className="w-60 h-full overflow-y-auto">
            <Sidebar />
          </div>
        </aside>

        {/* 手机端：覆盖层侧边栏（全屏，从顶部覆盖 header） */}
        <div className="lg:hidden">
          <button
            type="button"
            aria-label="关闭菜单"
            className={`fixed inset-0 w-full h-full bg-black/40 z-40 transition-opacity duration-300 border-none outline-none cursor-default ${
              sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={closeSidebar}
            onTouchEnd={closeSidebar}
          />
          <aside
            className={`fixed right-0 top-0 bottom-0 w-72 bg-stone-card border-l border-stone-border z-50 shadow-xl overflow-hidden transition-transform duration-300 ease-out flex flex-col ${
              sidebarOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {/* 顶部占位：与 header 等高，让 header 中的 X 按钮在视觉上对齐 */}
            <div className="h-14 shrink-0" />
            <div className="flex-1 min-h-0">
              <Sidebar />
            </div>
          </aside>
        </div>

        {/* Main content */}
        <main className="flex-1 min-w-0 flex flex-col">
          <div className="flex-1">
            <Outlet context={{ onOpenAuth: () => setAuthOpen(true) }} />
          </div>
          <Footer />
        </main>
      </div>

      <ScrollToTop />

      {/* Auth Modal */}
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </div>
  )
}
