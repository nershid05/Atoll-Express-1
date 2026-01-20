import { useBooking } from "@/hooks/use-bookings";
import { useTrip } from "@/hooks/use-trips";
import { useRoute } from "wouter";
import { Loader2, Printer, MapPin, Calendar, CreditCard, Anchor, CheckCircle, Ship } from "lucide-react";
import { Button } from "@/components/ui/button"; // Assuming UI component exists, or use standard
import { format } from "date-fns";
import logoImg from "@assets/67479162_2414021002167097_5524966927945957376_n_1768948773017.jpg";

export default function Ticket() {
  const [, params] = useRoute("/ticket/:id");
  const bookingId = Number(params?.id);
  
  const { data: booking, isLoading: bookingLoading } = useBooking(bookingId);
  // We need to fetch trip details separately based on booking.tripId
  const { data: trip, isLoading: tripLoading } = useTrip(booking?.tripId || 0);

  const isLoading = bookingLoading || tripLoading;

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!booking || !trip) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100">
        <p className="text-lg text-slate-500">Ticket not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-12 px-4 print:bg-white print:p-0">
      <div className="max-w-md mx-auto print:max-w-none print:w-full">
        {/* Ticket Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden print:shadow-none print:border print:border-slate-300">
          {/* Header */}
          <div className="bg-primary p-6 text-white text-center print:bg-white print:text-slate-900 print:border-b">
            <div className="flex justify-center mb-3">
              <img src={logoImg} alt="Yoosufspeed Logo" className="h-12 w-auto brightness-0 invert print:brightness-100 print:invert-0" />
            </div>
            <h1 className="font-display text-2xl font-bold">Yoosufspeed E-Ticket</h1>
            <p className="text-blue-100 text-sm opacity-80 print:text-slate-500">Booking Confirmed</p>
          </div>

          {/* Body */}
          <div className="p-8 space-y-6">
            <div className="text-center">
              <p className="text-sm text-slate-500 mb-1">Ticket Code</p>
              <div className="text-3xl font-mono font-bold text-slate-900 tracking-wider">
                {booking.ticketCode}
              </div>
            </div>

            <div className="border-t border-dashed border-slate-200 my-6" />

            {/* Route Visual */}
            <div className="flex justify-between items-center">
              <div className="text-left">
                <p className="text-xs text-slate-400 font-bold uppercase">From</p>
                <p className="font-bold text-lg text-slate-900">{trip.routeFrom}</p>
              </div>
              <div className="flex-1 flex flex-col items-center px-4">
                <span className="text-xs text-slate-400 font-mono mb-1">{trip.departureTime}</span>
                <div className="w-full h-0.5 bg-slate-200 relative">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary" />
                </div>
                <span className="text-xs text-primary font-bold mt-1">Direct</span>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 font-bold uppercase">To</p>
                <p className="font-bold text-lg text-slate-900">{trip.routeTo}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Passenger</p>
                <p className="font-semibold text-sm truncate">{booking.customerName}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Boat</p>
                <p className="font-semibold text-sm flex items-center gap-1">
                  <Ship className="h-3 w-3 text-primary" /> {trip.boatName}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Seats</p>
                <p className="font-semibold text-sm">{booking.ticketQuantity}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Status</p>
                <p className="font-semibold text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> Confirmed
                </p>
              </div>
            </div>

            <div className="text-center p-4 bg-yellow-50 border border-yellow-100 rounded-xl">
              <p className="text-xs text-yellow-800 font-medium">
                Please arrive 15 minutes before departure. Payment to be made on board.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-50 p-4 border-t border-slate-100 text-center text-xs text-slate-400">
            Booking ID: #{booking.id} • {format(new Date(booking.createdAt || ''), 'PPP')}
          </div>
        </div>

        {/* Action Buttons (Hidden in Print) */}
        <div className="mt-8 flex justify-center gap-4 no-print">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-full font-semibold shadow-lg hover:bg-slate-800 transition-colors"
          >
            <Printer className="h-4 w-4" />
            Print Ticket
          </button>
          <button 
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2 px-6 py-3 bg-white text-slate-700 border border-slate-200 rounded-full font-semibold shadow-sm hover:bg-slate-50 transition-colors"
          >
            Back Home
          </button>
        </div>
      </div>
    </div>
  );
}
