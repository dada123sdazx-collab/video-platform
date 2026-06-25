/** Скелет первой загрузки ленты shorts. */
export default function ShortSkeleton() {
  return (
    <div className="short-slot" aria-hidden="true">
      <div className="short-card short-card--skeleton">
        <div className="sk" style={{ position: 'absolute', inset: 0, borderRadius: 'inherit' }} />
        <div className="short-skeleton__actions">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="sk" style={{ width: 48, height: 48, borderRadius: '50%' }} />
          ))}
        </div>
        <div className="short-skeleton__meta">
          <div className="sk sk--line" style={{ width: '40%', marginBottom: 10 }} />
          <div className="sk sk--line" style={{ width: '70%' }} />
        </div>
      </div>
    </div>
  )
}
