import { AdminLayout } from "@/components/AdminLayout";
import { useTrips, useCreateTrip, useDeleteTrip, useUpdateTrip } from "@/hooks/use-trips";
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Edit2, X, Ship, Settings2, FileSpreadsheet, Download, Upload, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { type Trip, type Route } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

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
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [importRows, setImportRows] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importResult, setImportResult] = useState<{ created: number; failed: any[] } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  type ParsedRow = {
    routeName: string; routeFrom: string; routeTo: string;
    departureDate: string; departureTime: string; arrivalTime: string;
    price: number; onlineSeats: number | null; isActive: boolean;
    _valid: boolean; _errors: string[];
  };

  const parseExcelDate = (val: any): string => {
    if (!val) return "";
    if (typeof val === "number") {
      const date = XLSX.SSF.parse_date_code(val);
      if (date) {
        const mm = String(date.m).padStart(2, "0");
        const dd = String(date.d).padStart(2, "0");
        return `${date.y}-${mm}-${dd}`;
      }
    }
    const s = String(val).trim();
    // Try DD/MM/YYYY
    const ddmm = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ddmm) return `${ddmm[3]}-${ddmm[2].padStart(2,"0")}-${ddmm[1].padStart(2,"0")}`;
    return s;
  };

  const parseExcelTime = (val: any): string => {
    if (!val) return "";
    if (typeof val === "number" && val < 1) {
      const totalMinutes = Math.round(val * 24 * 60);
      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;
      return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
    }
    return String(val).trim().substring(0, 5);
  };

  const parseExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array", cellDates: false });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if (json.length < 2) { setImportErrors(["File appears to be empty or has no data rows."]); return; }

        const headers = (json[0] as string[]).map(h => String(h).trim().toLowerCase());
        const colIdx = (name: string) => headers.findIndex(h => h.includes(name));

        const ci = {
          routeName: colIdx("route name"),
          routeFrom: colIdx("from"),
          routeTo: colIdx("to"),
          date: colIdx("date"),
          dep: colIdx("departure"),
          arr: colIdx("arrival"),
          price: colIdx("price"),
          online: colIdx("online"),
          active: colIdx("active"),
        };

        const parsed: ParsedRow[] = [];
        const errors: string[] = [];

        for (let i = 1; i < json.length; i++) {
          const row: any[] = json[i];
          if (!row || row.every(c => c == null || c === "")) continue;

          const rowErrors: string[] = [];
          const routeName = ci.routeName >= 0 ? String(row[ci.routeName] ?? "").trim() : "";
          const routeFrom = ci.routeFrom >= 0 ? String(row[ci.routeFrom] ?? "").trim() : "";
          const routeTo = ci.routeTo >= 0 ? String(row[ci.routeTo] ?? "").trim() : "";
          const departureDate = parseExcelDate(ci.date >= 0 ? row[ci.date] : "");
          const departureTime = parseExcelTime(ci.dep >= 0 ? row[ci.dep] : "");
          const arrivalTime = parseExcelTime(ci.arr >= 0 ? row[ci.arr] : "");
          const price = ci.price >= 0 ? Number(row[ci.price]) : 0;
          const onlineSeats = ci.online >= 0 && row[ci.online] != null && row[ci.online] !== "" ? Number(row[ci.online]) : null;
          const activeRaw = ci.active >= 0 ? String(row[ci.active] ?? "yes").toLowerCase() : "yes";
          const isActive = !["no", "false", "0", "inactive"].includes(activeRaw);

          if (!routeName) rowErrors.push("Route Name missing");
          if (!routeFrom) rowErrors.push("From missing");
          if (!routeTo) rowErrors.push("To missing");
          if (!departureDate || !/^\d{4}-\d{2}-\d{2}$/.test(departureDate)) rowErrors.push(`Invalid date: "${departureDate}"`);
          if (!departureTime || !/^\d{2}:\d{2}$/.test(departureTime)) rowErrors.push(`Invalid departure time: "${departureTime}"`);
          if (!arrivalTime || !/^\d{2}:\d{2}$/.test(arrivalTime)) rowErrors.push(`Invalid arrival time: "${arrivalTime}"`);
          if (!price || isNaN(price) || price <= 0) rowErrors.push("Price must be > 0");

          if (rowErrors.length > 0) errors.push(`Row ${i + 1}: ${rowErrors.join(", ")}`);

          parsed.push({ routeName, routeFrom, routeTo, departureDate, departureTime, arrivalTime, price, onlineSeats, isActive, _valid: rowErrors.length === 0, _errors: rowErrors });
        }

        setImportRows(parsed);
        setImportErrors(errors);
        setImportResult(null);
      } catch (err) {
        setImportErrors([`Failed to parse file: ${err}`]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadTemplate = () => {
    const today = new Date();
    const rows = [
      ["Route Name", "From", "To", "Date", "Departure Time", "Arrival Time", "Price", "Online Seats", "Active"],
    ];
    // Generate 7 sample rows (one per day for a week)
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      rows.push(["Male - Baa Atoll", "Male", "Eydhafushi", dateStr, "07:00", "09:30", "500", "40", "yes"]);
      rows.push(["Baa Atoll - Male", "Eydhafushi", "Male", dateStr, "14:00", "16:30", "500", "40", "yes"]);
    }
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [14,12,12,12,16,12,8,14,8].map(w => ({ wch: w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Schedule");
    XLSX.writeFile(wb, "yoosufspeed-schedule-template.xlsx");
  };

  const bulkImportMutation = useMutation({
    mutationFn: async (rows: ParsedRow[]) => {
      const res = await apiRequest("POST", "/api/admin/trips/bulk", rows.filter(r => r._valid));
      return res.json();
    },
    onSuccess: (data) => {
      setImportResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      toast({ title: `Imported ${data.created} trip${data.created !== 1 ? "s" : ""} successfully!` });
    },
    onError: () => toast({ title: "Import failed", variant: "destructive" })
  });

  const resetImport = () => {
    setImportRows([]);
    setImportErrors([]);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Schedule</h1>
          <p className="text-slate-500">Configure routes, boats and trips.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { resetImport(); setIsImportModalOpen(true); }}
            className="flex items-center gap-2 border border-primary text-primary px-4 py-2 rounded-lg hover:bg-primary/5 transition-colors text-sm font-semibold"
          >
            <FileSpreadsheet className="h-4 w-4" /> Import Excel
          </button>
          <button 
            onClick={openCreate}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm font-semibold"
          >
            <Plus className="h-4 w-4" /> Add Trip
          </button>
        </div>
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

      {/* Excel Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-primary" /> Import Schedule from Excel
                </h2>
                <p className="text-sm text-slate-500 mt-1">Upload a .xlsx or .csv file to bulk-create trips for any period.</p>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-5">
              {/* Template Download */}
              <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-blue-800">Need a template?</p>
                  <p className="text-xs text-blue-600 mt-0.5">Download our pre-filled Excel template with the correct column format and 2 weeks of sample data.</p>
                </div>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold flex-shrink-0 ml-4"
                >
                  <Download className="h-4 w-4" /> Template
                </button>
              </div>

              {/* File Upload Zone */}
              {!importResult && (
                <div
                  className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${isDragOver ? "border-primary bg-primary/5" : "border-slate-200 hover:border-primary/50"}`}
                  onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={e => {
                    e.preventDefault();
                    setIsDragOver(false);
                    const file = e.dataTransfer.files[0];
                    if (file) parseExcelFile(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="font-semibold text-slate-600">Drop your Excel file here, or click to browse</p>
                  <p className="text-xs text-slate-400 mt-1">Supports .xlsx, .xls, .csv</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) parseExcelFile(f); }}
                  />
                </div>
              )}

              {/* Import Result */}
              {importResult && (
                <div className={`p-5 rounded-xl border ${importResult.failed.length === 0 ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle2 className={`h-6 w-6 ${importResult.failed.length === 0 ? "text-green-600" : "text-amber-600"}`} />
                    <h3 className={`font-bold text-lg ${importResult.failed.length === 0 ? "text-green-800" : "text-amber-800"}`}>
                      Import Complete
                    </h3>
                  </div>
                  <p className="text-sm text-slate-700"><strong>{importResult.created}</strong> trip{importResult.created !== 1 ? "s" : ""} created successfully.</p>
                  {importResult.failed.length > 0 && (
                    <p className="text-sm text-red-600 mt-1"><strong>{importResult.failed.length}</strong> row{importResult.failed.length !== 1 ? "s" : ""} failed. Check that all required fields are correct.</p>
                  )}
                  <button onClick={resetImport} className="mt-3 text-sm text-primary font-semibold hover:underline">Import another file</button>
                </div>
              )}

              {/* Validation Errors Summary */}
              {importErrors.length > 0 && !importResult && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm font-bold text-red-700 flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4" /> {importErrors.length} row{importErrors.length !== 1 ? "s have" : " has"} errors — fix in Excel and re-upload, or rows will be skipped.
                  </p>
                  <ul className="text-xs text-red-600 space-y-0.5 max-h-24 overflow-y-auto">
                    {importErrors.map((e, i) => <li key={i}>• {e}</li>)}
                  </ul>
                </div>
              )}

              {/* Preview Table */}
              {importRows.length > 0 && !importResult && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-slate-700">
                      Preview — {importRows.filter(r => r._valid).length} valid / {importRows.filter(r => !r._valid).length} invalid out of {importRows.length} rows
                    </p>
                  </div>
                  <div className="overflow-x-auto border rounded-xl">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          <th className="px-3 py-2">#</th>
                          <th className="px-3 py-2">Route</th>
                          <th className="px-3 py-2">From → To</th>
                          <th className="px-3 py-2">Date</th>
                          <th className="px-3 py-2">Departure</th>
                          <th className="px-3 py-2">Arrival</th>
                          <th className="px-3 py-2">Price</th>
                          <th className="px-3 py-2">Online</th>
                          <th className="px-3 py-2">Active</th>
                          <th className="px-3 py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importRows.map((row, i) => (
                          <tr key={i} className={row._valid ? "bg-white" : "bg-red-50"}>
                            <td className="px-3 py-2 text-slate-400">{i + 2}</td>
                            <td className="px-3 py-2 font-medium">{row.routeName || <span className="text-red-400 italic">missing</span>}</td>
                            <td className="px-3 py-2">{row.routeFrom} → {row.routeTo}</td>
                            <td className="px-3 py-2 font-mono">{row.departureDate}</td>
                            <td className="px-3 py-2 font-mono">{row.departureTime}</td>
                            <td className="px-3 py-2 font-mono">{row.arrivalTime}</td>
                            <td className="px-3 py-2">MVR {row.price}</td>
                            <td className="px-3 py-2">{row.onlineSeats ?? "All"}</td>
                            <td className="px-3 py-2">{row.isActive ? "Yes" : "No"}</td>
                            <td className="px-3 py-2">
                              {row._valid
                                ? <span className="text-green-600 font-bold">✓ Valid</span>
                                : <span className="text-red-500 font-bold" title={row._errors.join(", ")}>✗ {row._errors[0]}</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {importRows.length > 0 && !importResult && (
              <div className="p-6 border-t border-slate-100 flex justify-between items-center flex-shrink-0 bg-white">
                <p className="text-sm text-slate-500">
                  {importRows.filter(r => !r._valid).length > 0 && "Invalid rows will be skipped. "}
                  {importRows.filter(r => r._valid).length} trip{importRows.filter(r => r._valid).length !== 1 ? "s" : ""} will be created.
                </p>
                <div className="flex gap-3">
                  <button onClick={resetImport} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">Clear</button>
                  <button
                    onClick={() => bulkImportMutation.mutate(importRows)}
                    disabled={bulkImportMutation.isPending || importRows.filter(r => r._valid).length === 0}
                    className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {bulkImportMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Importing...</> : <><Upload className="h-4 w-4" /> Import {importRows.filter(r => r._valid).length} Trips</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
