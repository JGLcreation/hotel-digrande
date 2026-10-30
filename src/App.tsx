import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { RoomType } from './types/hotel.ts';
import { Navbar } from './components/Navbar.tsx';
import { HeroSection } from './components/HeroSection.tsx';
import { RoomCard } from './components/RoomCard.tsx';
import { RoomDetailModal } from './components/RoomDetailModal.tsx';
import { BookingModal } from './components/BookingModal.tsx';
import { MyBookingsView } from './components/MyBookingsView.tsx';
import { AmenitiesSection } from './components/AmenitiesSection.tsx';
import { AIConciergeDrawer } from './components/AIConciergeDrawer.tsx';
import { StaffDashboard } from './components/StaffDashboard.tsx';
import { SuperAdminDashboard } from './components/SuperAdminDashboard.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { 
  Sparkles, MapPin, Phone, Mail, ArrowRight 
} from 'lucide-react';

function HotelApp() {
  const { user } = useAuth();

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'guest-home' | 'guest-suites' | 'guest-amenities' | 'guest-my-bookings' | 'staff-dashboard' | 'superadmin-dashboard'>('guest-home');

  // Room types data
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState<boolean>(true);
  const [suiteCategoryFilter, setSuiteCategoryFilter] = useState<string>('all');

  // Modals state
  const [selectedRoomForDetail, setSelectedRoomForDetail] = useState<RoomType | null>(null);
  const [bookingModalRoom, setBookingModalRoom] = useState<RoomType | null>(null);
  const [searchCheckIn, setSearchCheckIn] = useState<string>('');
  const [searchCheckOut, setSearchCheckOut] = useState<string>('');
  const [searchGuests, setSearchGuests] = useState<number>(2);

  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [conciergeOpen, setConciergeOpen] = useState<boolean>(false);

  // Notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch Room Types
  const fetchRoomTypes = async () => {
    setIsLoadingRooms(true);
    try {
      const res = await fetch('/api/rooms/types');
      if (res.ok) {
        const data = await res.json();
        setRoomTypes(data.roomTypes || []);
      }
    } catch (err) {
      console.error('Failed to fetch room types:', err);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  useEffect(() => {
    fetchRoomTypes();
  }, []);

  // Dynamic Role Routing: When user signs in or role is updated by Super Admin,
  // route them to the dashboard corresponding to their assigned position.
  const [lastHandledUserId, setLastHandledUserId] = useState<number | null>(null);
  const [lastHandledRole, setLastHandledRole] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      if (user.id !== lastHandledUserId || user.role !== lastHandledRole) {
        setLastHandledUserId(user.id);
        setLastHandledRole(user.role);

        if (user.role === 'superadmin') {
          setActiveTab('superadmin-dashboard');
        } else if (user.role === 'admin' || user.role === 'staff') {
          setActiveTab('staff-dashboard');
        } else {
          // guest role
          if (activeTab === 'staff-dashboard' || activeTab === 'superadmin-dashboard') {
            setActiveTab('guest-home');
          }
        }
      }
    } else if (lastHandledUserId) {
      setLastHandledUserId(null);
      setLastHandledRole(null);
      if (activeTab === 'staff-dashboard' || activeTab === 'superadmin-dashboard') {
        setActiveTab('guest-home');
      }
    }
  }, [user, lastHandledUserId, lastHandledRole, activeTab]);

  // Strict route protection: Prevent unauthorized access to administrative views
  useEffect(() => {
    if (activeTab === 'superadmin-dashboard' && user?.role !== 'superadmin') {
      if (user?.role === 'admin' || user?.role === 'staff') {
        setActiveTab('staff-dashboard');
      } else {
        setActiveTab('guest-home');
      }
    } else if (activeTab === 'staff-dashboard' && (!user || (user.role !== 'staff' && user.role !== 'admin' && user.role !== 'superadmin'))) {
      setActiveTab('guest-home');
    }
  }, [activeTab, user]);

  // Handle Availability Search from Hero
  const handleHeroSearch = async (checkIn: string, checkOut: string, guests: number, category: string) => {
    setSearchCheckIn(checkIn);
    setSearchCheckOut(checkOut);
    setSearchGuests(guests);
    if (category !== 'all') {
      setSuiteCategoryFilter(category);
    }

    try {
      const res = await fetch(`/api/reservations/check-availability?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`);
      if (res.ok) {
        const data = await res.json();
        setRoomTypes(data.roomTypes || []);
        setActiveTab('guest-suites');
        setToastMessage(`Showing ${data.roomTypes.length} suite configurations available for ${data.nights} nights.`);
        setTimeout(() => setToastMessage(null), 5000);
      }
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  const filteredSuites = roomTypes.filter(r => {
    if (suiteCategoryFilter === 'all') return true;
    return r.category.toLowerCase().includes(suiteCategoryFilter.toLowerCase());
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] dark:bg-[#0c0e12] text-[#18181B] dark:text-[#f4f4f5] selection:bg-[#B89358]/20 selection:text-[#18181B] transition-colors">
      
      {/* Top Navbar + Mobile Bottom Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenBookingModal={(roomTypeId) => {
          const target = roomTypes.find(r => r.id === roomTypeId) || roomTypes[0];
          setBookingModalRoom(target);
        }}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onOpenConcierge={() => setConciergeOpen(true)}
      />

      {/* Floating Status Notification Toast */}
      {toastMessage && (
        <div className="fixed top-20 sm:top-24 right-4 sm:right-6 left-4 sm:left-auto z-50 bg-[#18181B] text-white text-xs px-4 py-3 rounded-xl shadow-2xl border border-white/20 flex items-center justify-between gap-2 animate-fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#B89358] shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-gray-400 hover:text-white p-1 text-sm font-bold">&times;</button>
        </div>
      )}

      {/* MAIN CONTENT VIEWPORT */}
      <main className="flex-1 pb-16 md:pb-0">

        {/* VIEW 1: HOME / OVERVIEW */}
        {activeTab === 'guest-home' && (
          <div>
            {/* Hero Section */}
            <HeroSection
              onSearchAvailability={handleHeroSearch}
              onExploreSuites={() => setActiveTab('guest-suites')}
            />

            {/* Featured Suites & Villas Showcase */}
            <section className="py-12 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 gap-3 sm:gap-4">
                <div>
                  <span className="text-xs uppercase tracking-[0.25em] text-[#B89358] font-semibold block mb-1 sm:mb-2">
                    Palatial Living
                  </span>
                  <h2 className="font-serif text-2xl sm:text-4xl md:text-5xl text-[#18181B] dark:text-[#f4f4f5] font-light tracking-tight leading-tight [text-wrap:balance]">
                    Signature Suites, Penthouse &amp; Garden Villas
                  </h2>
                </div>

                <div>
                  <button
                    onClick={() => setActiveTab('guest-suites')}
                    className="text-xs uppercase tracking-wider font-semibold text-[#18181B] dark:text-[#d8b77d] hover:text-[#B89358] flex items-center gap-1.5 transition-colors cursor-pointer min-h-[44px]"
                  >
                    <span>View All Collections</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Suite Showcase Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {roomTypes.slice(0, 3).map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    onExplore={(r) => setSelectedRoomForDetail(r)}
                    onReserve={(r) => setBookingModalRoom(r)}
                  />
                ))}
              </div>

            </section>

            {/* Amenities, Thermal Wellness & Gastronomy Showcase */}
            <AmenitiesSection
              onReserveSuite={() => setBookingModalRoom(roomTypes[0] || null)}
              onOpenConcierge={() => setConciergeOpen(true)}
            />

            {/* Verified Guest Testimonials */}
            <section className="py-12 sm:py-20 bg-[#FAF9F6] dark:bg-[#0c0e12] border-t border-[#E8E4DA] dark:border-[#27272a] transition-colors">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
                  <span className="text-xs uppercase tracking-[0.25em] text-[#B89358] font-semibold block mb-2">
                    Accredited Distinction
                  </span>
                  <h2 className="font-serif text-2xl sm:text-4xl text-[#18181B] dark:text-[#f4f4f5] font-light tracking-tight [text-wrap:balance]">
                    Treasured by Visionaries, Connoisseurs &amp; Royalty
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8">
                  
                  <div className="bg-white dark:bg-[#14171f] p-6 sm:p-8 rounded-xl border border-[#E8E4DA] dark:border-[#27272a] shadow-xs flex flex-col justify-between transition-colors">
                    <p className="font-serif text-base sm:text-lg text-[#27272A] dark:text-[#e4e4e7] italic leading-relaxed mb-6 font-light">
                      "The Presidential Penthouse at The Grand Luxe surpasses every European palace hotel. The 24-hour butler service and private jacuzzi overlooking the twilight coast are unmatched."
                    </p>
                    <div className="border-t border-[#F2EFE8] dark:border-[#27272a] pt-4">
                      <p className="text-xs font-semibold text-[#18181B] dark:text-white">Lord Julian Hastings</p>
                      <p className="text-[11px] text-[#71717A] dark:text-[#a1a1aa]">Member of Parliament · Stayed March 2026</p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-[#14171f] p-6 sm:p-8 rounded-xl border border-[#E8E4DA] dark:border-[#27272a] shadow-xs flex flex-col justify-between transition-colors">
                    <p className="font-serif text-base sm:text-lg text-[#27272A] dark:text-[#e4e4e7] italic leading-relaxed mb-6 font-light">
                      "Our wedding anniversary in the Private Garden Villa was pure bliss. The heated private plunge pool and Dom Pérignon welcome created memories that will last a lifetime."
                    </p>
                    <div className="border-t border-[#F2EFE8] dark:border-[#27272a] pt-4">
                      <p className="text-xs font-semibold text-[#18181B] dark:text-white">Camille &amp; Henrik Lindqvist</p>
                      <p className="text-[11px] text-[#71717A] dark:text-[#a1a1aa]">Architectural Directors, Stockholm · Stayed February 2026</p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-[#14171f] p-6 sm:p-8 rounded-xl border border-[#E8E4DA] dark:border-[#27272a] shadow-xs flex flex-col justify-between transition-colors">
                    <p className="font-serif text-base sm:text-lg text-[#27272A] dark:text-[#e4e4e7] italic leading-relaxed mb-6 font-light">
                      "As an executive hosting global retreats, the Executive Grand Suite and private club lounge provided seamless connectivity, privacy, and Michelin dining delivered to our suite."
                    </p>
                    <div className="border-t border-[#F2EFE8] dark:border-[#27272a] pt-4">
                      <p className="text-xs font-semibold text-[#18181B] dark:text-white">Dr. Evelyn St. Claire</p>
                      <p className="text-[11px] text-[#71717A] dark:text-[#a1a1aa]">Biotech Managing Partner · Stayed January 2026</p>
                    </div>
                  </div>

                </div>

              </div>
            </section>
          </div>
        )}

        {/* VIEW 2: SUITES & VILLAS CATALOG */}
        {activeTab === 'guest-suites' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pb-24 md:pb-12">
            
            <div className="border-b border-[#E8E4DA] dark:border-[#27272a] pb-6 sm:pb-8 mb-6 sm:mb-8">
              <span className="text-xs uppercase tracking-[0.2em] font-semibold text-[#B89358] block mb-1">
                Accommodations Portfolio
              </span>
              <h1 className="font-serif text-3xl sm:text-5xl text-[#18181B] dark:text-[#f4f4f5] font-light tracking-tight mb-3 sm:mb-4">
                The Palatial Suites &amp; Villas
              </h1>
              <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#a1a1aa] max-w-2xl">
                Every chamber is an architectural masterpiece crafted with rare travertine stone, bespoke Italian Rivolta Carmignani linens, and maritime vistas.
              </p>

              {/* Mobile-Friendly Category Segmented Filter */}
              <div className="flex gap-1.5 sm:gap-2 mt-5 sm:mt-6 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { id: 'all', label: 'All Collections' },
                  { id: 'Signature Suite', label: 'Signature Penthouse' },
                  { id: 'Deluxe Rooms', label: 'Deluxe Oceanfront' },
                  { id: 'Executive Suites', label: 'Executive Suites' },
                  { id: 'Private Villas', label: 'Private Villas' },
                  { id: 'Heritage Rooms', label: 'Heritage King' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSuiteCategoryFilter(cat.id)}
                    className={`px-3.5 sm:px-4 py-2 min-h-[44px] text-xs uppercase tracking-wider font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center ${
                      suiteCategoryFilter === cat.id
                        ? 'bg-[#18181B] dark:bg-[#B89358] text-white shadow-xs'
                        : 'bg-white dark:bg-[#14171f] border border-[#D4CFBE] dark:border-[#27272a] text-[#52525B] dark:text-[#a1a1aa] hover:border-[#18181B] dark:hover:border-[#B89358]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Suite Grid */}
            {isLoadingRooms ? (
              <div className="text-center py-20 text-xs text-[#71717A]">
                Curating suite availability...
              </div>
            ) : filteredSuites.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-[#14171f] rounded-xl border border-[#E8E4DA] dark:border-[#27272a] p-6 transition-colors">
                <p className="text-sm font-serif text-[#18181B] dark:text-[#f4f4f5] mb-2">No suites match the selected category.</p>
                <button
                  onClick={() => setSuiteCategoryFilter('all')}
                  className="text-xs text-[#B89358] hover:text-[#D8B77D] underline font-medium p-2 min-h-[44px] cursor-pointer"
                >
                  Reset filter to view all suites
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {filteredSuites.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    onExplore={(r) => setSelectedRoomForDetail(r)}
                    onReserve={(r) => setBookingModalRoom(r)}
                  />
                ))}
              </div>
            )}

          </div>
        )}

        {/* VIEW 3: AMENITIES & SPA */}
        {activeTab === 'guest-amenities' && (
          <div className="py-2 sm:py-6 pb-24 md:pb-12">
            <AmenitiesSection
              onReserveSuite={() => setBookingModalRoom(roomTypes[0] || null)}
              onOpenConcierge={() => setConciergeOpen(true)}
            />
          </div>
        )}

        {/* VIEW 4: MY RESERVATIONS */}
        {activeTab === 'guest-my-bookings' && (
          <MyBookingsView
            onReserveSuite={() => setActiveTab('guest-suites')}
          />
        )}

        {/* VIEW 5: HOTEL STAFF & OPERATIONS DASHBOARD */}
        {activeTab === 'staff-dashboard' && (user?.role === 'staff' || user?.role === 'admin' || user?.role === 'superadmin') && (
          <StaffDashboard />
        )}

        {/* VIEW 6: SUPER ADMINISTRATOR EXECUTIVE CONTROL CONSOLE */}
        {activeTab === 'superadmin-dashboard' && user?.role === 'superadmin' && (
          <SuperAdminDashboard
            onSwitchToOperations={() => setActiveTab('staff-dashboard')}
          />
        )}

      </main>

      {/* FOOTER: Minimalist Luxury Footer (with pb-28 on mobile to clear bottom nav) */}
      <footer className="bg-[#18181B] text-white border-t border-[#27272A] mt-auto pb-28 md:pb-16 pt-12 sm:pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 mb-10 sm:mb-12">
            
            <div className="sm:col-span-2 lg:col-span-1">
              <span className="font-serif text-xl sm:text-2xl tracking-[0.2em] font-semibold text-[#FAF9F6] block mb-2">
                THE GRAND LUXE
              </span>
              <p className="text-xs text-[#A1A1AA] leading-relaxed mb-4">
                A sanctuary of timeless splendor, private villa living, and Michelin-starred culinary artistry on the Mediterranean promontory.
              </p>
              <p className="text-[11px] text-[#71717A]">
                The Leading Hotels of the World · 2026
              </p>
            </div>

            <div>
              <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-[#D8B77D] mb-3 sm:mb-4">
                Accommodations
              </h4>
              <ul className="space-y-2 text-xs text-[#A1A1AA]">
                <li><button onClick={() => { setActiveTab('guest-suites'); setSuiteCategoryFilter('Signature Suite'); }} className="hover:text-white transition-colors py-1 min-h-[32px] text-left">Presidential Penthouse</button></li>
                <li><button onClick={() => { setActiveTab('guest-suites'); setSuiteCategoryFilter('Deluxe Rooms'); }} className="hover:text-white transition-colors py-1 min-h-[32px] text-left">Deluxe Oceanfront Suite</button></li>
                <li><button onClick={() => { setActiveTab('guest-suites'); setSuiteCategoryFilter('Executive Suites'); }} className="hover:text-white transition-colors py-1 min-h-[32px] text-left">Executive Grand Suite</button></li>
                <li><button onClick={() => { setActiveTab('guest-suites'); setSuiteCategoryFilter('Private Villas'); }} className="hover:text-white transition-colors py-1 min-h-[32px] text-left">Private Garden Villa</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-[#D8B77D] mb-3 sm:mb-4">
                Sanctuary Services
              </h4>
              <ul className="space-y-2 text-xs text-[#A1A1AA]">
                <li><button onClick={() => setActiveTab('guest-amenities')} className="hover:text-white transition-colors py-1 min-h-[32px] text-left">Le Belvédère Gastronomy</button></li>
                <li><button onClick={() => setActiveTab('guest-amenities')} className="hover:text-white transition-colors py-1 min-h-[32px] text-left">Grand Luxe Thermal Spa</button></li>
                <li><button onClick={() => setConciergeOpen(true)} className="hover:text-white transition-colors py-1 min-h-[32px] text-left">Chauffeured Limousine Fleet</button></li>
                <li><button onClick={() => setConciergeOpen(true)} className="hover:text-white transition-colors py-1 min-h-[32px] text-left">Private Yachting Charters</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs uppercase tracking-[0.2em] font-semibold text-[#D8B77D] mb-3 sm:mb-4">
                Palace Concierge
              </h4>
              <p className="text-xs text-[#A1A1AA] mb-2 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#B89358] shrink-0" />
                <span>1 Promenade des Palmiers, Côte d'Azur</span>
              </p>
              <p className="text-xs text-[#A1A1AA] mb-2 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#B89358] shrink-0" />
                <span className="font-mono">+1 (555) 019-2831 (24/7 Desk)</span>
              </p>
              <p className="text-xs text-[#A1A1AA] mb-4 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#B89358] shrink-0" />
                <span>concierge@grandluxe.com</span>
              </p>
              <button
                onClick={() => setConciergeOpen(true)}
                className="w-full py-2.5 min-h-[44px] border border-[#B89358] text-[#D8B77D] hover:bg-[#B89358] hover:text-white active:scale-[0.98] text-xs uppercase tracking-wider font-medium rounded-lg transition-all"
              >
                Inquire With Concierge
              </button>
            </div>

          </div>

          <div className="border-t border-[#27272A] pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#71717A] gap-3 text-center sm:text-left">
            <p>© 2026 The Grand Luxe Hotel &amp; Resort Palace. All rights reserved.</p>
            <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6">
              <span className="hover:text-white transition-colors cursor-pointer py-1">Privacy Charter</span>
              <span className="hover:text-white transition-colors cursor-pointer py-1">Terms of Residency</span>
              <span className="hover:text-white transition-colors cursor-pointer py-1">Heritage</span>
            </div>
          </div>

        </div>
      </footer>

      {/* MODALS */}

      {/* Room Detail Modal */}
      {selectedRoomForDetail && (
        <RoomDetailModal
          room={selectedRoomForDetail}
          onClose={() => setSelectedRoomForDetail(null)}
          onReserve={(room) => {
            setSelectedRoomForDetail(null);
            setBookingModalRoom(room);
          }}
        />
      )}

      {/* Booking Checkout Modal */}
      {bookingModalRoom && (
        <BookingModal
          roomType={bookingModalRoom}
          initialCheckIn={searchCheckIn}
          initialCheckOut={searchCheckOut}
          initialGuests={searchGuests}
          onClose={() => setBookingModalRoom(null)}
          onBookingSuccess={(_reservationId) => {
            fetchRoomTypes();
          }}
          onOpenAuthModal={() => setAuthModalOpen(true)}
          onViewMyBookings={() => {
            setBookingModalRoom(null);
            setActiveTab('guest-my-bookings');
          }}
        />
      )}

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />

      {/* AI Concierge Drawer */}
      <AIConciergeDrawer
        isOpen={conciergeOpen}
        onClose={() => setConciergeOpen(false)}
        onBookRoomType={(roomTypeId) => {
          setConciergeOpen(false);
          const room = roomTypes.find(r => r.id === roomTypeId) || roomTypes[0];
          setBookingModalRoom(room);
        }}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HotelApp />
    </AuthProvider>
  );
}
