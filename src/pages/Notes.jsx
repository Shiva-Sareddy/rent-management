import { useState, useEffect, useRef } from 'react'
import { supabase } from '../services/supabaseClient'
import Layout from '../components/layout/Layout'
import { motion, AnimatePresence } from 'framer-motion'

const STATUS = {
  'Not Opened':  { color: 'bg-gray-400',   light: 'bg-gray-50 dark:bg-gray-800   text-gray-600 dark:text-gray-400',   label: 'Not Opened'  },
  'In Progress': { color: 'bg-yellow-400', light: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400', label: 'In Progress' },
  'Completed':   { color: 'bg-green-500',  light: 'bg-green-50 dark:bg-green-900/20  text-green-600 dark:text-green-400',   label: 'Completed'   },
}

const fmtDate = (d) => {
  if (!d) return '—'
  const [y, m, day] = d.slice(0, 10).split('-')
  return `${day}/${m}/${y}`
}

const today = () => new Date().toISOString().slice(0, 10)

const compressImage = (file) => new Promise((resolve) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const MAX = 600
      let w = img.width, h = img.height
      if (w > MAX) { h = Math.round(h * MAX / w); w = MAX }
      if (h > MAX) { w = Math.round(w * MAX / h); h = MAX }
      canvas.width = w; canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', 0.6))
    }
    img.src = e.target.result
  }
  reader.readAsDataURL(file)
})

export default function Notes() {
  const [notes, setNotes] = useState([])
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [selected, setSelected] = useState(null)
  const [filterStatus, setFilterStatus] = useState('All')
  const [saving, setSaving] = useState(false)
  const fileRef = useRef()

  const empty = { title: '', description: '', house_number: '', status: 'Not Opened', resolved_on: '', photos: [] }
  const [form, setForm] = useState(empty)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const [{ data: n }, { data: t }] = await Promise.all([
      supabase.from('notes').select('*').eq('user_id', user.id).order('raised_on', { ascending: false }),
      supabase.from('tenants').select('id, house_number, full_name').eq('user_id', user.id).order('house_number'),
    ])
    setNotes(n || [])
    setTenants(t || [])
    setLoading(false)
  }

  const openCreate = () => { setEditing(null); setForm(empty); setShowModal(true) }
  const openEdit = (note) => {
    setEditing(note)
    setForm({ title: note.title, description: note.description, house_number: note.house_number, status: note.status, resolved_on: note.resolved_on || '', photos: note.photos || [] })
    setShowModal(true)
  }

  const handlePhotos = async (e) => {
    const files = Array.from(e.target.files).slice(0, 3 - form.photos.length)
    const compressed = await Promise.all(files.map(compressImage))
    setForm(f => ({ ...f, photos: [...f.photos, ...compressed].slice(0, 3) }))
  }

  const removePhoto = (i) => setForm(f => ({ ...f, photos: f.photos.filter((_, idx) => idx !== i) }))

  const handleSave = async () => {
    if (!form.title.trim() || !form.house_number) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const payload = {
      user_id: user.id,
      title: form.title.trim(),
      description: form.description.trim(),
      house_number: form.house_number,
      status: form.status,
      resolved_on: form.status === 'Completed' ? (form.resolved_on || today()) : null,
      photos: form.photos,
    }
    if (editing) {
      const { data } = await supabase.from('notes').update(payload).eq('id', editing.id).select().single()
      setNotes(n => n.map(x => x.id === editing.id ? data : x))
      if (selected?.id === editing.id) setSelected(data)
    } else {
      const { data } = await supabase.from('notes').insert({ ...payload, raised_on: today() }).select().single()
      setNotes(n => [data, ...n])
    }
    setSaving(false)
    setShowModal(false)
  }

  const handleDelete = async (id) => {
    await supabase.from('notes').delete().eq('id', id)
    setNotes(n => n.filter(x => x.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  const filtered = filterStatus === 'All' ? notes : notes.filter(n => n.status === filterStatus)

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    </Layout>
  )

  return (
    <Layout>
      <div className="space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Notes</h1>
            <p className="text-sm text-gray-400 mt-0.5">{notes.length} issue{notes.length !== 1 ? 's' : ''} tracked</p>
          </div>
          <button onClick={openCreate} className="btn-primary !py-2 !px-5 !text-sm">+ New Note</button>
        </div>

        {/* Filter */}
        <div className="flex gap-2 flex-wrap">
          {['All', 'Not Opened', 'In Progress', 'Completed'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${filterStatus === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
              {s}
              {s !== 'All' && <span className="ml-1.5 opacity-70">{notes.filter(n => n.status === s).length}</span>}
            </button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No notes found</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map(note => {
              const s = STATUS[note.status] || STATUS['Not Opened']
              return (
                <motion.div key={note.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelected(note)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${s.color}`} />
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{note.title}</p>
                      </div>
                      <p className="text-xs text-gray-400 mb-2 line-clamp-2">{note.description || '—'}</p>
                      <div className="flex items-center gap-3 text-[11px] text-gray-400">
                        <span>🏠 {note.house_number}</span>
                        <span>📅 {fmtDate(note.raised_on)}</span>
                        {note.photos?.length > 0 && <span>📷 {note.photos.length}</span>}
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-full shrink-0 ${s.light}`}>{note.status}</span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Detail / Timeline Modal */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setSelected(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-base font-bold text-gray-900 dark:text-gray-100">{selected.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">🏠 {selected.house_number}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setSelected(null); openEdit(selected) }}
                      className="text-xs px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold hover:bg-indigo-100 transition-colors">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(selected.id)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 font-semibold hover:bg-red-100 transition-colors">
                      Delete
                    </button>
                  </div>
                </div>

                {/* Description */}
                {selected.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-5 leading-relaxed">{selected.description}</p>
                )}

                {/* Flipkart-style timeline */}
                <div className="mb-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Tracking</p>
                  <div className="relative">
                    {[
                      { key: 'Not Opened',  label: 'Issue Raised',      date: selected.raised_on,   icon: '📋' },
                      { key: 'In Progress', label: 'Work In Progress',   date: selected.status === 'In Progress' || selected.status === 'Completed' ? selected.raised_on : null, icon: '🔧' },
                      { key: 'Completed',   label: 'Issue Resolved',     date: selected.resolved_on, icon: '✅' },
                    ].map((step, i, arr) => {
                      const isActive = selected.status === step.key
                      const isDone = (
                        (step.key === 'Not Opened') ||
                        (step.key === 'In Progress' && (selected.status === 'In Progress' || selected.status === 'Completed')) ||
                        (step.key === 'Completed' && selected.status === 'Completed')
                      )
                      return (
                        <div key={step.key} className="flex gap-3 pb-5 last:pb-0">
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${isDone ? 'bg-indigo-600' : 'bg-gray-100 dark:bg-gray-700'}`}>
                              {isDone ? <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="20 6 9 17 4 12"/></svg> : <span className="text-gray-400 text-xs">{i + 1}</span>}
                            </div>
                            {i < arr.length - 1 && <div className={`w-0.5 flex-1 mt-1 ${isDone ? 'bg-indigo-300 dark:bg-indigo-700' : 'bg-gray-200 dark:bg-gray-700'}`} />}
                          </div>
                          <div className="pt-1 pb-2">
                            <p className={`text-sm font-semibold ${isActive ? 'text-indigo-600 dark:text-indigo-400' : isDone ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400'}`}>{step.label}</p>
                            {step.date && <p className="text-xs text-gray-400 mt-0.5">{fmtDate(step.date)}</p>}
                            {isActive && !step.date && <p className="text-xs text-indigo-400 mt-0.5">Current status</p>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Photos */}
                {selected.photos?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Photos</p>
                    <div className="flex gap-2">
                      {selected.photos.map((p, i) => (
                        <img key={i} src={p} alt="" className="w-20 h-20 rounded-lg object-cover border border-gray-200 dark:border-gray-700" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5">
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">{editing ? 'Edit Note' : 'New Note'}</h2>

              <div className="space-y-3">
                <div>
                  <label className="label-text">Issue Title</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="input-field" placeholder="e.g. Water leakage in bathroom" />
                </div>

                <div>
                  <label className="label-text">Description <span className="text-gray-400 font-normal">(supports all Indian languages)</span></label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="input-field !h-24 resize-none" placeholder="Describe the issue..." lang="hi" />
                </div>

                <div>
                  <label className="label-text">House No.</label>
                  <select value={form.house_number} onChange={e => setForm(f => ({ ...f, house_number: e.target.value }))} className="input-field">
                    <option value="">Select house</option>
                    {tenants.map(t => (
                      <option key={t.id} value={t.house_number}>{t.house_number} — {t.full_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label-text">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="input-field">
                    <option>Not Opened</option>
                    <option>In Progress</option>
                    <option>Completed</option>
                  </select>
                </div>

                {form.status === 'Completed' && (
                  <div>
                    <label className="label-text">Resolved On</label>
                    <input type="date" value={form.resolved_on || today()} onChange={e => setForm(f => ({ ...f, resolved_on: e.target.value }))} className="input-field" />
                  </div>
                )}

                <div>
                  <label className="label-text">Photos <span className="text-gray-400 font-normal">(max 3)</span></label>
                  <div className="flex gap-2 flex-wrap mt-1">
                    {form.photos.map((p, i) => (
                      <div key={i} className="relative">
                        <img src={p} alt="" className="w-16 h-16 rounded-lg object-cover border border-gray-200 dark:border-gray-600" />
                        <button onClick={() => removePhoto(i)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center leading-none">×</button>
                      </div>
                    ))}
                    {form.photos.length < 3 && (
                      <button onClick={() => fileRef.current.click()}
                        className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-400 hover:border-indigo-400 hover:text-indigo-400 transition-colors text-xl">
                        +
                      </button>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotos} />
                </div>
              </div>

              <div className="flex gap-2 mt-5">
                <button onClick={handleSave} disabled={saving || !form.title.trim() || !form.house_number}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                  {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
                <button onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  )
}
