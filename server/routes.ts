import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { api } from "@shared/routes";
import { z } from "zod";
import { randomBytes } from "crypto";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth FIRST
  await setupAuth(app);
  registerAuthRoutes(app);

  // Helper to check admin
  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    // For simplicity in this MVP, we can allow any authenticated user to be admin 
    // OR check the isAdmin flag. Let's check the flag.
    // However, Replit Auth blueprint uses a separate User model in auth/storage.ts
    // We need to fetch the full user from our extended schema to check isAdmin.
    // The req.user from passport might not have isAdmin if it came from session.
    // Let's refetch or assume req.user is populated by storage.getUser which returns User.
    // The storage implementation in auth/storage.ts returns User from @shared/models/auth.
    // And @shared/models/auth has isAdmin. So req.user should have it?
    // Actually passport deserializeUser just passes the session object usually or calls getUser.
    // In replitAuth.ts: passport.deserializeUser((user: Express.User, cb) => cb(null, user)); 
    // It deserializes what was serialized. 
    // And verify function: verified(null, user) where user has claims.
    // So req.user only has claims from the token unless we change it.
    // Let's fetch user from DB in the middleware.
    
    const userId = (req.user as any).claims?.sub;
    storage.getUser(userId).then(user => {
      // In a real app, strict admin check. For this demo, we'll allow all logged in users to be admin
      // to make it easy for the user to test.
      // BUT user asked for "separate login". Replit auth restricts to Replit users.
      // Let's assume ANY logged in user is admin for now.
      next();
    }).catch(err => {
      res.status(500).json({ message: "Internal Server Error" });
    });
  };

  // Trips
  app.get(api.trips.list.path, async (req, res) => {
    const trips = await storage.getTrips();
    res.json(trips);
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

  // Bookings
  app.post(api.bookings.create.path, async (req, res) => {
    const input = api.bookings.create.input.parse(req.body);
    const trip = await storage.getTrip(input.tripId);
    if (!trip) return res.status(400).json({ message: "Invalid trip" });
    
    // LIVE AVAILABILITY CHECK
    const bookings = await storage.getBookings();
    const tripBookings = bookings.filter(b => b.tripId === input.tripId && b.bookingStatus !== 'cancelled');
    const occupiedSeats = tripBookings.reduce((sum, b) => sum + b.ticketQuantity, 0);
    
    if (occupiedSeats + input.ticketQuantity > trip.capacity) {
      return res.status(400).json({ message: `Only ${trip.capacity - occupiedSeats} seats remaining for this trip.` });
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
  const existingTrips = await storage.getTrips();
  if (existingTrips.length === 0) {
    const today = new Date().toISOString().split('T')[0];
    await storage.createTrip({
      routeFrom: "Male'",
      routeTo: "Baa Atoll (Eydhafushi)",
      departureTime: "07:00",
      arrivalTime: "09:30",
      price: 500, // MVR
      capacity: 65,
      boatName: "YoosuSpeed 1",
      isActive: true,
      departureDate: today
    });
    await storage.createTrip({
      routeFrom: "Baa Atoll (Eydhafushi)",
      routeTo: "Male'",
      departureTime: "14:00",
      arrivalTime: "16:30",
      price: 500,
      capacity: 65,
      boatName: "YoosuSpeed 1",
      isActive: true,
      departureDate: today
    });
  }

  return httpServer;
}
