import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EyeOff, RotateCcw, Trash2, Flag, MessageSquare, ExternalLink, Check, X } from 'lucide-react'
import { getAllShorts, hideShort, restoreShort, deleteShort } from '../../firebase/shorts'
import { getShortReports, markReportReviewed, REPORT_REASONS } from '../../firebase/shortReports'
import { getShortComments, deleteShortComment } from '../../firebase/shortInteractions'
import { useToast } from '../../context/ToastContext'
import { formatCount, formatTimeAgo } from '../../utils/formatters'

const FILTERS = [
  { id: 'all', label: 'Все' },
  { id: 'published', label: 'Опубликованные' },
  { id: 'blocked', label: 'Скрытые' },
  { id: 'reported', label: 'С жалобами' },
]

const reasonLabel = (v) => REPORT_REASONS.find((r) => r.value === v)?.label || v

const statusBadge = {
  published: 'bg-emerald-500/15 text-emerald-400',
  blocked: 'bg-red-500/15 text-red-400',
  draft: 'bg-zinc-500/15 text-zinc-400',
  deleted: 'bg-zinc-500/15 text-zinc-400',
}

export default function ShortsModeration() {
  const toast = useToast()
  const [shorts, setShorts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(null) // { id, type: 'reports'|'comments' }
  const [panelData, setPanelData] = useState({ loading: false, items: [] })

  useEffect(() => {
    getAllShorts().then(setShorts).finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return shorts.filter((s) => {
      const byStatus =
        filter === 'all' ? true :
        filter === 'reported' ? (s.moderation.reportsCount > 0 || s.moderation.isReported) :
        s.status === filter
      const byTitle = !q || s.title.toLowerCase().includes(q)
      return byStatus && byTitle
    })
  }, [shorts, filter, search])

  function patch(id, changes) {
    setShorts((list) => list.map((s) => (s.id === id ? { ...s, ...changes } : s)))
  }

  async function onHide(id) {
    try { await hideShort(id); patch(id, { status: 'blocked' }); toast.success('Short скрыт') }
    catch { toast.error('Не удалось скрыть') }
  }
  async function onRestore(id) {
    try {
      await restoreShort(id)
      patch(id, { status: 'published', moderation: { ...shorts.find((s) => s.id === id).moderation, isReported: false } })
      toast.success('Short восстановлен')
    } catch { toast.error('Не удалось восстановить') }
  }
  async function onDelete(id, title) {
    if (!confirm(`Удалить short «${title}»?`)) return
    try { await deleteShort(id); setShorts((l) => l.filter((s) => s.id !== id)); toast.success('Short удалён') }
    catch { toast.error('Не удалось удалить') }
  }

  async function togglePanel(short, type) {
    if (expanded?.id === short.id && expanded?.type === type) { setExpanded(null); return }
    setExpanded({ id: short.id, type })
    setPanelData({ loading: true, items: [] })
    const items = type === 'reports'
      ? await getShortReports(short.id)
      : (await getShortComments(short.id, { limit: 50 })).items
    setPanelData({ loading: false, items })
  }

  async function onReviewReport(reportId, status) {
    try {
      await markReportReviewed(reportId, status)
      setPanelData((d) => ({ ...d, items: d.items.map((r) => (r.id === reportId ? { ...r, status } : r)) }))
      toast.success(status === 'reviewed' ? 'Жалоба обработана' : 'Жалоба отклонена')
    } catch { toast.error('Ошибка') }
  }

  async function onDeleteComment(commentId, shortId) {
    if (!confirm('Удалить комментарий?')) return
    try {
      await deleteShortComment(commentId, shortId)
      setPanelData((d) => ({ ...d, items: d.items.filter((c) => c.id !== commentId) }))
      patch(shortId, { commentsCount: Math.max(0, (shorts.find((s) => s.id === shortId)?.commentsCount || 1) - 1) })
      toast.success('Комментарий удалён')
    } catch { toast.error('Не удалось удалить') }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="font-semibold text-[var(--text)]">Модерация Shorts ({filtered.length})</h2>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по названию…"
          className="vt-input"
          style={{ maxWidth: 240 }}
        />
      </div>

      <div className="flex gap-1 mb-4 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f.id ? 'bg-violet-600 text-white' : 'text-[var(--muted)] hover:text-[var(--text)] bg-[var(--surface)]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="skeleton h-48 rounded-xl" />
      ) : filtered.length === 0 ? (
        <p className="text-[var(--muted)] text-sm py-8 text-center">Shorts не найдены</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => (
            <div key={s.id} className="bg-[var(--surface)] rounded-xl border border-white/5 p-4">
              <div className="flex items-start gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-[var(--text)] line-clamp-1">{s.title}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${statusBadge[s.status] || ''}`}>{s.status}</span>
                    {s.moderation.reportsCount > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 inline-flex items-center gap-1">
                        <Flag size={10} /> {s.moderation.reportsCount}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[var(--muted)] mt-1">
                    @{s.authorName} · {formatCount(s.viewsCount)} просм. · ♥ {formatCount(s.likesCount)} · 💬 {formatCount(s.commentsCount)}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Link to={`/shorts/${s.id}`} className="p-1.5 rounded-lg text-zinc-400 hover:text-violet-400 hover:bg-violet-500/10" title="Открыть">
                    <ExternalLink size={15} />
                  </Link>
                  <button onClick={() => togglePanel(s, 'reports')} className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10" title="Жалобы">
                    <Flag size={15} />
                  </button>
                  <button onClick={() => togglePanel(s, 'comments')} className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10" title="Комментарии">
                    <MessageSquare size={15} />
                  </button>
                  {s.status === 'blocked' ? (
                    <button onClick={() => onRestore(s.id)} className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10" title="Восстановить">
                      <RotateCcw size={15} />
                    </button>
                  ) : (
                    <button onClick={() => onHide(s.id)} className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10" title="Скрыть">
                      <EyeOff size={15} />
                    </button>
                  )}
                  <button onClick={() => onDelete(s.id, s.title)} className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10" title="Удалить">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Раскрывающаяся панель: жалобы / комментарии */}
              {expanded?.id === s.id && (
                <div className="mt-3 pt-3 border-t border-white/5">
                  {panelData.loading ? (
                    <div className="skeleton h-16 rounded-lg" />
                  ) : panelData.items.length === 0 ? (
                    <p className="text-xs text-[var(--muted)] py-2">
                      {expanded.type === 'reports' ? 'Жалоб нет' : 'Комментариев нет'}
                    </p>
                  ) : expanded.type === 'reports' ? (
                    <div className="space-y-2">
                      {panelData.items.map((r) => (
                        <div key={r.id} className="flex items-start gap-2 text-sm bg-black/20 rounded-lg p-2.5">
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-amber-400">{reasonLabel(r.reason)}</span>
                            <span className="text-xs text-[var(--muted)] ml-2">{formatTimeAgo(r.createdAt)} · {r.status}</span>
                            {r.details && <p className="text-xs text-zinc-300 mt-1">{r.details}</p>}
                          </div>
                          {r.status === 'new' && (
                            <div className="flex gap-1 shrink-0">
                              <button onClick={() => onReviewReport(r.id, 'reviewed')} className="p-1 rounded text-emerald-400 hover:bg-emerald-500/10" title="Обработать"><Check size={14} /></button>
                              <button onClick={() => onReviewReport(r.id, 'rejected')} className="p-1 rounded text-red-400 hover:bg-red-500/10" title="Отклонить"><X size={14} /></button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {panelData.items.map((c) => (
                        <div key={c.id} className="flex items-start gap-2 text-sm bg-black/20 rounded-lg p-2.5">
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-[var(--text)]">{c.userName}</span>
                            <span className="text-xs text-[var(--muted)] ml-2">{formatTimeAgo(c.createdAt)}</span>
                            <p className="text-xs text-zinc-300 mt-1">{c.text}</p>
                          </div>
                          <button onClick={() => onDeleteComment(c.id, s.id)} className="p-1 rounded text-red-400 hover:bg-red-500/10 shrink-0" title="Удалить">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
