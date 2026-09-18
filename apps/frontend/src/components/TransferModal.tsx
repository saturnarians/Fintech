'use client';

import React, { useState } from 'react';
import { api } from '../lib/api';
import { NameEnquiryResponse, TransferResponse } from '../types';
import { X, Send, Search, CheckCircle2, AlertCircle, ArrowRightLeft, ShieldCheck } from 'lucide-react';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransferSuccess: () => void;
  senderAccountNo: string;
}

/**
 * ============================================================================
 * LEARNING NOTE: FUNDS TRANSFER & NAME ENQUIRY MODAL
 * ============================================================================
 * Implements Assignment Requirement 3:
 * 1. Name Enquiry: Verifies recipient details before executing transfer.
 * 2. Intra-bank transfers: Internal ledger updates.
 * 3. Inter-bank transfers: Routed through NIBSS by Phoenix settlement API.
 */
export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  onTransferSuccess,
  senderAccountNo,
}) => {
  const [recipientAccNo, setRecipientAccNo] = useState('');
  const [bankCode, setBankCode] = useState('260'); // Default to internal bank code
  const [amount, setAmount] = useState('');
  const [narration, setNarration] = useState('');

  // Name Enquiry State
  const [isPerformingEnquiry, setIsPerformingEnquiry] = useState(false);
  const [enquiryResult, setEnquiryResult] = useState<NameEnquiryResponse | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successResult, setSuccessResult] = useState<TransferResponse | null>(null);

  if (!isOpen) return null;

  // 1. Perform Name Enquiry to verify recipient
  const handleNameEnquiry = async () => {
    if (recipientAccNo.length !== 10) return;
    setErrorMsg('');
    setIsPerformingEnquiry(true);
    setEnquiryResult(null);

    try {
      const res = await api.get(`/accounts/name-enquiry/${recipientAccNo}`);
      setEnquiryResult(res.data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Recipient account enquiry failed.');
    } finally {
      setIsPerformingEnquiry(false);
    }
  };

  // 2. Submit Transfer Request
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount < 100) {
      setErrorMsg('Minimum transfer amount is ₦100');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await api.post('/transactions/transfer', {
        to: recipientAccNo,
        amount: numericAmount,
        recipientBankCode: bankCode,
        recipientAccountName: enquiryResult?.accountName || 'Recipient',
        narration: narration || 'Funds Transfer',
      });

      setSuccessResult(res.data);
      onTransferSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Transfer failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setRecipientAccNo('');
    setAmount('');
    setNarration('');
    setEnquiryResult(null);
    setSuccessResult(null);
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-navy-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-500/10 rounded-lg text-teal-400">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Funds Transfer</h3>
              <p className="text-xs text-slate-400">Intra-bank & Inter-bank via NIBSS</p>
            </div>
          </div>
          <button onClick={handleReset} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success View */}
        {successResult ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full inline-flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-white">Transfer Successful!</h4>
              <p className="text-sm text-slate-300 mt-1">
                ₦{successResult.amount.toLocaleString()} sent to <span className="font-semibold text-white">{successResult.recipientName}</span>
              </p>
              <p className="text-xs text-teal-400 font-mono mt-2">
                Ref: {successResult.transactionId}
              </p>
              {successResult.externalTransactionId && (
                <p className="text-xs text-purple-400 font-mono">
                  NIBSS TSQ ID: {successResult.externalTransactionId}
                </p>
              )}
            </div>
            <button
              onClick={handleReset}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          /* Transfer Form */
          <form onSubmit={handleTransfer} className="space-y-4">
            {/* Bank Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Destination Bank</label>
              <select
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
              >
                <option value="260">PHC Bank (Intra-Bank, Code 260)</option>
                <option value="108">KAC Bank (Inter-Bank NIBSS, Code 108)</option>
                <option value="999">Apex Bank (Inter-Bank NIBSS, Code 999)</option>
              </select>
            </div>

            {/* Recipient Account Number & Name Enquiry */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Recipient Account Number (10 Digits)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. 2601234567 or 1087207670"
                  value={recipientAccNo}
                  onChange={(e) => {
                    setRecipientAccNo(e.target.value);
                    setEnquiryResult(null);
                  }}
                  maxLength={10}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-teal-500"
                />
                <button
                  type="button"
                  onClick={handleNameEnquiry}
                  disabled={recipientAccNo.length !== 10 || isPerformingEnquiry}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1 shrink-0"
                >
                  <Search className="w-3.5 h-3.5" />
                  {isPerformingEnquiry ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </div>

            {/* Name Enquiry Result Display */}
            {enquiryResult && (
              <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-teal-300">{enquiryResult.accountName}</p>
                  <p className="text-slate-400">{enquiryResult.bankName} ({enquiryResult.accountNumber})</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 text-[10px] font-bold">
                  {enquiryResult.isInternal ? 'Internal Account' : 'NIBSS Partner'}
                </span>
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Transfer Amount (₦)</label>
              <input
                type="number"
                placeholder="e.g. 5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={100}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Narration */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Narration</label>
              <input
                type="text"
                placeholder="e.g. Payment for service"
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || recipientAccNo.length !== 10}
              className="w-full gradient-accent hover:opacity-90 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 glow-button mt-4"
            >
              <ShieldCheck className="w-4 h-4" />
              {isSubmitting ? 'Processing Transfer...' : 'Confirm & Send Funds'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
