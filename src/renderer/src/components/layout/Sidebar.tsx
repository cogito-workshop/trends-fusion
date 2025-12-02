import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { cn } from '../../lib/utils'
import {
  LayoutDashboard,
  Database,
  Brain,
  Share2,
  Settings,
  Bell,
  Bot,
  LogOut,
  User,
  BarChart3,
} from 'lucide-react'

const navigation = [
  { name: '控制面板', to: '/dashboard', icon: LayoutDashboard },
  { name: '数据采集', to: '/collection', icon: Database },
  { name: '数据分析', to: '/analytics', icon: BarChart3 },
  { name: '智能总结', to: '/summary', icon: Brain },
  { name: '发布管理', to: '/publish', icon: Share2 },
  { name: '通知系统', to: '/notifications', icon: Bell },
  { name: '自动配置', to: '/automation', icon: Bot },
  { name: '应用设置', to: '/settings', icon: Settings },
]

export default function Sidebar() {
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
  }

  return (
    <div className='flex h-full w-64 flex-col border-r bg-card'>
      <div className='flex h-16 items-center border-b px-6'>
        <div className='flex items-center gap-3'>
          <div className='h-8 w-8 rounded-lg bg-primary flex items-center justify-center'>
            <span className='text-primary-foreground font-bold text-sm'>T</span>
          </div>
          <div>
            <h1 className='text-lg font-semibold'>Trends Fusion</h1>
            <p className='text-xs text-muted-foreground'>AI内容工作流</p>
          </div>
        </div>
      </div>

      <nav className='flex-1 space-y-1 px-3 py-4'>
        {navigation.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )
              }
            >
              <Icon className='h-5 w-5' />
              {item.name}
            </NavLink>
          )
        })}
      </nav>

      <div className='border-t p-4'>
        <div className='flex items-center gap-3 rounded-lg bg-accent/50 p-3 mb-2'>
          <div className='h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center'>
            <User className='h-4 w-4 text-primary' />
          </div>
          <div className='flex-1 overflow-hidden'>
            <p className='text-sm font-medium truncate'>{user?.name || '用户'}</p>
            <p className='text-xs text-muted-foreground truncate'>{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className='flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground'
        >
          <LogOut className='h-5 w-5' />
          退出登录
        </button>
      </div>
    </div>
  )
}
