import { useEffect, useState, useRef } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import {
  Plus, Search, Download, Upload, FileSpreadsheet,
  X, Eye, Phone, Mail, BookOpen, ChevronDown
} from 'lucide-react'

const STATUS_BADGE = {
  active: 'badge-green',
  completed: 'badge-blue',
  dropped: 'badge-red',
}

const fmt = n => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

export default function Students() {
  const [students, setStudents] = useState([])
  const [courses, setCourses] = useState([])
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCourse, setFilterCourse] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [viewStudent, setViewStudent] = useState(null)
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '',
    course_id: '', batch_id: '', total_fee: '',
    discount: 0, admission_date: new Date().toISOString().split('T')[0],
    status: 'active', notes: '', installments: 3
  })
  const fileRef = useRef()

  const fetch = async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (filterCourse) params.course_id = filterCourse
      if (filterStatus) params.status = filterStatus
      const [s, c, b] = await Promise.all([
        api.get('/students', { params }),
        api.get('/courses'),
        api.get('/batches'),
      ])
      setStudents(s.data)
      setCourses(c.data)
      setBatches(b.data)
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [search, filterCourse, filterStatus])

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      await api.post('/students', { ...form, course_id: +form.course_id, batch_id: form.batch_id ? +form.batch_id : null, total_fee: +form.total_fee, discount: +form.discount, installments: +form.installments })
      toast.success('Student added successfully')
      setShowModal(false)
      resetForm()
      fetch()
    } catch (err) { toast.error(err.response?.data?.detail || 'Error') }
  }

  const resetForm = () => setForm({
    name: '', email: '', phone: '', address: '',
    course_id: '', batch_id: '', total_fee: '',
    discount: 0, admission_date: new Date().toISOString().split('T')[0],
    status: 'active', notes: '', installments: 3
  })

  const handleImport = async e => {
    const file = e.target.files[0]
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    try {
      const { data } = await api.post('/students/import/excel', fd)
      toast.success(`Imported ${data.created} students`)
      if (data.errors.length) toast.error(`${data.errors.length} rows had errors`)
      fetch()
    } catch { toast.error('Import failed') }
  }

  const downloadTemplate = async () => {
    const res = await api.get('/students/import/template', { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url; a.download = 'import_template.xlsx'; a.click()
  }

  const exportExcel = async () => {
    const res = await api.get('/students/export/excel', { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url; a.download = 'students_export.xlsx'; a.click()
  }

  const openView = async id => {
    const { data } = await api.get(`/students/${id}`)
    setViewStudent(data)
  }

  const courseSelected = courses.find(c => c.id === +form.course_id)

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="text-dark-400 text-sm mt-0.5">{students.length} students enrolled</p>
        </div>
        <div className="flex gap-3">
          <button onClick={downloadTemplate} className="btn-secondary text-xs">
            <FileSpreadsheet size={14} /> Template
          </button>
          <button onClick={() => fileRef.current.click()} className="btn-secondary">
            <Upload size={15} /> Import Excel
          </button>
          <button onClick={exportExcel} className="btn-secondary">
            <Download size={15} /> Export
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus size={16} /> Add Student
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-400" />
          <input className="input pl-9 text-sm" placeholder="Search by name, phone, ID..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="select w-48 text-sm" value={filterCourse} onChange={e => setFilterCourse(e.target.value)}>
          <option value="">All Courses</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
        </select>
        <select className="select w-36 text-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="dropped">Dropped</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Student ID</th><th>Name</th><th>Phone</th><th>Course</th>
              <th>Net Fee</th><th>Paid</th><th>Balance</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" className="text-center py-12 text-dark-400">Loading...</td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan="9" className="text-center py-12 text-dark-500">No students found</td></tr>
            ) : students.map(s => (
              <tr key={s.id}>
                <td><span className="font-mono text-brand-400 text-xs">{s.student_id}</span></td>
                <td className="font-medium text-white">{s.name}</td>
                <td className="text-dark-400">{s.phone}</td>
                <td><span className="badge-blue">{s.course_name}</span></td>
                <td>{fmt(s.net_fee)}</td>
                <td className="text-emerald-400">{fmt(s.total_paid)}</td>
                <td className={s.balance > 0 ? 'text-red-400 font-semibold' : 'text-emerald-400'}>{fmt(s.balance)}</td>
                <td><span className={STATUS_BADGE[s.status]}>{s.status}</span></td>
                <td>
                  <button onClick={() => openView(s.id)} className="text-brand-400 hover:text-brand-300 p-1.5 hover:bg-brand-500/10 rounded-lg transition-all">
                    <Eye size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Student Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal w-full max-w-2xl">
            <div className="modal-header">
              <h2 className="text-lg font-bold text-white">Add New Student</h2>
              <button onClick={() => setShowModal(false)} className="text-dark-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Full Name *</label>
                  <input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="Student full name" />
                </div>
                <div>
                  <label className="label">Phone *</label>
                  <input className="input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required placeholder="10-digit mobile" />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input className="input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="student@email.com" />
                </div>
                <div>
                  <label className="label">Course *</label>
                  <select className="select" value={form.course_id} onChange={e => {
                    const c = courses.find(x => x.id === +e.target.value)
                    setForm({...form, course_id: e.target.value, total_fee: c?.total_fee || ''})
                  }} required>
                    <option value="">Select Course</option>
                    {courses.filter(c => c.is_active).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Batch</label>
                  <select className="select" value={form.batch_id} onChange={e => setForm({...form, batch_id: e.target.value})}>
                    <option value="">Select Batch</option>
                    {batches.filter(b => !form.course_id || b.course_id === +form.course_id).map(b => <option key={b.id} value={b.id}>{b.batch_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Total Fee (₹) *</label>
                  <input className="input" type="number" value={form.total_fee} onChange={e => setForm({...form, total_fee: e.target.value})} required placeholder="35000" />
                </div>
                <div>
                  <label className="label">Discount (₹)</label>
                  <input className="input" type="number" value={form.discount} onChange={e => setForm({...form, discount: e.target.value})} placeholder="0" />
                </div>
                <div>
                  <label className="label">Net Fee</label>
                  <div className="input bg-dark-700 text-brand-400 font-semibold">
                    {fmt((+form.total_fee || 0) - (+form.discount || 0))}
                  </div>
                </div>
                <div>
                  <label className="label">Installments</label>
                  <select className="select" value={form.installments} onChange={e => setForm({...form, installments: e.target.value})}>
                    <option value="1">1 (Full Payment)</option>
                    <option value="2">2 Installments</option>
                    <option value="3">3 Installments</option>
                    <option value="4">4 Installments</option>
                    <option value="6">6 Installments</option>
                  </select>
                </div>
                <div>
                  <label className="label">Admission Date *</label>
                  <input className="input" type="date" value={form.admission_date} onChange={e => setForm({...form, admission_date: e.target.value})} required />
                </div>
                <div>
                  <label className="label">Status</label>
                  <select className="select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="dropped">Dropped</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="label">Address</label>
                  <input className="input" value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Full address" />
                </div>
                <div className="col-span-2">
                  <label className="label">Notes</label>
                  <textarea className="input h-20 resize-none" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Any additional notes..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Add Student</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Student Modal */}
      {viewStudent && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setViewStudent(null)}>
          <div className="modal w-full max-w-2xl">
            <div className="modal-header">
              <div>
                <h2 className="text-lg font-bold text-white">{viewStudent.name}</h2>
                <span className="font-mono text-brand-400 text-xs">{viewStudent.student_id}</span>
              </div>
              <button onClick={() => setViewStudent(null)} className="text-dark-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="modal-body space-y-5">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  ['Course', viewStudent.course_name], ['Batch', viewStudent.batch_name || '—'],
                  ['Phone', viewStudent.phone], ['Email', viewStudent.email || '—'],
                  ['Admission', viewStudent.admission_date], ['Status', viewStudent.status],
                ].map(([k, v]) => (
                  <div key={k} className="bg-dark-800 rounded-xl p-3">
                    <p className="text-dark-400 text-xs mb-0.5">{k}</p>
                    <p className="text-white font-medium">{v}</p>
                  </div>
                ))}
              </div>
              {/* Fee Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="card-sm text-center">
                  <p className="text-dark-400 text-xs">Net Fee</p>
                  <p className="text-white font-bold">{fmt(viewStudent.net_fee)}</p>
                </div>
                <div className="card-sm text-center">
                  <p className="text-dark-400 text-xs">Paid</p>
                  <p className="text-emerald-400 font-bold">{fmt(viewStudent.total_paid)}</p>
                </div>
                <div className="card-sm text-center">
                  <p className="text-dark-400 text-xs">Balance</p>
                  <p className={`font-bold ${viewStudent.balance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{fmt(viewStudent.balance)}</p>
                </div>
              </div>
              {/* Installments */}
              {viewStudent.installments?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3">Installment Schedule</h4>
                  <div className="space-y-2">
                    {viewStudent.installments.map(inst => (
                      <div key={inst.id} className="flex items-center justify-between bg-dark-800 rounded-xl px-4 py-3 text-sm">
                        <span className="text-dark-300">Installment {inst.installment_no}</span>
                        <span className="text-dark-400">{inst.due_date}</span>
                        <span>{fmt(inst.amount_due)}</span>
                        <span className={`badge-${inst.status === 'paid' ? 'green' : inst.status === 'partial' ? 'yellow' : inst.status === 'overdue' ? 'red' : 'blue'}`}>
                          {inst.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
