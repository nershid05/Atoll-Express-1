import { db } from "./db";
import { 
  users, type User, type UpsertUser,
  routes, type Route, type InsertRoute,
  trips, type Trip, type InsertTrip,
  bookings, type Booking, type InsertBooking,
  testimonials, type Testimonial, type InsertTestimonial,
  contactMessages, type ContactMessage, type InsertContact
} from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { authStorage } from "./replit_integrations/auth/storage";

export interface IStorage {
  // Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Routes
  getRoutes(): Promise<Route[]>;
  getRouteByName(name: string): Promise<Route | undefined>;
  createRoute(route: InsertRoute): Promise<Route>;
  updateRoute(id: number, route: Partial<InsertRoute>): Promise<Route>;
  
  // Trips
  getTrips(): Promise<Trip[]>;
  getTrip(id: number): Promise<Trip | undefined>;
  createTrip(trip: InsertTrip): Promise<Trip>;
  updateTrip(id: number, trip: Partial<InsertTrip>): Promise<Trip>;
  deleteTrip(id: number): Promise<void>;

  // Bookings
  createBooking(booking: InsertBooking & { ticketCode: string, totalPrice: number }): Promise<Booking>;
  getBooking(id: number): Promise<Booking | undefined>;
  getBookings(): Promise<Booking[]>; // Admin
  getBookingsByTrip(tripId: number): Promise<Booking[]>;
  getBookingsByRouteAndDate(routeName: string, departureDate: string): Promise<Booking[]>;
  updateBookingStatus(id: number, status: { bookingStatus?: string, paymentStatus?: string }): Promise<Booking>;
  
  // Testimonials
  getTestimonials(onlyApproved?: boolean): Promise<Testimonial[]>;
  createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial>;
  updateTestimonialApproval(id: number, approved: boolean): Promise<Testimonial>;

  // Contact
  createContactMessage(message: InsertContact): Promise<ContactMessage>;
  getContactMessages(): Promise<ContactMessage[]>;
}

export class DatabaseStorage implements IStorage {
  // Auth delegation
  async getUser(id: string): Promise<User | undefined> {
    return authStorage.getUser(id);
  }
  async upsertUser(user: UpsertUser): Promise<User> {
    return authStorage.upsertUser(user);
  }

  // Routes
  async getRoutes(): Promise<Route[]> {
    return db.select().from(routes);
  }
  async getRouteByName(name: string): Promise<Route | undefined> {
    const [route] = await db.select().from(routes).where(eq(routes.name, name));
    return route;
  }
  async createRoute(route: InsertRoute): Promise<Route> {
    const [newRoute] = await db.insert(routes).values(route).returning();
    return newRoute;
  }
  async updateRoute(id: number, updates: Partial<InsertRoute>): Promise<Route> {
    const [updated] = await db.update(routes).set(updates).where(eq(routes.id, id)).returning();
    return updated;
  }

  // Trips
  async getTrips(): Promise<Trip[]> {
    return db.select().from(trips).orderBy(trips.departureTime);
  }
  async getTrip(id: number): Promise<Trip | undefined> {
    const [trip] = await db.select().from(trips).where(eq(trips.id, id));
    return trip;
  }
  async createTrip(trip: InsertTrip): Promise<Trip> {
    const [newTrip] = await db.insert(trips).values({
      ...trip,
      departureDate: trip.departureDate || new Date().toISOString().split('T')[0]
    }).returning();
    return newTrip;
  }
  async updateTrip(id: number, updates: Partial<InsertTrip>): Promise<Trip> {
    const [updated] = await db.update(trips).set(updates).where(eq(trips.id, id)).returning();
    return updated;
  }
  async deleteTrip(id: number): Promise<void> {
    await db.delete(trips).where(eq(trips.id, id));
  }

  // Bookings
  async createBooking(booking: InsertBooking & { ticketCode: string, totalPrice: number }): Promise<Booking> {
    const [newBooking] = await db.insert(bookings).values(booking).returning();
    return newBooking;
  }
  async getBooking(id: number): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }
  async getBookings(): Promise<Booking[]> {
    return db.select().from(bookings).orderBy(desc(bookings.createdAt));
  }
  async updateBookingStatus(id: number, status: { bookingStatus?: string, paymentStatus?: string }): Promise<Booking> {
    const [updated] = await db.update(bookings).set(status).where(eq(bookings.id, id)).returning();
    return updated;
  }

  async getBookingsByTrip(tripId: number): Promise<Booking[]> {
    return db.select().from(bookings).where(eq(bookings.tripId, tripId));
  }

  async getBookingsByRouteAndDate(routeName: string, departureDate: string): Promise<Booking[]> {
    const allTrips = await db.select().from(trips).where(and(eq(trips.routeName, routeName), eq(trips.departureDate, departureDate)));
    const tripIds = allTrips.map(t => t.id);
    if (tripIds.length === 0) return [];
    
    const allBookings = await db.select().from(bookings);
    return allBookings.filter(b => tripIds.includes(b.tripId) && b.bookingStatus !== 'cancelled');
  }

  // Testimonials
  async getTestimonials(onlyApproved = true): Promise<Testimonial[]> {
    const query = db.select().from(testimonials);
    if (onlyApproved) {
      query.where(eq(testimonials.approved, true));
    }
    return await query.orderBy(desc(testimonials.createdAt));
  }
  async createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial> {
    const [newTestimonial] = await db.insert(testimonials).values(testimonial).returning();
    return newTestimonial;
  }
  async updateTestimonialApproval(id: number, approved: boolean): Promise<Testimonial> {
    const [updated] = await db.update(testimonials).set({ approved }).where(eq(testimonials.id, id)).returning();
    return updated;
  }

  // Contact
  async createContactMessage(message: InsertContact): Promise<ContactMessage> {
    const [newMessage] = await db.insert(contactMessages).values(message).returning();
    return newMessage;
  }
  async getContactMessages(): Promise<ContactMessage[]> {
    return db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
  }
}

export const storage = new DatabaseStorage();
