import { useEffect, useState } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Plus, Download, FileDown, X, Receipt } from 'lucide-react'

const fmt = n => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

const MODE_BADGE = {
  cash: 'badge-green', upi: 'badge-blue', bank_transfer: 'badge-yellow',
  cheque: 'badge-yellow', card: 'badge-blue'
}

export default function Collections() {
  const [collections, setCollections] = useState([])
  const [summary, setSummary] = useState(null)
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [form, setForm] = useState({
    student_id: '', installment_id: '', amount: '',
    payment_mode: 'upi', payment_date: new Date().toISOString().split('T')[0],
    transaction_ref: '', notes: ''
  })
  const [studentDetail, setStudentDetail] = useState(null)

  const fetch = async () => {
    setLoading(true)
    try {
      const params = {}
      if (fromDate) params.from_date = fromDate
      if (toDate) params.to_date = toDate
      const [c, s] = await Promise.all([
        api.get('/collections', { params }),
        api.get('/students'),
      ])
      setCollections(c.data)
      setStudents(s.data)
      const summary = await api.get('/collections/daily-summary')
      setSummary(summary.data)
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [fromDate, toDate])

  const loadStudentDetail = async id => {
    if (!id) { setStudentDetail(null); return }
    const { data } = await api.get(`/students/${id}`)
    setStudentDetail(data)
    setForm(f => ({ ...f, amount: data.balance > 0 ? Math.min(data.balance, data.net_fee / (data.installments?.length || 1)) : '' }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      const { data } = await api.post('/collections', {
        ...form,
        student_id: +form.student_id,
        installment_id: form.installment_id ? +form.installment_id : null,
        amount: +form.amount,
      })
      toast.success(`Recorded! Receipt: ${data.receipt_no}`)
      setShowModal(false)
      resetForm()
      fetch()
    } catch (err) { toast.error(err.response?.data?.detail || 'Error') }
  }

  const resetForm = () => {
    setForm({ student_id: '', installment_id: '', amount: '', payment_mode: 'upi', payment_date: new Date().toISOString().split('T')[0], transaction_ref: '', notes: '' })
    setStudentDetail(null)
  }

  const downloadReceipt = async (id, receiptNo) => {
    const res = await api.get(`/collections/${id}/receipt/pdf`, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url; a.download = `receipt_${receiptNo}.pdf`; a.click()
  }

  const exportExcel = async () => {
    const params = {}
    if (fromDate) params.from_date = fromDate
    if (toDate) params.to_date = toDate
    const res = await api.get('/collections/export/excel', { params, responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url; a.download = 'collections_export.xlsx'; a.click()
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Collections</h1>
          <p className="text-dark-400 text-sm mt-0.5">Daily fee collection tracker</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportExcel} className="btn-secondary"><Download size={15} /> Export</button>
          <button onClick={() => setShowModal(true)} className="btn-primary"><Plus size={16} /> Record Payment</button>
        </div>
      </div>

      {/* Today's Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="card-sm">
            <p className="text-dark-400 text-xs mb-1">Today's Total</p>
            <p className="text-2xl font-bold text-white">{fmt(summary.total_collections)}</p>
            <p className="text-dark-500 text-xs">{summary.total_transactions} transactions</p>
          </div>
          {summary.breakdown.map(b => (
            <div key={b.payment_mode} className="card-sm">
              <p className="text-dark-400 text-xs mb-1 capitalize">{b.payment_mode?.replace('_', ' ')}</p>
              <p className="text-xl font-bold text-white">{fmt(b.total)}</p>
              <p className="text-dark-500 text-xs">{b.count} txns</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3">
        <div>
          <label className="label">From</label>
          <input type="date" className="input w-44 text-sm" value={fromDate} onChange={e => setFromDate(e.target.value)} />
        </div>
        <div>
          <label className="label">To</label>
          <input type="date" className="input w-44 text-sm" value={toDate} onChange={e => setToDate(e.target.value)} />
        </div>
        {(fromDate || toDate) && (
          <button onClick={() => { setFromDate(''); setToDate('') }}
            className="btn-secondary self-end text-xs">Clear</button>
        )}
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Receipt No</th><th>Student</th><th>Course</th>
              <th>Amount</th><th>Mode</th><th>Date</th><th>Ref</th>
              <th>Collected By</th><th>Receipt</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" className="text-center py-12 text-dark-400">Loading...</td></tr>
            ) : collections.length === 0 ? (
              <tr><td colSpan="9" className="text-center py-12 text-dark-500">No collections found</td></tr>
            ) : collections.map(c => (
              <tr key={c.id}>
                <td><span className="font-mono text-brand-400 text-xs">{c.receipt_no}</span></td>
                <td>
                  <div>
                    <p className="text-white font-medium text-sm">{c.student_name}</p>
                    <p className="text-dark-500 text-xs">{c.student_code}</p>
                  </div>
                </td>
                <td className="text-dark-400 text-xs">{c.course_name}</td>
                <td className="text-emerald-400 font-semibold">{fmt(c.amount)}</td>
                <td><span className={MODE_BADGE[c.payment_mode] || 'badge-blue'}>{c.payment_mode?.replace('_', ' ')}</span></td>
                <td className="text-dark-400">{c.payment_date}</td>
                <td className="text-dark-500 text-xs">{c.transaction_ref || '—'}</td>
                <td className="text-dark-400 text-xs">{c.collected_by_name}</td>
                <td>
                  <button onClick={() => downloadReceipt(c.id, c.receipt_no)}
                    className="text-brand-400 hover:text-brand-300 p-1.5 hover:bg-brand-500/10 rounded-lg transition-all">
                    <FileDown size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Record Payment Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal w-full max-w-xl">
            <div className="modal-header">
              <h2 className="text-lg font-bold text-white">Record Fee Payment</h2>
              <button onClick={() => { setShowModal(false); resetForm() }} className="text-dark-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div>
                  <label className="label">Student *</label>
                  <select className="select" value={form.student_id} onChange={e => { setForm({...form, student_id: e.target.value}); loadStudentDetail(e.target.value) }} required>
                    <option value="">Select student</option>
                    {students.filter(s => s.status === 'active').map(s => (
                      <option key={s.id} value={s.id}>{s.name} — {s.student_id}</option>
                    ))}
                  </select>
                </div>

                {studentDetail && (
                  <div className="bg-dark-800 rounded-xl p-4 grid grid-cols-3 gap-3 text-sm">
                    <div><p className="text-dark-400 text-xs">Net Fee</p><p className="font-bold text-white">{fmt(studentDetail.net_fee)}</p></div>
                    <div><p className="text-dark-400 text-xs">Paid</p><p className="font-bold text-emerald-400">{fmt(studentDetail.total_paid)}</p></div>
                    <div><p className="text-dark-400 text-xs">Balance</p><p className={`font-bold ${studentDetail.balance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{fmt(studentDetail.balance)}</p></div>
                  </div>
                )}

                {studentDetail?.installments?.length > 0 && (
                  <div>
                    <label className="label">Installment (optional)</label>
                    <select className="select" value={form.installment_id} onChange={e => setForm({...form, installment_id: e.target.value})}>
                      <option value="">General Payment</option>
                      {studentDetail.installments.filter(i => i.status !== 'paid').map(i => (
                        <option key={i.id} value={i.id}>
                          Installment {i.installment_no} — {fmt(i.amount_due)} ({i.status})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Amount (₹) *</label>
                    <input className="input" type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required placeholder="0" />
                  </div>
                  <div>
                    <label className="label">Payment Mode *</label>
                    <select className="select" value={form.payment_mode} onChange={e => setForm({...form, payment_mode: e.target.value})}>
                      <option value="cash">Cash</option>
                      <option value="upi">UPI</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cheque">Cheque</option>
                      <option value="card">Card</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Payment Date *</label>
                    <input className="input" type="date" value={form.payment_date} onChange={e => setForm({...form, payment_date: e.target.value})} required />
                  </div>
                  <div>
                    <label className="label">Transaction Ref</label>
                    <input className="input" value={form.transaction_ref} onChange={e => setForm({...form, transaction_ref: e.target.value})} placeholder="UPI / Bank ref" />
                  </div>
                </div>
                <div>
                  <label className="label">Notes</label>
                  <input className="input" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Any notes..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => { setShowModal(false); resetForm() }} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary"><Receipt size={15} /> Record & Generate Receipt</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
