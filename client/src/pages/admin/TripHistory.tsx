import { AdminLayout } from "@/components/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { Download, Clock, ArrowRight, ChevronDown, ChevronUp, Ship } from "lucide-react";
import { useState } from "react";
import { type Route } from "@shared/schema";

type TripWithStats = {
  id: number;
  routeName: string;
  routeFrom: string;
  routeTo: string;
  departureDate: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  onlineSeats?: number | null;
  isActive?: boolean;
  stats: {
    totalBookings: number;
    passengers: number;
    revenue: number;
    paidCount: number;
    pendingCount: number;
  };
};

export default function TripHistory() {
  const { data: history, isLoading } = useQuery<TripWithStats[]>({
    queryKey: ["/api/admin/trips/history"],
  });
  const { data: routes } = useQuery<Route[]>({ queryKey: ["/api/routes"] });
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const filtered = history?.filter(t =>
    t.routeFrom.toLowerCase().includes(search.toLowerCase()) ||
    t.routeTo.toLowerCase().includes(search.toLowerCase()) ||
    t.routeName.toLowerCase().includes(search.toLowerCase()) ||
    t.departureDate.includes(search)
  );

  const totalRevenue = history?.reduce((s, t) => s + t.stats.revenue, 0) ?? 0;
  const totalPassengers = history?.reduce((s, t) => s + t.stats.passengers, 0) ?? 0;
  const totalTrips = history?.length ?? 0;

  const handleExport = async (tripId: number, date: string) => {
    const res = await fetch(`/api/admin/trips/${tripId}/export`, { credentials: "include" });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trip-${tripId}-${date}-manifest.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAll = async () => {
    if (!filtered) return;
    const rows: string[][] = [
      ["Trip ID", "Date", "Route", "From", "To", "Departure", "Arrival", "Price (MVR)", "Online Seats", "Bookings", "Passengers", "Revenue (MVR)", "Paid", "Pending"]
    ];
    for (const t of filtered) {
      rows.push([
        String(t.id), t.departureDate, t.routeName, t.routeFrom, t.routeTo,
        t.departureTime, t.arrivalTime, String(t.price),
        t.onlineSeats != null ? String(t.onlineSeats) : "All",
        String(t.stats.totalBookings), String(t.stats.passengers),
        String(t.stats.revenue), String(t.stats.paidCount), String(t.stats.pendingCount)
      ]);
    }
    const csv = rows.map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trip-history-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Trip History</h1>
          <p className="text-slate-500">Log of all completed trips with passenger and revenue data.</p>
        </div>
        <button
          onClick={handleExportAll}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-semibold"
        >
          <Download className="h-4 w-4" /> Export All (CSV)
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-1">
          <div className="text-xs font-bold uppercase text-slate-400">Total Trips</div>
          <div className="text-3xl font-bold text-slate-900">{totalTrips}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-1">
          <div className="text-xs font-bold uppercase text-slate-400">Total Passengers</div>
          <div className="text-3xl font-bold text-slate-900">{totalPassengers}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-1">
          <div className="text-xs font-bold uppercase text-slate-400">Total Revenue</div>
          <div className="text-3xl font-bold text-primary">MVR {totalRevenue.toLocaleString()}</div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          placeholder="Search by route, location, or date..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-sm px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Trip List */}
      <div className="space-y-3">
        {isLoading && (
          <div className="bg-white rounded-xl border p-12 text-center text-slate-400">Loading trip history...</div>
        )}
        {!isLoading && filtered?.length === 0 && (
          <div className="bg-white rounded-xl border p-12 text-center text-slate-400">No completed trips found.</div>
        )}
        {filtered?.map(trip => {
          const route = routes?.find(r => r.name === trip.routeName);
          const isExpanded = expandedId === trip.id;
          return (
            <div key={trip.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div
                className="flex flex-col md:flex-row md:items-center justify-between p-4 gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : trip.id)}
              >
                {/* Trip info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-1">
                    <Clock className="h-3.5 w-3.5" />
                    {trip.departureDate} • {trip.departureTime} – {trip.arrivalTime}
                  </div>
                  <div className="flex items-center gap-2 font-bold text-slate-800 text-lg">
                    <span>{trip.routeFrom}</span>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                    <span>{trip.routeTo}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <Ship className="h-3.5 w-3.5" />
                    {route?.boatName || "—"}
                    <span className="text-slate-300">•</span>
                    <span>{trip.routeName}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-6 flex-shrink-0">
                  <div className="text-center">
                    <div className="text-xs font-bold uppercase text-slate-400">Passengers</div>
                    <div className="text-xl font-bold text-slate-900">{trip.stats.passengers}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-bold uppercase text-slate-400">Bookings</div>
                    <div className="text-xl font-bold text-slate-900">{trip.stats.totalBookings}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-bold uppercase text-slate-400">Revenue</div>
                    <div className="text-xl font-bold text-primary">MVR {trip.stats.revenue.toLocaleString()}</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={e => { e.stopPropagation(); handleExport(trip.id, trip.departureDate); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" /> Export
                  </button>
                  <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Expanded Detail */}
              {isExpanded && (
                <div className="border-t border-slate-100 p-4 bg-slate-50/50">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white rounded-lg border border-slate-100 p-3 text-center">
                      <div className="text-xs font-bold text-slate-400 uppercase mb-1">Price/Seat</div>
                      <div className="font-bold text-slate-800">MVR {trip.price}</div>
                    </div>
                    <div className="bg-white rounded-lg border border-slate-100 p-3 text-center">
                      <div className="text-xs font-bold text-slate-400 uppercase mb-1">Online Seats</div>
                      <div className="font-bold text-slate-800">{trip.onlineSeats ?? "All"}</div>
                    </div>
                    <div className="bg-green-50 rounded-lg border border-green-100 p-3 text-center">
                      <div className="text-xs font-bold text-green-600 uppercase mb-1">Paid</div>
                      <div className="font-bold text-green-700">{trip.stats.paidCount} bookings</div>
                    </div>
                    <div className="bg-amber-50 rounded-lg border border-amber-100 p-3 text-center">
                      <div className="text-xs font-bold text-amber-600 uppercase mb-1">Pending Payment</div>
                      <div className="font-bold text-amber-700">{trip.stats.pendingCount} bookings</div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-3 italic">Click "Export" to download the full passenger manifest for this trip as a CSV file.</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
}
