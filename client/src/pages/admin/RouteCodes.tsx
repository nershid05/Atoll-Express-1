import { AdminLayout } from "@/components/AdminLayout";
import { useRouteCodes, useCreateRouteCode, useDeleteRouteCode, useUpdateRouteCode } from "@/hooks/use-route-codes";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Edit2, X } from "lucide-react";
import { type RouteCode } from "@shared/schema";

const routeCodeSchema = z.object({
  code: z.string().min(1, "Code required").max(20, "Code must be 20 characters or less"),
  name: z.string().min(1, "Name required"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

type RouteCodeFormValues = z.infer<typeof routeCodeSchema>;

export default function AdminRouteCodes() {
  const { data: routeCodes, isLoading } = useRouteCodes();
  const { mutateAsync: createRouteCode } = useCreateRouteCode();
  const { mutateAsync: updateRouteCode } = useUpdateRouteCode();
  const { mutateAsync: deleteRouteCode } = useDeleteRouteCode();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<RouteCode | null>(null);

  const form = useForm<RouteCodeFormValues>({
    resolver: zodResolver(routeCodeSchema),
    defaultValues: { isActive: true, description: "" }
  });

  const openCreate = () => {
    setEditingCode(null);
    form.reset({ isActive: true, description: "", code: "", name: "" });
    setIsModalOpen(true);
  };

  const openEdit = (code: RouteCode) => {
    setEditingCode(code);
    form.reset({
      code: code.code,
      name: code.name,
      description: code.description || "",
      isActive: code.isActive ?? true
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: RouteCodeFormValues) => {
    if (editingCode) {
      await updateRouteCode({ id: editingCode.id, data });
    } else {
      await createRouteCode(data);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this route code? All associated routes will remain but lose their route code assignment.")) {
      await deleteRouteCode(id);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-8 text-center">Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Route Codes</h1>
          <p className="text-slate-500">Create and manage route codes to group multiple routes.</p>
        </div>
        <button 
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Route Code
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 font-semibold text-slate-700">Code</th>
              <th className="p-4 font-semibold text-slate-700">Name</th>
              <th className="p-4 font-semibold text-slate-700">Description</th>
              <th className="p-4 font-semibold text-slate-700">Status</th>
              <th className="p-4 font-semibold text-slate-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {routeCodes?.map((rc) => (
              <tr key={rc.id} className="hover:bg-slate-50/50">
                <td className="p-4">
                  <div className="text-sm font-mono font-medium text-slate-900">{rc.code}</div>
                </td>
                <td className="p-4">
                  <div className="font-medium text-slate-900">{rc.name}</div>
                </td>
                <td className="p-4 text-sm text-slate-600">{rc.description || "-"}</td>
                <td className="p-4">
                  <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                    rc.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                  }`}>
                    {rc.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openEdit(rc)} className="p-2 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(rc.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!routeCodes?.length && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">No route codes found. Add one to get started.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold">{editingCode ? 'Edit Route Code' : 'Create New Route Code'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Code *</label>
                <input 
                  {...form.register("code")} 
                  type="text" 
                  placeholder="e.g., BAA-ATOLL" 
                  className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" 
                />
                {form.formState.errors.code && (
                  <p className="text-xs text-red-600">{form.formState.errors.code.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Name *</label>
                <input 
                  {...form.register("name")} 
                  type="text" 
                  placeholder="e.g., Baa Atoll Routes" 
                  className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" 
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-red-600">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea 
                  {...form.register("description")} 
                  placeholder="Optional description for this route code"
                  rows={3}
                  className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none" 
                />
              </div>

              <div className="flex items-center gap-2">
                <input 
                  {...form.register("isActive")} 
                  type="checkbox" 
                  id="isActive" 
                  className="h-4 w-4 rounded border-gray-300" 
                />
                <label htmlFor="isActive" className="text-sm">Active (Available for use)</label>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">Save Route Code</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
