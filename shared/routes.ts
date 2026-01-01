import { z } from 'zod';
import { insertTripSchema, insertBookingSchema, insertTestimonialSchema, insertContactSchema, trips, bookings, testimonials, contactMessages } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  trips: {
    list: {
      method: 'GET' as const,
      path: '/api/trips',
      responses: {
        200: z.array(z.custom<typeof trips.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/trips/:id',
      responses: {
        200: z.custom<typeof trips.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: { // Admin only
      method: 'POST' as const,
      path: '/api/trips',
      input: insertTripSchema,
      responses: {
        201: z.custom<typeof trips.$inferSelect>(),
        401: errorSchemas.unauthorized,
        400: errorSchemas.validation,
      },
    },
    update: { // Admin only
      method: 'PUT' as const,
      path: '/api/trips/:id',
      input: insertTripSchema.partial(),
      responses: {
        200: z.custom<typeof trips.$inferSelect>(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    delete: { // Admin only
      method: 'DELETE' as const,
      path: '/api/trips/:id',
      responses: {
        204: z.void(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
  },
  bookings: {
    create: {
      method: 'POST' as const,
      path: '/api/bookings',
      input: insertBookingSchema,
      responses: {
        201: z.custom<typeof bookings.$inferSelect>(), // Returns ticket details
        400: errorSchemas.validation,
      },
    },
    get: { // Retrieve by ID (public but maybe obscured, for now simple)
      method: 'GET' as const,
      path: '/api/bookings/:id',
      responses: {
        200: z.custom<typeof bookings.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    list: { // Admin only
      method: 'GET' as const,
      path: '/api/admin/bookings',
      responses: {
        200: z.array(z.custom<typeof bookings.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    updateStatus: { // Admin only
      method: 'PATCH' as const,
      path: '/api/bookings/:id/status',
      input: z.object({
        bookingStatus: z.enum(['confirmed', 'cancelled']).optional(),
        paymentStatus: z.enum(['pending', 'paid']).optional(),
      }),
      responses: {
        200: z.custom<typeof bookings.$inferSelect>(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
  },
  testimonials: {
    listPublic: {
      method: 'GET' as const,
      path: '/api/testimonials',
      responses: {
        200: z.array(z.custom<typeof testimonials.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/testimonials',
      input: insertTestimonialSchema,
      responses: {
        201: z.custom<typeof testimonials.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    listAll: { // Admin only
      method: 'GET' as const,
      path: '/api/admin/testimonials',
      responses: {
        200: z.array(z.custom<typeof testimonials.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    approve: { // Admin only
      method: 'PATCH' as const,
      path: '/api/testimonials/:id/approve',
      input: z.object({ approved: z.boolean() }),
      responses: {
        200: z.custom<typeof testimonials.$inferSelect>(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
  },
  contact: {
    create: {
      method: 'POST' as const,
      path: '/api/contact',
      input: insertContactSchema,
      responses: {
        201: z.custom<typeof contactMessages.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    list: { // Admin only
      method: 'GET' as const,
      path: '/api/admin/contact',
      responses: {
        200: z.array(z.custom<typeof contactMessages.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
