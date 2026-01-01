import { pgTable, text, serial, integer, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Export auth models
export * from "./models/auth";

// Trips Schedule
export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  routeFrom: text("route_from").notNull(),
  routeTo: text("route_to").notNull(),
  departureTime: text("departure_time").notNull(), // HH:MM format
  arrivalTime: text("arrival_time").notNull(), // HH:MM format
  price: integer("price").notNull(), // In MVR
  capacity: integer("capacity").notNull(),
  boatName: text("boat_name").notNull(),
  isActive: boolean("is_active").default(true),
});

export const insertTripSchema = createInsertSchema(trips).omit({ id: true });
export type Trip = typeof trips.$inferSelect;
export type InsertTrip = z.infer<typeof insertTripSchema>;

// Bookings
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  ticketQuantity: integer("ticket_quantity").notNull(),
  totalPrice: integer("total_price").notNull(),
  bookingStatus: text("booking_status").default("confirmed"), // confirmed, cancelled
  paymentStatus: text("payment_status").default("pending"), // pending (pay on delivery), paid
  ticketCode: text("ticket_code").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookings).omit({ 
  id: true, 
  ticketCode: true,
  createdAt: true,
  totalPrice: true // Calculated on backend
});
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

// Testimonials
export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  content: text("content").notNull(),
  rating: integer("rating").notNull().default(5),
  approved: boolean("approved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTestimonialSchema = createInsertSchema(testimonials).omit({ id: true, approved: true, createdAt: true });
export type Testimonial = typeof testimonials.$inferSelect;
export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;

// Contact Messages
export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertContactSchema = createInsertSchema(contactMessages).omit({ id: true, createdAt: true });
export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
