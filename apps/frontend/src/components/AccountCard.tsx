'use client';

import React, { useState } from 'react';
import { Account } from '../types';
import { CreditCard, Eye, EyeOff, Sparkles, RefreshCw, Send, ArrowUpRight } from 'lucide-react';

interface AccountCardProps {
  account: Account | null;
  onRefresh: () => void;
  onOpenTransfer: () => void;
}

/**
 * ============================================================================
 * LEARNING NOTE: ACCOUNT CARD & PRE-FUNDING DISPLAY
 * ============================================================================
 * Assignment Requirement 2:
 * "Upon account creation: Each account is pre-funded with ₦15,000 to enable testing."
 * This component visualizes the 10-digit NUBAN account number and real-time balance.
 */
export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  onRefresh,
  onOpenTransfer,
}) => {
  const [showBalance, setShowBalance] = useState(true);

  if (!account) return null;

  const formattedBalance = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(account.balance);

  return (
    <div className="relative overflow-hidden rounded-2xl glass-card border border-teal-500/20 p-6 shadow-2xl">
      {/* Background glow decoration */}
      <div className="absolute -right-16 -top-16 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">
              {account.bankName} Account
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" /> ₦15,000 Pre-Funded
            </span>
          </div>
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-mono font-bold tracking-widest text-white">
              {account.accountNumber}
            </h3>
            <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2 py-1 rounded">
              Bank Code: {account.bankCode}
            </span>
          </div>
        </div>

        <button
          onClick={onRefresh}
          className="self-start sm:self-auto p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-lg transition-all"
          title="Refresh Balance"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Account Balance Section */}
      <div className="mb-6 bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 mb-0.5">Available Balance</p>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {showBalance ? formattedBalance : '••••••••'}
            </span>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="text-slate-400 hover:text-teal-400 transition-colors"
            >
              {showBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Quick Action Button */}
        <button
          onClick={onOpenTransfer}
          className="gradient-accent text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 glow-button"
        >
          <Send className="w-4 h-4" />
          Send Money
        </button>
      </div>

      {/* Status Footer */}
      <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/60 pt-3">
        <span className="flex items-center gap-1">
          <CreditCard className="w-3.5 h-3.5 text-teal-400" />
          Single Account Policy Enforced (Max 1)
        </span>
        <span className="text-emerald-400 font-medium">Status: {account.status}</span>
      </div>
    </div>
  );
};
