import type { AuditFinding } from "@/features/googleAudit/googleAuditSlice";

interface AuditFindingsProps {
  findings: AuditFinding[];
}

export default function AuditFindings({ findings }: AuditFindingsProps) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="mb-4 text-lg font-semibold">Recommendations</h2>
      {findings.length === 0 ? (
        <p className="text-sm text-muted-foreground">No recommendations are available yet.</p>
      ) : (
        <ul className="space-y-4">
          {findings.map((item) => (
            <li className="rounded-lg border p-4" key={`${item.category}-${item.title}`}>
              <div className="flex justify-between gap-4">
                <h3 className="font-semibold">{item.title}</h3>
                <span className="text-sm capitalize text-muted-foreground">{item.severity}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
