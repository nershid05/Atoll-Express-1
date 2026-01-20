# Yoosufspeed Ferry Booking System

## Overview

Yoosufspeed is a ferry booking web application for speedboat services connecting Male' City, Hulhumale', and Baa Atoll in the Maldives. The system provides public-facing pages for viewing schedules, booking tickets, and submitting testimonials, along with an admin dashboard for managing trips, bookings, testimonials, and contact messages.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack React Query for server state
- **Forms**: React Hook Form with Zod validation via @hookform/resolvers
- **Styling**: Tailwind CSS with custom design tokens for ocean/travel theme
- **UI Components**: shadcn/ui component library (Radix UI primitives)
- **Build Tool**: Vite with path aliases (@/ for client/src, @shared/ for shared code)

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful endpoints defined in shared/routes.ts with Zod schemas for validation
- **Authentication**: Replit Auth (OpenID Connect) with Passport.js and session management
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema-to-validation integration
- **Schema Location**: shared/schema.ts contains all table definitions
- **Migrations**: Managed via drizzle-kit with `db:push` command

### Key Data Models
- **Users**: Authentication with Replit Auth, includes isAdmin flag
- **Trips**: Ferry schedules with route, times, pricing, capacity
- **Bookings**: Customer reservations with ticket codes, payment status
- **Testimonials**: Customer reviews with approval workflow
- **ContactMessages**: Customer inquiries from contact form

### Authentication & Authorization
- Replit Auth handles user authentication via OIDC
- Session-based auth with PostgreSQL session storage
- Admin routes protected by authentication middleware
- User data stored in users table with isAdmin boolean for role control

### API Structure
Routes defined declaratively in shared/routes.ts with:
- Path definitions
- HTTP methods
- Input/output Zod schemas for type safety
- Shared between frontend and backend for consistency

## External Dependencies

### Database
- PostgreSQL (required, connection via DATABASE_URL environment variable)

### Authentication
- Replit Auth (OIDC provider at https://replit.com/oidc)
- Requires REPL_ID and SESSION_SECRET environment variables

### Third-Party UI Libraries
- Radix UI primitives for accessible components
- Embla Carousel for carousels
- date-fns for date formatting
- Lucide React for icons

### Development Tools
- Vite for development server and builds
- esbuild for production server bundling
- Replit-specific plugins for dev experience (@replit/vite-plugin-*)