import { Home, Receipt, BarChart3, Inbox, type LucideIcon } from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Home',
    href: '/',
    icon: Home,
    exact: true,
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
