export default function ChartsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Analytics & Charts</h1>
        <p className="text-xs text-muted-foreground">Spending breakdowns and visual trends</p>
      </div>

      <div className="bg-card border border-border/60 rounded-2xl p-8 text-center space-y-2">
        <p className="text-xs font-medium text-foreground">Charts Module</p>
        <p className="text-[11px] text-muted-foreground">
          Interactive Recharts daily spend bar chart, category donut, MoM comparison, and top merchants arrive in Phase 5.
        </p>
      </div>
    </div>
  );
}
