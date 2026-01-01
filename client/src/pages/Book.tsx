import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useTrips } from "@/hooks/use-trips";
import { useCreateBooking } from "@/hooks/use-bookings";
import { useLocation, useSearch } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Loader2, MapPin, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

// Schema for the form
const bookingFormSchema = z.object({
  tripId: z.coerce.number().min(1, "Please select a trip"),
  customerName: z.string().min(2, "Name is required"),
  customerEmail: z.string().email("Invalid email"),
  customerPhone: z.string().min(7, "Valid phone number required"),
  ticketQuantity: z.coerce.number().min(1, "At least 1 ticket").max(10, "Max 10 tickets"),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

export default function Book() {
  const [location, setLocation] = useLocation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const preSelectedTripId = searchParams.get("tripId");

  const { data: trips, isLoading: isLoadingTrips } = useTrips();
  const { mutateAsync: createBooking, isPending: isSubmitting } = useCreateBooking();
  
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      tripId: preSelectedTripId ? Number(preSelectedTripId) : undefined,
      ticketQuantity: 1,
    }
  });

  const selectedTripId = form.watch("tripId");
  const selectedTrip = trips?.find(t => t.id === selectedTripId);

  const onSubmit = async (data: BookingFormValues) => {
    try {
      const result = await createBooking({
        ...data,
        totalPrice: 0, // Backend calculates
        bookingStatus: "confirmed",
        paymentStatus: "pending"
      });
      // Redirect to ticket view
      setLocation(`/ticket/${result.id}`);
    } catch (error) {
      console.error("Booking failed", error);
    }
  };

  if (isLoadingTrips) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navigation />
      
      <main className="flex-1 container px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-display font-bold mb-2">Book Your Trip</h1>
            <p className="text-muted-foreground">Secure your seat now. Pay when you board.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Booking Form */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Trip Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Select Trip</label>
                    <select 
                      {...form.register("tripId")}
                      className="w-full p-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      <option value="">-- Select a route --</option>
                      {trips?.filter(t => t.isActive).map(trip => (
                        <option key={trip.id} value={trip.id}>
                          {trip.routeFrom} → {trip.routeTo} ({trip.departureTime})
                        </option>
                      ))}
                    </select>
                    {form.formState.errors.tripId && (
                      <p className="text-sm text-destructive">{form.formState.errors.tripId.message}</p>
                    )}
                  </div>

                  {/* Personal Details */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-900 border-b pb-2">Passenger Details</h3>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Full Name</label>
                      <input 
                        {...form.register("customerName")}
                        placeholder="Ahmed Ali"
                        className="w-full p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                      {form.formState.errors.customerName && (
                        <p className="text-sm text-destructive">{form.formState.errors.customerName.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Email Address</label>
                        <input 
                          {...form.register("customerEmail")}
                          type="email"
                          placeholder="ahmed@example.com"
                          className="w-full p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                        {form.formState.errors.customerEmail && (
                          <p className="text-sm text-destructive">{form.formState.errors.customerEmail.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Phone Number</label>
                        <input 
                          {...form.register("customerPhone")}
                          type="tel"
                          placeholder="+960 777-1234"
                          className="w-full p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                        {form.formState.errors.customerPhone && (
                          <p className="text-sm text-destructive">{form.formState.errors.customerPhone.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Seats */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Number of Seats</label>
                    <select 
                      {...form.register("ticketQuantity")}
                      className="w-full p-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                        <option key={n} value={n}>{n} Seat{n > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-primary text-white rounded-xl font-bold text-lg shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      "Confirm Booking"
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Summary Card */}
            <div className="md:col-span-1">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 sticky top-24">
                <h3 className="font-display font-bold text-lg mb-4 text-slate-900">Trip Summary</h3>
                
                {selectedTrip ? (
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2 p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        {selectedTrip.routeFrom}
                      </div>
                      <div className="h-4 border-l-2 border-dashed border-slate-300 ml-[5px]" />
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <div className="h-2 w-2 rounded-full bg-secondary" />
                        {selectedTrip.routeTo}
                      </div>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-dashed">
                      <span className="text-sm text-muted-foreground">Departure</span>
                      <span className="font-mono font-medium">{selectedTrip.departureTime}</span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-dashed">
                      <span className="text-sm text-muted-foreground">Price per seat</span>
                      <span className="font-medium">MVR {selectedTrip.price}</span>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <span className="font-bold text-slate-900">Total</span>
                      <span className="font-bold text-xl text-primary">
                        MVR {selectedTrip.price * form.watch("ticketQuantity")}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    Select a trip to view details
                  </div>
                )}
                
                <div className="mt-6 p-4 bg-yellow-50 text-yellow-800 text-xs rounded-lg border border-yellow-100">
                  <p className="font-semibold mb-1">Payment on Delivery</p>
                  You will receive an e-ticket. Please present it when boarding and pay cash or transfer.
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
