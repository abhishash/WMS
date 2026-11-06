import type { AuditCategory as AuditCategoryItem } from "@/features/googleAudit/googleAuditSlice";

interface AuditCategoryProps {
  items: AuditCategoryItem[];
}

export default function AuditCategory({ items }: AuditCategoryProps) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="mb-4 text-lg font-semibold">Audit Details</h2>

      <div className="space-y-5">
        {items?.map((item) => {
          const percentage =
            item.available && item.score != null && item.max > 0
              ? Math.min((item.score / item.max) * 100, 100)
              : 0;

          return (
            <div key={item.name}>
              <div className="mb-2 flex justify-between">
                <span>{item.name}</span>

                <span>
                  {item.available
                    ? `${item.score?.toFixed(1)} / ${item.max}`
                    : "Unavailable"}
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: `${percentage}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
