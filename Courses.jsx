import { useEffect, useState } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Plus, X, BookOpen } from 'lucide-react'

const fmt = n => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

export default function Courses() {
  const [courses, setCourses] = useState([])
  const [batches, setBatches] = useState([])
  const [tab, setTab] = useState('courses')
  const [showModal, setShowModal] = useState(false)
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [form, setForm] = useState({ name: '', code: '', duration_months: 6, total_fee: '', is_active: true })
  const [bForm, setBForm] = useState({ batch_name: '', course_id: '', start_date: '', end_date: '', timings: '', is_active: true })

  const fetch = async () => {
    const [c, b] = await Promise.all([api.get('/courses'), api.get('/batches')])
    setCourses(c.data)
    setBatches(b.data)
  }
  useEffect(() => { fetch() }, [])

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      await api.post('/courses', { ...form, total_fee: +form.total_fee, duration_months: +form.duration_months })
      toast.success('Course created')
      setShowModal(false)
      setForm({ name: '', code: '', duration_months: 6, total_fee: '', is_active: true })
      fetch()
    } catch (err) { toast.error(err.response?.data?.detail || 'Error') }
  }

  const handleBatchSubmit = async e => {
    e.preventDefault()
    try {
      await api.post('/batches', { ...bForm, course_id: +bForm.course_id })
      toast.success('Batch created')
      setShowBatchModal(false)
      fetch()
    } catch (err) { toast.error(err.response?.data?.detail || 'Error') }
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Courses & Batches</h1>
          <p className="text-dark-400 text-sm mt-0.5">Manage Future Optima course catalog</p>
        </div>
        <div className="flex gap-3">
          {tab === 'courses' && <button onClick={() => setShowModal(true)} className="btn-primary"><Plus size={16} /> Add Course</button>}
          {tab === 'batches' && <button onClick={() => setShowBatchModal(true)} className="btn-primary"><Plus size={16} /> Add Batch</button>}
        </div>
      </div>

      <div className="flex gap-2">
        {['courses','batches'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${tab === t ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' : 'text-dark-400 hover:text-white hover:bg-dark-800'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'courses' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {courses.map(c => (
            <div key={c.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center">
                  <BookOpen size={18} className="text-brand-400" />
                </div>
                <span className={c.is_active ? 'badge-green' : 'badge-red'}>{c.is_active ? 'Active' : 'Inactive'}</span>
              </div>
              <h3 className="text-white font-semibold mb-1">{c.name}</h3>
              <div className="flex gap-2 mt-3">
                <span className="badge-blue">{c.code}</span>
                <span className="text-dark-400 text-xs">{c.duration_months} months</span>
              </div>
              <p className="text-brand-400 font-bold text-lg mt-3">{fmt(c.total_fee)}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'batches' && (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr><th>Batch Name</th><th>Course</th><th>Start Date</th><th>Timings</th><th>Status</th></tr>
            </thead>
            <tbody>
              {batches.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-12 text-dark-500">No batches created yet</td></tr>
              ) : batches.map(b => (
                <tr key={b.id}>
                  <td className="text-white font-medium">{b.batch_name}</td>
                  <td><span className="badge-blue">{b.course_code || b.course_name}</span></td>
                  <td className="text-dark-400">{b.start_date}</td>
                  <td className="text-dark-400">{b.timings || '—'}</td>
                  <td><span className={b.is_active ? 'badge-green' : 'badge-red'}>{b.is_active ? 'Active' : 'Inactive'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Course Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="text-lg font-bold text-white">Add Course</h2>
              <button onClick={() => setShowModal(false)} className="text-dark-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div>
                  <label className="label">Course Name *</label>
                  <input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Code *</label>
                    <input className="input" value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} required placeholder="PYFS" />
                  </div>
                  <div>
                    <label className="label">Duration (months)</label>
                    <input className="input" type="number" value={form.duration_months} onChange={e => setForm({...form, duration_months: e.target.value})} />
                  </div>
                  <div>
                    <label className="label">Total Fee (₹) *</label>
                    <input className="input" type="number" value={form.total_fee} onChange={e => setForm({...form, total_fee: e.target.value})} required />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Create Course</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Modal */}
      {showBatchModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowBatchModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="text-lg font-bold text-white">Add Batch</h2>
              <button onClick={() => setShowBatchModal(false)} className="text-dark-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleBatchSubmit}>
              <div className="modal-body space-y-4">
                <div>
                  <label className="label">Batch Name *</label>
                  <input className="input" value={bForm.batch_name} onChange={e => setBForm({...bForm, batch_name: e.target.value})} required placeholder="e.g. Batch A - July 2026" />
                </div>
                <div>
                  <label className="label">Course *</label>
                  <select className="select" value={bForm.course_id} onChange={e => setBForm({...bForm, course_id: e.target.value})} required>
                    <option value="">Select Course</option>
                    {courses.filter(c => c.is_active).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Start Date *</label>
                    <input className="input" type="date" value={bForm.start_date} onChange={e => setBForm({...bForm, start_date: e.target.value})} required />
                  </div>
                  <div>
                    <label className="label">End Date</label>
                    <input className="input" type="date" value={bForm.end_date} onChange={e => setBForm({...bForm, end_date: e.target.value})} />
                  </div>
                  <div className="col-span-2">
                    <label className="label">Timings</label>
                    <input className="input" value={bForm.timings} onChange={e => setBForm({...bForm, timings: e.target.value})} placeholder="e.g. Mon-Fri 9am-12pm" />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowBatchModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Create Batch</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
