import { AdminLayout } from "@/components/AdminLayout";
import { useTrips, useCreateTrip, useDeleteTrip, useUpdateTrip } from "@/hooks/use-trips";
import { useRouteCodes } from "@/hooks/use-route-codes";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Edit2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"; // Assuming shadcn-like structure, if not I'll build minimal modal
import { type Trip } from "@shared/schema";

// Simple Schema matches InsertTrip but ensuring proper types
const tripSchema = z.object({
  routeCodeId: z.number().optional().nullable(),
  routeFrom: z.string().min(1, "Origin required"),
  routeTo: z.string().min(1, "Destination required"),
  departureDate: z.string().min(1, "Date required"),
  departureTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "HH:MM format"),
  arrivalTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "HH:MM format"),
  price: z.coerce.number().min(1),
  capacity: z.coerce.number().min(1),
  boatName: z.string().min(1),
  isActive: z.boolean().default(true),
});

type TripFormValues = z.infer<typeof tripSchema>;

const boatNames = [
  "Yoosuf Rasgefaanu",
  "Yoosuf Emperor",
  "Yoosuf Empire",
  "Yoosuf Explorer",
  "Yoosuf Eros",
  "Yoosuf Empower"
];

const islands = ["Kudarikilu", "Kendhoo", "Maalhos", "Eydhafushi"];

export default function AdminTrips() {
  const { data: trips, isLoading } = useTrips();
  const { data: routeCodes } = useRouteCodes();
  const { mutateAsync: createTrip } = useCreateTrip();
  const { mutateAsync: updateTrip } = useUpdateTrip();
  const { mutateAsync: deleteTrip } = useDeleteTrip();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  const form = useForm<TripFormValues>({
    resolver: zodResolver(tripSchema),
    defaultValues: { isActive: true, routeCodeId: null }
  });

  const openCreate = () => {
    setEditingTrip(null);
    form.reset({ isActive: true, routeCodeId: null });
    setIsModalOpen(true);
  };

  const openEdit = (trip: Trip) => {
    setEditingTrip(trip);
    form.reset({
      ...trip,
      isActive: trip.isActive ?? true
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: TripFormValues) => {
    if (editingTrip) {
      await updateTrip({ id: editingTrip.id, ...data });
    } else {
      await createTrip(data);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this trip?")) {
      await deleteTrip(id);
    }
  };

  const getRouteCodeName = (routeCodeId: number | null | undefined) => {
    if (!routeCodeId) return "-";
    const code = routeCodes?.find(rc => rc.id === routeCodeId);
    return code ? `${code.code} (${code.name})` : "-";
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Schedule</h1>
          <p className="text-slate-500">Add or edit ferry trips and routes.</p>
        </div>
        <button 
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Trip
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 font-semibold text-slate-700">Code</th>
              <th className="p-4 font-semibold text-slate-700">Date</th>
              <th className="p-4 font-semibold text-slate-700">Route</th>
              <th className="p-4 font-semibold text-slate-700">Time</th>
              <th className="p-4 font-semibold text-slate-700">Boat</th>
              <th className="p-4 font-semibold text-slate-700">Price</th>
              <th className="p-4 font-semibold text-slate-700">Status</th>
              <th className="p-4 font-semibold text-slate-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {trips?.map((trip) => (
              <tr key={trip.id} className="hover:bg-slate-50/50">
                <td className="p-4 text-sm font-mono text-slate-600">{getRouteCodeName(trip.routeCodeId)}</td>
                <td className="p-4">
                  <div className="text-sm font-medium text-slate-600">{trip.departureDate}</div>
                </td>
                <td className="p-4">
                  <div className="font-medium text-slate-900">{trip.routeFrom} → {trip.routeTo}</div>
                </td>
                <td className="p-4">
                  <div className="text-sm font-mono">{trip.departureTime} - {trip.arrivalTime}</div>
                </td>
                <td className="p-4 text-sm text-slate-600">{trip.boatName} ({trip.capacity} pax)</td>
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
            ))}
            {!trips?.length && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-muted-foreground">No trips found. Add one to get started.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Manual Dialog Implementation if UI component not fully available or for simplicity */}
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
                <label className="text-sm font-medium">Route Code (Optional)</label>
                <select {...form.register("routeCodeId", { setValueAs: (value) => value === "" ? null : Number(value) })} className="w-full p-2 border rounded-md bg-white">
                  <option value="">Select a route code...</option>
                  {routeCodes?.filter(rc => rc.isActive).map(code => (
                    <option key={code.id} value={code.id}>{code.code} - {code.name}</option>
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
                  <label className="text-sm font-medium">Departure</label>
                  <input {...form.register("departureTime")} type="time" className="w-full p-2 border rounded-md" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Arrival</label>
                  <input {...form.register("arrivalTime")} type="time" className="w-full p-2 border rounded-md" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Price (MVR)</label>
                  <input {...form.register("price")} type="number" className="w-full p-2 border rounded-md" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Capacity</label>
                  <input {...form.register("capacity")} type="number" className="w-full p-2 border rounded-md" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Boat Name</label>
                <select 
                  {...form.register("boatName")} 
                  className="w-full p-2 border rounded-md bg-white"
                >
                  <option value="">Select a boat</option>
                  {boatNames.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
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

const boatNames = [
  "Yoosuf Rasgefaanu",
  "Yoosuf Emperor",
  "Yoosuf Empire",
  "Yoosuf Explorer",
  "Yoosuf Eros",
  "Yoosuf Empower"
];

const islands = ["Kendhoo", "Kudarikilu", "Maalhos", "Eydhafushi"];

export default function AdminTrips() {
  const { data: trips, isLoading } = useTrips();
  const { mutateAsync: createTrip } = useCreateTrip();
  const { mutateAsync: updateTrip } = useUpdateTrip();
  const { mutateAsync: deleteTrip } = useDeleteTrip();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  const form = useForm<TripFormValues>({
    resolver: zodResolver(tripSchema),
    defaultValues: { 
      isActive: true,
      capacity: 65,
      price: 500
    }
  });

  const openCreate = () => {
    setEditingTrip(null);
    form.reset({ isActive: true });
    setIsModalOpen(true);
  };

  const openEdit = (trip: Trip) => {
    setEditingTrip(trip);
    form.reset({
      ...trip,
      isActive: trip.isActive ?? true
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: TripFormValues) => {
    if (editingTrip) {
      await updateTrip({ id: editingTrip.id, ...data });
    } else {
      await createTrip(data);
    }
    setIsModalOpen(false);
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
          <p className="text-slate-500">Add or edit ferry trips and routes.</p>
        </div>
        <button 
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Trip
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 font-semibold text-slate-700">Date</th>
              <th className="p-4 font-semibold text-slate-700">Route</th>
              <th className="p-4 font-semibold text-slate-700">Time</th>
              <th className="p-4 font-semibold text-slate-700">Boat</th>
              <th className="p-4 font-semibold text-slate-700">Price</th>
              <th className="p-4 font-semibold text-slate-700">Status</th>
              <th className="p-4 font-semibold text-slate-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {trips?.map((trip) => (
              <tr key={trip.id} className="hover:bg-slate-50/50">
                <td className="p-4">
                  <div className="text-sm font-medium text-slate-600">{trip.departureDate}</div>
                </td>
                <td className="p-4">
                  <div className="font-medium text-slate-900">{trip.routeFrom} → {trip.routeTo}</div>
                </td>
                <td className="p-4">
                  <div className="text-sm font-mono">{trip.departureTime} - {trip.arrivalTime}</div>
                </td>
                <td className="p-4 text-sm text-slate-600">{trip.boatName} ({trip.capacity} pax)</td>
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
            ))}
            {!trips?.length && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-muted-foreground">No trips found. Add one to get started.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Manual Dialog Implementation if UI component not fully available or for simplicity */}
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
                  <label className="text-sm font-medium">Departure</label>
                  <input {...form.register("departureTime")} type="time" className="w-full p-2 border rounded-md" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Arrival</label>
                  <input {...form.register("arrivalTime")} type="time" className="w-full p-2 border rounded-md" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Price (MVR)</label>
                  <input {...form.register("price")} type="number" className="w-full p-2 border rounded-md" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Capacity</label>
                  <input {...form.register("capacity")} type="number" className="w-full p-2 border rounded-md" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Boat Name</label>
                <select 
                  {...form.register("boatName")} 
                  className="w-full p-2 border rounded-md bg-white"
                >
                  <option value="">Select a boat</option>
                  {boatNames.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
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
