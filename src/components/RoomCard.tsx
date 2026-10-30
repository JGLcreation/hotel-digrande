import React from 'react';
import { RoomType } from '../types/hotel.ts';
import { Users, Bed, Check } from 'lucide-react';

interface RoomCardProps {
  room: RoomType;
  onExplore: (room: RoomType) => void;
  onReserve: (room: RoomType) => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, onExplore, onReserve }) => {
  return (
    <article className="group bg-white rounded-xl border border-[#E8E4DA] overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:border-[#D4CFBE]">
      
      {/* Visual Asset Container (4:3 aspect ratio, subtle zoom on hover) */}
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-[#F0ECE1]">
        <img
          src={room.image_url}
          alt={room.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
          referrerPolicy="no-referrer"
          loading="lazy"
        />

        {/* Availability tag */}
        <div className="absolute bottom-3 left-3 bg-[#18181B]/90 backdrop-blur-xs text-[#FAF9F6] text-[11px] font-medium px-2.5 py-1 rounded-sm shadow-sm">
          {room.available_units > 0 ? (
            <span>{room.available_units} Available for selected dates</span>
          ) : (
            <span className="text-amber-300">High Demand · Inquire</span>
          )}
        </div>
      </div>

      {/* Content Container */}
      <div className="p-4 sm:p-6 flex-1 flex flex-col justify-between">
        
        <div>
          {/* Unboxed Category Kicker */}
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-[#71717A] mb-2 uppercase tracking-[0.14em] sm:tracking-[0.16em]">
            <span>{room.category}</span>
            <span>{room.size_sqm} m² · {room.view_type}</span>
          </div>

          {/* Room Name */}
          <h3 className="font-serif text-xl sm:text-2xl font-normal text-[#18181B] tracking-tight mb-2 group-hover:text-[#B89358] transition-colors leading-snug">
            {room.name}
          </h3>

          {/* Clean Unboxed Metadata Specifications */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#52525B] mb-3">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-[#B89358]" />
              Up to {room.max_occupancy} Guests
            </span>
            <span aria-hidden="true" className="text-[#A1A1AA]">·</span>
            <span className="flex items-center gap-1">
              <Bed className="w-3.5 h-3.5 text-[#B89358]" />
              {room.bed_type}
            </span>
          </div>

          {/* Description snippet */}
          <p className="text-xs text-[#71717A] line-clamp-2 leading-relaxed mb-4 font-normal">
            {room.description}
          </p>

          {/* Key Amenities preview */}
          <div className="space-y-1 mb-5 border-t border-[#F2EFE8] pt-3">
            {room.amenities.slice(0, 3).map((amenity, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-[#52525B]">
                <Check className="w-3.5 h-3.5 text-[#B89358] shrink-0" />
                <span className="truncate">{amenity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer: Price per night + Action CTAs (Touch target min-h 44px) */}
        <div className="pt-4 border-t border-[#E8E4DA] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-[11px] text-[#71717A]">From</span>
              <span className="text-xl sm:text-2xl font-serif font-semibold text-[#18181B] tabular-nums">
                ${room.base_price.toLocaleString()}
              </span>
              <span className="text-[11px] text-[#71717A]">/ night</span>
            </div>
            <p className="text-[10px] text-[#A1A1AA]">Taxes &amp; resort privileges included</p>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => onExplore(room)}
              className="px-3 py-2.5 min-h-[44px] text-xs font-medium text-[#27272A] hover:text-[#18181B] active:bg-[#FAF9F6] border border-[#D4CFBE] rounded-lg transition-colors flex items-center justify-center whitespace-nowrap cursor-pointer"
            >
              Details
            </button>
            <button
              onClick={() => onReserve(room)}
              className="px-4 py-2.5 min-h-[44px] text-xs uppercase tracking-wider font-medium text-white bg-[#18181B] hover:bg-[#B89358] active:scale-[0.98] rounded-lg transition-all flex items-center justify-center whitespace-nowrap cursor-pointer shadow-xs"
            >
              Reserve
            </button>
          </div>
        </div>

      </div>
    </article>
  );
};
