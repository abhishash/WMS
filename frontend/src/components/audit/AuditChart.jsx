export default function AuditChart({ categories = [] }) {
  if (categories.length === 0) {
    return <p className="text-sm text-muted-foreground">Audit scores will appear here.</p>;
  }

  return (
    <ul aria-label="Audit category scores" className="space-y-3">
      {categories.map((category) => {
        const score = Number(category.score) || 0;
        const max = Number(category.max) || 0;
        const percentage = max > 0 ? Math.min((score / max) * 100, 100) : 0;

        return (
          <li key={category.name}>
            <div className="mb-1 flex justify-between text-sm">
              <span>{category.name}</span>
              <span>{max > 0 ? `${score} / ${max}` : "--"}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div aria-hidden="true" className="h-full bg-primary" style={{ width: `${percentage}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
