import { useEffect, useState } from 'react'
import api from '../utils/api'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import {
  TrendingUp, TrendingDown, Users, AlertTriangle,
  BadgeIndianRupee, Wallet, Activity, Zap, RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [insights, setInsights] = useState('')
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/dashboard/stats')
      setStats(data)
    } catch {
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const fetchInsights = async () => {
    setInsightsLoading(true)
    try {
      const { data } = await api.get('/ai/quick-insights')
      setInsights(data.insights)
    } catch {
      setInsights('Unable to load AI insights.')
    } finally {
      setInsightsLoading(false)
    }
  }

  useEffect(() => { fetchStats(); fetchInsights() }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <svg className="animate-spin w-8 h-8 text-brand-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        <p className="text-dark-400 text-sm">Loading dashboard...</p>
      </div>
    </div>
  )

  const trendData = stats?.monthly_trend?.map(t => ({
    name: t.month_label,
    Collections: t.collections,
    Expenses: stats.expense_trend?.find(e => e.month_label === t.month_label)?.expenses || 0
  })) || []

  const modeData = stats?.mode_breakdown?.map(m => ({
    name: m.payment_mode?.replace('_', ' ').toUpperCase(),
    value: m.total
  })) || []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-dark-400 text-sm mt-0.5">Future Optima IT Solutions — Live Finance Overview</p>
        </div>
        <button onClick={fetchStats} className="btn-secondary">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard icon={<BadgeIndianRupee size={20} />} iconBg="bg-brand-500/20 text-brand-400"
          label="Today's Collection" value={fmt(stats?.today_collection)} trend="+live" />
        <StatCard icon={<TrendingUp size={20} />} iconBg="bg-emerald-500/20 text-emerald-400"
          label="This Month Income" value={fmt(stats?.month_collection)} />
        <StatCard icon={<TrendingDown size={20} />} iconBg="bg-red-500/20 text-red-400"
          label="This Month Expenses" value={fmt(stats?.month_expenses)} />
        <StatCard icon={<Wallet size={20} />}
          iconBg={stats?.month_profit >= 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}
          label="Net Profit" value={fmt(stats?.month_profit)}
          valueColor={stats?.month_profit >= 0 ? 'text-emerald-400' : 'text-red-400'} />
        <StatCard icon={<Users size={20} />} iconBg="bg-blue-500/20 text-blue-400"
          label="Active Students" value={stats?.active_students} />
        <StatCard icon={<AlertTriangle size={20} />} iconBg="bg-yellow-500/20 text-yellow-400"
          label="Overdue Installments" value={stats?.overdue_count} sub={fmt(stats?.overdue_amount)} />
        <StatCard icon={<Activity size={20} />} iconBg="bg-purple-500/20 text-purple-400"
          label="Total Outstanding" value={fmt(stats?.total_outstanding)} />
        <div className="card flex flex-col justify-between bg-gradient-to-br from-brand-500/20 to-purple-500/10 border-brand-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={16} className="text-brand-400" />
            <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">Elyra Insights</span>
          </div>
          {insightsLoading ? (
            <div className="flex items-center gap-2 text-dark-400 text-sm">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg> Analyzing...
            </div>
          ) : (
            <p className="text-dark-200 text-xs leading-relaxed whitespace-pre-line">{insights}</p>
          )}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue vs Expense Trend */}
        <div className="card xl:col-span-2">
          <h3 className="text-base font-semibold text-white mb-5">Revenue vs Expenses (6 months)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12 }}
                labelStyle={{ color: '#f1f5f9' }}
                formatter={v => [`₹${Number(v).toLocaleString('en-IN')}`, '']}
              />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
              <Area type="monotone" dataKey="Collections" stroke="#6366f1" fill="url(#colGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="Expenses" stroke="#ef4444" fill="url(#expGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Mode Pie */}
        <div className="card">
          <h3 className="text-base font-semibold text-white mb-5">Payment Modes (This Month)</h3>
          {modeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={modeData} cx="50%" cy="45%" outerRadius={85} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false} fontSize={10}>
                  {modeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={v => [`₹${Number(v).toLocaleString('en-IN')}`, '']}
                  contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-dark-500 text-sm">No collections this month</div>
          )}
        </div>
      </div>

      {/* Course Revenue */}
      <div className="card">
        <h3 className="text-base font-semibold text-white mb-5">Course-wise Revenue</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={stats?.course_revenue || []} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
            <XAxis type="number" stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }}
              tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
            <YAxis type="category" dataKey="course_name" stroke="#475569"
              tick={{ fill: '#94a3b8', fontSize: 11 }} width={200} />
            <Tooltip
              contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12 }}
              formatter={v => [`₹${Number(v).toLocaleString('en-IN')}`, '']}
            />
            <Bar dataKey="collected" fill="#6366f1" radius={[0, 6, 6, 0]} name="Collected" />
            <Bar dataKey="total_fees" fill="#334155" radius={[0, 6, 6, 0]} name="Total Fees" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function StatCard({ icon, iconBg, label, value, sub, trend, valueColor }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${iconBg}`}>{icon}</div>
      <div>
        <p className="stat-label">{label}</p>
        <p className={`stat-value ${valueColor || ''}`}>{value}</p>
        {sub && <p className="text-xs text-dark-500 mt-0.5">{sub} pending</p>}
        {trend && <span className="badge-green mt-1">{trend}</span>}
      </div>
    </div>
  )
}
