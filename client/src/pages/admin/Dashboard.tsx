import { AdminLayout } from "@/components/AdminLayout";
import { useTrips } from "@/hooks/use-trips";
import { useAdminBookings } from "@/hooks/use-bookings";
import { Users, Ship, Calendar, TrendingUp, DollarSign, PieChart as PieChartIcon } from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format, parseISO, subDays, startOfDay } from 'date-fns';

export default function Dashboard() {
  const { data: trips } = useTrips();
  const { data: bookings } = useAdminBookings();

  const totalBookings = bookings?.length || 0;
  const activeTrips = trips?.filter(t => t.isActive).length || 0;
  const totalRevenue = bookings?.reduce((acc, b) => acc + (b.totalPrice || 0), 0) || 0;
  const pendingPayments = bookings?.filter(b => b.paymentStatus === 'pending').length || 0;

  // Revenue Data for Chart (Last 7 days)
  const revenueData = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, 'MMM dd');
    const dayBookings = bookings?.filter(b => {
      const bDate = new Date(b.createdAt || '');
      return bDate.toDateString() === date.toDateString();
    }) || [];
    const revenue = dayBookings.reduce((acc, b) => acc + (b.totalPrice || 0), 0);
    return { name: dateStr, revenue };
  });

  // Booking Status Data for Pie Chart
  const statusData = [
    { name: 'Confirmed', value: bookings?.filter(b => b.bookingStatus === 'confirmed').length || 0, color: '#10b981' },
    { name: 'Cancelled', value: bookings?.filter(b => b.bookingStatus === 'cancelled').length || 0, color: '#ef4444' },
  ];

  const stats = [
    { label: "Total Bookings", value: totalBookings, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Revenue", value: `MVR ${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
    { label: "Pending Payments", value: pendingPayments, icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Active Routes", value: activeTrips, icon: Ship, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <AdminLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
          <p className="text-slate-500">Analytics and recent activity for YoosuSpeed.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-slate-200 text-sm font-medium text-slate-600">
          <Calendar className="h-4 w-4" />
          {format(new Date(), 'PPP')}
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
            <div className="flex justify-between items-start mb-4">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Stats</span>
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8 mb-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">Revenue Trends</h2>
            <select className="text-xs font-bold text-slate-500 bg-slate-50 border-none rounded-lg p-1">
              <option>Last 7 Days</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="revenue" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Booking Status Pie */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Booking Summary</h2>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-4">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-medium text-slate-600">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
          <button className="text-sm font-bold text-primary hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="p-4 font-semibold">Ticket</th>
                <th className="p-4 font-semibold">Customer</th>
                <th className="p-4 font-semibold">Route</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings?.slice(0, 5).map((booking) => {
                const trip = trips?.find(t => t.id === booking.tripId);
                return (
                  <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-mono font-medium text-primary">{booking.ticketCode}</td>
                    <td className="p-4">
                      <div className="font-medium text-slate-900">{booking.customerName}</div>
                      <div className="text-xs text-slate-500">{booking.customerPhone}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-700">{trip ? `${trip.routeFrom} → ${trip.routeTo}` : `Trip ID: ${booking.tripId}`}</div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                        booking.bookingStatus === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {booking.bookingStatus}
                      </span>
                    </td>
                    <td className="p-4 text-right text-slate-500 font-medium">
                      {new Date(booking.createdAt || '').toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
              {!bookings?.length && (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400 italic">No recent bookings found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
