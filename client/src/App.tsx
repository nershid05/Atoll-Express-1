import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Pages
import Home from "@/pages/Home";
import Schedule from "@/pages/Schedule";
import Book from "@/pages/Book";
import Ticket from "@/pages/Ticket";
import Testimonials from "@/pages/Testimonials";
import Contact from "@/pages/Contact";

// Admin Pages
import Dashboard from "@/pages/admin/Dashboard";
import AdminLogin from "@/pages/admin/Login";
import AdminTrips from "@/pages/admin/Trips";
import AdminBookings from "@/pages/admin/Bookings";
import AdminTestimonials from "@/pages/admin/Testimonials";
import AdminMessages from "@/pages/admin/ContactMessages";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Home} />
      <Route path="/schedule" component={Schedule} />
      <Route path="/book" component={Book} />
      <Route path="/ticket/:id" component={Ticket} />
      <Route path="/testimonials" component={Testimonials} />
      <Route path="/contact" component={Contact} />

      {/* Admin Routes - Protected by AdminLayout component inside */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={Dashboard} />
      <Route path="/admin/trips" component={AdminTrips} />
      <Route path="/admin/bookings" component={AdminBookings} />
      <Route path="/admin/testimonials" component={AdminTestimonials} />
      <Route path="/admin/contact" component={AdminMessages} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
