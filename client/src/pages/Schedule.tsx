import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useTrips } from "@/hooks/use-trips";
import { Link } from "wouter";
import { ArrowRight, Loader2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Schedule() {
  const { data: trips, isLoading } = useTrips();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navigation />
      
      <main className="flex-1 container px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-display font-bold text-slate-900 mb-4">Ferry Schedule</h1>
            <p className="text-muted-foreground text-lg">
              Regular speedboat transfers between Male'/Hulhumale' and Baa Atoll.
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : trips?.filter(t => {
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            if (t.departureDate < today) return false;
            if (t.departureDate === today) {
              const [hours, minutes] = t.departureTime.split(':').map(Number);
              const tripTime = new Date();
              tripTime.setHours(hours, minutes, 0, 0);
              return tripTime > now;
            }
            return true;
          }).length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl shadow-sm border">
              <p className="text-xl text-muted-foreground">No upcoming trips scheduled at the moment.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {trips?.filter(t => {
                const now = new Date();
                const today = now.toISOString().split('T')[0];
                if (t.departureDate < today) return false;
                if (t.departureDate === today) {
                  const [hours, minutes] = t.departureTime.split(':').map(Number);
                  const tripTime = new Date();
                  tripTime.setHours(hours, minutes, 0, 0);
                  return tripTime > now;
                }
                return true;
              }).map((trip) => (
                <div 
                  key={trip.id} 
                  className={cn(
                    "group bg-white rounded-xl p-6 shadow-sm border border-slate-200 transition-all hover:shadow-md hover:border-primary/50",
                    !trip.isActive && "opacity-60 grayscale"
                  )}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    {/* Route Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 text-xs font-bold text-primary uppercase tracking-wider">
                        <Calendar className="h-3.5 w-3.5" />
                        {trip.departureDate}
                      </div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2 text-slate-900 font-bold text-lg">
                          <MapPin className="h-5 w-5 text-primary" />
                          {trip.routeFrom}
                        </div>
                        <ArrowRight className="h-5 w-5 text-slate-400" />
                        <div className="flex items-center gap-2 text-slate-900 font-bold text-lg">
                          <MapPin className="h-5 w-5 text-secondary" />
                          {trip.routeTo}
                        </div>
                      </div>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>Boat: {trip.boatName}</span>
                        <span>•</span>
                        <span>Capacity: {trip.capacity} seats</span>
                      </div>
                    </div>

                    {/* Time & Price */}
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Departure</div>
                        <div className="text-2xl font-bold text-slate-900 font-mono">{trip.departureTime}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Price</div>
                        <div className="text-2xl font-bold text-primary">MVR {trip.price}</div>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="md:border-l md:pl-6">
                      {trip.isActive ? (
                        <Link href={`/book?tripId=${trip.id}`}>
                          <button className="w-full md:w-auto px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                            Book Now
                          </button>
                        </Link>
                      ) : (
                        <span className="inline-block px-6 py-3 bg-slate-100 text-slate-400 rounded-lg font-semibold cursor-not-allowed">
                          Unavailable
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
