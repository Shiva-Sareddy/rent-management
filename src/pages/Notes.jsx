import { useState, useEffect, useRef } from 'react'
import { supabase } from '../services/supabaseClient'
import Layout from '../components/layout/Layout'
import { motion, AnimatePresence } from 'framer-motion'

const STATUS = {
  'Not Opened':  { dot: 'bg-gray-400',    badge: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400' },
  'In Progress': { dot: 'bg-amber-400',   badge: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' },
  'Completed':   { dot: 'bg-emerald-500', badge: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' },
}

const fmtDate = (d) => {
  if (!d) return null
  const [y, m, day] = d.slice(0, 10).split('-')
  return `${day}/${m}/${y}`
}
const todayStr = () => new Date().toISOString().slice(0, 10)

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

const Ico = {
  home: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  cal: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  photo: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  edit: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><polyline points="20 6 9 17 4 12"/></svg>,
  close: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  wrench: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  note: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
}

const EMPTY = { title: '', description: '', house_number: '', status: 'Not Opened', resolved_on: '', resolution_notes: '', photos: [] }

export default function Notes() {
  const [notes, setNotes] = useState([])
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [selected, setSelected] = useState(null)
  const [filterStatus, setFilterStatus] = useState('All')
  const [saving, setSaving] = useState(false)
  const [lightbox, setLightbox] = useState(null)
  const [errors, setErrors] = useState({})
  const fileRef = useRef()
  const [form, setForm] = useState(EMPTY)

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

  const openCreate = () => { setEditing(null); setForm(EMPTY); setErrors({}); setShowModal(true) }
  const openEdit = (note) => {
    setEditing(note); setErrors({})
    setForm({ title: note.title || '', description: note.description || '', house_number: note.house_number || '', status: note.status || 'Not Opened', resolved_on: note.resolved_on || '', resolution_notes: note.resolution_notes || '', photos: note.photos || [] })
    setShowModal(true)
  }

  const handlePhotos = async (e) => {
    const files = Array.from(e.target.files).slice(0, 3 - form.photos.length)
    const compressed = await Promise.all(files.map(compressImage))
    setForm(f => ({ ...f, photos: [...f.photos, ...compressed].slice(0, 3) }))
  }

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = 'Required'
    if (!form.description.trim()) e.description = 'Required'
    if (!form.house_number) e.house_number = 'Required'
    if (form.status === 'Completed' && !form.resolution_notes.trim()) e.resolution_notes = 'Required when marking Completed'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const payload = {
      user_id: user.id,
      title: form.title.trim(),
      description: form.description.trim(),
      house_number: form.house_number,
      status: form.status,
      resolved_on: form.status === 'Completed' ? (form.resolved_on || todayStr()) : null,
      resolution_notes: form.status === 'Completed' ? form.resolution_notes.trim() : null,
      photos: form.photos,
    }
    if (editing) {
      const { data } = await supabase.from('notes').update(payload).eq('id', editing.id).select().single()
      setNotes(n => n.map(x => x.id === editing.id ? data : x))
      if (selected?.id === editing.id) setSelected(data)
    } else {
      const { data } = await supabase.from('notes').insert({ ...payload, raised_on: todayStr() }).select().single()
      setNotes(n => [data, ...n])
    }
    setSaving(false)
    setShowModal(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this note?')) return
    await supabase.from('notes').delete().eq('id', id)
    setNotes(n => n.filter(x => x.id !== id))
    setSelected(null)
  }

  const filtered = filterStatus === 'All' ? notes : notes.filter(n => n.status === filterStatus)

  if (loading) return (
    <Layout><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" /></div></Layout>
  )

  return (
    <Layout>
      <div className="space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Notes</h1>
            <p className="text-sm text-gray-400 mt-0.5">{notes.length} issue{notes.length !== 1 ? 's' : ''} logged</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 btn-primary !py-2 !px-4 !text-sm">
            {Ico.plus}<span>New Note</span>
          </button>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 flex-wrap">
          {['All', 'Not Opened', 'In Progress', 'Completed'].map(s => {
            const count = s === 'All' ? notes.length : notes.filter(n => n.status === s).length
            return (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${filterStatus === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                {s} <span className="opacity-60 ml-0.5">{count}</span>
              </button>
            )
          })}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 mb-3 opacity-25"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            <p className="text-sm font-medium">No notes found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((note, idx) => {
              const s = STATUS[note.status] || STATUS['Not Opened']
              return (
                <motion.div key={note.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all duration-300">
                  <div className="p-5">
                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
                          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Issue</span>
                        </div>
                        <h3 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 leading-snug">{note.title}</h3>
                      </div>
                      <span className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap ${s.badge}`}>{note.status}</span>
                    </div>

                    {/* Card Details */}
                    <div className="space-y-2.5">
                      <div className="flex items-center text-gray-500 dark:text-gray-400">
                        <svg className="w-4 h-4 mr-2.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h10"/></svg>
                        <span className="text-sm line-clamp-1">{note.description}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-gray-500 dark:text-gray-400">
                          <svg className="w-4 h-4 mr-2.5 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                          <span className="text-sm font-medium">House {note.house_number}</span>
                        </div>
                        <div className="flex items-center text-gray-500 dark:text-gray-400">
                          <svg className="w-4 h-4 mr-2 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2"/><line x1="16" y1="2" x2="16" y2="6" strokeWidth="2"/><line x1="8" y1="2" x2="8" y2="6" strokeWidth="2"/><line x1="3" y1="10" x2="21" y2="10" strokeWidth="2"/></svg>
                          <span className="text-sm">{fmtDate(note.raised_on)}</span>
                        </div>
                      </div>
                      {note.photos?.length > 0 && (
                        <div className="flex items-center text-gray-500 dark:text-gray-400">
                          <svg className="w-4 h-4 mr-2.5 text-violet-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"/><circle cx="8.5" cy="8.5" r="1.5" strokeWidth="2"/><polyline points="21 15 16 10 5 21" strokeWidth="2"/></svg>
                          <span className="text-sm">{note.photos.length} photo{note.photos.length > 1 ? 's' : ''} attached</span>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <button onClick={() => setSelected(note)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-xl text-sm font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200">
                        View Details
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4" onClick={() => setSelected(null)}>
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="bg-white dark:bg-gray-900 w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col" style={{ maxHeight: '92vh' }}
              onClick={e => e.stopPropagation()}>

              {/* Top bar */}
              <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-5 py-3.5 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${(STATUS[selected.status] || STATUS['Not Opened']).dot}`} />
                  <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">{selected.status}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setSelected(null); openEdit(selected) }}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors">
                    {Ico.edit} Edit
                  </button>
                  <button onClick={() => handleDelete(selected.id)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 transition-colors">
                    {Ico.trash} Delete
                  </button>
                  <button onClick={() => setSelected(null)} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 transition-colors ml-1">
                    {Ico.close}
                  </button>
                </div>
              </div>

              <div className="px-5 py-5 space-y-5 overflow-y-auto flex-1">
                {/* Title + meta */}
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-snug mb-2">{selected.title}</h2>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1.5">{Ico.home} House {selected.house_number}</span>
                    <span className="flex items-center gap-1.5">{Ico.cal} Raised {fmtDate(selected.raised_on)}</span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Description</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{selected.description}</p>
                </div>

                {/* Timeline */}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-4">Tracking</p>
                  {[
                    { key: 'Not Opened',  label: 'Issue Raised',    sub: fmtDate(selected.raised_on),   icon: Ico.note },
                    { key: 'In Progress', label: 'Work In Progress', sub: (selected.status === 'In Progress' || selected.status === 'Completed') ? 'Acknowledged' : null, icon: Ico.wrench },
                    { key: 'Completed',   label: 'Issue Resolved',  sub: fmtDate(selected.resolved_on), icon: Ico.check },
                  ].map((step, i, arr) => {
                    const isDone = step.key === 'Not Opened' ||
                      (step.key === 'In Progress' && (selected.status === 'In Progress' || selected.status === 'Completed')) ||
                      (step.key === 'Completed' && selected.status === 'Completed')
                    const isActive = selected.status === step.key
                    return (
                      <div key={step.key} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isDone ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                            {step.icon}
                          </div>
                          {i < arr.length - 1 && <div className={`w-0.5 h-8 ${isDone ? 'bg-indigo-200 dark:bg-indigo-800' : 'bg-gray-100 dark:bg-gray-800'}`} />}
                        </div>
                        <div className="pt-1.5 pb-5">
                          <p className={`text-sm font-semibold ${isActive ? 'text-indigo-600 dark:text-indigo-400' : isDone ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400'}`}>{step.label}</p>
                          {step.sub && <p className="text-xs text-gray-400 mt-0.5">{step.sub}</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Resolution notes */}
                {selected.resolution_notes && (
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1.5 flex items-center gap-1.5">{Ico.wrench} Resolution</p>
                    <p className="text-sm text-emerald-800 dark:text-emerald-300 leading-relaxed">{selected.resolution_notes}</p>
                  </div>
                )}

                {/* Photos */}
                {selected.photos?.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Photos</p>
                    <div className="flex gap-2.5">
                      {selected.photos.map((p, i) => (
                        <img key={i} src={p} alt="" onClick={() => setLightbox(p)}
                          className="w-24 h-24 rounded-xl object-cover border border-gray-200 dark:border-gray-700 cursor-zoom-in hover:opacity-90 transition-opacity" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" onClick={() => setLightbox(null)}>
            <motion.img initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              src={lightbox} alt="" className="max-w-full max-h-full rounded-xl object-contain" />
          </div>
        )}
      </AnimatePresence>

      {/* Create / Edit modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="bg-white dark:bg-gray-900 w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">

              <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-5 py-4 flex items-center justify-between z-10">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">{editing ? 'Edit Note' : 'New Note'}</h2>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 transition-colors">{Ico.close}</button>
              </div>

              <div className="px-5 py-5 space-y-4">

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Issue Title <span className="text-red-400">*</span></label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className={`input-field ${errors.title ? '!border-red-400' : ''}`} placeholder="e.g. Water leakage in kitchen sink" />
                  {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                    Description <span className="text-red-400">*</span>
                    <span className="font-normal text-gray-400 ml-1">— supports all Indian languages</span>
                  </label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className={`input-field !h-24 resize-none ${errors.description ? '!border-red-400' : ''}`}
                    placeholder="Describe the issue in detail..." />
                  {errors.description && <p className="text-xs text-red-400 mt-1">{errors.description}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">House No. <span className="text-red-400">*</span></label>
                  <select value={form.house_number} onChange={e => setForm(f => ({ ...f, house_number: e.target.value }))}
                    className={`input-field ${errors.house_number ? '!border-red-400' : ''}`}>
                    <option value="">Select house</option>
                    {tenants.map(t => <option key={t.id} value={t.house_number}>{t.house_number} — {t.full_name}</option>)}
                  </select>
                  {errors.house_number && <p className="text-xs text-red-400 mt-1">{errors.house_number}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Status</label>
                  <div className="flex gap-2">
                    {['Not Opened', 'In Progress', 'Completed'].map(s => (
                      <button key={s} type="button" onClick={() => setForm(f => ({ ...f, status: s }))}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors ${form.status === s
                          ? s === 'Completed' ? 'bg-emerald-600 border-emerald-600 text-white'
                            : s === 'In Progress' ? 'bg-amber-500 border-amber-500 text-white'
                            : 'bg-gray-600 border-gray-600 text-white'
                          : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {form.status === 'Completed' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Resolved On</label>
                    <input type="date" value={form.resolved_on || todayStr()} onChange={e => setForm(f => ({ ...f, resolved_on: e.target.value }))} className="input-field" />
                  </div>
                )}

                {form.status === 'Completed' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                      Resolution Notes <span className="text-red-400">*</span>
                      <span className="font-normal text-gray-400 ml-1">— what was done to fix it</span>
                    </label>
                    <textarea value={form.resolution_notes} onChange={e => setForm(f => ({ ...f, resolution_notes: e.target.value }))}
                      className={`input-field !h-20 resize-none ${errors.resolution_notes ? '!border-red-400' : ''}`}
                      placeholder="e.g. Replaced the kitchen sink pipe and sealed the joints" />
                    {errors.resolution_notes && <p className="text-xs text-red-400 mt-1">{errors.resolution_notes}</p>}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Photos <span className="font-normal text-gray-400">— max 3</span></label>
                  <div className="flex gap-2.5 flex-wrap">
                    {form.photos.map((p, i) => (
                      <div key={i} className="relative">
                        <img src={p} alt="" className="w-20 h-20 rounded-xl object-cover border border-gray-200 dark:border-gray-700" />
                        <button onClick={() => setForm(f => ({ ...f, photos: f.photos.filter((_, idx) => idx !== i) }))}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-sm">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="w-2.5 h-2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    ))}
                    {form.photos.length < 3 && (
                      <button onClick={() => fileRef.current.click()}
                        className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center text-gray-400 hover:border-indigo-400 hover:text-indigo-400 transition-colors gap-1">
                        {Ico.plus}<span className="text-[10px]">Add</span>
                      </button>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotos} />
                </div>
              </div>

              <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-5 py-4 flex gap-3">
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                  {saving ? 'Saving...' : editing ? 'Update Note' : 'Create Note'}
                </button>
                <button onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
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
