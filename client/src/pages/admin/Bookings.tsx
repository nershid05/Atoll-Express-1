import { AdminLayout } from "@/components/AdminLayout";
import { useAdminBookings, useUpdateBookingStatus } from "@/hooks/use-bookings";
import { Search, Filter, Check, X } from "lucide-react";
import { useState } from "react";

export default function AdminBookings() {
  const { data: bookings, isLoading } = useAdminBookings();
  const { mutate: updateStatus } = useUpdateBookingStatus();
  const [filter, setFilter] = useState("");

  const filteredBookings = bookings?.filter(b => 
    b.customerName.toLowerCase().includes(filter.toLowerCase()) || 
    b.ticketCode.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Manage Bookings</h1>
        <p className="text-slate-500">View and update customer reservations.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              placeholder="Search by name or ticket code..." 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-9 pr-4 py-2 w-full border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-4">Ticket</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Trip Info</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBookings?.map((booking) => (
                <tr key={booking.id} className="hover:bg-slate-50/50">
                  <td className="p-4 font-mono font-medium">{booking.ticketCode}</td>
                  <td className="p-4 font-medium">{booking.customerName}</td>
                  <td className="p-4 text-slate-500">
                    <div>{booking.customerPhone}</div>
                    <div className="text-xs">{booking.customerEmail}</div>
                  </td>
                  <td className="p-4">
                    <div>ID: {booking.tripId}</div>
                    <div className="text-xs text-slate-500">{booking.ticketQuantity} seats • MVR {booking.totalPrice}</div>
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => updateStatus({ id: booking.id, paymentStatus: booking.paymentStatus === 'paid' ? 'pending' : 'paid' })}
                      className={`px-2 py-1 rounded text-xs font-medium cursor-pointer ${
                        booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {booking.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                    </button>
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
              ))}
              {!filteredBookings?.length && (
                 <tr><td colSpan={7} className="p-8 text-center text-slate-400">No bookings match your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
