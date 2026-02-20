import { AdminLayout } from "@/components/AdminLayout";
import { useAdminBookings, useUpdateBookingStatus } from "@/hooks/use-bookings";
import { useTrips } from "@/hooks/use-trips";
import { Search, Filter, Check, X, Eye, FileText, Calendar } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format, parseISO, isSameDay } from "date-fns";

export default function AdminBookings() {
  const { data: bookings, isLoading: bookingsLoading } = useAdminBookings();
  const { data: trips } = useTrips();
  const { mutate: updateStatus } = useUpdateBookingStatus();
  const [filter, setFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedSlip, setSelectedSlip] = useState<string | null>(null);

  const filteredBookings = bookings?.filter(b => {
    const matchesText = b.customerName.toLowerCase().includes(filter.toLowerCase()) || 
                       b.ticketCode.toLowerCase().includes(filter.toLowerCase());
    
    if (!dateFilter) return matchesText;

    const trip = trips?.find(t => t.id === b.tripId);
    if (!trip) return matchesText;

    try {
      return matchesText && trip.departureDate === dateFilter;
    } catch (e) {
      return matchesText;
    }
  });

  const isLoading = bookingsLoading;

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Manage Bookings</h1>
        <p className="text-slate-500">View and update customer reservations.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              placeholder="Search by name or ticket code..." 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-9 pr-4 py-2 w-full border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="relative w-full sm:w-48">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="pl-9 pr-4 py-2 w-full border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          {dateFilter && (
            <button 
              onClick={() => setDateFilter("")}
              className="text-xs text-primary font-medium hover:underline self-center"
            >
              Clear Date
            </button>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-4">Ticket</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Trip Info</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Slip</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBookings?.map((booking) => {
                const trip = trips?.find(t => t.id === booking.tripId);
                return (
                  <tr key={booking.id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-mono font-medium">{booking.ticketCode}</td>
                    <td className="p-4 font-medium">{booking.customerName}</td>
                    <td className="p-4 text-slate-500">
                      <div>{booking.customerPhone}</div>
                      <div className="text-xs">{booking.customerEmail}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-700">{trip ? `${trip.routeFrom} → ${trip.routeTo}` : `ID: ${booking.tripId}`}</div>
                      <div className="text-xs text-slate-500">{trip?.departureDate} • {booking.ticketQuantity} seats</div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <button 
                          onClick={() => updateStatus({ id: booking.id, paymentStatus: booking.paymentStatus === 'paid' ? 'pending' : 'paid' })}
                          className={`px-2 py-1 rounded text-xs font-medium cursor-pointer w-fit ${
                            booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {booking.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                        </button>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">{booking.paymentMethod?.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {booking.paymentSlipUrl ? (
                        <button 
                          onClick={() => setSelectedSlip(booking.paymentSlipUrl)}
                          className="flex items-center gap-1 text-primary hover:text-primary/80 font-medium transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                          View Slip
                        </button>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                        booking.bookingStatus === 'confirmed' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {booking.bookingStatus}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {booking.bookingStatus === 'confirmed' ? (
                         <button 
                           onClick={() => updateStatus({ id: booking.id, bookingStatus: 'cancelled' })}
                           className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                           title="Cancel Booking"
                         >
                           <X className="h-4 w-4" />
                         </button>
                      ) : (
                        <button 
                          onClick={() => updateStatus({ id: booking.id, bookingStatus: 'confirmed' })}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                          title="Confirm Booking"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile List View */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredBookings?.map((booking) => {
            const trip = trips?.find(t => t.id === booking.tripId);
            return (
              <div key={booking.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-mono font-bold text-slate-900">{booking.ticketCode}</div>
                    <div className="font-medium text-slate-700">{booking.customerName}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      booking.bookingStatus === 'confirmed' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {booking.bookingStatus}
                    </span>
                    <button 
                      onClick={() => updateStatus({ id: booking.id, paymentStatus: booking.paymentStatus === 'paid' ? 'pending' : 'paid' })}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {booking.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-slate-500">
                    <div className="font-bold text-slate-400 uppercase text-[10px]">Trip</div>
                    <div className="truncate">{trip ? `${trip.routeFrom} → ${trip.routeTo}` : `ID: ${booking.tripId}`}</div>
                    <div>{trip?.departureDate}</div>
                  </div>
                  <div className="text-slate-500 text-right">
                    <div className="font-bold text-slate-400 uppercase text-[10px]">Details</div>
                    <div>{booking.ticketQuantity} seats</div>
                    <div>MVR {booking.totalPrice}</div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                  <div className="flex gap-2">
                    {booking.paymentSlipUrl && (
                      <button 
                        onClick={() => setSelectedSlip(booking.paymentSlipUrl)}
                        className="p-2 text-primary bg-primary/5 rounded-lg"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                    <a href={`tel:${booking.customerPhone}`} className="p-2 text-slate-600 bg-slate-100 rounded-lg">
                      <Filter className="h-4 w-4" />
                    </a>
                  </div>
                  <div className="flex gap-2">
                    {booking.bookingStatus === 'confirmed' ? (
                       <button 
                         onClick={() => updateStatus({ id: booking.id, bookingStatus: 'cancelled' })}
                         className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold"
                       >
                         <X className="h-3.5 w-3.5" /> CANCEL
                       </button>
                    ) : (
                      <button 
                        onClick={() => updateStatus({ id: booking.id, bookingStatus: 'confirmed' })}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-bold"
                      >
                        <Check className="h-3.5 w-3.5" /> CONFIRM
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {!filteredBookings?.length && (
          <div className="p-12 text-center text-slate-400">No bookings match your criteria.</div>
        )}
      </div>

      <Dialog open={!!selectedSlip} onOpenChange={() => setSelectedSlip(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Payment Slip</DialogTitle>
          </DialogHeader>
          <div className="mt-4 flex justify-center bg-slate-100 rounded-lg p-4 overflow-hidden max-h-[70vh]">
            {selectedSlip?.startsWith('data:application/pdf') ? (
              <iframe src={selectedSlip} className="w-full h-[60vh]" />
            ) : (
              <img src={selectedSlip!} alt="Payment Slip" className="max-w-full h-auto object-contain" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
