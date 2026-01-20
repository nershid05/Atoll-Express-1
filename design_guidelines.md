# Yoosufspeed Ferry Booking Application - Design Guidelines

## Design Approach
**Hybrid System**: Booking.com's efficiency + Spotify's bold green aesthetic (matching brand color). The interface prioritizes quick booking flows while maintaining strong brand presence through strategic green accents against dark backgrounds.

## Typography
**Font Stack**: 
- Primary: Inter (Google Fonts) - 400, 500, 600, 700 weights
- Headings: 2.5rem to 4rem (bold 700), tight leading
- Body: 1rem base, 1.125rem for important content
- Small text: 0.875rem for labels/metadata
- Button text: 0.875rem to 1rem, medium weight (500-600)

## Layout System
**Spacing Units**: Tailwind primitives of 4, 6, 8, 12, 16, 24 for consistent rhythm
- Section padding: py-16 md:py-24
- Component gaps: gap-6 to gap-8
- Card padding: p-6 to p-8
- Max container: max-w-7xl mx-auto

## Core Components

**Navigation**
Sticky dark header (bg-black/95) with green logo, main nav links centered, prominent "Book Now" CTA in green. Mobile: hamburger menu.

**Hero Section**
Full-width image (ocean/ferry departure) with gradient overlay (black to transparent). Centered booking widget floated over image bottom-third with blurred dark background (backdrop-blur-xl bg-black/60). Widget contains: route selection dropdowns, date/time pickers, passenger count, large green search button.

**Route Cards**
Grid layout (2-3 columns desktop). Each card: ferry route image top, route name (bold), departure/arrival times, duration, pricing bold in green, "Book" button outlined green. Hover: subtle lift effect.

**Booking Flow Panels**
Multi-step process with progress indicator (green active states). White cards on light grey background. Form inputs: dark borders, green focus states, clear labels above fields.

**Schedule Table**
Alternating row backgrounds (white/light grey). Green highlights for available departures. Column headers dark with white text. Mobile: card transformation.

**Footer**
Dark background (bg-gray-900) with four columns: company info, routes, support, contact. Green accent for links hover states. Newsletter signup with green submit button.

**Buttons**
Primary: solid green (#1DB954), white text, rounded corners (rounded-lg)
Secondary: green border, green text, transparent fill
On images: backdrop-blur-md bg-white/20 with white text and border

## Images

**Hero Image**: 
Wide ocean horizon with modern ferry at golden hour - positioned as full-width background spanning 70vh minimum. Should convey reliability and modern fleet.

**Route Cards** (6-8 images):
Individual ferry exteriors, interior cabin shots, deck views, scenic island destinations. Aspect ratio 16:9, professionally shot to emphasize comfort and safety.

**Features Section** (3 images):
1. Comfortable seating interior
2. Loading dock operations (showing efficiency)
3. Sunset ocean view from ferry deck
Grid layout, aspect ratio 4:3

**Trust Section**:
Fleet photo showing multiple ferries, emphasizing scale and reliability.

## Page Structure

1. **Hero**: Booking widget over ocean imagery
2. **Popular Routes**: 3-column grid of route cards
3. **Why Choose Us**: 3-column features (icons + text) - fleet size, safety record, on-time guarantee
4. **Schedule Overview**: Searchable/filterable table
5. **Trust Signals**: Customer reviews (3-column testimonial cards), safety certifications (badge row)
6. **CTA Section**: Full-width green background, centered "Book Your Journey" message with button
7. **Footer**: Comprehensive links and newsletter

## Animation Strategy
Minimal and purposeful: subtle card hover lifts, smooth scroll to booking sections, progress indicator fills. Avoid distracting motion - prioritize booking conversion.

**Accessibility**: WCAG AA contrast maintained (green #1DB954 passes on dark backgrounds, use white text). All interactive elements keyboard navigable, form labels explicit.