import { useEffect, useState } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Plus, Download, X, Trash2 } from 'lucide-react'

const fmt = n => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
const CATEGORIES = ['salary','rent','utilities','marketing','infrastructure','stationery','maintenance','travel','miscellaneous']

export default function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [summary, setSummary] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [form, setForm] = useState({
    category: 'rent', description: '', amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    payment_mode: 'upi', vendor: '', reference: ''
  })

  const today = new Date()
  const fetch = async () => {
    setLoading(true)
    try {
      const params = {}
      if (fromDate) params.from_date = fromDate
      if (toDate) params.to_date = toDate
      const [e, s] = await Promise.all([
        api.get('/expenses', { params }),
        api.get('/expenses/summary/category', { params: { month: today.getMonth() + 1, year: today.getFullYear() } })
      ])
      setExpenses(e.data)
      setSummary(s.data)
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [fromDate, toDate])

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      await api.post('/expenses', { ...form, amount: +form.amount })
      toast.success('Expense added')
      setShowModal(false)
      setForm({ category: 'rent', description: '', amount: '', expense_date: new Date().toISOString().split('T')[0], payment_mode: 'upi', vendor: '', reference: '' })
      fetch()
    } catch (err) { toast.error(err.response?.data?.detail || 'Error') }
  }

  const handleDelete = async id => {
    if (!confirm('Delete this expense?')) return
    await api.delete(`/expenses/${id}`)
    toast.success('Deleted')
    fetch()
  }

  const exportExcel = async () => {
    const res = await api.get('/expenses/export/excel', { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url; a.download = 'expenses_export.xlsx'; a.click()
  }

  const totalMonth = summary.reduce((s, r) => s + r.total, 0)

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="text-dark-400 text-sm mt-0.5">This month: {fmt(totalMonth)}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportExcel} className="btn-secondary"><Download size={15} /> Export</button>
          <button onClick={() => setShowModal(true)} className="btn-primary"><Plus size={16} /> Add Expense</button>
        </div>
      </div>

      {/* Category Summary */}
      <div className="grid grid-cols-3 xl:grid-cols-5 gap-4">
        {summary.slice(0, 5).map(s => (
          <div key={s.category} className="card-sm">
            <p className="text-dark-400 text-xs capitalize mb-1">{s.category}</p>
            <p className="text-white font-bold">{fmt(s.total)}</p>
            <div className="mt-2 h-1 bg-dark-700 rounded-full">
              <div className="h-1 bg-brand-500 rounded-full" style={{ width: `${Math.min((s.total / totalMonth) * 100, 100)}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div><label className="label">From</label><input type="date" className="input w-44 text-sm" value={fromDate} onChange={e => setFromDate(e.target.value)} /></div>
        <div><label className="label">To</label><input type="date" className="input w-44 text-sm" value={toDate} onChange={e => setToDate(e.target.value)} /></div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr><th>Category</th><th>Description</th><th>Vendor</th><th>Amount</th><th>Mode</th><th>Date</th><th>Ref</th><th></th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="text-center py-12 text-dark-400">Loading...</td></tr>
            ) : expenses.length === 0 ? (
              <tr><td colSpan="8" className="text-center py-12 text-dark-500">No expenses found</td></tr>
            ) : expenses.map(e => (
              <tr key={e.id}>
                <td><span className="badge-blue capitalize">{e.category}</span></td>
                <td className="text-white">{e.description}</td>
                <td className="text-dark-400">{e.vendor || '—'}</td>
                <td className="text-red-400 font-semibold">{fmt(e.amount)}</td>
                <td className="text-dark-400 capitalize">{e.payment_mode?.replace('_', ' ')}</td>
                <td className="text-dark-400">{e.expense_date}</td>
                <td className="text-dark-500 text-xs">{e.reference || '—'}</td>
                <td>
                  <button onClick={() => handleDelete(e.id)} className="text-red-400/50 hover:text-red-400 p-1.5 hover:bg-red-500/10 rounded-lg transition-all">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="text-lg font-bold text-white">Add Expense</h2>
              <button onClick={() => setShowModal(false)} className="text-dark-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Category *</label>
                    <select className="select" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Amount (₹) *</label>
                    <input className="input" type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
                  </div>
                </div>
                <div>
                  <label className="label">Description *</label>
                  <input className="input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} required placeholder="What was this expense for?" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Date *</label>
                    <input className="input" type="date" value={form.expense_date} onChange={e => setForm({...form, expense_date: e.target.value})} required />
                  </div>
                  <div>
                    <label className="label">Payment Mode *</label>
                    <select className="select" value={form.payment_mode} onChange={e => setForm({...form, payment_mode: e.target.value})}>
                      <option value="cash">Cash</option><option value="upi">UPI</option>
                      <option value="bank_transfer">Bank Transfer</option><option value="cheque">Cheque</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Vendor</label>
                    <input className="input" value={form.vendor} onChange={e => setForm({...form, vendor: e.target.value})} placeholder="Vendor name" />
                  </div>
                  <div>
                    <label className="label">Reference</label>
                    <input className="input" value={form.reference} onChange={e => setForm({...form, reference: e.target.value})} placeholder="Bill / receipt no" />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Add Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
