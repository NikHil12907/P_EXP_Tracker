'use client';

import { useState } from 'react';
import { Search, Receipt, Plus } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils/format';

const CATEGORY_FILTERS = [
  'All',
  'Food & Dining',
  'Groceries',
  'Shopping',
  'Bills & Utilities',
  'Travel & Fuel',
  'Health & Medical',
  'Entertainment',
  'Transfers (People)',
];

const MODE_FILTERS = ['All Modes', 'UPI', 'card', 'netbanking', 'atm'];

export default function TransactionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedMode, setSelectedMode] = useState('All Modes');

  // Transactions list (wired to live database queries in Phase 4)
  const transactions: Array<{
    id: string;
    merchant: string;
    amount: number;
    category: string | null;
    payment_mode: string;
    account_last4: string | null;
    occurred_at: string;
    note: string | null;
  }> = [];

  return (
    <div className="space-y-6">
      {/* Header & Subtitle */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Transactions
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Filter, search, and manage your recorded debits
        </p>
      </div>

      {/* ==================================================================== */}
      {/* TOOLBAR: SEARCH & FILTER CHIPS                                       */}
      {/* ==================================================================== */}
      <div className="space-y-3 bg-card border border-border rounded-2xl p-4 shadow-sm">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by merchant or note..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all"
          />
        </div>

        {/* Filter Chips Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* Category Chips Scrollable */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-[11px] font-semibold uppercase text-muted-foreground/80 tracking-wider mr-1 shrink-0">
              Category:
            </span>
            {CATEGORY_FILTERS.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    active
                      ? 'bg-blue-600 text-white'
                      : 'bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Mode Selector */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-semibold uppercase text-muted-foreground/80 tracking-wider">
              Mode:
            </span>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="h-8 px-2 rounded-lg bg-background border border-border text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {MODE_FILTERS.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TRANSACTIONS VIEW: DESKTOP TABLE & MOBILE CARDS                      */}
      {/* ==================================================================== */}
      {transactions.length === 0 ? (
        /* Empty State */
        <div className="bg-card border border-border rounded-2xl p-10 lg:p-16 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto border border-border">
            <Receipt className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              No transactions found
            </p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Transactions forwarded from your phone or entered manually will appear in this ledger.
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
          {/* Desktop Table View (>= 768px) with Sticky Header */}
          <div className="hidden md:block bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="max-h-[600px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-card border-b border-border/80 shadow-sm">
                  <tr className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="py-3 px-4">Merchant</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Mode</th>
                    <th className="py-3 px-4">Date / Time</th>
                    <th className="py-3 px-4">Account</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-sm">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3 px-4 font-medium text-foreground">
                        {tx.merchant}
                        {tx.note && (
                          <span className="block text-[11px] text-muted-foreground/80 font-normal">
                            {tx.note}
                          </span>
                        )}
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
                          {tx.payment_mode}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {formatDateTime(tx.occurred_at)}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-muted-foreground">
                        {tx.account_last4 ? `X${tx.account_last4}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-medium tabular-nums text-foreground">
                        -{formatCurrency(tx.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards View (< 768px) */}
          <div className="md:hidden divide-y divide-border/60 bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            {transactions.map((tx) => (
              <div key={tx.id} className="p-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-foreground">
                    {tx.merchant}
                  </div>
                  <div className="text-sm font-semibold tabular-nums text-foreground">
                    -{formatCurrency(tx.amount)}
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <span>{tx.category || 'Uncategorised'}</span>
                    <span>•</span>
                    <span className="uppercase font-medium">{tx.payment_mode}</span>
                  </div>
                  <div>{formatDateTime(tx.occurred_at)}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
