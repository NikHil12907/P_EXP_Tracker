import { Inbox, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ReviewPage() {
  const unparsedMessagesCount = 0;
  const balanceGapsCount = 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Needs Review
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Actionable inbox for unparsed messages and balance continuity alerts
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Unparsed Messages Section */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Inbox className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-semibold text-foreground">
                Unparsed Messages
              </h3>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground tabular-nums">
              {unparsedMessagesCount}
            </span>
          </div>

          <div className="p-6 border border-dashed border-border rounded-xl text-center space-y-1.5 bg-muted/20">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
            <p className="text-xs font-medium text-foreground">
              Inbox is clean
            </p>
            <p className="text-[11px] text-muted-foreground">
              No ambiguous or unparsed SMS messages waiting for review.
            </p>
          </div>
        </div>

        {/* Balance Gap Notices Section */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-foreground">
                Balance Gap Notices
              </h3>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground tabular-nums">
              {balanceGapsCount}
            </span>
          </div>

          <div className="p-6 border border-dashed border-border rounded-xl text-center space-y-1.5 bg-muted/20">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
            <p className="text-xs font-medium text-foreground">
              Ledger is consistent
            </p>
            <p className="text-[11px] text-muted-foreground">
              No balance discrepancy notices detected between consecutive transactions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
