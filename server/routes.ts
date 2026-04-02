import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getSession } from "./replit_integrations/auth";
import { setupLocalAuth, requireAdmin, seedAdminUser } from "./localAuth";
import { api } from "@shared/routes";
import { z } from "zod";
import { randomBytes } from "crypto";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup session + local auth FIRST
  app.use(getSession());
  const passportLib = await import("passport");
  app.use(passportLib.default.initialize());
  app.use(passportLib.default.session());
  setupLocalAuth(app);
  await seedAdminUser();

  // Trips
  app.get(api.trips.list.path, async (req, res) => {
    // Automatically hide/deactivate past trips
    const allTrips = await storage.getTrips();
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');

    const validTrips = allTrips.filter(t => {
      if (t.departureDate < today) return false;
      if (t.departureDate === today && t.departureTime < currentTime) return false;
      return true;
    });

    res.json(validTrips);
  });

  app.get(api.trips.get.path, async (req, res) => {
    const trip = await storage.getTrip(Number(req.params.id));
    if (!trip) return res.status(404).json({ message: "Trip not found" });
    res.json(trip);
  });

  app.post(api.trips.create.path, requireAdmin, async (req, res) => {
    const input = api.trips.create.input.parse(req.body);
    const trip = await storage.createTrip(input);
    res.status(201).json(trip);
  });

  app.put(api.trips.update.path, requireAdmin, async (req, res) => {
    const input = api.trips.update.input.parse(req.body);
    const trip = await storage.updateTrip(Number(req.params.id), input);
    res.json(trip);
  });

  app.delete(api.trips.delete.path, requireAdmin, async (req, res) => {
    await storage.deleteTrip(Number(req.params.id));
    res.status(204).send();
  });

  // Bulk create trips from Excel import
  app.post("/api/admin/trips/bulk", requireAdmin, async (req, res) => {
    const rows = req.body as Array<{
      routeName: string; routeFrom: string; routeTo: string;
      departureDate: string; departureTime: string; arrivalTime: string;
      price: number; onlineSeats?: number | null; isActive?: boolean;
    }>;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ message: "No trip data provided" });
    }
    const created: any[] = [];
    const failed: Array<{ row: number; reason: string }> = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        const trip = await storage.createTrip({
          routeName: r.routeName,
          routeFrom: r.routeFrom,
          routeTo: r.routeTo,
          departureDate: r.departureDate,
          departureTime: r.departureTime,
          arrivalTime: r.arrivalTime,
          price: Number(r.price),
          onlineSeats: r.onlineSeats != null ? Number(r.onlineSeats) : null,
          isActive: r.isActive !== false,
        });
        created.push(trip);
      } catch (e: any) {
        failed.push({ row: i + 2, reason: e?.message || "Unknown error" });
      }
    }
    res.status(201).json({ created: created.length, failed });
  });

  // Bookings
  app.post(api.bookings.create.path, async (req, res) => {
    const input = api.bookings.create.input.parse(req.body);
    const trip = await storage.getTrip(input.tripId);
    if (!trip) return res.status(400).json({ message: "Invalid trip" });
    
    // Fetch route for capacity
    const route = await storage.getRouteByName(trip.routeName);
    if (!route) return res.status(400).json({ message: "Route configuration not found" });

    // LIVE AVAILABILITY CHECK (Per Trip for online seats)
    const tripBookings = await storage.getBookingsByTrip(trip.id);
    const activeBookings = tripBookings.filter(b => b.bookingStatus !== 'cancelled');
    const occupiedOnlineSeats = activeBookings.reduce((sum, b) => sum + b.ticketQuantity, 0);
    
    // Online seat limit: use trip.onlineSeats if set, otherwise fall back to route capacity
    const onlineSeatLimit = trip.onlineSeats ?? route.capacity;
    
    if (occupiedOnlineSeats + input.ticketQuantity > onlineSeatLimit) {
      const remaining = Math.max(0, onlineSeatLimit - occupiedOnlineSeats);
      return res.status(400).json({ message: `Only ${remaining} online seat${remaining === 1 ? '' : 's'} remaining for this trip.` });
    }
    
    // Calculate total price
    const totalPrice = trip.price * input.ticketQuantity;
    // Generate Ticket Code
    const ticketCode = 'TICKET-' + randomBytes(4).toString('hex').toUpperCase();

    const booking = await storage.createBooking({
      ...input,
      ticketCode,
      totalPrice
    });
    res.status(201).json(booking);
  });

  // Admin: Past trips history with booking stats
  app.get("/api/admin/trips/history", requireAdmin, async (req, res) => {
    const allTrips = await storage.getTrips();
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');

    const pastTrips = allTrips.filter(t => {
      if (t.departureDate < today) return true;
      if (t.departureDate === today && t.departureTime <= currentTime) return true;
      return false;
    }).sort((a, b) => {
      if (b.departureDate !== a.departureDate) return b.departureDate.localeCompare(a.departureDate);
      return b.departureTime.localeCompare(a.departureTime);
    });

    // Enrich with booking stats
    const enriched = await Promise.all(pastTrips.map(async trip => {
      const tripBookings = await storage.getBookingsByTrip(trip.id);
      const active = tripBookings.filter(b => b.bookingStatus !== 'cancelled');
      const revenue = active.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
      const passengers = active.reduce((sum, b) => sum + b.ticketQuantity, 0);
      const paid = active.filter(b => b.paymentStatus === 'paid').length;
      return { ...trip, stats: { totalBookings: active.length, passengers, revenue, paidCount: paid, pendingCount: active.length - paid } };
    }));

    res.json(enriched);
  });

  // Admin: Export trip bookings as CSV
  app.get("/api/admin/trips/:id/export", requireAdmin, async (req, res) => {
    const trip = await storage.getTrip(Number(req.params.id));
    if (!trip) return res.status(404).json({ message: "Trip not found" });
    const tripBookings = await storage.getBookingsByTrip(trip.id);
    const active = tripBookings.filter(b => b.bookingStatus !== 'cancelled');

    const rows = [
      ["Ticket Code", "Customer Name", "Phone", "Email", "Seats", "Total (MVR)", "Payment Method", "Payment Status", "Booking Status", "Booked At"],
      ...active.map(b => [
        b.ticketCode, b.customerName, b.customerPhone, b.customerEmail,
        b.ticketQuantity, b.totalPrice, b.paymentMethod || "cash",
        b.paymentStatus || "pending", b.bookingStatus || "confirmed",
        b.createdAt ? new Date(b.createdAt).toLocaleString() : ""
      ])
    ];

    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="trip-${trip.id}-${trip.departureDate}-manifest.csv"`);
    res.send(csv);
  });

  // Trip availability endpoint
  app.get("/api/trips/:id/availability", async (req, res) => {
    const trip = await storage.getTrip(Number(req.params.id));
    if (!trip) return res.status(404).json({ message: "Trip not found" });
    const route = await storage.getRouteByName(trip.routeName);
    const tripBookings = await storage.getBookingsByTrip(trip.id);
    const activeBookings = tripBookings.filter(b => b.bookingStatus !== 'cancelled');
    const occupied = activeBookings.reduce((sum, b) => sum + b.ticketQuantity, 0);
    const onlineSeatLimit = trip.onlineSeats ?? (route?.capacity ?? 0);
    res.json({ onlineSeatLimit, occupied, remaining: Math.max(0, onlineSeatLimit - occupied) });
  });

  app.get(api.bookings.get.path, async (req, res) => {
    const booking = await storage.getBooking(Number(req.params.id));
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.json(booking);
  });

  app.get(api.bookings.list.path, requireAdmin, async (req, res) => {
    const bookings = await storage.getBookings();
    res.json(bookings);
  });

  app.patch(api.bookings.updateStatus.path, requireAdmin, async (req, res) => {
    const input = api.bookings.updateStatus.input.parse(req.body);
    const booking = await storage.updateBookingStatus(Number(req.params.id), input);
    res.json(booking);
  });

  // Testimonials
  app.get(api.testimonials.listPublic.path, async (req, res) => {
    const testimonials = await storage.getTestimonials(true);
    res.json(testimonials);
  });

  app.post(api.testimonials.create.path, async (req, res) => {
    const input = api.testimonials.create.input.parse(req.body);
    const testimonial = await storage.createTestimonial(input);
    res.status(201).json(testimonial);
  });

  app.get(api.testimonials.listAll.path, requireAdmin, async (req, res) => {
    const testimonials = await storage.getTestimonials(false);
    res.json(testimonials);
  });

  app.patch(api.testimonials.approve.path, requireAdmin, async (req, res) => {
    const input = api.testimonials.approve.input.parse(req.body);
    const testimonial = await storage.updateTestimonialApproval(Number(req.params.id), input.approved);
    res.json(testimonial);
  });

  // Routes
  app.get("/api/routes", async (req, res) => {
    const allRoutes = await storage.getRoutes();
    res.json(allRoutes);
  });

  app.post("/api/routes", requireAdmin, async (req, res) => {
    const route = await storage.createRoute(req.body);
    res.status(201).json(route);
  });

  app.patch("/api/routes/:id", requireAdmin, async (req, res) => {
    const route = await storage.updateRoute(Number(req.params.id), req.body);
    res.json(route);
  });

  // Contact
  app.post(api.contact.create.path, async (req, res) => {
    const input = api.contact.create.input.parse(req.body);
    const message = await storage.createContactMessage(input);
    res.status(201).json(message);
  });

  app.get(api.contact.list.path, requireAdmin, async (req, res) => {
    const messages = await storage.getContactMessages();
    res.json(messages);
  });

  // Seed Data if empty
  const allRoutes = await storage.getRoutes();
  if (allRoutes.length === 0) {
    await storage.createRoute({
      name: "Male - Baa Atoll",
      boatName: "YoosuSpeed 1",
      capacity: 65,
      isActive: true
    });
    await storage.createRoute({
      name: "Baa Atoll - Male",
      boatName: "YoosuSpeed 1",
      capacity: 65,
      isActive: true
    });
  }

  const existingTrips = await storage.getTrips();
  if (existingTrips.length === 0) {
    const today = new Date().toISOString().split('T')[0];
    await storage.createTrip({
      routeName: "Male - Baa Atoll",
      routeFrom: "Male'",
      routeTo: "Baa Atoll (Eydhafushi)",
      departureTime: "07:00",
      arrivalTime: "09:30",
      price: 500, // MVR
      isActive: true,
      departureDate: today
    });
    await storage.createTrip({
      routeName: "Baa Atoll - Male",
      routeFrom: "Baa Atoll (Eydhafushi)",
      routeTo: "Male'",
      departureTime: "14:00",
      arrivalTime: "16:30",
      price: 500,
      isActive: true,
      departureDate: today
    });
  }

  return httpServer;
}
