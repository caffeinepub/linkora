import type { ReputationReview } from "../backend.d.ts";

function avgScore(reviews: ReputationReview[], key: keyof ReputationReview["scores"]): number {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + Number(r.scores[key]), 0);
  return Math.min(100, Math.round(sum / reviews.length));
}

export function computeAvgReputation(reviews: ReputationReview[]): number {
  if (reviews.length === 0) return 0;
  const scores = reviews.map((r) => {
    const s = r.scores;
    return (Number(s.contribution) + Number(s.teamwork) + Number(s.skillRelevance) + Number(s.reliability)) / 4;
  });
  return Math.min(100, Math.round(scores.reduce((a, b) => a + b, 0) / scores.length));
}

interface ReputationBarsProps {
  reviews: ReputationReview[];
}

const scoreBarColor = (val: number) => {
  if (val >= 75) return "bg-emerald-500";
  if (val >= 50) return "bg-teal-400";
  if (val >= 25) return "bg-amber-400";
  return "bg-rose-400";
};

export function ReputationBars({ reviews }: ReputationBarsProps) {
  const dims = [
    { label: "Contribution", key: "contribution" as const },
    { label: "Teamwork", key: "teamwork" as const },
    { label: "Skill Relevance", key: "skillRelevance" as const },
    { label: "Reliability", key: "reliability" as const },
  ];

  return (
    <div className="space-y-3">
      {dims.map(({ label, key }) => {
        const val = avgScore(reviews, key);
        return (
          <div key={key}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium text-foreground">{val}/100</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${scoreBarColor(val)}`}
                style={{ width: `${val}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface ReputationBadgeProps {
  reviews: ReputationReview[];
  size?: "sm" | "md";
}

export function ReputationBadge({ reviews, size = "md" }: ReputationBadgeProps) {
  const avg = computeAvgReputation(reviews);
  const color =
    avg >= 75 ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10"
    : avg >= 50 ? "text-teal-400 border-teal-400/30 bg-teal-400/10"
    : avg >= 25 ? "text-amber-400 border-amber-400/30 bg-amber-400/10"
    : "text-muted-foreground border-border bg-muted/30";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 font-medium ${
      size === "sm" ? "text-xs py-0.5" : "text-sm py-1 px-3"
    } ${color}`}>
      ★ {avg}
    </span>
  );
}
