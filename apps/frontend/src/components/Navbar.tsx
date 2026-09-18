'use client';

import React from 'react';
import { User } from '../types';
import { Building2, ShieldCheck, LogOut, UserCheck } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  activeView: 'dashboard' | 'admin';
  setActiveView: (view: 'dashboard' | 'admin') => void;
}

/**
 * ============================================================================
 * LEARNING NOTE: NAVBAR & RBAC BADGE COMPONENT
 * ============================================================================
 * Displays user session details, role badge (CUSTOMER vs ADMIN),
 * and navigation tabs for Role-Based Access Control (RBAC).
 */
export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
  activeView,
  setActiveView,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-navy-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand & Bank Identifiers */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              PHC Bank <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">Code 260</span>
            </h1>
            <p className="text-xs text-slate-400">Powered by NIBSS by Phoenix</p>
          </div>
        </div>

        {/* User Session & Role Navigation */}
        {user ? (
          <div className="flex items-center space-x-4">
            {/* RBAC Navigation Tabs */}
            {user.role === 'ADMIN' && (
              <div className="bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 flex space-x-1">
                <button
                  onClick={() => setActiveView('dashboard')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    activeView === 'dashboard'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Customer View
                </button>
                <button
                  onClick={() => setActiveView('admin')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
                    activeView === 'admin'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Admin Portal (RBAC)
                </button>
              </div>
            )}

            {/* Profile Info */}
            <div className="flex items-center space-x-3 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-800">
              <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-sm">
                {user.firstName[0]}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-semibold text-white">{user.fullName}</p>
                <div className="flex items-center gap-1 text-[10px]">
                  <span
                    className={`font-mono px-1.5 py-0.2 rounded font-bold ${
                      user.role === 'ADMIN'
                        ? 'bg-purple-500/20 text-purple-300'
                        : 'bg-teal-500/20 text-teal-300'
                    }`}
                  >
                    {user.role}
                  </span>
                  {user.kycVerified && (
                    <span className="text-emerald-400 flex items-center gap-0.5">
                      <UserCheck className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              title="Log out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="text-xs text-slate-400">Not Authenticated</div>
        )}
      </div>
    </header>
  );
};
