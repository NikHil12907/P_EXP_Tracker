import Link from 'next/link';
import {
  Calendar,
  TrendingDown,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Inbox,
  PieChart,
  Plus,
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils/format';

export default async function DashboardHomePage() {
  // Phase 1 initial metrics (will connect to Supabase query in Phase 4)
  const thisMonthTotal = 0;
  const todayTotal = 0;
  const averagePerDay = 0;
  const vsLastMonthChange = 0; // percentage
  const unparsedCount = 0;
  const balanceGapsCount = 0;

  const recentTransactions: Array<{
    id: string;
    merchant: string;
    amount: number;
    occurredAt: string;
    category: string | null;
    mode: string;
  }> = [];

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* ROW 1: 4 KPI CARDS (2x2 on Mobile, 4x1 on Desktop)                   */}
      {/* ==================================================================== */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {/* Card 1: This Month */}
        <div className="bg-card border border-border rounded-2xl p-4 lg:p-5 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">This Month</span>
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-xl lg:text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {formatCurrency(thisMonthTotal)}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Current billing cycle
          </p>
        </div>

        {/* Card 2: Today */}
        <div className="bg-card border border-border rounded-2xl p-4 lg:p-5 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">Today</span>
            <TrendingDown className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl lg:text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {formatCurrency(todayTotal)}
          </div>
          <p className="text-[11px] text-muted-foreground">
            All modes combined
          </p>
        </div>

        {/* Card 3: Average Per Day */}
        <div className="bg-card border border-border rounded-2xl p-4 lg:p-5 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">Avg / Day</span>
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-xl lg:text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {formatCurrency(averagePerDay)}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Based on days elapsed
          </p>
        </div>

        {/* Card 4: vs Last Month % */}
        <div className="bg-card border border-border rounded-2xl p-4 lg:p-5 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">vs Last Month</span>
            <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-xl lg:text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {vsLastMonthChange > 0 ? `+${vsLastMonthChange}%` : `${vsLastMonthChange}%`}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Relative comparison
          </p>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* ROW 2: 2-COLUMN SPLIT (2/3 RECENT TRANSACTIONS + 1/3 STACKED PANELS) */}
      {/* ==================================================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT COLUMN: 2/3 WIDTH ON DESKTOP */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground tracking-tight">
                Recent Transactions
              </h2>
              <p className="text-xs text-muted-foreground">
                Latest debit activity from bank SMS
              </p>
            </div>
            <Link
              href="/transactions"
              className="text-xs font-medium text-blue-500 hover:text-blue-400 flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
            >
              <span>View all</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentTransactions.length === 0 ? (
            /* Empty State Container */
            <div className="bg-card border border-border/80 rounded-2xl p-8 lg:p-12 text-center space-y-3 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto border border-border">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  No transactions recorded yet
                </p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Forwarded SMS debits will appear here automatically. You can also log an expense manually.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add your first expense</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE VIEW (>= 768px) */}
              <div className="hidden md:block bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/80 bg-muted/30 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      <th className="py-3 px-4">Merchant</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Mode</th>
                      <th className="py-3 px-4">Date / Time</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-sm">
                    {recentTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-3 px-4 font-medium text-foreground">
                          {tx.merchant}
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">
                          {tx.category ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-foreground text-[11px]">
                              {tx.category}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/60 italic">
                              Uncategorised
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">
                          <span className="uppercase text-[10px] font-semibold tracking-wide px-1.5 py-0.5 rounded bg-muted/80">
                            {tx.mode}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">
                          {formatDateTime(tx.occurredAt)}
                        </td>
                        <td className="py-3 px-4 text-right font-medium tabular-nums text-foreground">
                          -{formatCurrency(tx.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS VIEW (< 768px) */}
              <div className="md:hidden divide-y divide-border/60 bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="p-3.5 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium text-foreground">
                        {tx.merchant}
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                        <span>{tx.category || 'Uncategorised'}</span>
                        <span>•</span>
                        <span>{tx.mode}</span>
                        <span>•</span>
                        <span>{formatDateTime(tx.occurredAt)}</span>
                      </div>
                    </div>
                    <div className="text-sm font-semibold tabular-nums text-foreground">
                      -{formatCurrency(tx.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* RIGHT COLUMN: 1/3 WIDTH ON DESKTOP (STACKED PANELS) */}
        <div className="space-y-4">
          {/* Panel 1: Needs Review & Notices Summary */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-semibold text-foreground">
                  Review Inbox
                </h3>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-muted text-muted-foreground tabular-nums">
                {unparsedCount + balanceGapsCount}
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Unparsed bank messages and detected balance discrepancies require your attention.
            </p>

            <Link
              href="/review"
              className="inline-flex items-center justify-between w-full p-2.5 rounded-xl bg-muted/60 hover:bg-muted text-xs font-medium text-foreground transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <span>Open Review Inbox</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </Link>
          </div>

          {/* Panel 2: Spending by Category Placeholder (No Fake Data) */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-semibold text-foreground">
                Category Split
              </h3>
            </div>

            <div className="py-6 px-4 border border-dashed border-border rounded-xl text-center space-y-2 bg-muted/20">
              <p className="text-xs font-medium text-foreground">
                Spending analytics arrive in Phase 5
              </p>
              <p className="text-[11px] text-muted-foreground max-w-[200px] mx-auto">
                Interactive Recharts donut breakdowns will be visualized here once expenses are recorded.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
