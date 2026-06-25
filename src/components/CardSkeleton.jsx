/** Скелетон карточки видео (shimmer). Совпадает по форме с VideoCard. */
export default function CardSkeleton() {
  return (
    <div className="card skeleton">
      <div className="sk sk--poster" />
      <div className="card__body" style={{ gap: 10 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="sk" style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="sk sk--title" style={{ marginBottom: 8 }} />
            <div className="sk sk--line" style={{ width: '60%' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

export function CardSkeletonGrid({ count = 8 }) {
  return (
    <div className="grid">
      {Array.from({ length: count }).map((_, i) => <CardSkeleton key={i} />)}
    </div>
  )
}
