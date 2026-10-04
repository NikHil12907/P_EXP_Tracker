export default function ReviewPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Needs Review</h1>
        <p className="text-xs text-muted-foreground">Unparsed SMS and balance discrepancy notices</p>
      </div>

      <div className="bg-card border border-border/60 rounded-2xl p-8 text-center space-y-2">
        <p className="text-xs font-medium text-foreground">Review Inbox</p>
        <p className="text-[11px] text-muted-foreground">
          Unparsed SMS entries and directional balance gap notices will be managed here starting in Phase 4.
        </p>
      </div>
    </div>
  );
}
