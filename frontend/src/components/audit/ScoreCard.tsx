interface ScoreCardProps {
  score: number | null;
  coverage: number;
}

export default function ScoreCard({ score, coverage }: ScoreCardProps) {
  const getStatus = () => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Needs Improvement";

    return "Poor";
  };

  return (
    <section className="rounded-2xl border bg-card p-6">
      <h2 className="text-lg font-semibold">Google Business Score</h2>

      <div className="mt-5 flex items-center gap-6">
        <div
          aria-label={score == null ? "Score unavailable" : `Score ${score} out of 100`}
          className="flex h-32 w-32 items-center justify-center rounded-full border-[10px] border-primary"
          role="img"
        >
          <div className="text-center">
            <h1 className="text-4xl font-bold">{score ?? "--"}</h1>

            <p className="text-sm text-gray-500">/ 100</p>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold">
            {score == null ? "Not available" : getStatus()}
          </h3>

          <p className="mt-2 text-sm text-muted-foreground">Data coverage: {coverage}%</p>
        </div>
      </div>
    </section>
  );
}
