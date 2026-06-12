const CATEGORIES = ['Все', 'Технологии', 'Музыка', 'Спорт', 'Кулинария']

export default function CategoryFilter({ active, onChange }) {
  return (
    <div className="discover__chips">
      {CATEGORIES.map(cat => (
        <button key={cat} onClick={() => onChange(cat)} className={`chip${active === cat ? ' is-active' : ''}`}>
          {cat}
        </button>
      ))}
    </div>
  )
}

export { CATEGORIES }
