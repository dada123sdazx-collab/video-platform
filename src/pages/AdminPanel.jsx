import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Shield, Film, Users, MessageSquare, Eye, Trash2,
  Edit3, Check, X, Plus, TrendingUp, ArrowLeft,
} from 'lucide-react'
import {
  getAdminStats, getAllVideos, getAllUsers, getAllComments,
  deleteVideo, updateVideo, deleteComment, addVideo, deleteUserDoc,
} from '../firebase/db'
import { useAuth } from '../context/AuthContext'
import { CATEGORIES } from '../components/CategoryFilter'

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL
const NON_ALL = CATEGORIES.filter(c => c !== 'Все')

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-[var(--surface)] rounded-xl p-5 border border-white/5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-bold text-[var(--text)]">{value?.toLocaleString('ru') ?? '—'}</p>
        <p className="text-xs text-[var(--muted)]">{label}</p>
      </div>
    </div>
  )
}

export default function AdminPanel() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('videos')
  const [stats, setStats] = useState(null)
  const [videos, setVideos] = useState([])
  const [users, setUsers] = useState([])
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [showAdd, setShowAdd] = useState(false)
  const [newVideo, setNewVideo] = useState({ title: '', description: '', category: NON_ALL[0], videoUrl: '', thumbnail: '' })
  const [saving, setSaving] = useState(false)

  // Guard
  useEffect(() => {
    if (user && user.email !== ADMIN_EMAIL) navigate('/', { replace: true })
  }, [user, navigate])

  useEffect(() => {
    if (!user || user.email !== ADMIN_EMAIL) return
    Promise.all([getAdminStats(), getAllVideos(), getAllUsers(), getAllComments()]).then(([s, v, u, c]) => {
      setStats(s)
      setVideos(v.sort((a, b) => (b.views ?? 0) - (a.views ?? 0)))
      setUsers(u)
      setComments(c)
      setLoading(false)
    })
  }, [user])

  async function handleDeleteVideo(id, title) {
    if (!confirm(`Удалить видео «${title}»?`)) return
    await deleteVideo(id)
    setVideos(v => v.filter(x => x.id !== id))
    setStats(s => ({ ...s, videos: s.videos - 1 }))
  }

  async function handleDeleteComment(id) {
    if (!confirm('Удалить комментарий?')) return
    await deleteComment(id)
    setComments(c => c.filter(x => x.id !== id))
    setStats(s => ({ ...s, comments: s.comments - 1 }))
  }

  function startEdit(v) {
    setEditId(v.id)
    setEditForm({ title: v.title, description: v.description ?? '', category: v.category, videoUrl: v.videoUrl, thumbnail: v.thumbnail ?? '' })
  }

  async function saveEdit() {
    setSaving(true)
    await updateVideo(editId, editForm)
    setVideos(v => v.map(x => x.id === editId ? { ...x, ...editForm } : x))
    setEditId(null)
    setSaving(false)
  }

  async function handleAddVideo() {
    if (!newVideo.title.trim() || !newVideo.videoUrl.trim()) return
    setSaving(true)
    const ref = await addVideo({ ...newVideo, author: user.displayName || user.email })
    setVideos(v => [{ id: ref.id, ...newVideo, views: 0, likes: [], author: user.displayName || user.email }, ...v])
    setStats(s => ({ ...s, videos: s.videos + 1 }))
    setNewVideo({ title: '', description: '', category: NON_ALL[0], videoUrl: '', thumbnail: '' })
    setShowAdd(false)
    setSaving(false)
  }

  if (!user || user.email !== ADMIN_EMAIL) return null

  return (
    <main className="page-enter max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link to="/" className="p-2 rounded-lg text-[var(--muted)] hover:text-violet-400 hover:bg-violet-500/5 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400">
          <Shield size={18} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--text)] tracking-tight">Панель администратора</h1>
          <p className="text-xs text-[var(--muted)]">{user.email}</p>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Film}         label="Видео"       value={stats.videos}   color="bg-violet-500/15 text-violet-400" />
          <StatCard icon={Users}        label="Пользователей" value={stats.users}  color="bg-blue-500/15 text-blue-400" />
          <StatCard icon={Eye}          label="Просмотров"  value={stats.views}    color="bg-emerald-500/15 text-emerald-400" />
          <StatCard icon={MessageSquare} label="Комментариев" value={stats.comments} color="bg-amber-500/15 text-amber-400" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[var(--surface)] p-1 rounded-xl w-fit border border-white/5">
        {[
          { id: 'videos',   label: 'Видео',   icon: Film },
          { id: 'users',    label: 'Пользователи', icon: Users },
          { id: 'comments', label: 'Комментарии', icon: MessageSquare },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === id ? 'bg-violet-600 text-white' : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {/* ── Videos tab ──────────────────────────────────────────── */}
      {tab === 'videos' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[var(--text)]">Видео ({videos.length})</h2>
            <button onClick={() => setShowAdd(v => !v)} className="btn-accent text-sm">
              <Plus size={14} /> Добавить
            </button>
          </div>

          {/* Add form */}
          {showAdd && (
            <div className="bg-[var(--surface)] rounded-xl border border-violet-500/20 p-5 mb-4 space-y-3">
              <h3 className="font-semibold text-[var(--text)] mb-2 text-sm">Новое видео</h3>
              {[
                { key: 'title', ph: 'Название *', type: 'text' },
                { key: 'videoUrl', ph: 'Ссылка на видео (URL) *', type: 'text' },
                { key: 'thumbnail', ph: 'Обложка (URL)', type: 'text' },
              ].map(({ key, ph, type }) => (
                <input key={key} type={type} placeholder={ph}
                  value={newVideo[key]}
                  onChange={e => setNewVideo(f => ({ ...f, [key]: e.target.value }))}
                  className="vt-input" />
              ))}
              <select value={newVideo.category}
                onChange={e => setNewVideo(f => ({ ...f, category: e.target.value }))}
                className="vt-input">
                {NON_ALL.map(c => <option key={c}>{c}</option>)}
              </select>
              <textarea placeholder="Описание" rows={3} value={newVideo.description}
                onChange={e => setNewVideo(f => ({ ...f, description: e.target.value }))}
                className="vt-input resize-none" />
              <div className="flex gap-2">
                <button onClick={handleAddVideo} disabled={saving || !newVideo.title || !newVideo.videoUrl} className="btn-accent">
                  <Check size={14} /> {saving ? 'Сохранение...' : 'Добавить'}
                </button>
                <button onClick={() => setShowAdd(false)} className="btn-ghost"><X size={14} /> Отмена</button>
              </div>
            </div>
          )}

          {loading ? <div className="skeleton h-48 rounded-xl" /> : (
            <div className="bg-[var(--surface)] rounded-xl border border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-[var(--muted)] text-xs uppercase tracking-wider">
                      <th className="text-left px-4 py-3 font-medium">Название</th>
                      <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Категория</th>
                      <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Просмотры</th>
                      <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Лайки</th>
                      <th className="px-4 py-3 w-20"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {videos.map(v => (
                      <>
                        <tr key={v.id} className="border-b border-white/4 hover:bg-white/2 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-medium text-[var(--text)] line-clamp-1 max-w-[200px]">{v.title}</div>
                            <div className="text-xs text-[var(--muted)] mt-0.5">{v.author}</div>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className="badge">{v.category}</span>
                          </td>
                          <td className="px-4 py-3 text-[var(--muted)] hidden lg:table-cell">
                            {(v.views ?? 0).toLocaleString('ru')}
                          </td>
                          <td className="px-4 py-3 text-[var(--muted)] hidden lg:table-cell">
                            {Array.isArray(v.likes) ? v.likes.length : 0}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 justify-end">
                              <button onClick={() => startEdit(v)}
                                className="p-1.5 rounded-lg text-zinc-500 hover:text-violet-400 hover:bg-violet-500/10 transition-colors">
                                <Edit3 size={14} />
                              </button>
                              <button onClick={() => handleDeleteVideo(v.id, v.title)}
                                className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {editId === v.id && (
                          <tr key={`edit-${v.id}`} className="border-b border-violet-500/20 bg-violet-500/5">
                            <td colSpan={5} className="px-4 py-4">
                              <div className="space-y-2 max-w-2xl">
                                <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                                  placeholder="Название" className="vt-input" />
                                <input value={editForm.videoUrl} onChange={e => setEditForm(f => ({ ...f, videoUrl: e.target.value }))}
                                  placeholder="URL видео" className="vt-input" />
                                <input value={editForm.thumbnail} onChange={e => setEditForm(f => ({ ...f, thumbnail: e.target.value }))}
                                  placeholder="URL обложки" className="vt-input" />
                                <select value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                                  className="vt-input">
                                  {NON_ALL.map(c => <option key={c}>{c}</option>)}
                                </select>
                                <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                                  rows={2} placeholder="Описание" className="vt-input resize-none" />
                                <div className="flex gap-2 mt-1">
                                  <button onClick={saveEdit} disabled={saving} className="btn-accent text-xs py-1.5 px-3">
                                    <Check size={12} /> {saving ? '...' : 'Сохранить'}
                                  </button>
                                  <button onClick={() => setEditId(null)} className="btn-ghost text-xs py-1.5 px-3">
                                    <X size={12} /> Отмена
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Users tab ───────────────────────────────────────────── */}
      {tab === 'users' && (
        <div>
          <h2 className="font-semibold text-[var(--text)] mb-4">Пользователи ({users.length})</h2>
          {loading ? <div className="skeleton h-48 rounded-xl" /> : (
            <div className="bg-[var(--surface)] rounded-xl border border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-[var(--muted)] text-xs uppercase tracking-wider">
                      <th className="text-left px-4 py-3 font-medium">Имя</th>
                      <th className="text-left px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-white/4 hover:bg-white/2 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-violet-600/20 flex items-center justify-center text-violet-400 text-xs font-bold">
                              {(u.name || u.email)?.[0]?.toUpperCase()}
                            </div>
                            <span className="text-[var(--text)] font-medium">{u.name || '—'}</span>
                            {u.email === ADMIN_EMAIL && (
                              <span className="text-[10px] font-bold bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded">admin</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[var(--muted)]">{u.email}</td>
                        <td className="px-4 py-3 text-right">
                          {u.email !== ADMIN_EMAIL && (
                            <button
                              onClick={async () => {
                                if (!confirm(`Удалить пользователя «${u.name || u.email}»?`)) return
                                await deleteUserDoc(u.id)
                                setUsers(prev => prev.filter(x => x.id !== u.id))
                                setStats(s => ({ ...s, users: s.users - 1 }))
                              }}
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Comments tab ─────────────────────────────────────────── */}
      {tab === 'comments' && (
        <div>
          <h2 className="font-semibold text-[var(--text)] mb-4">Комментарии ({comments.length})</h2>
          {loading ? <div className="skeleton h-48 rounded-xl" /> : comments.length === 0 ? (
            <p className="text-[var(--muted)] text-sm py-8 text-center">Комментариев нет</p>
          ) : (
            <div className="space-y-2">
              {comments.map(c => (
                <div key={c.id} className="bg-[var(--surface)] rounded-xl border border-white/5 p-4 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-sm font-medium text-[var(--text)]">{c.userName}</span>
                      <span className="text-xs text-[var(--muted)]">
                        {c.date?.toDate ? c.date.toDate().toLocaleDateString('ru-RU') : ''}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-300">{c.text}</p>
                    <Link to={`/video/${c.videoId}`} className="text-xs text-violet-400 hover:underline mt-1 inline-block">
                      → Перейти к видео
                    </Link>
                  </div>
                  <button onClick={() => handleDeleteComment(c.id)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  )
}
