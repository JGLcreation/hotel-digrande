import React, { useState, useEffect } from 'react';
import { Reservation, FolioData } from '../types/hotel.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Calendar, Search, FileText, Printer, XCircle } from 'lucide-react';

interface MyBookingsViewProps {
  onReserveSuite: () => void;
}

export const MyBookingsView: React.FC<MyBookingsViewProps> = ({ onReserveSuite }) => {
  const { user } = useAuth();
  const [emailInput, setEmailInput] = useState<string>(user?.email || 'jericlozada1996@gmail.com');
  const [bookings, setBookings] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeFolio, setActiveFolio] = useState<FolioData | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchBookings = async (emailToFetch: string) => {
    setIsLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/reservations/my?email=${encodeURIComponent(emailToFetch)}`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data.reservations || []);
      }
    } catch (err) {
      console.error('Failed to fetch personal bookings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const emailToUse = user?.email || emailInput || 'jericlozada1996@gmail.com';
    if (user?.email) {
      setEmailInput(user.email);
    }
    fetchBookings(emailToUse);

    const interval = setInterval(() => {
      fetchBookings(emailToUse);
    }, 10000);

    return () => clearInterval(interval);
  }, [user]);

  const handleCancel = async (bookingId: string) => {
    if (!window.confirm('Are you certain you wish to cancel this reservation?')) return;

    try {
      const res = await fetch(`/api/reservations/${bookingId}/cancel`, {
        method: 'POST'
      });
      if (res.ok) {
        setActionMessage(`Reservation ${bookingId} has been successfully cancelled.`);
        fetchBookings(emailInput);
      }
    } catch (err) {
      console.error('Failed to cancel:', err);
    }
  };

  const handleViewFolio = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/folios/${bookingId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveFolio(data.folio);
      }
    } catch (err) {
      console.error('Failed to load folio:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="text-emerald-700 font-medium">Confirmed</span>;
      case 'checked_in':
        return <span className="text-blue-700 font-medium">In-House</span>;
      case 'checked_out':
        return <span className="text-[#71717A] font-medium">Completed</span>;
      case 'cancelled':
        return <span className="text-red-700 font-medium">Cancelled</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pb-24 md:pb-12">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 sm:pb-8 border-b border-[#E8E4DA] gap-4 mb-6 sm:mb-8">
        <div>
          <span className="text-xs uppercase tracking-[0.2em] font-semibold text-[#B89358]">
            Palace Guest Portal
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#18181B] font-light">
            My Itinerary &amp; Stays
          </h1>
        </div>

        {/* Search Box (Mobile Full Width) */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchBookings(emailInput);
          }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto"
        >
          <div className="relative flex-1">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Search by reservation email"
              className="text-xs px-3 py-2.5 pl-8 border border-[#D4CFBE] rounded-lg bg-white w-full sm:w-64 min-h-[44px] focus:outline-none focus:border-[#B89358]"
            />
            <Search className="w-4 h-4 text-[#71717A] absolute left-2.5 top-3.5" />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 text-xs font-medium text-white bg-[#18181B] hover:bg-[#B89358] active:scale-[0.98] rounded-lg min-h-[44px] transition-colors whitespace-nowrap"
          >
            Find Stays
          </button>
        </form>
      </div>

      {actionMessage && (
        <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg">
          {actionMessage}
        </div>
      )}

      {/* Bookings List */}
      {isLoading ? (
        <div className="text-center py-16 text-xs text-[#71717A]">
          Loading reservations...
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-14 sm:py-16 bg-white rounded-xl border border-[#E8E4DA] p-6 sm:p-8">
          <Calendar className="w-10 h-10 text-[#B89358] mx-auto mb-3 stroke-[1.5]" />
          <h3 className="font-serif text-xl text-[#18181B] mb-2 font-normal">No Reservations Found</h3>
          <p className="text-xs text-[#71717A] max-w-sm mx-auto mb-6">
            We could not find any active bookings under <strong>{emailInput}</strong>.
          </p>
          <button
            onClick={onReserveSuite}
            className="px-6 py-3 min-h-[44px] text-xs uppercase tracking-wider font-medium text-white bg-[#18181B] hover:bg-[#B89358] rounded-lg transition-colors cursor-pointer"
          >
            Explore &amp; Reserve a Suite
          </button>
        </div>
      ) : (
        <div className="space-y-5 sm:space-y-6">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-xl border border-[#E8E4DA] p-4 sm:p-6 shadow-xs flex flex-col md:flex-row justify-between gap-5 sm:gap-6 hover:border-[#D4CFBE] transition-all"
            >
              
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
                {booking.image_url && (
                  <img
                    src={booking.image_url}
                    alt={booking.room_type_name}
                    className="w-full sm:w-44 h-36 sm:h-32 object-cover rounded-lg bg-[#F0ECE1]"
                  />
                )}

                <div className="text-xs space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-sm text-[#18181B]">{booking.id}</span>
                    <span aria-hidden="true" className="text-[#D4CFBE]">·</span>
                    <span className="text-xs">{getStatusBadge(booking.status)}</span>
                  </div>

                  <h3 className="font-serif text-xl sm:text-2xl text-[#18181B] font-normal">
                    {booking.room_type_name}
                  </h3>

                  {booking.category && (
                    <span className="inline-block text-[10px] uppercase tracking-wider font-semibold text-[#B89358]">
                      {booking.category}
                    </span>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[#52525B] pt-1">
                    <p>
                      <strong className="text-[#18181B]">Dates:</strong> {booking.check_in_date} → {booking.check_out_date}
                    </p>
                    <p>
                      <strong className="text-[#18181B]">Guests:</strong> {booking.guests_count || 1} {booking.guests_count === 1 ? 'Guest' : 'Guests'}
                    </p>
                    <p>
                      <strong className="text-[#18181B]">Allocated Room:</strong> {booking.assigned_room_id ? `Room ${booking.assigned_room_id}` : 'Assigned upon arrival'}
                    </p>
                    <p>
                      <strong className="text-[#18181B]">Payment:</strong> <span className="text-emerald-700 capitalize font-medium">{booking.payment_status}</span>
                    </p>
                  </div>

                  {booking.add_ons && booking.add_ons.length > 0 && (
                    <div className="pt-2 border-t border-[#F2EFE8]">
                      <span className="text-[10px] text-[#71717A] uppercase tracking-wider font-semibold block mb-1">
                        Reserved Add-ons ({booking.add_ons.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {booking.add_ons.map((addon, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-[#FAF9F6] border border-[#E8E4DA] rounded text-[11px] text-[#27272A] flex items-center gap-1">
                            <span>✦ {addon.name}</span>
                            <span className="font-mono text-[#B89358] font-medium">${addon.price}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {booking.special_requests && (
                    <p className="text-[#71717A] italic text-[11px] pt-1">
                      "{booking.special_requests}"
                    </p>
                  )}
                </div>
              </div>

              {/* Right column: Folio total & Action controls */}
              <div className="flex flex-col justify-between items-start md:items-end border-t md:border-t-0 pt-3 md:pt-0 border-[#E8E4DA] gap-3">
                <div className="md:text-right">
                  <span className="text-[10px] text-[#71717A] uppercase tracking-wider block">Total Folio</span>
                  <span className="font-serif text-2xl font-bold text-[#18181B] tabular-nums">
                    ${booking.total_price.toLocaleString()}
                  </span>
                  <span className="block text-[10px] text-emerald-700 capitalize font-medium">
                    Payment: {booking.payment_status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  <button
                    onClick={() => handleViewFolio(booking.id)}
                    className="flex-1 md:flex-initial px-3 py-2.5 min-h-[44px] border border-[#D4CFBE] rounded-lg text-xs font-medium text-[#27272A] hover:bg-[#FAF9F6] transition-colors flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#B89358]" />
                    <span>View Folio</span>
                  </button>

                  {booking.status === 'confirmed' && (
                    <button
                      onClick={() => handleCancel(booking.id)}
                      className="px-3 py-2.5 min-h-[44px] border border-red-200 text-red-700 hover:bg-red-50 rounded-lg text-xs font-medium transition-colors"
                    >
                      Cancel Stay
                    </button>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Guest Folio Modal (Mobile Responsive Bottom Sheet) */}
      {activeFolio && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="relative bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-xl shadow-2xl border border-[#E8E4DA] p-5 sm:p-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveFolio(null)}
              className="absolute top-4 right-4 text-[#71717A] hover:text-[#18181B] p-2 rounded-full hover:bg-[#FAF9F6] min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <XCircle className="w-6 h-6" />
            </button>

            <div className="border-b border-[#E8E4DA] pb-4 mb-4">
              <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#B89358]">
                Itemized Folio Statement
              </span>
              <h3 className="font-serif text-xl sm:text-2xl text-[#18181B] mt-1">
                Statement of Account · {activeFolio.reservation_id}
              </h3>
              <p className="text-xs text-[#71717A]">
                Guest: <strong>{activeFolio.guest_name}</strong> · Room: <strong>{activeFolio.room_number || 'N/A'}</strong>
              </p>
            </div>

            {/* Folio Items Table */}
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-[#E8E4DA] text-[#71717A] uppercase tracking-wider text-[10px]">
                    <th className="py-2">Description</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2EFE8]">
                  {activeFolio.items.map((item) => (
                    <tr key={item.id} className="hover:bg-[#FAF9F6]/50">
                      <td className="py-2.5 font-medium text-[#18181B]">
                        {item.description}
                        <span className="block text-[10px] text-[#71717A] capitalize">{item.category}</span>
                      </td>
                      <td className="py-2.5 text-right font-mono font-medium text-[#18181B] tabular-nums whitespace-nowrap">
                        ${item.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[#18181B] font-semibold text-[#18181B]">
                    <td className="py-3 text-sm font-serif">Total Charges</td>
                    <td className="py-3 text-right text-base font-serif text-[#B89358] tabular-nums whitespace-nowrap">
                      ${activeFolio.total_charges.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-4 border-t border-[#E8E4DA] pb-safe">
              <span className="text-xs text-emerald-700 font-medium capitalize text-center sm:text-left">
                Payment Status: {activeFolio.payment_status}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 sm:flex-initial px-4 py-2.5 min-h-[44px] border border-[#D4CFBE] rounded-lg text-xs font-medium text-[#27272A] hover:bg-[#FAF9F6] flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Invoice</span>
                </button>
                <button
                  onClick={() => setActiveFolio(null)}
                  className="flex-1 sm:flex-initial px-4 py-2.5 min-h-[44px] bg-[#18181B] text-white rounded-lg text-xs font-medium hover:bg-[#27272A]"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
