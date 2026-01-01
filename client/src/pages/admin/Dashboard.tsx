import { AdminLayout } from "@/components/AdminLayout";
import { useTrips } from "@/hooks/use-trips";
import { useAdminBookings } from "@/hooks/use-bookings";
import { Users, Ship, Calendar, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const { data: trips } = useTrips();
  const { data: bookings } = useAdminBookings();

  const totalBookings = bookings?.length || 0;
  const activeTrips = trips?.filter(t => t.isActive).length || 0;
  // Simple revenue calc
  const totalRevenue = bookings?.reduce((acc, b) => acc + (b.totalPrice || 0), 0) || 0;

  const stats = [
    { label: "Total Bookings", value: totalBookings, icon: Users, color: "bg-blue-500" },
    { label: "Active Routes", value: activeTrips, icon: Ship, color: "bg-teal-500" },
    { label: "Total Revenue", value: `MVR ${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: "bg-amber-500" },
    { label: "Scheduled Trips", value: trips?.length || 0, icon: Calendar, color: "bg-purple-500" },
  ];

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
        <p className="text-slate-500">Welcome back to YoosuSpeed admin panel.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-white ${stat.color}`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-bold mb-4">Recent Bookings</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="p-3 rounded-l-lg">Ticket Code</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Route</th>
                <th className="p-3">Status</th>
                <th className="p-3 rounded-r-lg">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings?.slice(0, 5).map((booking) => (
                <tr key={booking.id} className="hover:bg-slate-50/50">
                  <td className="p-3 font-mono font-medium">{booking.ticketCode}</td>
                  <td className="p-3">{booking.customerName}</td>
                  <td className="p-3 text-slate-500">Trip ID: {booking.tripId}</td>
                  <td className="p-3">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      booking.bookingStatus === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {booking.bookingStatus}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500">{new Date(booking.createdAt || '').toLocaleDateString()}</td>
                </tr>
              ))}
              {!bookings?.length && (
                <tr><td colSpan={5} className="p-4 text-center text-slate-400">No bookings found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
