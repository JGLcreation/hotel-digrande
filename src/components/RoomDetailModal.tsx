import React from 'react';
import { RoomType } from '../types/hotel.ts';
import { X, Check, ArrowRight, ShieldCheck, Clock, Sparkles } from 'lucide-react';

interface RoomDetailModalProps {
  room: RoomType | null;
  onClose: () => void;
  onReserve: (room: RoomType) => void;
}

export const RoomDetailModal: React.FC<RoomDetailModalProps> = ({ room, onClose, onReserve }) => {
  if (!room) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6 animate-fade-in">
      <div 
        className="relative bg-white dark:bg-[#12151b] w-full sm:max-w-4xl rounded-t-2xl sm:rounded-2xl shadow-2xl border border-[#E8E4DA] dark:border-[#27272a] overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh] transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Mobile Drag Indicator Bar */}
        <div className="sm:hidden w-10 h-1.5 bg-[#D4CFBE] dark:bg-zinc-700 rounded-full mx-auto my-2.5 shrink-0" />

        {/* Close Button (min 44x44px touch target) */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 bg-white/90 dark:bg-zinc-800/90 hover:bg-white dark:hover:bg-zinc-700 text-[#18181B] dark:text-white min-h-[44px] min-w-[44px] p-2 rounded-full shadow-md flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close suite details"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header & Image */}
        <div className="relative w-full h-56 sm:h-80 md:h-96 bg-[#F0ECE1] dark:bg-zinc-900 shrink-0">
          <img
            src={room.image_url}
            alt={room.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
          
          <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 text-white">
            <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-[#D8B77D] font-medium block mb-1">
              {room.category} · {room.view_type}
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl text-[#FAF9F6] font-light leading-tight">
              {room.name}
            </h2>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-8 overflow-y-auto space-y-5 sm:space-y-6">
          
          {/* Quick Specifications Bar (2 cols on mobile, 4 on desktop) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 sm:p-4 bg-[#FAF9F6] dark:bg-[#181c24] rounded-xl border border-[#EBE7DD] dark:border-[#27272a] text-xs transition-colors">
            <div>
              <span className="text-[#71717A] dark:text-[#a1a1aa] text-[11px] block mb-0.5">Dimension</span>
              <span className="font-semibold text-[#18181B] dark:text-white">{room.size_sqm} m² ({(room.size_sqm * 10.764).toFixed(0)} sq ft)</span>
            </div>
            <div>
              <span className="text-[#71717A] dark:text-[#a1a1aa] text-[11px] block mb-0.5">Capacity</span>
              <span className="font-semibold text-[#18181B] dark:text-white">Up to {room.max_occupancy} Guests</span>
            </div>
            <div>
              <span className="text-[#71717A] dark:text-[#a1a1aa] text-[11px] block mb-0.5">Bed Configuration</span>
              <span className="font-semibold text-[#18181B] dark:text-white">{room.bed_type}</span>
            </div>
            <div>
              <span className="text-[#71717A] dark:text-[#a1a1aa] text-[11px] block mb-0.5">Maritime View</span>
              <span className="font-semibold text-[#18181B] dark:text-white">{room.view_type}</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-[11px] sm:text-xs uppercase tracking-[0.16em] font-semibold text-[#71717A] dark:text-[#a1a1aa] mb-2">
              Suite Architectural Narrative
            </h4>
            <p className="text-xs sm:text-sm text-[#3F3F46] dark:text-[#d4d4d8] leading-relaxed font-normal">
              {room.description}
            </p>
          </div>

          {/* Complete Amenities Checklist */}
          <div>
            <h4 className="text-[11px] sm:text-xs uppercase tracking-[0.16em] font-semibold text-[#71717A] dark:text-[#a1a1aa] mb-3">
              Included Signature Amenities &amp; Privileges
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
              {room.amenities.map((amenity, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs text-[#27272A] dark:text-[#f4f4f5] bg-white dark:bg-[#181c24] p-2.5 border border-[#F0ECE1] dark:border-[#27272a] rounded-lg transition-colors">
                  <Check className="w-4 h-4 text-[#B89358] shrink-0" />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Guest Privileges */}
          <div className="border-t border-[#E8E4DA] dark:border-[#27272a] pt-4 text-xs text-[#71717A] dark:text-[#a1a1aa] grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 transition-colors">
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-[#B89358] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[#18181B] dark:text-white">Check-in &amp; Check-out</p>
                <p className="text-[11px]">Check-in from 15:00 · Check-out until 12:00 noon</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-[#B89358] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[#18181B] dark:text-white">Flexible Cancellation</p>
                <p className="text-[11px]">Free cancellation up to 48 hours prior to arrival</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-[#B89358] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[#18181B] dark:text-white">Dedicated Concierge</p>
                <p className="text-[11px]">Pre-arrival itinerary and dietary coordination</p>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Sticky Bottom Purchase Bar (Mobile Touch 48px) */}
        <div className="p-4 sm:p-6 bg-[#FAF9F6] dark:bg-[#161a22] border-t border-[#E8E4DA] dark:border-[#27272a] flex items-center justify-between shrink-0 pb-safe transition-colors">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-[11px] text-[#71717A] dark:text-[#a1a1aa]">Rate</span>
              <span className="text-2xl sm:text-3xl font-serif font-semibold text-[#18181B] dark:text-white tabular-nums">
                ${room.base_price.toLocaleString()}
              </span>
              <span className="text-[11px] text-[#71717A] dark:text-[#a1a1aa]">/ night</span>
            </div>
            <p className="text-[10px] text-[#71717A] dark:text-[#a1a1aa] hidden sm:block">State taxes &amp; resort charges calculated at checkout</p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onClose}
              className="hidden sm:inline-block px-4 py-2.5 min-h-[44px] text-xs font-medium text-[#52525B] dark:text-[#a1a1aa] hover:text-[#18181B] dark:hover:text-white transition-colors cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={() => {
                onClose();
                onReserve(room);
              }}
              className="px-5 sm:px-6 py-2.5 min-h-[48px] text-xs uppercase tracking-[0.16em] font-medium text-white bg-[#18181B] dark:bg-[#B89358] dark:text-[#0c0e12] hover:bg-[#B89358] dark:hover:bg-[#d8b77d] active:scale-[0.98] rounded-lg transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer whitespace-nowrap"
            >
              <span>Reserve Suite</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
