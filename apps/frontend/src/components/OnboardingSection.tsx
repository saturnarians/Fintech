'use client';

import React, { useState, useRef } from 'react';
import { api } from '../lib/api';
import { createRateLimiter } from '../lib/rateLimiter';
import { User, Account } from '../types';
import { ShieldAlert, CheckCircle2, UserCheck, PlusCircle, AlertCircle } from 'lucide-react';

interface OnboardingSectionProps {
  user: User;
  account: Account | null;
  onAccountCreated: (acc: Account) => void;
  onUserUpdated: (u: User) => void;
}

/**
 * ============================================================================
 * LEARNING NOTE: CUSTOMER ONBOARDING & KYC GATE COMPONENT
 * ============================================================================
 * Implements Assignment Requirement 1:
 * - Customer MUST create/validate BVN or NIN before account creation is enabled.
 * - Enforces single account limit.
 */
export const OnboardingSection: React.FC<OnboardingSectionProps> = ({
  user,
  account,
  onAccountCreated,
  onUserUpdated,
}) => {
  const [kycType, setKycType] = useState<'BVN' | 'NIN'>('BVN');
  const [kycID, setKycID] = useState('');
  const [dob, setDob] = useState('1995-05-10');
  const [phone, setPhone] = useState(user.phone || '08012345678');
  
  // State for BVN/NIN seeding in mock store
  const [isSeeding, setIsSeeding] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [bvnNinCreated, setBvnNinCreated] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  /**
   * LEARNING NOTE: RATE LIMITER — cap KYC seed submissions to 3 per 60 s.
   * Prevents accidental or malicious flooding of the NIBSS identity gateway.
   */
  const seedLimiter = useRef(createRateLimiter(3, 60_000));

  // 1. Seed/Insert BVN or NIN into NIBSS Identity Gateway
  const handleSeedIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Rate-limit guard — 3 submissions per 60 s
    if (!seedLimiter.current.isAllowed()) {
      const waitSec = Math.ceil(seedLimiter.current.msUntilReset() / 1000);
      setErrorMsg(`Too many attempts. Please wait ${waitSec}s before trying again.`);
      return;
    }

    setIsSeeding(true);

    try {
      const endpoint = kycType === 'BVN' ? '/identity/insert-bvn' : '/identity/insert-nin';
      const payload =
        kycType === 'BVN'
          ? { bvn: kycID, firstName: user.firstName, lastName: user.lastName, dob, phone }
          : { nin: kycID, firstName: user.firstName, lastName: user.lastName, dob };

      await api.post(endpoint, payload);
      setBvnNinCreated(true);
      setSuccessMsg(`Simulated ${kycType} record "${kycID}" successfully registered in NIBSS Identity store! You can now create your account.`);
    } catch (err: any) {
      setErrorMsg(err.message || `Failed to register ${kycType} in NIBSS.`);
    } finally {
      setIsSeeding(false);
    }
  };

  // 2. Call Account Creation Endpoint (Gated by BVN/NIN)
  const handleCreateAccount = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsCreatingAccount(true);

    try {
      const res = await api.post('/accounts', {
        kycType,
        kycID,
        dob,
      });

      setSuccessMsg('Bank account created successfully! Pre-funded with ₦15,000.');
      onAccountCreated({
        accountNumber: res.data.accountNumber,
        bankCode: res.data.bankCode,
        bankName: res.data.bankName,
        balance: res.data.balance,
        currency: 'NGN',
        status: 'ACTIVE',
        createdAt: res.data.createdAt,
      });

      // Update local user state
      onUserUpdated({
        ...user,
        kycVerified: true,
        bvnOrNin: kycID,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Account creation failed.');
    } finally {
      setIsCreatingAccount(false);
    }
  };

  if (account) {
    return null; // Customer already has an account
  }

  return (
    <div className="rounded-2xl glass-card border border-amber-500/20 p-6 mb-8 shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">KYC & Account Onboarding Required</h3>
          <p className="text-xs text-slate-400">
            Requirement: You must create/validate a BVN or NIN before opening your bank account.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Step 1: Register BVN / NIN in NIBSS Gateway */}
      {!bvnNinCreated && (
        <form onSubmit={handleSeedIdentity} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Identity Type</label>
              <select
                value={kycType}
                onChange={(e) => setKycType(e.target.value as 'BVN' | 'NIN')}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
              >
                <option value="BVN">Bank Verification Number (BVN)</option>
                <option value="NIN">National Identity Number (NIN)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                11-Digit {kycType} ID
              </label>
              <input
                type="text"
                placeholder="e.g. 11112222333"
                value={kycID}
                onChange={(e) => setKycID(e.target.value)}
                maxLength={11}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Date of Birth</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSeeding || kycID.length !== 11}
            className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <UserCheck className="w-4 h-4" />
            {isSeeding ? 'Verifying with NIBSS...' : `Step 1: Validate & Register ${kycType} with NIBSS`}
          </button>
        </form>
      )}

      {/* Step 2: Create Account after KYC Verification */}
      {bvnNinCreated && (
        <div className="bg-slate-900/80 p-5 rounded-xl border border-teal-500/30 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-teal-500/20 text-teal-400">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white">KYC Verified: {kycType} ({kycID})</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Your identity has been verified against NIBSS records. Click below to generate your 10-digit NUBAN account with automatic ₦15,000 pre-funding.
            </p>
          </div>

          <button
            onClick={handleCreateAccount}
            disabled={isCreatingAccount}
            className="gradient-accent hover:opacity-90 disabled:opacity-50 text-white font-bold px-8 py-3 rounded-xl text-sm inline-flex items-center gap-2 glow-button"
          >
            <PlusCircle className="w-5 h-5" />
            {isCreatingAccount ? 'Generating Account...' : 'Step 2: Create Account & Claim ₦15,000 Pre-Funding'}
          </button>
        </div>
      )}
    </div>
  );
};
