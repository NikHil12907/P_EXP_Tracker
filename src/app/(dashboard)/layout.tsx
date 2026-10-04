import { createClient } from '@/lib/supabase/server';
import { signOut } from '@/app/(auth)/login/actions';
import { AppShell } from '@/components/layout/app-shell';

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
    <AppShell userEmail={userEmail} signOutAction={signOut}>
      {children}
    </AppShell>
  );
}
