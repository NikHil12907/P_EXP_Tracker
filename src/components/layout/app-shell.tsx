'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from '@/components/navigation/nav-config';
import { Wallet, LogOut, Plus } from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
  userEmail: string;
  signOutAction: () => Promise<void>;
}

export function AppShell({ children, userEmail, signOutAction }: AppShellProps) {
  const pathname = usePathname();

  function isItemActive(href: string, exact?: boolean) {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  }

  // Get human-readable page title from current route
  function getPageTitle() {
    if (pathname === '/transactions') return 'Transactions';
    if (pathname === '/charts') return 'Analytics & Charts';
    if (pathname === '/review') return 'Needs Review';
    return 'Dashboard';
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row relative">
      {/* ==================================================================== */}
      {/* 1. TABLET ICON-ONLY RAIL (768px - 1023px)                             */}
      {/* ==================================================================== */}
      <aside className="hidden md:flex lg:hidden w-16 flex-col items-center justify-between py-5 bg-card border-r border-border fixed inset-y-0 left-0 z-30">
        <div className="flex flex-col items-center gap-6 w-full">
          {/* Brand Icon */}
          <Link
            href="/"
            className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-500 flex items-center justify-center border border-blue-500/20 hover:bg-blue-600/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            title="Expenses"
          >
            <Wallet className="w-5 h-5" />
          </Link>

          {/* Navigation Icons with Tooltips */}
          <nav className="flex flex-col items-center gap-2 w-full px-2" aria-label="Tablet Sidebar">
            {NAV_ITEMS.map((item) => {
              const active = isItemActive(item.href, item.exact);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all group relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    active
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {/* CSS Tooltip */}
                  <span className="absolute left-14 px-2 py-1 bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs font-medium rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-md">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Tablet Rail Bottom Sign-Out */}
        <form action={signOutAction} className="w-full px-2 flex justify-center">
          <button
            type="submit"
            title={`Sign out (${userEmail})`}
            className="w-11 h-11 rounded-xl flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-950/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </form>
      </aside>

      {/* ==================================================================== */}
      {/* 2. DESKTOP FIXED SIDEBAR (>= 1024px)                                  */}
      {/* ==================================================================== */}
      <aside className="hidden lg:flex w-60 flex-col justify-between py-6 px-4 bg-card border-r border-border fixed inset-y-0 left-0 z-30">
        <div className="space-y-6">
          {/* Brand Header */}
          <Link
            href="/"
            className="flex items-center gap-3 px-2 py-1 rounded-xl hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-foreground block leading-none">
                Expenses
              </span>
              <span className="text-[10px] text-muted-foreground tracking-wide uppercase font-semibold">
                Tracker
              </span>
            </div>
          </Link>

          {/* Nav Items List */}
          <nav className="space-y-1" aria-label="Desktop Sidebar">
            {NAV_ITEMS.map((item) => {
              const active = isItemActive(item.href, item.exact);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    active
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Desktop Sidebar Bottom Footer */}
        <div className="pt-4 border-t border-border/80 space-y-3">
          <div className="px-3">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground/70 tracking-wider block">
              Signed in as
            </span>
            <p className="text-xs font-medium text-foreground truncate mt-0.5" title={userEmail}>
              {userEmail}
            </p>
          </div>

          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-red-400 hover:bg-red-950/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* ==================================================================== */}
      {/* 3. MAIN CONTENT CONTAINER (Mobile / Tablet / Desktop Adaptive)        */}
      {/* ==================================================================== */}
      <div className="flex-1 flex flex-col md:pl-16 lg:pl-60 min-w-0 min-h-screen">
        {/* Mobile Top Header (< 768px) */}
        <header className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 h-14 bg-background/85 backdrop-blur-md border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight leading-none text-foreground">
                Expenses
              </h1>
              <p className="text-[10px] text-muted-foreground truncate max-w-[160px]">
                {userEmail}
              </p>
            </div>
          </div>

          <form action={signOutAction}>
            <button
              type="submit"
              title="Sign out"
              className="touch-target p-2 text-muted-foreground hover:text-foreground rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </header>

        {/* Tablet & Desktop Top Bar (>= 768px) */}
        <header className="hidden md:flex items-center justify-between px-6 lg:px-8 h-16 border-b border-border/80 bg-background/80 backdrop-blur-md sticky top-0 z-20">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground">
              {getPageTitle()}
            </h1>
          </div>

          {/* Primary "Add expense" Button on Tablet & Desktop */}
          <button
            type="button"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Plus className="w-4 h-4" />
            <span>Add expense</span>
          </button>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 w-full pb-24 md:pb-8">
          <div className="w-full max-w-full md:max-w-3xl lg:max-w-[1200px] mx-auto p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>

        {/* ================================================================== */}
        {/* 4. MOBILE-ONLY FLOATING ACTION BUTTON (FAB) & BOTTOM NAVIGATION     */}
        {/* ================================================================== */}
        {/* Floating Action Button (FAB) strictly on Mobile (< 768px) */}
        <div className="md:hidden fixed bottom-[4.5rem] right-4 z-30">
          <button
            type="button"
            aria-label="Add expense"
            className="touch-target w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white shadow-lg flex items-center justify-center transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Persistent Bottom Nav (< 768px) */}
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/90 backdrop-blur-lg border-t border-border px-4 py-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
          aria-label="Mobile Navigation"
        >
          <div className="flex items-center justify-around max-w-md mx-auto">
            {NAV_ITEMS.map((item) => {
              const active = isItemActive(item.href, item.exact);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center min-h-touch min-w-touch py-1 px-3 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    active
                      ? 'text-blue-500 font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] mt-1">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
