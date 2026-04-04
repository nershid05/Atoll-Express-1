import { AdminLayout } from "@/components/AdminLayout";
import { useAdminBookings, useUpdateBookingStatus } from "@/hooks/use-bookings";
import { useTrips } from "@/hooks/use-trips";
import { Search, Check, X, Eye, Calendar, ChevronDown, ChevronUp, Users, Banknote, Clock } from "lucide-react";
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function AdminBookings() {
  const { data: bookings, isLoading } = useAdminBookings();
  const { data: trips } = useTrips();
  const { mutate: updateStatus } = useUpdateBookingStatus();

  const [filter, setFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");
  const [selectedSlip, setSelectedSlip] = useState<string | null>(null);
  const [collapsedTrips, setCollapsedTrips] = useState<Set<number>>(new Set());

  const toggleTrip = (tripId: number) => {
    setCollapsedTrips(prev => {
      const next = new Set(prev);
      next.has(tripId) ? next.delete(tripId) : next.add(tripId);
      return next;
    });
  };

  const filtered = useMemo(() => {
    return bookings?.filter(b => {
      const matchesText = !filter ||
        b.customerName.toLowerCase().includes(filter.toLowerCase()) ||
        b.ticketCode.toLowerCase().includes(filter.toLowerCase()) ||
        b.customerPhone?.includes(filter);
      const matchesPayment = paymentStatusFilter === "all" || b.paymentStatus === paymentStatusFilter;
      let matchesDate = true;
      if (dateFilter) {
        const trip = trips?.find(t => t.id === b.tripId);
        matchesDate = trip?.departureDate === dateFilter;
      }
      return matchesText && matchesPayment && matchesDate;
    }) ?? [];
  }, [bookings, filter, dateFilter, paymentStatusFilter, trips]);

  // Group by tripId, sorted by trip departure date desc
  const grouped = useMemo(() => {
    const map = new Map<number, typeof filtered>();
    for (const b of filtered) {
      if (!map.has(b.tripId)) map.set(b.tripId, []);
      map.get(b.tripId)!.push(b);
    }
    // Sort tripIds by departure date desc
    return Array.from(map.entries()).sort(([aId], [bId]) => {
      const tA = trips?.find(t => t.id === aId);
      const tB = trips?.find(t => t.id === bId);
      if (!tA || !tB) return 0;
      const dateA = `${tA.departureDate}${tA.departureTime}`;
      const dateB = `${tB.departureDate}${tB.departureTime}`;
      return dateB.localeCompare(dateA);
    });
  }, [filtered, trips]);

  const hasFilters = filter || dateFilter || paymentStatusFilter !== "all";

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Manage Bookings</h1>
        <p className="text-slate-500">Bookings are grouped by trip.</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            placeholder="Search name, phone or ticket..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="pl-9 pr-4 py-2 w-full border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="relative w-full sm:w-44">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="pl-9 pr-3 py-2 w-full border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={paymentStatusFilter}
          onChange={e => setPaymentStatusFilter(e.target.value)}
          className="text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white w-full sm:w-36"
        >
          <option value="all">All Payments</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
        </select>
        {hasFilters && (
          <button
            onClick={() => { setFilter(""); setDateFilter(""); setPaymentStatusFilter("all"); }}
            className="flex items-center gap-1 text-xs text-primary font-bold hover:underline whitespace-nowrap px-2"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        )}
      </div>

      {isLoading && (
        <div className="text-center py-16 text-slate-400">Loading bookings...</div>
      )}

      {!isLoading && grouped.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 shadow-sm">
          No bookings match your criteria.
        </div>
      )}

      {/* Trip Groups */}
      <div className="space-y-4">
        {grouped.map(([tripId, tripBookings]) => {
          const trip = trips?.find(t => t.id === tripId);
          const isCollapsed = collapsedTrips.has(tripId);
          const totalSeats = tripBookings.reduce((s, b) => s + b.ticketQuantity, 0);
          const paidCount = tripBookings.filter(b => b.paymentStatus === "paid").length;
          const pendingCount = tripBookings.filter(b => b.paymentStatus === "pending").length;
          const confirmedCount = tripBookings.filter(b => b.bookingStatus === "confirmed").length;
          const revenue = tripBookings.filter(b => b.paymentStatus === "paid").reduce((s, b) => s + Number(b.totalPrice), 0);

          return (
            <div key={tripId} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Trip Header */}
              <button
                onClick={() => toggleTrip(tripId)}
                className="w-full text-left p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-base">
                      {trip ? `${trip.routeFrom} → ${trip.routeTo}` : `Trip #${tripId}`}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      {trip && (
                        <>
                          <span className="text-sm text-slate-500">{trip.departureDate}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-sm font-mono text-slate-600">{trip.departureTime} – {trip.arrivalTime}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-[11px] text-slate-400 font-semibold uppercase">{trip.routeName}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 sm:gap-4 ml-12 sm:ml-0">
                  <div className="flex items-center gap-1.5 text-sm">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-700">{tripBookings.length}</span>
                    <span className="text-slate-400 text-xs">booking{tripBookings.length !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <Banknote className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-700">MVR {revenue.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {paidCount > 0 && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[11px] font-bold">{paidCount} paid</span>
                    )}
                    {pendingCount > 0 && (
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-[11px] font-bold">{pendingCount} pending</span>
                    )}
                  </div>
                  <div className="text-slate-400">
                    {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                  </div>
                </div>
              </button>

              {/* Bookings List */}
              {!isCollapsed && (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block border-t border-slate-100 overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Ticket</th>
                          <th className="px-4 py-3 font-semibold">Route</th>
                          <th className="px-4 py-3 font-semibold">Customer</th>
                          <th className="px-4 py-3 font-semibold">Contact</th>
                          <th className="px-4 py-3 font-semibold">Seats</th>
                          <th className="px-4 py-3 font-semibold">Payment</th>
                          <th className="px-4 py-3 font-semibold">Slip</th>
                          <th className="px-4 py-3 font-semibold">Status</th>
                          <th className="px-4 py-3 font-semibold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {tripBookings.map(booking => (
                          <tr key={booking.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-4 py-3 font-mono font-medium text-slate-800">{booking.ticketCode}</td>
                            <td className="px-4 py-3">
                              {trip ? (
                                <div className="flex items-center gap-1 text-sm font-medium text-slate-700 whitespace-nowrap">
                                  <span>{trip.routeFrom}</span>
                                  <span className="text-slate-400">→</span>
                                  <span>{trip.routeTo}</span>
                                </div>
                              ) : <span className="text-slate-400 text-xs">—</span>}
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-900">{booking.customerName}</td>
                            <td className="px-4 py-3 text-slate-500">
                              <div>{booking.customerPhone}</div>
                              <div className="text-xs">{booking.customerEmail}</div>
                            </td>
                            <td className="px-4 py-3 text-slate-700 font-medium">{booking.ticketQuantity}</td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => updateStatus({ id: booking.id, paymentStatus: booking.paymentStatus === "paid" ? "pending" : "paid" })}
                                className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer ${
                                  booking.paymentStatus === "paid" ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                }`}
                              >
                                {booking.paymentStatus === "paid" ? "Paid" : "Pending"}
                              </button>
                              <div className="text-[10px] text-slate-400 uppercase font-semibold mt-0.5">{booking.paymentMethod?.replace("_", " ")}</div>
                            </td>
                            <td className="px-4 py-3">
                              {booking.paymentSlipUrl ? (
                                <button
                                  onClick={() => setSelectedSlip(booking.paymentSlipUrl)}
                                  className="flex items-center gap-1 text-primary hover:text-primary/80 font-medium text-xs"
                                >
                                  <Eye className="h-3.5 w-3.5" /> View
                                </button>
                              ) : <span className="text-slate-300 text-xs">—</span>}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                booking.bookingStatus === "confirmed" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
                              }`}>
                                {booking.bookingStatus}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              {booking.bookingStatus === "confirmed" ? (
                                <button
                                  onClick={() => updateStatus({ id: booking.id, bookingStatus: "cancelled" })}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                                  title="Cancel"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => updateStatus({ id: booking.id, bookingStatus: "confirmed" })}
                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                                  title="Confirm"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden border-t border-slate-100 divide-y divide-slate-50">
                    {tripBookings.map(booking => (
                      <div key={booking.id} className="p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-mono font-bold text-slate-800 text-sm">{booking.ticketCode}</div>
                            <div className="font-semibold text-slate-900">{booking.customerName}</div>
                            <div className="text-xs text-slate-400">{booking.customerPhone}</div>
                            {trip && (
                              <div className="flex items-center gap-1 text-xs font-semibold text-primary mt-0.5">
                                <span>{trip.routeFrom}</span>
                                <span className="text-slate-400">→</span>
                                <span>{trip.routeTo}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              booking.bookingStatus === "confirmed" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
                            }`}>{booking.bookingStatus}</span>
                            <button
                              onClick={() => updateStatus({ id: booking.id, paymentStatus: booking.paymentStatus === "paid" ? "pending" : "paid" })}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                booking.paymentStatus === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                              }`}
                            >{booking.paymentStatus === "paid" ? "Paid" : "Pending"}</button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                          <div className="text-xs text-slate-500">{booking.ticketQuantity} seat{booking.ticketQuantity !== 1 ? "s" : ""} • MVR {booking.totalPrice}</div>
                          <div className="flex items-center gap-2">
                            {booking.paymentSlipUrl && (
                              <button onClick={() => setSelectedSlip(booking.paymentSlipUrl)} className="p-1.5 text-primary bg-primary/5 rounded-lg">
                                <Eye className="h-4 w-4" />
                              </button>
                            )}
                            {booking.bookingStatus === "confirmed" ? (
                              <button onClick={() => updateStatus({ id: booking.id, bookingStatus: "cancelled" })} className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold">
                                <X className="h-3.5 w-3.5" /> Cancel
                              </button>
                            ) : (
                              <button onClick={() => updateStatus({ id: booking.id, bookingStatus: "confirmed" })} className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-bold">
                                <Check className="h-3.5 w-3.5" /> Confirm
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Payment Slip Dialog */}
      <Dialog open={!!selectedSlip} onOpenChange={() => setSelectedSlip(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Payment Slip</DialogTitle>
          </DialogHeader>
          <div className="mt-4 flex justify-center bg-slate-100 rounded-lg p-4 max-h-[70vh] overflow-auto">
            {selectedSlip?.startsWith("data:application/pdf") ? (
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
