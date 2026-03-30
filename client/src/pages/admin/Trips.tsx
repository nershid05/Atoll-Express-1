import { AdminLayout } from "@/components/AdminLayout";
import { useTrips, useCreateTrip, useDeleteTrip, useUpdateTrip } from "@/hooks/use-trips";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Edit2, X, Ship, Settings2 } from "lucide-react";
import { type Trip, type Route } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Route Management Schema
const routeSchema = z.object({
  boatName: z.string().min(1, "Boat name required"),
  capacity: z.coerce.number().min(1, "Capacity required"),
});

type RouteFormValues = z.infer<typeof routeSchema>;

// Simple Schema matches InsertTrip but ensuring proper types
const tripSchema = z.object({
  routeName: z.string().min(1, "Route name required"),
  routeFrom: z.string().min(1, "Origin required"),
  routeTo: z.string().min(1, "Destination required"),
  departureDate: z.string().min(1, "Date required"),
  departureTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "HH:MM format"),
  arrivalTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "HH:MM format"),
  price: z.coerce.number().min(1),
  onlineSeats: z.union([z.coerce.number().min(1, "Must be at least 1"), z.literal(""), z.null()]).optional().transform(v => (v === "" || v == null) ? null : Number(v)),
  isActive: z.boolean().default(true),
});

type TripFormValues = z.infer<typeof tripSchema>;

const boatNames = [
  "Yoosuf Rasgefaanu",
  "Yoosuf Emporer",
  "Yoosuf Explorer",
  "Yoosuf Empower",
  "Yoosuf Empire"
];

const islands = ["Kudarikilu", "Kendhoo", "Maalhos", "Eydhafushi"];

export default function AdminTrips() {
  const { data: trips, isLoading: tripsLoading } = useTrips();
  const { data: routes, isLoading: routesLoading } = useQuery<Route[]>({ queryKey: ["/api/routes"] });
  const { mutateAsync: createTrip } = useCreateTrip();
  const { mutateAsync: updateTrip } = useUpdateTrip();
  const { mutateAsync: deleteTrip } = useDeleteTrip();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);

  const form = useForm<TripFormValues>({
    resolver: zodResolver(tripSchema),
    defaultValues: { 
      isActive: true,
      price: 500
    }
  });

  const routeForm = useForm<RouteFormValues>({
    resolver: zodResolver(routeSchema),
  });

  const updateRouteMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: RouteFormValues }) => {
      const res = await apiRequest("PATCH", `/api/routes/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/routes"] });
      toast({ title: "Route updated successfully" });
      setIsRouteModalOpen(false);
    }
  });

  const openCreate = () => {
    setEditingTrip(null);
    form.reset({ isActive: true, price: 500 });
    setIsModalOpen(true);
  };

  const openEdit = (trip: Trip) => {
    setEditingTrip(trip);
    form.reset({
      ...trip,
      onlineSeats: trip.onlineSeats ?? undefined,
      isActive: trip.isActive ?? true
    });
    setIsModalOpen(true);
  };

  const openRouteEdit = (route: Route) => {
    setEditingRoute(route);
    routeForm.reset({
      boatName: route.boatName,
      capacity: route.capacity,
    });
    setIsRouteModalOpen(true);
  };

  const onSubmit = async (data: TripFormValues) => {
    if (editingTrip) {
      await updateTrip({ id: editingTrip.id, ...data });
    } else {
      await createTrip({ ...data });
    }
    setIsModalOpen(false);
  };

  const onRouteSubmit = async (data: RouteFormValues) => {
    if (editingRoute) {
      await updateRouteMutation.mutateAsync({ id: editingRoute.id, data });
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this trip?")) {
      await deleteTrip(id);
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Schedule</h1>
          <p className="text-slate-500">Configure routes, boats and trips.</p>
        </div>
        <button 
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Trip
        </button>
      </div>

      {/* Routes Configuration Section */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-primary" />
          Route Configurations
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {routes?.map((route) => (
            <div key={route.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-900">{route.name}</p>
                <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Ship className="h-3.5 w-3.5" /> {route.boatName}
                  </span>
                  <span>•</span>
                  <span>{route.capacity} seats</span>
                </div>
              </div>
              <button 
                onClick={() => openRouteEdit(route)}
                className="p-2 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-semibold text-slate-700">Date</th>
                <th className="p-4 font-semibold text-slate-700">Route</th>
                <th className="p-4 font-semibold text-slate-700">Time</th>
                <th className="p-4 font-semibold text-slate-700">Boat (Route Level)</th>
                <th className="p-4 font-semibold text-slate-700">Price</th>
                <th className="p-4 font-semibold text-slate-700">Status</th>
                <th className="p-4 font-semibold text-slate-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {trips?.map((trip) => {
                const route = routes?.find(r => r.name === trip.routeName);
                return (
                  <tr key={trip.id} className="hover:bg-slate-50/50">
                    <td className="p-4">
                      <div className="text-sm font-medium text-slate-600">{trip.departureDate}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-900">{trip.routeFrom} → {trip.routeTo}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">{trip.routeName}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-mono">{trip.departureTime} - {trip.arrivalTime}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-slate-600 font-medium">{route?.boatName || "Not set"}</div>
                      <div className="text-xs text-slate-400">{route?.capacity || 0} seats total</div>
                      {trip.onlineSeats != null && (
                        <div className="text-xs text-primary font-semibold">{trip.onlineSeats} online</div>
                      )}
                    </td>
                    <td className="p-4 text-sm font-medium">MVR {trip.price}</td>
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                        trip.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                      }`}>
                        {trip.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(trip)} className="p-2 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(trip.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Route Edit Modal */}
      {isRouteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold">Configure Route: {editingRoute?.name}</h2>
              <button onClick={() => setIsRouteModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={routeForm.handleSubmit(onRouteSubmit)} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Boat Name</label>
                <select 
                  {...routeForm.register("boatName")} 
                  className="w-full p-2 border rounded-md bg-white"
                >
                  <option value="">Select a boat</option>
                  {boatNames.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                {routeForm.formState.errors.boatName && <p className="text-xs text-destructive">{routeForm.formState.errors.boatName.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Total Boat Capacity (Seats)</label>
                <input {...routeForm.register("capacity")} type="number" className="w-full p-2 border rounded-md" placeholder="e.g. 65" />
                {routeForm.formState.errors.capacity && <p className="text-xs text-destructive">{routeForm.formState.errors.capacity.message}</p>}
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsRouteModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={updateRouteMutation.isPending} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                  {updateRouteMutation.isPending ? "Saving..." : "Save Route Settings"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Trip Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold">{editingTrip ? 'Edit Trip' : 'Create New Trip'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Route (Select from Configured)</label>
                <select {...form.register("routeName")} className="w-full p-2 border rounded-md bg-white">
                  <option value="">Select Route</option>
                  {routes?.map(r => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Departure Date</label>
                <input {...form.register("departureDate")} type="date" className="w-full p-2 border rounded-md" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">From</label>
                  <select {...form.register("routeFrom")} className="w-full p-2 border rounded-md bg-white">
                    <option value="">Select Origin</option>
                    <option value="Male">Male</option>
                    {islands.map(island => (
                      <option key={island} value={island}>{island}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">To</label>
                  <select {...form.register("routeTo")} className="w-full p-2 border rounded-md bg-white">
                    <option value="">Select Destination</option>
                    <option value="Male">Male</option>
                    {islands.map(island => (
                      <option key={island} value={island}>{island}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Departure Time</label>
                  <input {...form.register("departureTime")} type="time" className="w-full p-2 border rounded-md" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Arrival Time</label>
                  <input {...form.register("arrivalTime")} type="time" className="w-full p-2 border rounded-md" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Price (MVR)</label>
                  <input {...form.register("price")} type="number" className="w-full p-2 border rounded-md" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Online Seats</label>
                  <input 
                    {...form.register("onlineSeats")} 
                    type="number" 
                    min="0"
                    placeholder="Leave blank = all seats"
                    className="w-full p-2 border rounded-md" 
                  />
                  {form.watch("routeName") && (
                    <p className="text-[10px] text-slate-400 italic">
                      Total route capacity: {routes?.find(r => r.name === form.watch("routeName"))?.capacity ?? "—"} seats
                    </p>
                  )}
                  {form.formState.errors.onlineSeats && <p className="text-xs text-destructive">{form.formState.errors.onlineSeats.message}</p>}
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
                <strong>Online Seats:</strong> Set how many seats customers can book online. The remaining seats can be assigned by admin directly. Leave blank to allow all route seats online.
              </div>

              <div className="flex items-center gap-2">
                <input {...form.register("isActive")} type="checkbox" id="isActive" className="h-4 w-4 rounded border-gray-300" />
                <label htmlFor="isActive" className="text-sm">Active (Available for booking)</label>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">Save Trip</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
