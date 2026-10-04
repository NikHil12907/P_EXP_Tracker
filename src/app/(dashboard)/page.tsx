import { Plus, TrendingDown, Calendar, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardHomePage() {
  // Phase 1 skeleton metrics (wired to live database queries in Phase 4)
  const thisMonthTotal = 0;
  const todayTotal = 0;
  const recentTransactions: Array<{
    id: string;
    merchant: string;
    amount: number;
    occurredAt: string;
    category: string;
    mode: string;
  }> = [];

  return (
    <div className="space-y-6">
      {/* Month & Today Spend KPI Summary */}
      <section className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-2xl p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <span>This Month</span>
          </div>
          <div className="text-xl font-bold tracking-tight">
            ₹{thisMonthTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-muted-foreground">
            Live tracker active
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrendingDown className="w-3.5 h-3.5 text-blue-400" />
            <span>Today</span>
          </div>
          <div className="text-xl font-bold tracking-tight">
            ₹{todayTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-muted-foreground">
            No expenses yet
          </div>
        </div>
      </section>

      {/* Quick Status / Ingest Status Card */}
      <section className="bg-card/50 border border-border/80 rounded-2xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            System Status
          </h2>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Phase 1 Ready
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Database schema, authentication, and security policies are provisioned. Ingest webhook endpoint connects in Phase 3.
        </p>
      </section>

      {/* Recent Transactions List */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Recent Transactions
          </h2>
          <Link
            href="/transactions"
            className="text-xs text-blue-500 hover:text-blue-400 flex items-center gap-0.5"
          >
            <span>View all</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="bg-card border border-border/60 rounded-2xl p-8 text-center space-y-2">
            <p className="text-xs font-medium text-foreground">
              No transactions recorded yet
            </p>
            <p className="text-[11px] text-muted-foreground max-w-[240px] mx-auto">
              Inbound debit SMS from your phone will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/60 bg-card border border-border rounded-2xl overflow-hidden">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="p-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-foreground">
                    {tx.merchant}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {tx.category} • {tx.mode}
                  </div>
                </div>
                <div className="text-xs font-semibold text-foreground">
                  -₹{tx.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Floating Action Button (FAB) for Manual Entry */}
      <div className="fixed bottom-20 right-4 z-30">
        <button
          type="button"
          aria-label="Add manual expense"
          className="touch-target w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white shadow-lg flex items-center justify-center transition-transform active:scale-95"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
