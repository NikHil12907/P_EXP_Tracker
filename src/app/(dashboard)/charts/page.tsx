import { BarChart3, PieChart, TrendingUp, Calendar } from 'lucide-react';

export default function ChartsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Analytics & Charts
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Spending breakdowns and category distributions
          </p>
        </div>

        {/* Date Filter Chips Placeholder */}
        <div className="flex items-center gap-1.5 p-1 bg-card border border-border rounded-xl w-fit">
          {['This Week', 'This Month', 'Custom'].map((filter, idx) => (
            <button
              key={filter}
              type="button"
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                idx === 1
                  ? 'bg-blue-600 text-white'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of chart empty-state placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-foreground">
              Daily Spending Trend
            </h3>
          </div>
          <div className="h-64 border border-dashed border-border rounded-xl flex flex-col items-center justify-center p-6 text-center space-y-2 bg-muted/20">
            <Calendar className="w-8 h-8 text-muted-foreground/60" />
            <p className="text-xs font-medium text-foreground">
              Daily spend bar chart arrives in Phase 5
            </p>
            <p className="text-[11px] text-muted-foreground max-w-xs">
              Recharts daily spending bars will render here once debit transactions are recorded.
            </p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-foreground">
              Category Distribution
            </h3>
          </div>
          <div className="h-64 border border-dashed border-border rounded-xl flex flex-col items-center justify-center p-6 text-center space-y-2 bg-muted/20">
            <TrendingUp className="w-8 h-8 text-muted-foreground/60" />
            <p className="text-xs font-medium text-foreground">
              Category donut chart arrives in Phase 5
            </p>
            <p className="text-[11px] text-muted-foreground max-w-xs">
              Interactive slice breakdown will display your top categories here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
