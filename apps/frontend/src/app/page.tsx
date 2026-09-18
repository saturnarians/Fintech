'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { User, Account, Transaction } from '../types';
import { Navbar } from '../components/Navbar';
import { AccountCard } from '../components/AccountCard';
import { OnboardingSection } from '../components/OnboardingSection';
import { TransferModal } from '../components/TransferModal';
import { TransactionHistory } from '../components/TransactionHistory';
import {
  Building2,
  Lock,
  UserPlus,
  LogIn,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Users,
  CheckCircle2,
} from 'lucide-react';

/**
 * ============================================================================
 * LEARNING NOTE: MAIN APPLICATION ENTRY POINT (NEXT.JS + NESTJS)
 * ============================================================================
 * Coordinates the full Digital Banking assignment workflow:
 * 1. Auth & Passport JWT session persistence.
 * 2. BVN/NIN Onboarding verification gate before account creation.
 * 3. Single NUBAN account creation with ₦15,000 pre-funding.
 * 4. Intra-bank and Inter-bank NIBSS transfer operations.
 * 5. Strict Data Privacy (Customers view ONLY their own data).
 * 6. Role-Based Access Control (RBAC): Admin portal for auditing all accounts.
 */
export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allAccounts, setAllAccounts] = useState<Account[]>([]);

  // Auth Toggle & Form State
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [bvnOrNin, setBvnOrNin] = useState('');

  // UI State
  const [activeView, setActiveView] = useState<'dashboard' | 'admin'>('dashboard');
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // Restore session on load
  useEffect(() => {
    const token = localStorage.getItem('phc_jwt_token');
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch Authenticated User Profile & Banking Data
  const fetchProfile = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.get('/auth/profile');
      setUser(res.data);
      await fetchAccountAndTransactions(res.data);
    } catch (err: any) {
      localStorage.removeItem('phc_jwt_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccountAndTransactions = async (currentUser: User) => {
    try {
      // Fetch Customer Account
      const accRes = await api.get('/accounts/me');
      setAccount(accRes.data);

      // Fetch Customer Transactions (Strict Data Privacy)
      const txRes = await api.get('/transactions');
      setTransactions(txRes.data);

      // If Admin, also fetch all bank accounts (RBAC test)
      if (currentUser.role === 'ADMIN') {
        const adminAccsRes = await api.get('/accounts');
        setAllAccounts(adminAccsRes.data);
      }
    } catch (err) {
      // Account not created yet
      setAccount(null);
      setTransactions([]);
    }
  };

  // Auth Submit Handler
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmittingAuth(true);

    try {
      if (authMode === 'register') {
        await api.post('/auth/register', {
          email,
          password,
          firstName,
          lastName,
          phone,
          bvnOrNin: bvnOrNin || undefined,
        });
      }

      // Login to obtain Passport JWT
      const loginRes = await api.post('/auth/login', { email, password });
      const { accessToken, user: authenticatedUser } = loginRes.data;

      localStorage.setItem('phc_jwt_token', accessToken);
      setUser(authenticatedUser);
      await fetchAccountAndTransactions(authenticatedUser);
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('phc_jwt_token');
    setUser(null);
    setAccount(null);
    setTransactions([]);
    setAllAccounts([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-mono">Initializing PHC Core Banking Engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-navy-900 text-slate-100">
      <Navbar
        user={user}
        onLogout={handleLogout}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {!user ? (
          /* Authentication Screen */
          <div className="max-w-md mx-auto my-8">
            <div className="text-center mb-8">
              <div className="inline-flex p-3 rounded-2xl gradient-accent shadow-xl shadow-teal-500/20 mb-3">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">PHC Digital Banking</h2>
              <p className="text-xs text-slate-400 mt-1">
                Domain-Driven Modular Monolith with Clean/Hexagonal Architecture
              </p>
            </div>

            <div className="glass-card rounded-2xl p-6 border border-slate-800 shadow-2xl">
              {/* Tab Switcher */}
              <div className="grid grid-cols-2 gap-1 bg-slate-900/80 p-1 rounded-xl mb-6 border border-slate-800">
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setErrorMsg('');
                  }}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    authMode === 'login' ? 'bg-teal-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" /> Sign In
                </button>
                <button
                  onClick={() => {
                    setAuthMode('register');
                    setErrorMsg('');
                  }}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    authMode === 'register' ? 'bg-teal-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" /> Register
                </button>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authMode === 'register' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">First Name</label>
                        <input
                          type="text"
                          required
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Last Name</label>
                        <input
                          type="text"
                          required
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="08012345678"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="customer@example.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingAuth}
                  className="w-full gradient-accent hover:opacity-90 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 glow-button mt-4"
                >
                  <Lock className="w-4 h-4" />
                  {isSubmittingAuth ? 'Authenticating...' : authMode === 'login' ? 'Sign In' : 'Create Customer Account'}
                </button>
              </form>

              {/* Seed Credentials Hint */}
              <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400">
                <p className="font-semibold text-slate-300 mb-1">Mock Seed Credentials:</p>
                <ul className="space-y-0.5 font-mono">
                  <li>Customer: <span className="text-teal-400">alice@example.com</span> / <span className="text-teal-400">Password123!</span></li>
                  <li>Admin: <span className="text-purple-400">admin@phcbank.com</span> / <span className="text-purple-400">AdminPassword123!</span></li>
                </ul>
              </div>
            </div>
          </div>
        ) : activeView === 'admin' && user.role === 'ADMIN' ? (
          /* RBAC Admin Portal View */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-purple-400" /> Admin RBAC Portal
                </h2>
                <p className="text-xs text-slate-400">Auditing all bank accounts & inter-bank settlement logs</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold font-mono">
                Role: SUPERADMIN
              </span>
            </div>

            {/* Admin Account List */}
            <div className="rounded-2xl glass-card border border-purple-500/20 p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" /> System Bank Accounts ({allAccounts.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2.5 px-3">Account Number</th>
                      <th className="py-2.5 px-3">Bank Code</th>
                      <th className="py-2.5 px-3">User ID</th>
                      <th className="py-2.5 px-3">Balance</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {allAccounts.map((acc) => (
                      <tr key={acc.accountNumber} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-bold text-teal-400">{acc.accountNumber}</td>
                        <td className="py-2.5 px-3">{acc.bankCode} ({acc.bankName})</td>
                        <td className="py-2.5 px-3 text-slate-400">{acc.id || 'usr-registered'}</td>
                        <td className="py-2.5 px-3 font-bold text-emerald-400">₦{acc.balance.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-emerald-300">{acc.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Admin Global Transaction Audit */}
            <TransactionHistory transactions={transactions} isAdmin={true} />
          </div>
        ) : (
          /* Customer Banking Dashboard */
          <div className="space-y-8">
            {/* Onboarding KYC Gate */}
            <OnboardingSection
              user={user}
              account={account}
              onAccountCreated={(acc) => {
                setAccount(acc);
                fetchProfile();
              }}
              onUserUpdated={setUser}
            />

            {/* Account Card (₦15k pre-funded) */}
            {account && (
              <AccountCard
                account={account}
                onRefresh={() => user && fetchAccountAndTransactions(user)}
                onOpenTransfer={() => setIsTransferOpen(true)}
              />
            )}

            {/* Transaction History (Strict Data Privacy) */}
            {account && (
              <TransactionHistory
                transactions={transactions}
                currentAccountNumber={account.accountNumber}
              />
            )}

            {/* Funds Transfer Modal */}
            {account && (
              <TransferModal
                isOpen={isTransferOpen}
                onClose={() => setIsTransferOpen(false)}
                onTransferSuccess={() => fetchAccountAndTransactions(user)}
                senderAccountNo={account.accountNumber}
              />
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800 bg-navy-950 px-6 py-4 text-center text-xs text-slate-500">
        <p>TS Academy — Phoenix Cohort Digital Banking Monolith • Built with NestJS, Drizzle, SQLite, and Next.js</p>
      </footer>
    </div>
  );
}
