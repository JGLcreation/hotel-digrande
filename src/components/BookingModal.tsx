import React, { useState, useEffect } from 'react';
import { RoomType, AddOnService } from '../types/hotel.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { X, Calendar, Users, Check, ArrowRight, ShieldCheck, CreditCard, Sparkles, Printer, Lock } from 'lucide-react';

interface BookingModalProps {
  roomType: RoomType | null;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
  onClose: () => void;
  onBookingSuccess: (reservationId: string) => void;
  onOpenAuthModal?: () => void;
  onViewMyBookings?: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  roomType,
  initialCheckIn,
  initialCheckOut,
  initialGuests = 2,
  onClose,
  onBookingSuccess,
  onOpenAuthModal,
  onViewMyBookings
}) => {
  const { user } = useAuth();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 4);

  const fmt = (d: Date) => d.toISOString().split('T')[0];

  const [checkIn, setCheckIn] = useState<string>(initialCheckIn || fmt(tomorrow));
  const [checkOut, setCheckOut] = useState<string>(initialCheckOut || fmt(dayAfter));
  const [guestsCount, setGuestsCount] = useState<number>(initialGuests);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Available add-ons
  const [availableServices, setAvailableServices] = useState<AddOnService[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<AddOnService[]>([]);

  // Guest details form
  const [guestName, setGuestName] = useState<string>(user?.name || '');
  const [guestEmail, setGuestEmail] = useState<string>(user?.email || '');
  const [guestPhone, setGuestPhone] = useState<string>(user?.phone || '');
  const [specialRequests, setSpecialRequests] = useState<string>('High floor preferred with extra feather pillows.');

  useEffect(() => {
    if (user) {
      setGuestName(user.name);
      setGuestEmail(user.email);
      if (user.phone) setGuestPhone(user.phone);
      setCardHolder(user.name);
    }
  }, [user]);

  // Payment form
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'pay_at_checkin'>('credit_card');
  const [cardNumber, setCardNumber] = useState<string>('4532 •••• •••• 8912');
  const [cardHolder, setCardHolder] = useState<string>(user?.name || 'Jeric Lozada');
  const [cardExp, setCardExp] = useState<string>('12/28');
  const [cardCvv, setCardCvv] = useState<string>('842');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedBookingId, setConfirmedBookingId] = useState<string | null>(null);
  const [confirmedRoomId, setConfirmedRoomId] = useState<string | null>(null);

  // Fetch hotel add-on services
  useEffect(() => {
    async function loadServices() {
      try {
        const res = await fetch('/api/services');
        if (res.ok) {
          const data = await res.json();
          setAvailableServices(data.services || []);
        }
      } catch (err) {
        console.error('Failed to load services:', err);
      }
    }
    loadServices();
  }, []);

  if (!roomType) return null;

  // Nights calculation
  const inD = new Date(checkIn);
  const outD = new Date(checkOut);
  const nights = Math.max(1, Math.round((outD.getTime() - inD.getTime()) / (1000 * 60 * 60 * 24)));

  const roomSubtotal = roomType.base_price * nights;
  const addOnsTotal = selectedAddOns.reduce((sum, item) => sum + item.price, 0);
  const subtotal = roomSubtotal + addOnsTotal;
  const tax = subtotal * 0.12;
  const totalPrice = Math.round((subtotal + tax) * 100) / 100;

  const toggleAddOn = (service: AddOnService) => {
    if (selectedAddOns.some(s => s.id === service.id)) {
      setSelectedAddOns(selectedAddOns.filter(s => s.id !== service.id));
    } else {
      setSelectedAddOns([...selectedAddOns, service]);
    }
  };

  const handleConfirmReservation = async () => {
    setError(null);

    if (!user) {
      setError('Palace Membership Required: You must be registered and signed in to book a suite.');
      onOpenAuthModal?.();
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('grand_luxe_token')
            ? { Authorization: `Bearer ${localStorage.getItem('grand_luxe_token')}` }
            : {})
        },
        body: JSON.stringify({
          guest_name: guestName,
          guest_email: guestEmail,
          guest_phone: guestPhone,
          room_type_id: roomType.id,
          check_in_date: checkIn,
          check_out_date: checkOut,
          guests_count: guestsCount,
          special_requests: specialRequests,
          add_ons: selectedAddOns,
          payment_method: paymentMethod
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to confirm reservation');
        setIsSubmitting(false);
        return;
      }

      setConfirmedBookingId(data.reservationId);
      setConfirmedRoomId(data.assignedRoomId);
      setStep(4);
      onBookingSuccess(data.reservationId);
    } catch (err) {
      setError('Network communication failure. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6 animate-fade-in">
      <div 
        className="relative bg-white w-full sm:max-w-3xl rounded-t-2xl sm:rounded-2xl shadow-2xl border border-[#E8E4DA] overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Mobile Grab Handle */}
        <div className="sm:hidden w-10 h-1.5 bg-[#D4CFBE] rounded-full mx-auto my-2.5 shrink-0" />

        {/* Top Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#E8E4DA] bg-[#FAF9F6] flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#B89358]">
              Palace Reservation System
            </span>
            <h3 className="font-serif text-lg sm:text-2xl text-[#18181B] font-light truncate max-w-[250px] sm:max-w-none">
              {step === 4 ? 'Reservation Confirmed' : `Reserve ${roomType.name}`}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#71717A] hover:text-[#18181B] min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-[#F2EFE8] transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator (Steps 1, 2, 3) */}
        {step < 4 && (
          <div className="px-4 sm:px-6 py-2 bg-white border-b border-[#F0ECE1] flex items-center justify-between text-[11px] sm:text-xs text-[#71717A] shrink-0">
            <div className={`flex items-center gap-1.5 ${step === 1 ? 'text-[#18181B] font-semibold' : ''}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 1 ? 'bg-[#18181B] text-white' : 'bg-[#E4E0D5] text-[#71717A]'}`}>1</span>
              <span className="hidden sm:inline">Stay &amp; Enhancements</span>
              <span className="sm:hidden">Stay</span>
            </div>
            <div className={`flex items-center gap-1.5 ${step === 2 ? 'text-[#18181B] font-semibold' : ''}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 2 ? 'bg-[#18181B] text-white' : 'bg-[#E4E0D5] text-[#71717A]'}`}>2</span>
              <span className="hidden sm:inline">Guest Details</span>
              <span className="sm:hidden">Details</span>
            </div>
            <div className={`flex items-center gap-1.5 ${step === 3 ? 'text-[#18181B] font-semibold' : ''}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 3 ? 'bg-[#18181B] text-white' : 'bg-[#E4E0D5] text-[#71717A]'}`}>3</span>
              <span className="hidden sm:inline">Payment &amp; Folio</span>
              <span className="sm:hidden">Payment</span>
            </div>
          </div>
        )}

        {/* Scrollable Modal Content */}
        <div className="p-4 sm:p-8 overflow-y-auto flex-1">
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
              {error}
            </div>
          )}

          {!user && step < 4 && (
            <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900 animate-fade-in">
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  <strong>Palace Membership Required:</strong> You must sign in or register a guest account before booking a suite.
                </span>
              </div>
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="px-3.5 py-2 min-h-[38px] bg-[#18181B] hover:bg-[#B89358] text-white font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap text-xs shadow-xs"
              >
                Sign In / Register
              </button>
            </div>
          )}

          {/* STEP 1: DATES, SUITE SUMMARY & ADD-ONS */}
          {step === 1 && (
            <div className="space-y-5 sm:space-y-6">
              
              {/* Suite Summary Card */}
              <div className="flex flex-col sm:flex-row gap-3.5 sm:gap-4 p-3.5 sm:p-4 bg-[#FAF9F6] rounded-xl border border-[#EBE7DD]">
                <img
                  src={roomType.image_url}
                  alt={roomType.name}
                  className="w-full sm:w-36 h-28 object-cover rounded-lg"
                />
                <div className="flex-1 text-xs">
                  <span className="text-[#B89358] uppercase tracking-wider text-[10px] font-semibold block mb-0.5">
                    {roomType.category}
                  </span>
                  <h4 className="font-serif text-lg font-normal text-[#18181B] mb-1">
                    {roomType.name}
                  </h4>
                  <p className="text-[#71717A] mb-2">{roomType.size_sqm} m² · {roomType.view_type} · {roomType.bed_type}</p>
                  <p className="font-semibold text-[#18181B] text-sm tabular-nums">
                    ${roomType.base_price.toLocaleString()} <span className="text-xs font-normal text-[#71717A]">/ night</span>
                  </p>
                </div>
              </div>

              {/* Dates & Guests Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 border border-[#E4E0D5] rounded-lg bg-white min-h-[52px]">
                  <label className="block text-[10px] uppercase font-semibold text-[#71717A] mb-1">Check-in</label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full text-xs font-medium text-[#18181B] focus:outline-none"
                    required
                  />
                </div>
                <div className="p-3 border border-[#E4E0D5] rounded-lg bg-white min-h-[52px]">
                  <label className="block text-[10px] uppercase font-semibold text-[#71717A] mb-1">Check-out</label>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full text-xs font-medium text-[#18181B] focus:outline-none"
                    required
                  />
                </div>
                <div className="p-3 border border-[#E4E0D5] rounded-lg bg-white min-h-[52px]">
                  <label className="block text-[10px] uppercase font-semibold text-[#71717A] mb-1">Guests</label>
                  <select
                    value={guestsCount}
                    onChange={(e) => setGuestsCount(parseInt(e.target.value, 10))}
                    className="w-full text-xs font-medium text-[#18181B] focus:outline-none bg-transparent"
                  >
                    {[...Array(roomType.max_occupancy)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1} {i === 0 ? 'Guest' : 'Guests'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Luxury Enhancements & Add-ons */}
              <div>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Sparkles className="w-4 h-4 text-[#B89358]" />
                  <h4 className="text-[11px] sm:text-xs uppercase tracking-[0.16em] font-semibold text-[#18181B]">
                    Signature Enhancements &amp; Add-Ons
                  </h4>
                </div>

                <div className="space-y-2">
                  {availableServices.map((service) => {
                    const isSelected = selectedAddOns.some(s => s.id === service.id);
                    return (
                      <div
                        key={service.id}
                        onClick={() => toggleAddOn(service)}
                        className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all min-h-[54px] ${
                          isSelected ? 'bg-[#FAF9F6] border-[#B89358] shadow-xs' : 'bg-white border-[#E8E4DA] hover:border-[#D4CFBE]'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 sm:gap-3">
                          <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                            isSelected ? 'bg-[#B89358] border-[#B89358] text-white' : 'border-[#D4CFBE]'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-[#18181B]">{service.name}</p>
                            <p className="text-[10px] sm:text-[11px] text-[#71717A] leading-tight">{service.description}</p>
                          </div>
                        </div>
                        <span className="text-xs font-serif font-semibold text-[#18181B] tabular-nums whitespace-nowrap ml-3">
                          +${service.price.toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Price Calculation Card */}
              <div className="p-4 bg-[#FAF9F6] rounded-xl border border-[#E8E4DA] text-xs space-y-2">
                <div className="flex justify-between text-[#52525B]">
                  <span>Stay ({nights} {nights === 1 ? 'night' : 'nights'} @ ${roomType.base_price}/night)</span>
                  <span className="tabular-nums font-medium">${roomSubtotal.toLocaleString()}</span>
                </div>
                {selectedAddOns.length > 0 && (
                  <div className="flex justify-between text-[#52525B]">
                    <span>Enhancements ({selectedAddOns.length})</span>
                    <span className="tabular-nums font-medium">+${addOnsTotal.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#52525B]">
                  <span>Hospitality Tax &amp; Tourism Levy (12%)</span>
                  <span className="tabular-nums font-medium">${tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-[#E8E4DA] pt-2 flex justify-between font-serif text-base sm:text-lg font-semibold text-[#18181B]">
                  <span>Total Estimated Folio</span>
                  <span className="tabular-nums text-lg sm:text-xl text-[#B89358]">${totalPrice.toFixed(2)}</span>
                </div>
              </div>

            </div>
          )}

          {/* STEP 2: GUEST DETAILS */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-xs text-[#71717A]">
                Please enter the primary guest information for registration and digital keycard issuing.
              </p>

              <div>
                <label className="block text-xs font-medium text-[#27272A] mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. Lord Arthur Sterling"
                  className="w-full text-xs p-3 min-h-[44px] border border-[#E4E0D5] rounded-lg bg-white focus:outline-none focus:border-[#B89358]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#27272A] mb-1">Email Address *</label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="guest@example.com"
                    className="w-full text-xs p-3 min-h-[44px] border border-[#E4E0D5] rounded-lg bg-white focus:outline-none focus:border-[#B89358]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#27272A] mb-1">Mobile / WhatsApp</label>
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="+1 (555) 019-2831"
                    className="w-full text-xs p-3 min-h-[44px] border border-[#E4E0D5] rounded-lg bg-white focus:outline-none focus:border-[#B89358]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#27272A] mb-1">Special Requests &amp; Arrival Notes</label>
                <textarea
                  rows={3}
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Dietary preferences, arrival hour, extra hypoallergenic pillows..."
                  className="w-full text-xs p-3 border border-[#E4E0D5] rounded-lg bg-white focus:outline-none focus:border-[#B89358]"
                />
              </div>

              <div className="p-3 bg-[#FAF9F6] border border-[#E8E4DA] rounded-lg text-xs text-[#52525B] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#B89358] shrink-0" />
                <span>Complimentary cancellation up to 48 hours prior to arrival date.</span>
              </div>
            </div>
          )}

          {/* STEP 3: PAYMENT METHOD */}
          {step === 3 && (
            <div className="space-y-5 sm:space-y-6">
              
              {/* Payment selector */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('credit_card')}
                  className={`p-3 min-h-[48px] rounded-lg border flex items-center justify-center gap-2 font-medium transition-colors cursor-pointer ${
                    paymentMethod === 'credit_card' ? 'bg-[#FAF9F6] border-[#B89358] text-[#18181B] font-semibold' : 'border-[#E4E0D5] text-[#71717A]'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-[#B89358]" />
                  <span>Card Settlement</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('pay_at_checkin')}
                  className={`p-3 min-h-[48px] rounded-lg border flex items-center justify-center gap-2 font-medium transition-colors cursor-pointer ${
                    paymentMethod === 'pay_at_checkin' ? 'bg-[#FAF9F6] border-[#B89358] text-[#18181B] font-semibold' : 'border-[#E4E0D5] text-[#71717A]'
                  }`}
                >
                  <span>Pay upon Arrival</span>
                </button>
              </div>

              {paymentMethod === 'credit_card' ? (
                <div className="p-4 bg-[#FAF9F6] rounded-xl border border-[#E4E0D5] space-y-3">
                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-[#71717A] mb-1">Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="•••• •••• •••• ••••"
                      className="w-full text-xs p-3 min-h-[44px] border border-[#D4CFBE] rounded-lg bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-[#71717A] mb-1">Cardholder Name</label>
                    <input
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      className="w-full text-xs p-3 min-h-[44px] border border-[#D4CFBE] rounded-lg bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-semibold text-[#71717A] mb-1">Expiry (MM/YY)</label>
                      <input
                        type="text"
                        value={cardExp}
                        onChange={(e) => setCardExp(e.target.value)}
                        className="w-full text-xs p-3 min-h-[44px] border border-[#D4CFBE] rounded-lg bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-semibold text-[#71717A] mb-1">CVV / CVC</label>
                      <input
                        type="password"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="w-full text-xs p-3 min-h-[44px] border border-[#D4CFBE] rounded-lg bg-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-[#FAF9F6] rounded-xl border border-[#E4E0D5] text-xs text-[#52525B] space-y-2">
                  <p className="font-semibold text-[#18181B]">Pay at Front Desk</p>
                  <p>Settle your full reservation folio upon arrival via credit card, wire, or cash.</p>
                </div>
              )}

              {/* Total Due */}
              <div className="p-4 bg-white rounded-xl border border-[#B89358]/40 flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#71717A]">Total Amount to Settle</span>
                  <p className="text-xs font-medium text-[#18181B]">{nights} nights · {guestsCount} guests</p>
                </div>
                <span className="font-serif text-2xl font-bold text-[#B89358] tabular-nums">
                  ${totalPrice.toFixed(2)}
                </span>
              </div>

            </div>
          )}

          {/* STEP 4: SUCCESS / CONFIRMATION VOUCHER */}
          {step === 4 && (
            <div className="space-y-5 text-center animate-fade-in py-2">
              
              <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                <Check className="w-7 h-7" />
              </div>

              <div>
                <h4 className="font-serif text-2xl sm:text-3xl text-[#18181B] mb-1 font-light">
                  Your Palatial Retreat is Secured
                </h4>
                <p className="text-xs text-[#71717A] max-w-md mx-auto">
                  Confirmation itinerary issued to <strong className="text-[#18181B]">{guestEmail}</strong>.
                </p>
              </div>

              {/* Digital Booking Folio Voucher */}
              <div className="bg-[#FAF9F6] border border-[#E4E0D5] rounded-xl p-5 text-left max-w-md mx-auto shadow-xs">
                
                <div className="border-b border-[#E8E4DA] pb-3 mb-3 flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-[#71717A] font-semibold">Reservation Code</span>
                    <p className="font-mono text-lg font-bold text-[#18181B] tracking-wider">{confirmedBookingId}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-widest text-[#71717A] font-semibold">Allocated Room</span>
                    <p className="text-base font-serif font-bold text-[#B89358]">
                      {confirmedRoomId ? `Room ${confirmedRoomId}` : 'At Check-in'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-[#52525B] mb-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[#71717A]">Guest Account:</span>
                    <span className="font-semibold text-[#18181B]">{guestName} {user?.username ? `(@${user.username})` : ''}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#71717A]">Booked Suite:</span>
                    <span className="font-semibold text-[#18181B] truncate max-w-[200px]">{roomType.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#71717A]">Stay Period:</span>
                    <span className="font-medium text-[#18181B]">{checkIn} → {checkOut} ({nights} {nights === 1 ? 'night' : 'nights'})</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#71717A]">Occupancy:</span>
                    <span className="font-medium text-[#18181B]">{guestsCount} {guestsCount === 1 ? 'Guest' : 'Guests'}</span>
                  </div>

                  {selectedAddOns.length > 0 && (
                    <div className="border-t border-[#E8E4DA] pt-2">
                      <span className="text-[10px] text-[#71717A] uppercase tracking-wider font-semibold block mb-1">
                        Curated Add-on Experiences ({selectedAddOns.length})
                      </span>
                      <div className="space-y-1">
                        {selectedAddOns.map(addon => (
                          <div key={addon.id} className="flex justify-between text-[11px]">
                            <span className="text-[#18181B] truncate max-w-[220px]">✦ {addon.name}</span>
                            <span className="font-mono text-[#B89358]">${addon.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between font-semibold text-[#18181B] border-t border-[#E8E4DA] pt-2">
                    <span>Total Palatial Folio:</span>
                    <span className="text-sm text-[#B89358] tabular-nums font-bold">${totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                <div className="p-2.5 bg-white border border-[#EAE6DC] rounded-lg text-[11px] text-[#71717A] flex items-center justify-between">
                  <div>
                    <span className="font-medium text-[#18181B] block">Connected to Palace Desk</span>
                    <span className="text-[10px] text-[#71717A]">Visible in Front Desk &amp; Admin</span>
                  </div>
                  <span className="font-mono text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Confirmed</span>
                </div>

              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2 pb-safe">
                {onViewMyBookings && (
                  <button
                    onClick={() => {
                      onClose();
                      onViewMyBookings();
                    }}
                    className="px-5 py-2.5 min-h-[44px] bg-[#B89358] hover:bg-[#8C6A32] active:scale-95 text-white text-xs uppercase tracking-wider font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <span>View in My Bookings</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2.5 min-h-[44px] border border-[#D4CFBE] rounded-lg text-xs font-medium text-[#27272A] hover:bg-[#FAF9F6] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Voucher</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 min-h-[44px] bg-[#18181B] hover:bg-black text-white text-xs uppercase tracking-wider font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Modal Bottom Sticky Actions for Steps 1-3 */}
        {step < 4 && (
          <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-[#FAF9F6] border-t border-[#E8E4DA] flex items-center justify-between shrink-0 pb-safe">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((step - 1) as any)}
                className="px-4 py-2 min-h-[44px] text-xs font-medium text-[#52525B] hover:text-[#18181B] transition-colors cursor-pointer"
              >
                Back
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 min-h-[44px] text-xs font-medium text-[#71717A] hover:text-[#18181B] transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 2 && (!guestName || !guestEmail)) {
                    setError('Please provide your name and email address.');
                    return;
                  }
                  setError(null);
                  setStep((step + 1) as any);
                }}
                className="px-6 py-2.5 min-h-[48px] text-xs uppercase tracking-[0.16em] font-medium text-white bg-[#18181B] hover:bg-[#B89358] active:scale-[0.98] rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : !user ? (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="px-6 sm:px-8 py-2.5 min-h-[48px] text-xs uppercase tracking-[0.16em] font-medium text-white bg-[#18181B] hover:bg-[#B89358] active:scale-[0.98] rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Lock className="w-4 h-4 text-[#D8B77D]" />
                <span>Sign In / Register to Book</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirmReservation}
                disabled={isSubmitting}
                className="px-6 sm:px-8 py-2.5 min-h-[48px] text-xs uppercase tracking-[0.16em] font-medium text-white bg-[#18181B] hover:bg-[#B89358] active:scale-[0.98] rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Confirming...' : 'Finalize Reservation'}</span>
                <Check className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
