import React, { useState } from 'react';
import { Calendar, Users, Compass, ArrowRight, ShieldCheck, Award, Sparkles } from 'lucide-react';

interface HeroSectionProps {
  onSearchAvailability: (checkIn: string, checkOut: string, guests: number, category: string) => void;
  onExploreSuites: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onSearchAvailability,
  onExploreSuites
}) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date();
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 4);

  const fmt = (d: Date) => d.toISOString().split('T')[0];

  const [checkIn, setCheckIn] = useState<string>(fmt(tomorrow));
  const [checkOut, setCheckOut] = useState<string>(fmt(dayAfterTomorrow));
  const [guests, setGuests] = useState<number>(2);
  const [category, setCategory] = useState<string>('all');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchAvailability(checkIn, checkOut, guests, category);
  };

  return (
    <section className="relative w-full overflow-hidden bg-[#0F172A] text-white">
      {/* Background Hero Image with measured scrim overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="/src/assets/images/hero_luxury_hotel_1790748121852.jpg"
          alt="The Grand Luxe Hotel & Resort Palace Façade and Ocean Terrace at Twilight"
          className="w-full h-full object-cover object-center scale-105 transform animate-fade-in duration-1000"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/70 to-black/40" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-16 sm:pt-24 sm:pb-24 md:pt-32 md:pb-28 flex flex-col items-center text-center">
        
        {/* Subtle Brand Kicker */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.25em] text-[#D8B77D] mb-3 sm:mb-4 font-medium">
          <span>Riviera Promontory</span>
          <span aria-hidden="true">·</span>
          <span>Private Sanctuary</span>
          <span aria-hidden="true" className="hidden sm:inline">·</span>
          <span className="hidden sm:inline">5-Star Palace</span>
        </div>

        {/* Display Headline with balanced wrap */}
        <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-light tracking-tight text-[#FAF9F6] max-w-4xl leading-[1.12] sm:leading-[1.08] mb-4 sm:mb-6 [text-wrap:balance]">
          An Oasis of Timeless Splendor &amp; Coastal Grandeur
        </h1>

        {/* Subtitle */}
        <p className="font-sans text-xs sm:text-base md:text-lg text-[#E4E4E7]/90 max-w-2xl font-normal leading-relaxed mb-8 sm:mb-10 [text-wrap:balance]">
          Bespoke palatial suites, private heated plunge pools, dedicated 24-hour butler service, and Michelin-starred gastronomy overlooking the azure sea.
        </p>

        {/* Integrated Reservation Search Console (Mobile & Dark Mode Optimized) */}
        <div className="w-full max-w-5xl bg-white/95 dark:bg-[#12151d]/95 backdrop-blur-md rounded-xl p-3.5 sm:p-4 text-[#18181B] dark:text-[#f4f4f5] shadow-2xl border border-white/40 dark:border-[#27272a]">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3 items-center">
            
            {/* Check In Date */}
            <div className="text-left px-3 py-2 border border-[#E4E0D5] dark:border-[#27272a] rounded-lg bg-[#FAF9F6]/80 dark:bg-[#181b24] focus-within:border-[#B89358] transition-colors min-h-[52px] flex flex-col justify-center">
              <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#71717A] dark:text-[#a1a1aa] mb-0.5">
                Arrival Date
              </label>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#B89358] shrink-0" />
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full bg-transparent text-xs font-medium text-[#18181B] dark:text-[#f4f4f5] focus:outline-none cursor-pointer"
                  required
                />
              </div>
            </div>

            {/* Check Out Date */}
            <div className="text-left px-3 py-2 border border-[#E4E0D5] dark:border-[#27272a] rounded-lg bg-[#FAF9F6]/80 dark:bg-[#181b24] focus-within:border-[#B89358] transition-colors min-h-[52px] flex flex-col justify-center">
              <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#71717A] dark:text-[#a1a1aa] mb-0.5">
                Departure Date
              </label>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#B89358] shrink-0" />
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full bg-transparent text-xs font-medium text-[#18181B] dark:text-[#f4f4f5] focus:outline-none cursor-pointer"
                  required
                />
              </div>
            </div>

            {/* Guests Count */}
            <div className="text-left px-3 py-2 border border-[#E4E0D5] dark:border-[#27272a] rounded-lg bg-[#FAF9F6]/80 dark:bg-[#181b24] focus-within:border-[#B89358] transition-colors min-h-[52px] flex flex-col justify-center">
              <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#71717A] dark:text-[#a1a1aa] mb-0.5">
                Guests
              </label>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#B89358] shrink-0" />
                <select
                  value={guests}
                  onChange={(e) => setGuests(parseInt(e.target.value, 10))}
                  className="w-full bg-transparent text-xs font-medium text-[#18181B] dark:text-[#f4f4f5] focus:outline-none cursor-pointer"
                >
                  <option value={1} className="dark:bg-[#181b24] dark:text-white">1 Guest (Solo)</option>
                  <option value={2} className="dark:bg-[#181b24] dark:text-white">2 Guests (Couple)</option>
                  <option value={3} className="dark:bg-[#181b24] dark:text-white">3 Guests (Trio)</option>
                  <option value={4} className="dark:bg-[#181b24] dark:text-white">4 Guests (Family)</option>
                </select>
              </div>
            </div>

            {/* Suite Category */}
            <div className="text-left px-3 py-2 border border-[#E4E0D5] dark:border-[#27272a] rounded-lg bg-[#FAF9F6]/80 dark:bg-[#181b24] focus-within:border-[#B89358] transition-colors min-h-[52px] flex flex-col justify-center">
              <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#71717A] dark:text-[#a1a1aa] mb-0.5">
                Collection
              </label>
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#B89358] shrink-0" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-transparent text-xs font-medium text-[#18181B] dark:text-[#f4f4f5] focus:outline-none cursor-pointer"
                >
                  <option value="all" className="dark:bg-[#181b24] dark:text-white">All Collections</option>
                  <option value="Signature Suite" className="dark:bg-[#181b24] dark:text-white">Signature Penthouse</option>
                  <option value="Deluxe Rooms" className="dark:bg-[#181b24] dark:text-white">Deluxe Oceanfront</option>
                  <option value="Executive Suites" className="dark:bg-[#181b24] dark:text-white">Executive Suites</option>
                  <option value="Private Villas" className="dark:bg-[#181b24] dark:text-white">Private Villas</option>
                  <option value="Heritage Rooms" className="dark:bg-[#181b24] dark:text-white">Heritage Rooms</option>
                </select>
              </div>
            </div>

            {/* CTA Button (Touch target min-h 48px) */}
            <div className="w-full">
              <button
                type="submit"
                className="w-full min-h-[48px] bg-[#18181B] dark:bg-[#B89358] hover:bg-[#B89358] dark:hover:bg-[#8C6A32] active:scale-[0.98] text-white text-xs uppercase tracking-[0.16em] font-medium rounded-lg transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <span>Check Availability</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </form>
        </div>

        {/* Trust Markers - Mobile Responsive Wrap */}
        <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-[11px] sm:text-xs text-[#E4E4E7]/80">
          <div className="flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-[#D8B77D]" />
            <span>Condé Nast Gold List</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D8B77D]" />
            <span>Flexible Cancellation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#D8B77D]" />
            <span>24/7 Palace Butler</span>
          </div>
        </div>

      </div>
    </section>
  );
};
