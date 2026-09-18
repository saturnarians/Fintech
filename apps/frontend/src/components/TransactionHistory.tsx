'use client';

import React from 'react';
import { Transaction } from '../types';
import { History, ArrowUpRight, ArrowDownLeft, Lock, Shield, CheckCircle2, Clock, XCircle } from 'lucide-react';

interface TransactionHistoryProps {
  transactions: Transaction[];
  currentAccountNumber?: string;
  isAdmin?: boolean;
}

/**
 * ============================================================================
 * LEARNING NOTE: TRANSACTION HISTORY & DATA ISOLATION COMPONENT
 * ============================================================================
 * Implements Assignment Requirement 4:
 * - Customers can ONLY view their own transaction history.
 * - Strict Data Isolation: Enforced at API controller level via user token.
 */
export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
  currentAccountNumber,
  isAdmin = false,
}) => {
  return (
    <div className="rounded-2xl glass-card border border-slate-800 p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-teal-500/10 rounded-lg text-teal-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Transaction History</h3>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-400" />
              {isAdmin ? 'Admin Portal — All Bank Audit Records' : 'Strict Data Privacy Isolation Enforced'}
            </p>
          </div>
        </div>
        <span className="text-xs font-mono bg-slate-800 text-slate-300 px-3 py-1 rounded-full">
          {transactions.length} Records
        </span>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-12 text-slate-500 space-y-2">
          <Shield className="w-10 h-10 mx-auto opacity-40 text-teal-400" />
          <p className="text-sm">No transaction records found for your account.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Recipient / Details</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {transactions.map((tx) => {
                const isDebit = tx.senderAccountNumber === currentAccountNumber;
                const formattedAmount = new Intl.NumberFormat('en-NG', {
                  style: 'currency',
                  currency: 'NGN',
                }).format(tx.amount);

                return (
                  <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* Direction Icon */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {tx.transactionType === 'INITIAL_PREFUND' ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                            PRE-FUND
                          </span>
                        ) : isDebit ? (
                          <span className="flex items-center gap-1 text-rose-400 font-bold">
                            <ArrowUpRight className="w-4 h-4" /> DEBIT
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-emerald-400 font-bold">
                            <ArrowDownLeft className="w-4 h-4" /> CREDIT
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Reference */}
                    <td className="py-3 px-4 font-bold text-white">{tx.reference}</td>

                    {/* Recipient / Narration */}
                    <td className="py-3 px-4 font-sans">
                      <p className="font-semibold text-slate-200">{tx.recipientAccountName}</p>
                      <p className="text-[11px] text-slate-400">
                        {tx.recipientAccountNumber} ({tx.recipientBankCode}) • {tx.narration || 'No narration'}
                      </p>
                    </td>

                    {/* Amount */}
                    <td className={`py-3 px-4 font-bold ${isDebit ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {isDebit ? `- ${formattedAmount}` : `+ ${formattedAmount}`}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      {tx.status === 'SUCCESS' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> SUCCESS
                        </span>
                      )}
                      {tx.status === 'FAILED' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-bold border border-rose-500/20">
                          <XCircle className="w-3 h-3" /> FAILED
                        </span>
                      )}
                      {tx.status === 'PENDING' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/20">
                          <Clock className="w-3 h-3" /> PENDING
                        </span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {new Date(tx.createdAt).toLocaleDateString('en-NG', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
