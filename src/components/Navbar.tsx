import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';
import { 
  Sparkles, User as UserIcon, Shield, Briefcase, Crown,
  Menu, X, Compass, Bed, Calendar, Waves, LogOut, ChevronDown,
  Sun, Moon
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'guest-home' | 'guest-suites' | 'guest-amenities' | 'guest-my-bookings' | 'staff-dashboard' | 'superadmin-dashboard';
  setActiveTab: (tab: 'guest-home' | 'guest-suites' | 'guest-amenities' | 'guest-my-bookings' | 'staff-dashboard' | 'superadmin-dashboard') => void;
  onOpenBookingModal: (roomTypeId?: string) => void;
  onOpenAuthModal: () => void;
  onOpenConcierge: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenBookingModal,
  onOpenAuthModal,
  onOpenConcierge
}) => {
  const { user, isAuthenticated, logout, demoLogin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isSuperAdmin = user?.role === 'superadmin';
  const isStaffOrAdmin = Boolean(user && (user.role === 'staff' || user.role === 'admin' || user.role === 'superadmin'));

  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-[#FAF9F6]/95 dark:bg-[#0c0e12]/95 backdrop-blur-md border-b border-[#E6E2D8] dark:border-[#27272a] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between">
          
          {/* Zone 1: Single element wordmark in high-contrast luxury serif */}
          <button
            onClick={() => { setActiveTab('guest-home'); setMobileMenuOpen(false); }}
            className="text-left group focus:outline-none min-h-[44px] flex flex-col justify-center cursor-pointer"
          >
            <span className="font-serif text-xl sm:text-2xl tracking-[0.16em] sm:tracking-[0.2em] font-semibold text-[#18181B] dark:text-[#f4f4f5] group-hover:text-[#B89358] transition-colors">
              THE GRAND LUXE
            </span>
            <span className="block text-[8px] sm:text-[9px] uppercase tracking-[0.25em] text-[#71717A] dark:text-[#a1a1aa] -mt-0.5 sm:-mt-1 font-sans">
              Hotel &amp; Resort · Est. 1898
            </span>
          </button>

          {/* Zone 2: Desktop 4-6 clean text navigation links */}
          <nav className="hidden md:flex items-center gap-8 text-xs uppercase tracking-[0.18em] font-medium text-[#52525B] dark:text-[#a1a1aa]">
            <button
              onClick={() => setActiveTab('guest-home')}
              className={`hover:text-[#B89358] dark:hover:text-[#B89358] transition-colors min-h-[44px] flex items-center cursor-pointer ${
                activeTab === 'guest-home' ? 'text-[#18181B] dark:text-white font-semibold' : ''
              }`}
            >
              Overview
            </button>
            
            <button
              onClick={() => setActiveTab('guest-suites')}
              className={`hover:text-[#B89358] dark:hover:text-[#B89358] transition-colors min-h-[44px] flex items-center cursor-pointer ${
                activeTab === 'guest-suites' ? 'text-[#18181B] dark:text-white font-semibold' : ''
              }`}
            >
              Suites &amp; Villas
            </button>
            
            <button
              onClick={() => setActiveTab('guest-amenities')}
              className={`hover:text-[#B89358] dark:hover:text-[#B89358] transition-colors min-h-[44px] flex items-center cursor-pointer ${
                activeTab === 'guest-amenities' ? 'text-[#18181B] dark:text-white font-semibold' : ''
              }`}
            >
              Wellness &amp; Dining
            </button>

            {isAuthenticated && (
              <button
                onClick={() => setActiveTab('guest-my-bookings')}
                className={`hover:text-[#B89358] dark:hover:text-[#B89358] transition-colors min-h-[44px] flex items-center cursor-pointer ${
                  activeTab === 'guest-my-bookings' ? 'text-[#18181B] dark:text-white font-semibold' : ''
                }`}
              >
                My Reservations
              </button>
            )}

            {isSuperAdmin && (
              <button
                onClick={() => setActiveTab('superadmin-dashboard')}
                className={`transition-colors flex items-center gap-1.5 py-1 px-2.5 rounded-sm border min-h-[44px] cursor-pointer ${
                  activeTab === 'superadmin-dashboard'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-100'
                }`}
              >
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                <span>Super Admin</span>
              </button>
            )}

            {isStaffOrAdmin && (
              <button
                onClick={() => setActiveTab('staff-dashboard')}
                className={`transition-colors flex items-center gap-1.5 py-1 px-2.5 rounded-sm border min-h-[44px] cursor-pointer ${
                  activeTab === 'staff-dashboard'
                    ? 'bg-[#18181B] dark:bg-zinc-800 text-[#FAF9F6] border-[#18181B] dark:border-zinc-700'
                    : 'bg-[#B89358]/10 text-[#8C6A32] dark:text-[#d8b77d] border-[#B89358]/30 hover:bg-[#B89358]/20'
                }`}
              >
                {user?.role === 'admin' || user?.role === 'superadmin' ? (
                  <Shield className="w-3.5 h-3.5" />
                ) : (
                  <Briefcase className="w-3.5 h-3.5" />
                )}
                <span>Operations</span>
              </button>
            )}
          </nav>

          {/* Zone 3: Actions + Mobile menu toggler */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Theme Toggle Button (Light/Dark Mode) */}
            <button
              onClick={toggleTheme}
              className="p-2 min-h-[44px] min-w-[44px] border border-[#D4CFBE] dark:border-[#3f3f46] rounded-lg bg-white dark:bg-[#18181b] text-[#27272A] dark:text-[#f4f4f5] hover:border-[#B89358] transition-colors flex items-center justify-center cursor-pointer shadow-xs"
              title={theme === 'dark' ? 'Switch to Luxury Light Mode' : 'Switch to Evening Dark Mode'}
              aria-label="Toggle Dark/Light Mode"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 animate-spin-once" />
              ) : (
                <Moon className="w-4 h-4 text-[#71717A] hover:text-[#B89358]" />
              )}
            </button>

            {/* AI Luxury Concierge button (Desktop & Mobile) */}
            <button
              onClick={onOpenConcierge}
              className="flex items-center gap-1 text-xs font-medium text-[#71717A] dark:text-[#a1a1aa] hover:text-[#B89358] dark:hover:text-[#B89358] min-h-[44px] px-2 sm:px-2.5 py-1.5 rounded transition-colors cursor-pointer"
              title="Ask Personal Concierge"
            >
              <Sparkles className="w-4 h-4 text-[#B89358]" />
              <span className="hidden sm:inline">Concierge</span>
            </button>

            {/* Quick Role Switcher / Demo Dropdown */}
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-1.5 text-xs min-h-[44px] px-2.5 py-1.5 border border-[#D4CFBE] dark:border-[#3f3f46] rounded bg-white dark:bg-[#18181b] text-[#27272A] dark:text-[#f4f4f5] hover:border-[#B89358] transition-colors cursor-pointer"
              >
                <UserIcon className="w-3.5 h-3.5 text-[#B89358]" />
                <span className="truncate max-w-[80px] sm:max-w-[110px]">
                  {isAuthenticated ? (user?.username || user?.name.split(' ')[0]) : 'Sign In'}
                </span>
                <ChevronDown className="w-3 h-3 text-[#71717A] dark:text-[#a1a1aa]" />
              </button>

              {roleMenuOpen && (
                <div 
                  className="absolute right-0 mt-1.5 w-68 bg-white dark:bg-[#18181b] border border-[#E4E0D5] dark:border-[#27272a] rounded-lg shadow-xl py-2 z-50 text-xs animate-fade-in"
                  onMouseLeave={() => setRoleMenuOpen(false)}
                >
                  <div className="px-3 py-1.5 border-b border-[#F0ECE1] dark:border-[#27272a]">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-[#18181B] dark:text-white truncate">{user?.name || 'Guest User'}</p>
                      {user?.role === 'superadmin' && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-950 dark:text-amber-300 px-1.5 py-0.5 rounded">
                          <Crown className="w-2.5 h-2.5" /> ROOT
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#71717A] dark:text-[#a1a1aa] truncate">
                      {user?.username ? `@${user.username} · ` : ''}{user?.email || 'Not authenticated'}
                    </p>
                    <span className="inline-block mt-1 text-[10px] uppercase font-semibold tracking-wider text-[#B89358]">
                      Position: {user?.role ? user.role.toUpperCase() : 'UNREGISTERED GUEST'}
                    </span>
                  </div>

                  <div className="p-2 space-y-1 bg-[#FAF9F6]/60 dark:bg-[#27272a]/40 border-b border-[#F0ECE1] dark:border-[#27272a]">
                    <p className="text-[10px] uppercase tracking-wider text-[#A1A1AA] px-1 font-medium">Quick Demo Role Switch</p>
                    
                    {/* Super Admin lozada */}
                    <button
                      onClick={async () => {
                        const u = await demoLogin('superadmin');
                        if (u?.role === 'superadmin') setActiveTab('superadmin-dashboard');
                        setRoleMenuOpen(false);
                      }}
                      className="w-full text-left px-2 py-1.5 min-h-[36px] rounded hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center justify-between text-amber-950 dark:text-amber-300 font-medium cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5">
                        <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>Super Administrator (lozada)</span>
                      </div>
                      <span className="text-[9px] bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 px-1 py-0.5 rounded font-mono">Console</span>
                    </button>

                    <button
                      onClick={async () => {
                        const u = await demoLogin('admin');
                        if (u) setActiveTab('staff-dashboard');
                        setRoleMenuOpen(false);
                      }}
                      className="w-full text-left px-2 py-1.5 min-h-[36px] rounded hover:bg-white dark:hover:bg-zinc-800 flex items-center justify-between text-[#27272A] dark:text-[#e4e4e7] cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-[#B89358]" />
                        <span>General Manager (Admin)</span>
                      </div>
                      <span className="text-[9px] bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 px-1 py-0.5 rounded font-mono">Operations</span>
                    </button>

                    <button
                      onClick={async () => {
                        const u = await demoLogin('staff');
                        if (u) setActiveTab('staff-dashboard');
                        setRoleMenuOpen(false);
                      }}
                      className="w-full text-left px-2 py-1.5 min-h-[36px] rounded hover:bg-white dark:hover:bg-zinc-800 flex items-center justify-between text-[#27272A] dark:text-[#e4e4e7] cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-[#B89358]" />
                        <span>Front Desk Manager (Staff)</span>
                      </div>
                      <span className="text-[9px] bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 px-1 py-0.5 rounded font-mono">Front Desk</span>
                    </button>

                    <button
                      onClick={async () => {
                        const u = await demoLogin('guest');
                        if (u) setActiveTab('guest-home');
                        setRoleMenuOpen(false);
                      }}
                      className="w-full text-left px-2 py-1.5 min-h-[36px] rounded hover:bg-white dark:hover:bg-zinc-800 flex items-center justify-between text-[#27272A] dark:text-[#e4e4e7] cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5">
                        <UserIcon className="w-3.5 h-3.5 text-[#B89358]" />
                        <span>VIP Guest (Camille)</span>
                      </div>
                      <span className="text-[9px] bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 px-1 py-0.5 rounded font-mono">Guest</span>
                    </button>
                  </div>

                  {isAuthenticated ? (
                    <button
                      onClick={() => { logout(); setRoleMenuOpen(false); }}
                      className="w-full text-left px-3 py-2.5 min-h-[44px] text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => { onOpenAuthModal(); setRoleMenuOpen(false); }}
                      className="w-full text-left px-3 py-2.5 min-h-[44px] text-[#18181B] dark:text-white font-medium hover:bg-[#FAF9F6] dark:hover:bg-zinc-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-[#B89358]" />
                      <span>Sign In or Register</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Primary Action Button (Desktop) */}
            <button
              onClick={() => onOpenBookingModal()}
              className="hidden sm:flex items-center px-4 py-2 min-h-[44px] text-xs uppercase tracking-[0.16em] font-medium text-white bg-[#18181B] dark:bg-[#B89358] dark:text-[#0c0e12] dark:hover:bg-[#d8b77d] rounded hover:bg-[#27272A] transition-colors whitespace-nowrap shadow-sm cursor-pointer"
            >
              Reserve a Suite
            </button>

            {/* Mobile Hamburger Drawer Trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#18181B] dark:text-[#f4f4f5] hover:text-[#B89358] transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

          </div>

        </div>

        {/* Mobile Slide-Over Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-[#12151b] border-b border-[#E8E4DA] dark:border-[#27272a] px-4 pt-3 pb-6 space-y-3 shadow-lg animate-fade-in">
            <div className="flex flex-col space-y-1 text-sm font-medium text-[#27272A] dark:text-[#e4e4e7]">
              <button
                onClick={() => { setActiveTab('guest-home'); setMobileMenuOpen(false); }}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg min-h-[44px] cursor-pointer transition-colors ${
                  activeTab === 'guest-home' 
                    ? 'bg-[#FAF9F6] dark:bg-zinc-800 text-[#B89358] font-semibold' 
                    : 'hover:bg-gray-50 dark:hover:bg-zinc-800/60'
                }`}
              >
                <Compass className="w-4 h-4" />
                <span>Overview &amp; Welcome</span>
              </button>
              <button
                onClick={() => { setActiveTab('guest-suites'); setMobileMenuOpen(false); }}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg min-h-[44px] cursor-pointer transition-colors ${
                  activeTab === 'guest-suites' 
                    ? 'bg-[#FAF9F6] dark:bg-zinc-800 text-[#B89358] font-semibold' 
                    : 'hover:bg-gray-50 dark:hover:bg-zinc-800/60'
                }`}
              >
                <Bed className="w-4 h-4" />
                <span>Suites &amp; Villas Portfolio</span>
              </button>
              <button
                onClick={() => { setActiveTab('guest-amenities'); setMobileMenuOpen(false); }}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg min-h-[44px] cursor-pointer transition-colors ${
                  activeTab === 'guest-amenities' 
                    ? 'bg-[#FAF9F6] dark:bg-zinc-800 text-[#B89358] font-semibold' 
                    : 'hover:bg-gray-50 dark:hover:bg-zinc-800/60'
                }`}
              >
                <Waves className="w-4 h-4" />
                <span>Thermal Spa &amp; Michelin Dining</span>
              </button>
              <button
                onClick={() => { setActiveTab('guest-my-bookings'); setMobileMenuOpen(false); }}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg min-h-[44px] cursor-pointer transition-colors ${
                  activeTab === 'guest-my-bookings' 
                    ? 'bg-[#FAF9F6] dark:bg-zinc-800 text-[#B89358] font-semibold' 
                    : 'hover:bg-gray-50 dark:hover:bg-zinc-800/60'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>My Reservations</span>
              </button>

              {isSuperAdmin && (
                <button
                  onClick={() => { setActiveTab('superadmin-dashboard'); setMobileMenuOpen(false); }}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg min-h-[44px] cursor-pointer transition-colors ${
                    activeTab === 'superadmin-dashboard' 
                      ? 'bg-amber-500 text-stone-950 font-bold' 
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                  }`}
                >
                  <Crown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Super Admin Console</span>
                </button>
              )}

              {isStaffOrAdmin && (
                <button
                  onClick={() => { setActiveTab('staff-dashboard'); setMobileMenuOpen(false); }}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg min-h-[44px] cursor-pointer transition-colors ${
                    activeTab === 'staff-dashboard' 
                      ? 'bg-[#18181B] dark:bg-zinc-800 text-white font-semibold' 
                      : 'bg-[#B89358]/10 text-[#8C6A32] dark:text-[#d8b77d]'
                  }`}
                >
                  <Briefcase className="w-4 h-4 text-[#B89358]" />
                  <span>Hotel Operations Console</span>
                </button>
              )}
            </div>

            <div className="pt-2 border-t border-[#F0ECE1] dark:border-[#27272a]">
              <button
                onClick={() => { onOpenBookingModal(); setMobileMenuOpen(false); }}
                className="w-full py-3 min-h-[44px] text-xs uppercase tracking-[0.16em] font-medium text-white bg-[#18181B] dark:bg-[#B89358] dark:text-[#0c0e12] hover:bg-[#B89358] rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <span>Book a Palatial Suite</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Pattern 1: Fixed Mobile Bottom Navigation Bar (Thumb-Zone Ergonomics) */}
      <nav 
        aria-label="Mobile Bottom Navigation" 
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF9F6]/95 dark:bg-[#0c0e12]/95 backdrop-blur-md border-t border-[#E8E4DA] dark:border-[#27272a] pb-safe transition-colors"
      >
        <div className={`grid ${isSuperAdmin || isStaffOrAdmin ? 'grid-cols-5' : 'grid-cols-4'} items-center h-16`}>
          
          <button
            onClick={() => setActiveTab('guest-home')}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors cursor-pointer ${
              activeTab === 'guest-home' ? 'text-[#B89358] font-semibold' : 'text-[#71717A] dark:text-[#a1a1aa] hover:text-[#18181B] dark:hover:text-white'
            }`}
          >
            <Compass className="w-5 h-5 stroke-[1.75]" />
            <span className="text-[10px] tracking-tight mt-1">Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('guest-suites')}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors cursor-pointer ${
              activeTab === 'guest-suites' ? 'text-[#B89358] font-semibold' : 'text-[#71717A] dark:text-[#a1a1aa] hover:text-[#18181B] dark:hover:text-white'
            }`}
          >
            <Bed className="w-5 h-5 stroke-[1.75]" />
            <span className="text-[10px] tracking-tight mt-1">Suites</span>
          </button>

          {isSuperAdmin ? (
            <button
              onClick={() => setActiveTab('superadmin-dashboard')}
              className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors cursor-pointer ${
                activeTab === 'superadmin-dashboard' ? 'text-amber-500 font-bold' : 'text-amber-700/80 dark:text-amber-400 hover:text-amber-600'
              }`}
            >
              <Crown className="w-5 h-5 stroke-[1.75] text-amber-500" />
              <span className="text-[10px] tracking-tight mt-1">Admin</span>
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('guest-my-bookings')}
              className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors cursor-pointer ${
                activeTab === 'guest-my-bookings' ? 'text-[#B89358] font-semibold' : 'text-[#71717A] dark:text-[#a1a1aa] hover:text-[#18181B] dark:hover:text-white'
              }`}
            >
              <Calendar className="w-5 h-5 stroke-[1.75]" />
              <span className="text-[10px] tracking-tight mt-1">My Stays</span>
            </button>
          )}

          <button
            onClick={onOpenConcierge}
            className="flex flex-col items-center justify-center h-full min-h-[44px] text-[#71717A] dark:text-[#a1a1aa] hover:text-[#B89358] transition-colors cursor-pointer"
          >
            <Sparkles className="w-5 h-5 text-[#B89358] stroke-[1.75]" />
            <span className="text-[10px] tracking-tight mt-1">Concierge</span>
          </button>

          {isSuperAdmin ? (
            <button
              onClick={() => setActiveTab('staff-dashboard')}
              className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors cursor-pointer ${
                activeTab === 'staff-dashboard' ? 'text-[#B89358] font-semibold' : 'text-[#71717A] dark:text-[#a1a1aa] hover:text-[#18181B] dark:hover:text-white'
              }`}
            >
              <Briefcase className="w-5 h-5 stroke-[1.75]" />
              <span className="text-[10px] tracking-tight mt-1">Desk</span>
            </button>
          ) : isStaffOrAdmin ? (
            <button
              onClick={() => setActiveTab('staff-dashboard')}
              className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors cursor-pointer ${
                activeTab === 'staff-dashboard' ? 'text-[#B89358] font-semibold' : 'text-[#71717A] dark:text-[#a1a1aa] hover:text-[#18181B] dark:hover:text-white'
              }`}
            >
              <Briefcase className="w-5 h-5 stroke-[1.75]" />
              <span className="text-[10px] tracking-tight mt-1">Operations</span>
            </button>
          ) : null}

        </div>
      </nav>
    </>
  );
};
