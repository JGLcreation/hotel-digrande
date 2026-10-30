import React from 'react';
import { Utensils, Waves, Compass, ArrowRight } from 'lucide-react';

interface AmenitiesSectionProps {
  onReserveSuite: () => void;
  onOpenConcierge: () => void;
}

export const AmenitiesSection: React.FC<AmenitiesSectionProps> = ({ onReserveSuite, onOpenConcierge }) => {
  return (
    <section className="py-12 sm:py-20 bg-white border-t border-[#E8E4DA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
          <span className="text-xs uppercase tracking-[0.25em] text-[#B89358] font-semibold block mb-2">
            Sanctuary of Refinement
          </span>
          <h2 className="font-serif text-2xl sm:text-4xl md:text-5xl text-[#18181B] font-light tracking-tight mb-3 sm:mb-4 [text-wrap:balance]">
            World-Class Gastronomy, Thermal Wellness &amp; Private Charters
          </h2>
          <p className="text-xs sm:text-sm text-[#71717A] leading-relaxed [text-wrap:balance]">
            Meticulously designed to nourish body and soul with sensory delight, private vitality pools, and culinary masterworks.
          </p>
        </div>

        {/* 3-Column Luxury Features (Responsive Stack) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
          
          {/* Feature 1: Dining */}
          <div className="bg-[#FAF9F6] border border-[#E8E4DA] rounded-xl p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-white rounded-lg border border-[#E4E0D5] flex items-center justify-center text-[#B89358] mb-5 shadow-xs">
                <Utensils className="w-6 h-6 stroke-[1.5]" />
              </div>
              <h3 className="font-serif text-xl sm:text-2xl text-[#18181B] font-normal mb-2">
                Le Belvédère Gastronomy
              </h3>
              <p className="text-xs text-[#71717A] leading-relaxed mb-4">
                Executive Chef Julian Laurent orchestrates unforgettable 5-course tasting journeys spotlighting fresh Mediterranean catch, hand-foraged herbs, and vintage grand cru cellars.
              </p>
              <div className="text-xs text-[#52525B] space-y-1.5 border-t border-[#EBE7DD] pt-3.5">
                <p>· Tasting Menus &amp; In-Suite Dining</p>
                <p>· Sommelier Cellar with 2,400 Bottles</p>
                <p>· 24-Hour In-Room Service</p>
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={onOpenConcierge}
                className="w-full sm:w-auto min-h-[44px] text-xs font-semibold text-[#18181B] hover:text-[#B89358] flex items-center justify-center sm:justify-start gap-1.5 transition-colors cursor-pointer"
              >
                <span>Inquire Table Reservation</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Feature 2: Thermal Wellness Sanctuary */}
          <div className="bg-[#FAF9F6] border border-[#E8E4DA] rounded-xl p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-white rounded-lg border border-[#E4E0D5] flex items-center justify-center text-[#B89358] mb-5 shadow-xs">
                <Waves className="w-6 h-6 stroke-[1.5]" />
              </div>
              <h3 className="font-serif text-xl sm:text-2xl text-[#18181B] font-normal mb-2">
                Grand Luxe Thermal Spa
              </h3>
              <p className="text-xs text-[#71717A] leading-relaxed mb-4">
                Carved into coastal limestone, our heated vitality pools, eucalyptus steam chambers, and botanical organic facials restore vitality in total seclusion.
              </p>
              <div className="text-xs text-[#52525B] space-y-1.5 border-t border-[#EBE7DD] pt-3.5">
                <p>· Heated Vitality Hydro-Pool</p>
                <p>· 90-min Restorative Botanical Massage</p>
                <p>· Private Couples Suite with Steam Bath</p>
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={onOpenConcierge}
                className="w-full sm:w-auto min-h-[44px] text-xs font-semibold text-[#18181B] hover:text-[#B89358] flex items-center justify-center sm:justify-start gap-1.5 transition-colors cursor-pointer"
              >
                <span>Reserve Spa Treatment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Feature 3: Private Charters & Excursions */}
          <div className="bg-[#FAF9F6] border border-[#E8E4DA] rounded-xl p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-white rounded-lg border border-[#E4E0D5] flex items-center justify-center text-[#B89358] mb-5 shadow-xs">
                <Compass className="w-6 h-6 stroke-[1.5]" />
              </div>
              <h3 className="font-serif text-xl sm:text-2xl text-[#18181B] font-normal mb-2">
                Yachting &amp; Private Transfers
              </h3>
              <p className="text-xs text-[#71717A] leading-relaxed mb-4">
                Glide across sapphire coastlines aboard our private 42-foot motor yacht or arrive in seamless comfort via our chauffeured Mercedes-Maybach fleet.
              </p>
              <div className="text-xs text-[#52525B] space-y-1.5 border-t border-[#EBE7DD] pt-3.5">
                <p>· Private Sunset Coastal Charters</p>
                <p>· Airport Limousine Transfers to Portico</p>
                <p>· Helicopter Transfers &amp; Excursions</p>
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={onOpenConcierge}
                className="w-full sm:w-auto min-h-[44px] text-xs font-semibold text-[#18181B] hover:text-[#B89358] flex items-center justify-center sm:justify-start gap-1.5 transition-colors cursor-pointer"
              >
                <span>Arrange Coastal Charter</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* Featured Showcase Callout Banner */}
        <div className="relative rounded-2xl overflow-hidden bg-[#18181B] text-white p-6 sm:p-12 border border-[#333]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-center">
            <div>
              <span className="text-xs uppercase tracking-[0.25em] text-[#D8B77D] font-semibold block mb-2">
                Bespoke Hospitality Guarantee
              </span>
              <h3 className="font-serif text-2xl sm:text-4xl font-light mb-3 sm:mb-4 text-[#FAF9F6] leading-tight">
                Every Stay Tailored with Impeccable Precision
              </h3>
              <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed mb-6 font-normal">
                From specialized dietary menus prepared by Michelin-awarded masters to bespoke pillow menus and private limousine coordination, our round-the-clock Butler Service ensures zero friction throughout your residency.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={onReserveSuite}
                  className="w-full sm:w-auto px-6 py-3 min-h-[44px] bg-[#B89358] hover:bg-[#8C6A32] active:scale-[0.98] text-white text-xs uppercase tracking-wider font-medium rounded-lg transition-all flex items-center justify-center"
                >
                  Reserve Your Stay
                </button>
                <button
                  onClick={onOpenConcierge}
                  className="w-full sm:w-auto px-6 py-3 min-h-[44px] border border-[#52525B] text-[#E4E4E7] hover:text-white hover:border-white text-xs uppercase tracking-wider font-medium rounded-lg transition-colors flex items-center justify-center"
                >
                  Speak with Concierge
                </button>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden shadow-2xl border border-white/20 aspect-[16/10]">
              <img
                src="/src/assets/images/hotel_spa_wellness_1790748168996.jpg"
                alt="Grand Luxe Thermal Sanctuary & Vitality Pool"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
