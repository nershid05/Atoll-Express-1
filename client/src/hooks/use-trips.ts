import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertTrip } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useTrips() {
  return useQuery({
    queryKey: [api.trips.list.path],
    queryFn: async () => {
      const res = await fetch(api.trips.list.path);
      if (!res.ok) throw new Error("Failed to fetch trips");
      return api.trips.list.responses[200].parse(await res.json());
    },
  });
}

export function useTrip(id: number) {
  return useQuery({
    queryKey: [api.trips.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.trips.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch trip");
      return api.trips.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertTrip) => {
      // Validate with schema first if possible, but backend does it too
      const validated = api.trips.create.input.parse(data);
      const res = await fetch(api.trips.create.path, {
        method: api.trips.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized");
        const error = await res.json();
        throw new Error(error.message || "Failed to create trip");
      }
      return api.trips.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.trips.list.path] });
      toast({ title: "Success", description: "Trip created successfully" });
    },
    onError: (err) => {
      toast({ 
        title: "Error", 
        description: err.message, 
        variant: "destructive" 
      });
    },
  });
}

export function useUpdateTrip() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertTrip>) => {
      const validated = api.trips.update.input.parse(updates);
      const url = buildUrl(api.trips.update.path, { id });
      
      const res = await fetch(url, {
        method: api.trips.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to update trip");
      return api.trips.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.trips.list.path] });
      toast({ title: "Success", description: "Trip updated successfully" });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useDeleteTrip() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.trips.delete.path, { id });
      const res = await fetch(url, { 
        method: api.trips.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete trip");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.trips.list.path] });
      toast({ title: "Success", description: "Trip deleted successfully" });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}
