import { useEffect, useState } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Plus, X } from 'lucide-react'

const fmt = n => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function Salary() {
  const today = new Date()
  const [records, setRecords] = useState([])
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [year, setYear] = useState(today.getFullYear())
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    staff_name: '', designation: '', month: today.getMonth() + 1, year: today.getFullYear(),
    gross_salary: '', deductions: 0, paid_date: new Date().toISOString().split('T')[0], payment_mode: 'bank_transfer'
  })

  const fetch = async () => {
    try {
      const { data } = await api.get('/salary', { params: { month, year } })
      setRecords(data)
    } catch { toast.error('Failed') }
  }

  useEffect(() => { fetch() }, [month, year])

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      await api.post('/salary', { ...form, gross_salary: +form.gross_salary, deductions: +form.deductions, month: +form.month, year: +form.year })
      toast.success('Salary record added')
      setShowModal(false)
      fetch()
    } catch (err) { toast.error(err.response?.data?.detail || 'Error') }
  }

  const total = records.reduce((s, r) => s + r.net_salary, 0)

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Salary</h1>
          <p className="text-dark-400 text-sm mt-0.5">Total this period: {fmt(total)}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary"><Plus size={16} /> Add Record</button>
      </div>

      <div className="flex gap-3">
        <select className="select w-40 text-sm" value={month} onChange={e => setMonth(+e.target.value)}>
          {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
        </select>
        <select className="select w-28 text-sm" value={year} onChange={e => setYear(+e.target.value)}>
          {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr><th>Staff Name</th><th>Designation</th><th>Gross</th><th>Deductions</th><th>Net Salary</th><th>Mode</th><th>Paid Date</th></tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr><td colSpan="7" className="text-center py-12 text-dark-500">No salary records for this period</td></tr>
            ) : records.map(r => (
              <tr key={r.id}>
                <td className="text-white font-medium">{r.staff_name}</td>
                <td className="text-dark-400">{r.designation || '—'}</td>
                <td>{fmt(r.gross_salary)}</td>
                <td className="text-red-400">{fmt(r.deductions)}</td>
                <td className="text-emerald-400 font-bold">{fmt(r.net_salary)}</td>
                <td className="text-dark-400 capitalize">{r.payment_mode?.replace('_', ' ')}</td>
                <td className="text-dark-400">{r.paid_date || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="text-lg font-bold text-white">Add Salary Record</h2>
              <button onClick={() => setShowModal(false)} className="text-dark-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="label">Staff Name *</label>
                    <input className="input" value={form.staff_name} onChange={e => setForm({...form, staff_name: e.target.value})} required placeholder="Full name" />
                  </div>
                  <div>
                    <label className="label">Designation</label>
                    <input className="input" value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} placeholder="e.g. Trainer" />
                  </div>
                  <div>
                    <label className="label">Payment Mode</label>
                    <select className="select" value={form.payment_mode} onChange={e => setForm({...form, payment_mode: e.target.value})}>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cash">Cash</option>
                      <option value="upi">UPI</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Month</label>
                    <select className="select" value={form.month} onChange={e => setForm({...form, month: +e.target.value})}>
                      {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Year</label>
                    <select className="select" value={form.year} onChange={e => setForm({...form, year: +e.target.value})}>
                      {[2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Gross Salary (₹) *</label>
                    <input className="input" type="number" value={form.gross_salary} onChange={e => setForm({...form, gross_salary: e.target.value})} required />
                  </div>
                  <div>
                    <label className="label">Deductions (₹)</label>
                    <input className="input" type="number" value={form.deductions} onChange={e => setForm({...form, deductions: e.target.value})} />
                  </div>
                  <div>
                    <label className="label">Net Salary</label>
                    <div className="input bg-dark-700 text-emerald-400 font-bold">
                      {fmt((+form.gross_salary || 0) - (+form.deductions || 0))}
                    </div>
                  </div>
                  <div>
                    <label className="label">Paid Date</label>
                    <input className="input" type="date" value={form.paid_date} onChange={e => setForm({...form, paid_date: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
