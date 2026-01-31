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
import { useState, useEffect } from "react";

// Schema for the form
const bookingFormSchema = z.object({
  date: z.string().min(1, "Please select a date"),
  tripId: z.coerce.number().min(1, "Please select a trip"),
  customerName: z.string().min(2, "Name is required"),
  customerEmail: z.string().email("Invalid email"),
  customerPhone: z.string().min(7, "Valid phone number required"),
  ticketQuantity: z.coerce.number().min(1, "At least 1 ticket").max(10, "Max 10 tickets"),
  paymentMethod: z.enum(["cash", "bank_transfer"]).default("cash"),
  paymentSlip: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

const islands = ["Kudarikilu", "Kendhoo", "Maalhos", "Eydhafushi"];

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
      date: new Date().toISOString().split('T')[0],
      tripId: preSelectedTripId ? Number(preSelectedTripId) : undefined,
      ticketQuantity: 1,
      paymentMethod: "cash",
    }
  });

  const selectedDate = form.watch("date");
  const selectedTripId = Number(form.watch("tripId"));
  const paymentMethod = form.watch("paymentMethod");
  const routeFrom = form.watch("routeFrom" as any);
  const routeTo = form.watch("routeTo" as any);
  
  const filteredTrips = trips?.filter(t => {
    if (!t.isActive || t.departureDate !== selectedDate) return false;
    
    // Multi-stop transit logic
    const stops = ["Kudarikilu", "Kendhoo", "Maalhos", "Eydhafushi", "Male"];
    const reverseStops = [...stops].reverse();
    
    const isMainRoute = stops.includes(t.routeFrom) && stops.includes(t.routeTo);
    const isReverseRoute = reverseStops.includes(t.routeFrom) && reverseStops.includes(t.routeTo);

    if (routeFrom && routeTo) {
      // If user selected specific from/to, check if this trip covers that segment
      // For now, we assume a trip from Kudarikilu to Male covers all intermediate stops
      // In a real system, we'd check the sequence. 
      // Simplified: if trip is Kudarikilu -> Male, any sub-segment is valid.
      const tripStops = t.routeFrom === "Kudarikilu" ? stops : reverseStops;
      const fromIdx = tripStops.indexOf(routeFrom);
      const toIdx = tripStops.indexOf(routeTo);
      
      const tripFromIdx = tripStops.indexOf(t.routeFrom);
      const tripToIdx = tripStops.indexOf(t.routeTo);

      if (fromIdx === -1 || toIdx === -1 || fromIdx >= toIdx) return false;
      if (fromIdx < tripFromIdx || toIdx > tripToIdx) return false;
    } else if (routeFrom) {
      if (t.routeFrom !== routeFrom && !stops.includes(t.routeFrom)) return false;
    }
    
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Prevent past dates entirely if someone tries to hack the input
    if (selectedDate < today) return false;
    
    // Filter out past trips for today
    if (selectedDate === today) {
      const [hours, minutes] = t.departureTime.split(':').map(Number);
      const tripTime = new Date();
      tripTime.setHours(hours, minutes, 0, 0);
      return tripTime > now;
    }
    
    // LIVE AVAILABILITY CHECK
    // Check if the trip is already full
    // In a real app, this would be a separate API call or join, 
    // but we'll use the bookings list to count.
    // However, the 'trips' object doesn't have booking counts here.
    // We'll rely on the backend validation during submission, 
    // but for UI, we can assume if it's visible, it has space or show 'Full'
    
    return true;
  }) || [];
  const selectedTrip = trips?.find(t => t.id === selectedTripId);

  // Reset trip selection if date changes and current trip is not available
  useEffect(() => {
    if (selectedTripId && !filteredTrips.some(t => t.id === selectedTripId)) {
      form.setValue("tripId", 0);
    }
  }, [selectedDate, filteredTrips, selectedTripId, form]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue("paymentSlip", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: BookingFormValues) => {
    try {
      const { paymentSlip, ...rest } = data;
      const result = await createBooking({
        ...rest,
        paymentSlipUrl: paymentSlip,
        bookingStatus: "confirmed",
        paymentStatus: paymentMethod === "cash" ? "pending" : "pending"
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
                  {/* Route Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">From</label>
                      <select 
                        {...form.register("routeFrom" as any)}
                        className="w-full p-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      >
                        <option value="">Any Island</option>
                        <option value="Male">Male</option>
                        {islands.map(island => (
                          <option key={island} value={island}>{island}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">To</label>
                      <select 
                        {...form.register("routeTo" as any)}
                        className="w-full p-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      >
                        <option value="">Any Island</option>
                        <option value="Male">Male</option>
                        {islands.map(island => (
                          <option key={island} value={island}>{island}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Date Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Select Date</label>
                    <input 
                      type="date"
                      {...form.register("date")}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full p-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                    {form.formState.errors.date && (
                      <p className="text-sm text-destructive">{form.formState.errors.date.message}</p>
                    )}
                  </div>

                  {/* Trip Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Select Trip</label>
                    <select 
                      {...form.register("tripId")}
                      className="w-full p-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      {filteredTrips.length > 0 ? (
                        <>
                          <option value="0">-- Select a route --</option>
                          {filteredTrips.map(trip => (
                            <option key={trip.id} value={trip.id.toString()}>
                              {trip.routeFrom} → {trip.routeTo} ({trip.departureTime})
                            </option>
                          ))}
                        </>
                      ) : (
                        <option value="0">
                          {selectedDate === new Date().toISOString().split('T')[0] 
                            ? "Planned trips for today ended" 
                            : "No trips available for this date"}
                        </option>
                      )}
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

                  {/* Payment Method */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-semibold text-slate-900">Payment Method</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <label className={cn(
                        "flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all",
                        paymentMethod === "cash" ? "border-primary bg-primary/5" : "border-slate-100 hover:border-slate-200"
                      )}>
                        <input {...form.register("paymentMethod")} type="radio" value="cash" className="sr-only" />
                        <span className="font-bold text-sm">Cash on Board</span>
                        <span className="text-xs text-muted-foreground">Pay when boarding</span>
                      </label>
                      <label className={cn(
                        "flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all",
                        paymentMethod === "bank_transfer" ? "border-primary bg-primary/5" : "border-slate-100 hover:border-slate-200"
                      )}>
                        <input {...form.register("paymentMethod")} type="radio" value="bank_transfer" className="sr-only" />
                        <span className="font-bold text-sm">Bank Transfer</span>
                        <span className="text-xs text-muted-foreground">Transfer & Upload slip</span>
                      </label>
                    </div>

                    {paymentMethod === "bank_transfer" && (
                      <div className="space-y-4 p-4 rounded-xl bg-slate-50 border border-slate-200 animate-in fade-in duration-300">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-xs font-bold uppercase text-slate-500">Bank of Maldives (BML)</p>
                            <p className="text-sm font-mono font-bold">7730000123456</p>
                            <p className="text-[10px] text-slate-400 italic">Account Name: Yoosufspeed</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-bold uppercase text-slate-500">MIB</p>
                            <p className="text-sm font-mono font-bold">9010111222333</p>
                            <p className="text-[10px] text-slate-400 italic">Account Name: Yoosufspeed</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Upload Payment Slip</label>
                          <input 
                            type="file" 
                            accept="image/*,.pdf" 
                            onChange={handleFileUpload}
                            className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                          />
                          {!form.watch("paymentSlip") && (
                            <p className="text-[10px] text-destructive italic">Required for bank transfer</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmitting || (paymentMethod === "bank_transfer" && !form.watch("paymentSlip"))}
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
                      <span className="text-sm text-muted-foreground">Date</span>
                      <span className="font-medium">{selectedTrip.departureDate}</span>
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
