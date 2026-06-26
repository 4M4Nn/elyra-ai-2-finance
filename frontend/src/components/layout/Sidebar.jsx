import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, Users, BookOpen, DollarSign, TrendingDown,
  FileText, Bot, LogOut, ChevronRight, Layers, BadgeIndianRupee,
  GraduationCap, BarChart3, Receipt
} from 'lucide-react'
import clsx from 'clsx'

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/students', icon: GraduationCap, label: 'Students' },
  { to: '/collections', icon: BadgeIndianRupee, label: 'Collections' },
  { to: '/expenses', icon: TrendingDown, label: 'Expenses' },
  { to: '/salary', icon: DollarSign, label: 'Salary' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/courses', icon: BookOpen, label: 'Courses' },
  { to: '/elyra', icon: Bot, label: 'Elyra AI' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <aside className="w-64 min-h-screen bg-dark-900 border-r border-dark-700 flex flex-col fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="p-6 border-b border-dark-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center glow">
            <Layers size={20} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">Elyra AI 2</p>
            <p className="text-xs text-dark-400 leading-tight">Finance Agent</p>
          </div>
        </div>
        <div className="mt-3 px-2 py-1.5 bg-brand-500/10 rounded-lg border border-brand-500/20">
          <p className="text-xs text-brand-400 font-medium truncate">Future Optima IT Solutions</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
              isActive
                ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                : 'text-dark-400 hover:text-dark-100 hover:bg-dark-800'
            )}
          >
            <Icon size={17} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-dark-700">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-dark-800 mb-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
            <span className="text-brand-400 font-bold text-xs">{user?.name?.[0]?.toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-dark-400 capitalize">{user?.role}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
