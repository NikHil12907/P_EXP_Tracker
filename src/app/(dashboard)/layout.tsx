import { createClient } from '@/lib/supabase/server';
import { signOut } from '@/app/(auth)/login/actions';
import { BottomNav } from '@/components/navigation/bottom-nav';
import { LogOut, Wallet } from 'lucide-react';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userEmail = 'Owner';
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.email) {
      userEmail = user.email;
    }
  } catch {
    // Falls back gracefully if Supabase environment variables are being configured
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center">
      {/* Mobile-constrained app container */}
      <div className="w-full max-w-[420px] min-h-screen flex flex-col pb-24 border-x border-border/40 shadow-sm bg-background">
        {/* Sticky Mobile Top Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 h-14 bg-background/85 backdrop-blur-md border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight leading-none">
                Expenses
              </h1>
              <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                {userEmail}
              </p>
            </div>
          </div>

          <form action={signOut}>
            <button
              type="submit"
              title="Sign out"
              className="touch-target p-2 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 px-4 py-4">{children}</main>

        {/* Fixed Mobile Bottom Navigation */}
        <BottomNav />
      </div>
    </div>
  );
}
