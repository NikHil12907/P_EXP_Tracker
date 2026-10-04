import { Search, Filter } from 'lucide-react';

export default function TransactionsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Transactions</h1>
        <p className="text-xs text-muted-foreground">Search and manage recorded expenses</p>
      </div>

      {/* Search and Filter bar placeholder */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search merchant or note..."
            disabled
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-card border border-border text-xs text-foreground placeholder:text-muted-foreground/60 opacity-70"
          />
        </div>
        <button
          type="button"
          disabled
          className="touch-target w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground opacity-70"
        >
          <Filter className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-card border border-border/60 rounded-2xl p-8 text-center space-y-2">
        <p className="text-xs font-medium text-foreground">Transactions View</p>
        <p className="text-[11px] text-muted-foreground">
          Detailed transactions list, filters, category editing, and deletion will be wired up in Phase 4.
        </p>
      </div>
    </div>
  );
}
