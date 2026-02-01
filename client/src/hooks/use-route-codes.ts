import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertRouteCode } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useRouteCodes() {
  return useQuery({
    queryKey: [api.routeCodes.list.path],
    queryFn: async () => {
      const res = await fetch(api.routeCodes.list.path, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch route codes");
      return api.routeCodes.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateRouteCode() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertRouteCode) => {
      const validated = api.routeCodes.create.input.parse(data);
      const res = await fetch(api.routeCodes.create.path, {
        method: api.routeCodes.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized");
        const error = await res.json();
        throw new Error(error.message || "Failed to create route code");
      }
      return api.routeCodes.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.routeCodes.list.path] });
      toast({
        title: "Success",
        description: "Route code created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateRouteCode() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertRouteCode> }) => {
      const url = buildUrl(api.routeCodes.update.path, { id });
      const validated = api.routeCodes.update.input.parse(data);
      const res = await fetch(url, {
        method: api.routeCodes.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized");
        const error = await res.json();
        throw new Error(error.message || "Failed to update route code");
      }
      return api.routeCodes.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.routeCodes.list.path] });
      toast({
        title: "Success",
        description: "Route code updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteRouteCode() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.routeCodes.delete.path, { id });
      const res = await fetch(url, {
        method: api.routeCodes.delete.method,
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized");
        const error = await res.json();
        throw new Error(error.message || "Failed to delete route code");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.routeCodes.list.path] });
      toast({
        title: "Success",
        description: "Route code deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
