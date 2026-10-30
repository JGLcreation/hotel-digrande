import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { X, Shield, Briefcase, User as UserIcon, Lock, Mail, Phone, Crown, AlertCircle, AtSign } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  promptReason?: string | null;
  onSuccess?: (user?: any) => void;
  onNavigateTab?: (tab: 'guest-home' | 'guest-suites' | 'guest-amenities' | 'guest-my-bookings' | 'staff-dashboard' | 'superadmin-dashboard') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, promptReason, onSuccess, onNavigateTab }) => {
  const { login, register, demoLogin, error, clearError } = useAuth();
  const [isRegister, setIsRegister] = useState<boolean>(false);

  // Form states
  const [name, setName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [identifier, setIdentifier] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isRegister) {
      const ok = await register(name, email, password, phone, username);
      if (ok) {
        onSuccess?.();
        onClose();
      }
    } else {
      const userObj = await login(identifier, password);
      if (userObj) {
        if (userObj.role === 'superadmin') {
          onNavigateTab?.('superadmin-dashboard');
        } else if (userObj.role === 'admin' || userObj.role === 'staff') {
          onNavigateTab?.('staff-dashboard');
        } else {
          onNavigateTab?.('guest-home');
        }
        onSuccess?.(userObj);
        onClose();
      }
    }
    setLoading(false);
  };

  const handleDemoSwitch = async (role: 'superadmin' | 'admin' | 'staff' | 'guest') => {
    setLoading(true);
    const userObj = await demoLogin(role);
    setLoading(false);
    if (role === 'superadmin') {
      onNavigateTab?.('superadmin-dashboard');
    } else if (role === 'admin' || role === 'staff') {
      onNavigateTab?.('staff-dashboard');
    } else {
      onNavigateTab?.('guest-home');
    }
    onSuccess?.(userObj);
    onClose();
  };

  const fillSuperAdminCredentials = () => {
    setIsRegister(false);
    setIdentifier('lozada');
    setPassword('lozada123');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div 
        className="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl border border-[#E8E4DA] overflow-hidden max-h-[92vh] overflow-y-auto pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Grab Handle */}
        <div className="sm:hidden w-10 h-1.5 bg-[#D4CFBE] rounded-full mx-auto my-2.5 shrink-0" />

        {/* Header */}
        <div className="p-4 sm:p-6 bg-[#FAF9F6] border-b border-[#E8E4DA] flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#B89358]">
              Palace Security &amp; Access
            </span>
            <h3 className="font-serif text-xl sm:text-2xl text-[#18181B] font-light">
              {isRegister ? 'Register Guest Account' : 'Sign In to The Grand Luxe'}
            </h3>
          </div>
          <button
            onClick={() => { clearError(); onClose(); }}
            className="text-[#71717A] hover:text-[#18181B] min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-[#F2EFE8]"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Prompt Reason Banner (e.g. Guest trying to book without account) */}
        {promptReason && (
          <div className="p-3.5 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <p className="leading-snug">{promptReason}</p>
          </div>
        )}

        {/* 1-Click Role Switcher */}
        <div className="p-3.5 sm:p-4 bg-[#FAF9F6]/80 border-b border-[#E8E4DA]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-[#71717A]">
              Test Profiles &amp; Quick Access
            </p>
            <button
              type="button"
              onClick={fillSuperAdminCredentials}
              className="text-[10px] font-semibold text-purple-700 hover:underline flex items-center gap-1"
            >
              <Crown className="w-3 h-3" />
              <span>Fill `lozada`</span>
            </button>
          </div>

          <div className="grid grid-cols-4 gap-1.5 text-xs">
            {/* Super Admin */}
            <button
              type="button"
              onClick={() => handleDemoSwitch('superadmin')}
              className="p-2 min-h-[58px] bg-purple-50/70 border border-purple-200 rounded-xl hover:border-purple-400 active:bg-purple-100 text-center flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer"
              title="Super Administrator (lozada / lozada123)"
            >
              <Crown className="w-4 h-4 text-purple-700" />
              <span className="font-semibold text-purple-900 text-[11px] leading-tight">Super Admin</span>
              <span className="text-[9px] text-purple-600 font-mono">lozada</span>
            </button>

            {/* Admin (GM) */}
            <button
              type="button"
              onClick={() => handleDemoSwitch('admin')}
              className="p-2 min-h-[58px] bg-white border border-[#D4CFBE] rounded-xl hover:border-[#B89358] active:bg-[#FAF9F6] text-center flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer"
            >
              <Shield className="w-4 h-4 text-[#B89358]" />
              <span className="font-medium text-[#18181B] text-[11px] leading-tight">GM Admin</span>
              <span className="text-[9px] text-[#71717A]">admin</span>
            </button>

            {/* Staff */}
            <button
              type="button"
              onClick={() => handleDemoSwitch('staff')}
              className="p-2 min-h-[58px] bg-white border border-[#D4CFBE] rounded-xl hover:border-[#B89358] active:bg-[#FAF9F6] text-center flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer"
            >
              <Briefcase className="w-4 h-4 text-[#B89358]" />
              <span className="font-medium text-[#18181B] text-[11px] leading-tight">Front Desk</span>
              <span className="text-[9px] text-[#71717A]">clara</span>
            </button>

            {/* VIP Guest */}
            <button
              type="button"
              onClick={() => handleDemoSwitch('guest')}
              className="p-2 min-h-[58px] bg-white border border-[#D4CFBE] rounded-xl hover:border-[#B89358] active:bg-[#FAF9F6] text-center flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer"
            >
              <UserIcon className="w-4 h-4 text-[#B89358]" />
              <span className="font-medium text-[#18181B] text-[11px] leading-tight">VIP Guest</span>
              <span className="text-[9px] text-[#71717A]">guest</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-4 sm:p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {isRegister ? (
              <>
                <div>
                  <label className="block text-xs font-medium text-[#27272A] mb-1">Full Legal Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Lord Arthur Sterling"
                      className="w-full p-3 min-h-[44px] border border-[#D4CFBE] rounded-lg bg-[#FAF9F6] focus:outline-none focus:border-[#B89358]"
                    />
                    <UserIcon className="w-4 h-4 text-[#71717A] absolute right-3 top-3.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#27272A] mb-1">Username (Optional)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. sterling1898"
                      className="w-full p-3 min-h-[44px] border border-[#D4CFBE] rounded-lg bg-[#FAF9F6] focus:outline-none focus:border-[#B89358]"
                    />
                    <AtSign className="w-4 h-4 text-[#71717A] absolute right-3 top-3.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#27272A] mb-1">Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full p-3 min-h-[44px] border border-[#D4CFBE] rounded-lg bg-[#FAF9F6] focus:outline-none focus:border-[#B89358]"
                    />
                    <Mail className="w-4 h-4 text-[#71717A] absolute right-3 top-3.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#27272A] mb-1">Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a secure password"
                      className="w-full p-3 min-h-[44px] border border-[#D4CFBE] rounded-lg bg-[#FAF9F6] focus:outline-none focus:border-[#B89358]"
                    />
                    <Lock className="w-4 h-4 text-[#71717A] absolute right-3 top-3.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#27272A] mb-1">Phone Number (Optional)</label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 019-2831"
                      className="w-full p-3 min-h-[44px] border border-[#D4CFBE] rounded-lg bg-[#FAF9F6] focus:outline-none focus:border-[#B89358]"
                    />
                    <Phone className="w-4 h-4 text-[#71717A] absolute right-3 top-3.5" />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-medium text-[#27272A] mb-1">
                    Username or Email
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Username (e.g. lozada) or email"
                      className="w-full p-3 min-h-[44px] border border-[#D4CFBE] rounded-lg bg-[#FAF9F6] focus:outline-none focus:border-[#B89358]"
                    />
                    <AtSign className="w-4 h-4 text-[#71717A] absolute right-3 top-3.5" />
                  </div>
                  <p className="text-[10px] text-[#71717A] mt-1">
                    Super Admin: username <span className="font-mono font-semibold text-purple-800">lozada</span> / password <span className="font-mono font-semibold text-purple-800">lozada123</span>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#27272A] mb-1">Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full p-3 min-h-[44px] border border-[#D4CFBE] rounded-lg bg-[#FAF9F6] focus:outline-none focus:border-[#B89358]"
                    />
                    <Lock className="w-4 h-4 text-[#71717A] absolute right-3 top-3.5" />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 min-h-[48px] bg-[#18181B] hover:bg-[#B89358] active:scale-[0.98] text-white uppercase tracking-wider text-xs font-medium rounded-lg transition-all disabled:opacity-50 cursor-pointer shadow-sm mt-3"
            >
              {loading ? 'Authenticating...' : isRegister ? 'Register & Access Suites' : 'Sign In'}
            </button>
          </form>

          {/* Toggle Register / Login */}
          <div className="mt-4 pt-4 border-t border-[#E8E4DA] text-center text-xs text-[#71717A]">
            {isRegister ? (
              <p>
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => { clearError(); setIsRegister(false); }}
                  className="font-semibold text-[#18181B] hover:underline p-1 min-h-[44px]"
                >
                  Sign In to Account
                </button>
              </p>
            ) : (
              <p>
                First time at The Grand Luxe?{' '}
                <button
                  type="button"
                  onClick={() => { clearError(); setIsRegister(true); }}
                  className="font-semibold text-[#18181B] hover:underline p-1 min-h-[44px]"
                >
                  Register Guest Account (Required to Book)
                </button>
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
