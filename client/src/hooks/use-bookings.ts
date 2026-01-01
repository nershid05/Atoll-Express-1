import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertBooking } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Public Create Booking
export function useCreateBooking() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: InsertBooking) => {
      // Amount is calculated on backend, but schema might require it locally?
      // Schema omitted totalPrice, so we don't send it. 
      // InsertBooking schema handles omitted fields.
      const res = await fetch(api.bookings.create.path, {
        method: api.bookings.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create booking");
      }
      return api.bookings.create.responses[201].parse(await res.json());
    },
    onError: (err) => {
      toast({ title: "Booking Failed", description: err.message, variant: "destructive" });
    },
  });
}

// Public Get Booking (for Ticket View)
export function useBooking(id: number) {
  return useQuery({
    queryKey: [api.bookings.get.path, id],
    queryFn: async () => {
      if (!id) return null;
      const url = buildUrl(api.bookings.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch booking");
      return api.bookings.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

// Admin List Bookings
export function useAdminBookings() {
  return useQuery({
    queryKey: [api.bookings.list.path],
    queryFn: async () => {
      const res = await fetch(api.bookings.list.path, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized");
        throw new Error("Failed to fetch bookings");
      }
      return api.bookings.list.responses[200].parse(await res.json());
    },
  });
}

// Admin Update Status
export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number, bookingStatus?: 'confirmed' | 'cancelled', paymentStatus?: 'pending' | 'paid' }) => {
      const url = buildUrl(api.bookings.updateStatus.path, { id });
      const res = await fetch(url, {
        method: api.bookings.updateStatus.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to update booking status");
      return api.bookings.updateStatus.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.bookings.list.path] });
      // Also invalidate individual booking if viewing ticket
      queryClient.invalidateQueries({ queryKey: [api.bookings.get.path] });
      toast({ title: "Success", description: "Booking status updated" });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}
