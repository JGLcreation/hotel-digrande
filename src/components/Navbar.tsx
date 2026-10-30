import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { 
  Sparkles, User as UserIcon, Shield, Briefcase, Crown,
  Menu, X, Compass, Bed, Calendar, Waves, LogOut, ChevronDown 
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
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isSuperAdmin = user?.role === 'superadmin';
  const isStaffOrAdmin = Boolean(user && (user.role === 'staff' || user.role === 'admin' || user.role === 'superadmin'));

  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-[#E6E2D8] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between">
          
          {/* Zone 1: Single element wordmark in high-contrast luxury serif */}
          <button
            onClick={() => { setActiveTab('guest-home'); setMobileMenuOpen(false); }}
            className="text-left group focus:outline-none min-h-[44px] flex flex-col justify-center"
          >
            <span className="font-serif text-xl sm:text-2xl tracking-[0.16em] sm:tracking-[0.2em] font-semibold text-[#18181B] group-hover:text-[#B89358] transition-colors">
              THE GRAND LUXE
            </span>
            <span className="block text-[8px] sm:text-[9px] uppercase tracking-[0.25em] text-[#71717A] -mt-0.5 sm:-mt-1 font-sans">
              Hotel &amp; Resort · Est. 1898
            </span>
          </button>

          {/* Zone 2: Desktop 4-6 clean text navigation links */}
          <nav className="hidden md:flex items-center gap-8 text-xs uppercase tracking-[0.18em] font-medium text-[#52525B]">
            <button
              onClick={() => setActiveTab('guest-home')}
              className={`transition-colors hover:text-[#18181B] py-1 border-b min-h-[44px] flex items-center ${activeTab === 'guest-home' ? 'border-[#B89358] text-[#18181B] font-semibold' : 'border-transparent'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('guest-suites')}
              className={`transition-colors hover:text-[#18181B] py-1 border-b min-h-[44px] flex items-center ${activeTab === 'guest-suites' ? 'border-[#B89358] text-[#18181B] font-semibold' : 'border-transparent'}`}
            >
              Suites &amp; Villas
            </button>
            <button
              onClick={() => setActiveTab('guest-amenities')}
              className={`transition-colors hover:text-[#18181B] py-1 border-b min-h-[44px] flex items-center ${activeTab === 'guest-amenities' ? 'border-[#B89358] text-[#18181B] font-semibold' : 'border-transparent'}`}
            >
              Wellness &amp; Dining
            </button>
            <button
              onClick={() => setActiveTab('guest-my-bookings')}
              className={`transition-colors hover:text-[#18181B] py-1 border-b min-h-[44px] flex items-center ${activeTab === 'guest-my-bookings' ? 'border-[#B89358] text-[#18181B] font-semibold' : 'border-transparent'}`}
            >
              My Reservations
            </button>

            {isSuperAdmin && (
              <button
                onClick={() => setActiveTab('superadmin-dashboard')}
                className={`transition-colors flex items-center gap-1.5 py-1 px-3 rounded-md border min-h-[44px] ${
                  activeTab === 'superadmin-dashboard'
                    ? 'bg-amber-500 text-stone-950 font-semibold border-amber-600 shadow-sm'
                    : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                }`}
                title="Super Administrator Executive Control Console"
              >
                <Crown className="w-3.5 h-3.5 text-amber-600" />
                <span>Super Admin</span>
              </button>
            )}

            {isStaffOrAdmin && (
              <button
                onClick={() => setActiveTab('staff-dashboard')}
                className={`transition-colors flex items-center gap-1.5 py-1 px-2.5 rounded-sm border min-h-[44px] ${
                  activeTab === 'staff-dashboard'
                    ? 'bg-[#18181B] text-[#FAF9F6] border-[#18181B]'
                    : 'bg-[#B89358]/10 text-[#8C6A32] border-[#B89358]/30 hover:bg-[#B89358]/20'
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
            
            {/* AI Luxury Concierge button (Desktop & Mobile) */}
            <button
              onClick={onOpenConcierge}
              className="flex items-center gap-1 text-xs font-medium text-[#71717A] hover:text-[#B89358] min-h-[44px] px-2 sm:px-2.5 py-1.5 rounded transition-colors"
              title="Ask Personal Concierge"
            >
              <Sparkles className="w-4 h-4 text-[#B89358]" />
              <span className="hidden sm:inline">Concierge</span>
            </button>

            {/* Quick Role Switcher / Demo Dropdown */}
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-1.5 text-xs min-h-[44px] px-2.5 py-1.5 border border-[#D4CFBE] rounded bg-white text-[#27272A] hover:border-[#B89358] transition-colors"
              >
                <UserIcon className="w-3.5 h-3.5 text-[#B89358]" />
                <span className="truncate max-w-[80px] sm:max-w-[110px]">
                  {isAuthenticated ? (user?.username || user?.name.split(' ')[0]) : 'Sign In'}
                </span>
                <ChevronDown className="w-3 h-3 text-[#71717A]" />
              </button>

              {roleMenuOpen && (
                <div 
                  className="absolute right-0 mt-1.5 w-68 bg-white border border-[#E4E0D5] rounded-lg shadow-xl py-2 z-50 text-xs animate-fade-in"
                  onMouseLeave={() => setRoleMenuOpen(false)}
                >
                  <div className="px-3 py-1.5 border-b border-[#F0ECE1]">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-[#18181B] truncate">{user?.name || 'Guest User'}</p>
                      {user?.role === 'superadmin' && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                          <Crown className="w-2.5 h-2.5" /> ROOT
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#71717A] truncate">
                      {user?.username ? `@${user.username} · ` : ''}{user?.email || 'Not authenticated'}
                    </p>
                    <span className="inline-block mt-1 text-[10px] uppercase font-semibold tracking-wider text-[#B89358]">
                      Position: {user?.role ? user.role.toUpperCase() : 'UNREGISTERED GUEST'}
                    </span>
                  </div>

                  <div className="p-2 space-y-1 bg-[#FAF9F6]/60 border-b border-[#F0ECE1]">
                    <p className="text-[10px] uppercase tracking-wider text-[#A1A1AA] px-1 font-medium">Quick Demo Role Switch</p>
                    
                    {/* Super Admin lozada */}
                    <button
                      onClick={() => { demoLogin('superadmin'); setRoleMenuOpen(false); }}
                      className="w-full text-left px-2 py-1.5 min-h-[36px] rounded hover:bg-amber-50 flex items-center justify-between text-amber-950 font-medium"
                    >
                      <div className="flex items-center gap-1.5">
                        <Crown className="w-3.5 h-3.5 text-amber-600" />
                        <span>Super Administrator (lozada)</span>
                      </div>
                      <span className="text-[9px] bg-amber-200 text-amber-900 px-1 py-0.5 rounded font-mono">Full Ctrl</span>
                    </button>

                    <button
                      onClick={() => { demoLogin('admin'); setRoleMenuOpen(false); }}
                      className="w-full text-left px-2 py-1.5 min-h-[36px] rounded hover:bg-white flex items-center justify-between text-[#27272A]"
                    >
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-[#B89358]" />
                        <span>General Manager (Admin)</span>
                      </div>
                      <span className="text-[9px] bg-stone-100 text-stone-700 px-1 py-0.5 rounded font-mono">GM</span>
                    </button>

                    <button
                      onClick={() => { demoLogin('staff'); setRoleMenuOpen(false); }}
                      className="w-full text-left px-2 py-1.5 min-h-[36px] rounded hover:bg-white flex items-center justify-between text-[#27272A]"
                    >
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-[#B89358]" />
                        <span>Front Desk Manager (Staff)</span>
                      </div>
                      <span className="text-[9px] bg-stone-100 text-stone-700 px-1 py-0.5 rounded font-mono">Desk</span>
                    </button>

                    <button
                      onClick={() => { demoLogin('guest'); setRoleMenuOpen(false); }}
                      className="w-full text-left px-2 py-1.5 min-h-[36px] rounded hover:bg-white flex items-center justify-between text-[#27272A]"
                    >
                      <div className="flex items-center gap-1.5">
                        <UserIcon className="w-3.5 h-3.5 text-[#B89358]" />
                        <span>VIP Guest (Camille)</span>
                      </div>
                      <span className="text-[9px] bg-stone-100 text-stone-700 px-1 py-0.5 rounded font-mono">Guest</span>
                    </button>
                  </div>

                  {isAuthenticated ? (
                    <button
                      onClick={() => { logout(); setRoleMenuOpen(false); }}
                      className="w-full text-left px-3 py-2.5 min-h-[44px] text-red-700 hover:bg-red-50 flex items-center gap-1.5 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => { onOpenAuthModal(); setRoleMenuOpen(false); }}
                      className="w-full text-left px-3 py-2.5 min-h-[44px] text-[#18181B] font-medium hover:bg-[#FAF9F6] flex items-center gap-1.5 transition-colors"
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
              className="hidden sm:flex items-center px-4 py-2 min-h-[44px] text-xs uppercase tracking-[0.16em] font-medium text-white bg-[#18181B] rounded hover:bg-[#27272A] transition-colors whitespace-nowrap shadow-sm"
            >
              Reserve a Suite
            </button>

            {/* Mobile Hamburger Drawer Trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#18181B] hover:text-[#B89358] transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

          </div>

        </div>

        {/* Mobile Slide-Over Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-[#E8E4DA] px-4 pt-3 pb-6 space-y-3 shadow-lg animate-fade-in">
            <div className="flex flex-col space-y-1 text-sm font-medium text-[#27272A]">
              <button
                onClick={() => { setActiveTab('guest-home'); setMobileMenuOpen(false); }}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg min-h-[44px] ${activeTab === 'guest-home' ? 'bg-[#FAF9F6] text-[#B89358] font-semibold' : 'hover:bg-gray-50'}`}
              >
                <Compass className="w-4 h-4" />
                <span>Overview &amp; Welcome</span>
              </button>
              <button
                onClick={() => { setActiveTab('guest-suites'); setMobileMenuOpen(false); }}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg min-h-[44px] ${activeTab === 'guest-suites' ? 'bg-[#FAF9F6] text-[#B89358] font-semibold' : 'hover:bg-gray-50'}`}
              >
                <Bed className="w-4 h-4" />
                <span>Suites &amp; Villas Portfolio</span>
              </button>
              <button
                onClick={() => { setActiveTab('guest-amenities'); setMobileMenuOpen(false); }}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg min-h-[44px] ${activeTab === 'guest-amenities' ? 'bg-[#FAF9F6] text-[#B89358] font-semibold' : 'hover:bg-gray-50'}`}
              >
                <Waves className="w-4 h-4" />
                <span>Thermal Spa &amp; Michelin Dining</span>
              </button>
              <button
                onClick={() => { setActiveTab('guest-my-bookings'); setMobileMenuOpen(false); }}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg min-h-[44px] ${activeTab === 'guest-my-bookings' ? 'bg-[#FAF9F6] text-[#B89358] font-semibold' : 'hover:bg-gray-50'}`}
              >
                <Calendar className="w-4 h-4" />
                <span>My Reservations</span>
              </button>

              {isSuperAdmin && (
                <button
                  onClick={() => { setActiveTab('superadmin-dashboard'); setMobileMenuOpen(false); }}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg min-h-[44px] ${activeTab === 'superadmin-dashboard' ? 'bg-amber-500 text-stone-950 font-bold' : 'bg-amber-50 text-amber-900 border border-amber-200'}`}
                >
                  <Crown className="w-4 h-4 text-amber-600" />
                  <span>Super Admin Console</span>
                </button>
              )}

              {isStaffOrAdmin && (
                <button
                  onClick={() => { setActiveTab('staff-dashboard'); setMobileMenuOpen(false); }}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg min-h-[44px] ${activeTab === 'staff-dashboard' ? 'bg-[#18181B] text-white font-semibold' : 'bg-[#B89358]/10 text-[#8C6A32]'}`}
                >
                  <Briefcase className="w-4 h-4 text-[#B89358]" />
                  <span>Hotel Operations Console</span>
                </button>
              )}
            </div>

            <div className="pt-2 border-t border-[#F0ECE1]">
              <button
                onClick={() => { onOpenBookingModal(); setMobileMenuOpen(false); }}
                className="w-full py-3 min-h-[44px] text-xs uppercase tracking-[0.16em] font-medium text-white bg-[#18181B] hover:bg-[#B89358] rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
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
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF9F6]/95 backdrop-blur-md border-t border-[#E8E4DA] pb-safe"
      >
        <div className={`grid ${isSuperAdmin || isStaffOrAdmin ? 'grid-cols-5' : 'grid-cols-4'} items-center h-16`}>
          
          <button
            onClick={() => setActiveTab('guest-home')}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
              activeTab === 'guest-home' ? 'text-[#B89358] font-semibold' : 'text-[#71717A] hover:text-[#18181B]'
            }`}
          >
            <Compass className="w-5 h-5 stroke-[1.75]" />
            <span className="text-[10px] tracking-tight mt-1">Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('guest-suites')}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
              activeTab === 'guest-suites' ? 'text-[#B89358] font-semibold' : 'text-[#71717A] hover:text-[#18181B]'
            }`}
          >
            <Bed className="w-5 h-5 stroke-[1.75]" />
            <span className="text-[10px] tracking-tight mt-1">Suites</span>
          </button>

          {isSuperAdmin ? (
            <button
              onClick={() => setActiveTab('superadmin-dashboard')}
              className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
                activeTab === 'superadmin-dashboard' ? 'text-amber-600 font-bold' : 'text-amber-800/80 hover:text-amber-900'
              }`}
            >
              <Crown className="w-5 h-5 stroke-[1.75] text-amber-600" />
              <span className="text-[10px] tracking-tight mt-1">Admin</span>
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('guest-my-bookings')}
              className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
                activeTab === 'guest-my-bookings' ? 'text-[#B89358] font-semibold' : 'text-[#71717A] hover:text-[#18181B]'
              }`}
            >
              <Calendar className="w-5 h-5 stroke-[1.75]" />
              <span className="text-[10px] tracking-tight mt-1">My Stays</span>
            </button>
          )}

          <button
            onClick={onOpenConcierge}
            className="flex flex-col items-center justify-center h-full min-h-[44px] text-[#71717A] hover:text-[#B89358] transition-colors"
          >
            <Sparkles className="w-5 h-5 text-[#B89358] stroke-[1.75]" />
            <span className="text-[10px] tracking-tight mt-1">Concierge</span>
          </button>

          {isSuperAdmin ? (
            <button
              onClick={() => setActiveTab('staff-dashboard')}
              className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
                activeTab === 'staff-dashboard' ? 'text-[#B89358] font-semibold' : 'text-[#71717A] hover:text-[#18181B]'
              }`}
            >
              <Briefcase className="w-5 h-5 stroke-[1.75]" />
              <span className="text-[10px] tracking-tight mt-1">Desk</span>
            </button>
          ) : isStaffOrAdmin ? (
            <button
              onClick={() => setActiveTab('staff-dashboard')}
              className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
                activeTab === 'staff-dashboard' ? 'text-[#B89358] font-semibold' : 'text-[#71717A] hover:text-[#18181B]'
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
