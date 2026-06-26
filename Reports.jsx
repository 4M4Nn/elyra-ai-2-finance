import { useEffect, useState } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Download, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'

const fmt = n => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function Reports() {
  const today = new Date()
  const [pnl, setPnl] = useState(null)
  const [outstanding, setOutstanding] = useState([])
  const [overdue, setOverdue] = useState([])
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [year, setYear] = useState(today.getFullYear())
  const [tab, setTab] = useState('pnl')

  const fetchPnl = async () => {
    try {
      const { data } = await api.get('/reports/pnl', { params: { month, year } })
      setPnl(data)
    } catch { toast.error('Failed to load P&L') }
  }

  const fetchOutstanding = async () => {
    try {
      const [o, od] = await Promise.all([api.get('/reports/outstanding'), api.get('/reports/overdue-installments')])
      setOutstanding(o.data)
      setOverdue(od.data)
    } catch { toast.error('Failed') }
  }

  useEffect(() => { fetchPnl() }, [month, year])
  useEffect(() => { fetchOutstanding() }, [])

  const exportPnl = async () => {
    const res = await api.get('/reports/pnl/export/excel', { params: { month, year }, responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a'); a.href = url; a.download = `pnl_${month}_${year}.xlsx`; a.click()
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="text-dark-400 text-sm mt-0.5">P&L, Outstanding & Overdue Analysis</p>
        </div>
        {tab === 'pnl' && <button onClick={exportPnl} className="btn-secondary"><Download size={15} /> Export P&L</button>}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {['pnl', 'outstanding', 'overdue'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${tab === t ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' : 'text-dark-400 hover:text-white hover:bg-dark-800'}`}>
            {t === 'pnl' ? 'P&L Report' : t === 'outstanding' ? 'Outstanding Fees' : 'Overdue Installments'}
          </button>
        ))}
      </div>

      {/* P&L Tab */}
      {tab === 'pnl' && (
        <div className="space-y-6">
          <div className="flex gap-3">
            <select className="select w-36 text-sm" value={month} onChange={e => setMonth(+e.target.value)}>
              {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
            <select className="select w-28 text-sm" value={year} onChange={e => setYear(+e.target.value)}>
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {pnl && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Income */}
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={18} className="text-emerald-400" />
                  <h3 className="font-semibold text-white">Income</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-3 border-b border-dark-700">
                    <span className="text-dark-300">Total Collections</span>
                    <span className="text-emerald-400 font-bold text-lg">{fmt(pnl.total_income)}</span>
                  </div>
                </div>
              </div>

              {/* Expenses */}
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingDown size={18} className="text-red-400" />
                  <h3 className="font-semibold text-white">Expenses</h3>
                </div>
                <div className="space-y-2">
                  {pnl.expenses_breakdown.map(e => (
                    <div key={e.category} className="flex justify-between items-center text-sm">
                      <span className="text-dark-300 capitalize">{e.category}</span>
                      <span className="text-red-400">{fmt(e.total)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center text-sm pt-1">
                    <span className="text-dark-300">Salary</span>
                    <span className="text-red-400">{fmt(pnl.salary_total)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-dark-700">
                    <span className="text-dark-200 font-semibold">Total Expenses</span>
                    <span className="text-red-400 font-bold">{fmt(pnl.total_expenses)}</span>
                  </div>
                </div>
              </div>

              {/* Net Profit */}
              <div className={`card border-2 ${pnl.net_profit >= 0 ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                <h3 className="font-semibold text-white mb-6">Net Profit / Loss</h3>
                <div className="text-center py-4">
                  <p className={`text-4xl font-bold ${pnl.net_profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {fmt(pnl.net_profit)}
                  </p>
                  <p className="text-dark-400 mt-2 text-sm">{MONTHS[month - 1]} {year}</p>
                  <div className="mt-4 p-3 bg-dark-800 rounded-xl">
                    <p className="text-xs text-dark-400">Margin</p>
                    <p className="text-white font-semibold">
                      {pnl.total_income > 0 ? ((pnl.net_profit / pnl.total_income) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Outstanding Tab */}
      {tab === 'outstanding' && (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr><th>Student ID</th><th>Name</th><th>Phone</th><th>Course</th><th>Net Fee</th><th>Paid</th><th>Balance</th></tr>
            </thead>
            <tbody>
              {outstanding.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-12 text-dark-500">No outstanding fees 🎉</td></tr>
              ) : outstanding.map(s => (
                <tr key={s.student_id}>
                  <td><span className="font-mono text-brand-400 text-xs">{s.student_id}</span></td>
                  <td className="text-white font-medium">{s.name}</td>
                  <td className="text-dark-400">{s.phone}</td>
                  <td><span className="badge-blue text-xs">{s.course_name}</span></td>
                  <td>{fmt(s.net_fee)}</td>
                  <td className="text-emerald-400">{fmt(s.paid)}</td>
                  <td className="text-red-400 font-bold">{fmt(s.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Overdue Tab */}
      {tab === 'overdue' && (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr><th>Student</th><th>Phone</th><th>Course</th><th>Installment</th><th>Due Date</th><th>Due Amount</th><th>Paid</th><th>Remaining</th></tr>
            </thead>
            <tbody>
              {overdue.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-12 text-dark-500">No overdue installments 🎉</td></tr>
              ) : overdue.map(i => (
                <tr key={i.id}>
                  <td>
                    <div>
                      <p className="text-white text-sm">{i.student_name}</p>
                      <p className="text-dark-500 text-xs">{i.student_code}</p>
                    </div>
                  </td>
                  <td className="text-dark-400">{i.phone}</td>
                  <td><span className="badge-blue text-xs">{i.course_name}</span></td>
                  <td className="text-dark-300">#{i.installment_no}</td>
                  <td className="text-red-400">{i.due_date}</td>
                  <td>{fmt(i.amount_due)}</td>
                  <td className="text-emerald-400">{fmt(i.amount_paid)}</td>
                  <td className="text-red-400 font-bold">{fmt(i.amount_due - i.amount_paid)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
