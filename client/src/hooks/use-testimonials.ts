import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertTestimonial } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Public List
export function useTestimonials() {
  return useQuery({
    queryKey: [api.testimonials.listPublic.path],
    queryFn: async () => {
      const res = await fetch(api.testimonials.listPublic.path);
      if (!res.ok) throw new Error("Failed to fetch testimonials");
      return api.testimonials.listPublic.responses[200].parse(await res.json());
    },
  });
}

// Admin List All
export function useAdminTestimonials() {
  return useQuery({
    queryKey: [api.testimonials.listAll.path],
    queryFn: async () => {
      const res = await fetch(api.testimonials.listAll.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch admin testimonials");
      return api.testimonials.listAll.responses[200].parse(await res.json());
    },
  });
}

// Create
export function useCreateTestimonial() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertTestimonial) => {
      const res = await fetch(api.testimonials.create.path, {
        method: api.testimonials.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to submit testimonial");
      return api.testimonials.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      toast({ title: "Received!", description: "Thank you for your feedback. It will be posted after review." });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not submit review. Try again.", variant: "destructive" });
    },
  });
}

// Approve
export function useApproveTestimonial() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, approved }: { id: number, approved: boolean }) => {
      const url = buildUrl(api.testimonials.approve.path, { id });
      const res = await fetch(url, {
        method: api.testimonials.approve.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update status");
      return api.testimonials.approve.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.testimonials.listAll.path] });
      queryClient.invalidateQueries({ queryKey: [api.testimonials.listPublic.path] });
      toast({ title: "Success", description: "Testimonial status updated" });
    },
  });
}
