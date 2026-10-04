'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Receipt, BarChart3, Inbox } from 'lucide-react';

const NAV_ITEMS = [
  {
    label: 'Home',
    href: '/',
    icon: Home,
  },
  {
    label: 'Transactions',
    href: '/transactions',
    icon: Receipt,
  },
  {
    label: 'Charts',
    href: '/charts',
    icon: BarChart3,
  },
  {
    label: 'Review',
    href: '/review',
    icon: Inbox,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/90 backdrop-blur-lg border-t border-border px-4 py-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <div className="max-w-[420px] mx-auto flex items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center min-h-touch min-w-touch py-1 px-3 rounded-xl transition-colors ${
                isActive
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
  );
}
