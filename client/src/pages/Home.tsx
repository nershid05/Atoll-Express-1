import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Link } from "wouter";
import { ArrowRight, Clock, ShieldCheck, Ship, Star, Quote } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { type Testimonial } from "@shared/schema";

import heroImg from "@assets/WhatsApp_Image_2026-01-21_at_03.57.08_1768949857607.jpeg";
import boatImg1 from "@assets/fleet_boat_1.png";
import boatImg2 from "@assets/fleet_boat_2.png";

export default function Home() {
  const { data: testimonials } = useQuery<Testimonial[]>({
    queryKey: ["/api/testimonials"],
  });

  const activeTestimonials = testimonials?.filter(t => t.approved).slice(0, 3) || [];

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <div 
            className="w-full h-full bg-cover bg-center" 
            style={{ 
              backgroundImage: `url(${heroImg})` 
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/20" />
        </div>
        
        <div className="relative z-10 container px-4 text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white mb-6 tracking-tight drop-shadow-lg">
            Experience the <span className="text-primary">Fastest</span><br />
            Connection to Baa Atoll
          </h1>
          <p className="text-lg md:text-xl text-slate-200 max-w-2xl mx-auto mb-10 drop-shadow-md">
            Premium speedboat ferry service connecting Male' City, Hulhumale' and Baa Atoll islands with comfort and reliability.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/book" 
              className="inline-flex items-center justify-center h-14 px-8 rounded-full bg-primary text-white font-semibold text-lg hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/30"
            >
              Book a Seat
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link 
              href="/schedule" 
              className="inline-flex items-center justify-center h-14 px-8 rounded-full bg-white/20 backdrop-blur-md border border-white/40 text-white font-semibold text-lg hover:bg-white/30 transition-all shadow-lg"
            >
              View Schedule
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-slate-50">
        <div className="container px-4">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:-translate-y-1 transition-transform duration-300">
              <div className="h-14 w-14 bg-blue-100 rounded-xl flex items-center justify-center text-primary mb-6">
                <Ship className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Modern Fleet</h3>
              <p className="text-muted-foreground">
                Our speedboats are equipped with comfortable seating, safety gear, and modern navigation systems for a smooth ride.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:-translate-y-1 transition-transform duration-300">
              <div className="h-14 w-14 bg-teal-100 rounded-xl flex items-center justify-center text-teal-600 mb-6">
                <Clock className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Punctual Service</h3>
              <p className="text-muted-foreground">
                We value your time. Our schedules are optimized to get you to your destination on time, every time.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:-translate-y-1 transition-transform duration-300">
              <div className="h-14 w-14 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 mb-6">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Safe & Secure</h3>
              <p className="text-muted-foreground">
                Safety is our priority. Experienced captains and crew ensure your journey across the ocean is safe.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {activeTestimonials.length > 0 && (
        <section className="py-24 bg-white">
          <div className="container px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mb-4">What Our Passengers Say</h2>
              <p className="text-muted-foreground text-lg">Trusted by hundreds of travelers every week.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {activeTestimonials.map((testimonial) => (
                <div key={testimonial.id} className="p-8 rounded-2xl bg-slate-50 border border-slate-100 relative">
                  <Quote className="absolute top-6 right-8 h-8 w-8 text-slate-200" />
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-slate-700 italic mb-6 leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  <div className="font-bold text-slate-900">{testimonial.name}</div>
                </div>
              ))}
            </div>
            <div className="text-center mt-12">
              <Link href="/testimonials" className="text-primary font-semibold hover:underline">
                Read all reviews
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 bg-primary text-white">
        <div className="container px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">Ready to travel?</h2>
          <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">
            Book your seat online in less than 2 minutes. Receive your e-ticket instantly and pay on delivery.
          </p>
          <Link 
            href="/book" 
            className="inline-flex items-center justify-center h-14 px-10 rounded-full bg-white text-primary font-bold text-lg hover:bg-blue-50 transition-all shadow-xl"
          >
            Book Now
          </Link>
        </div>
      </section>

      {/* Our Fleet */}
      <section className="py-24 bg-slate-50">
        <div className="container px-4">
          <div className="text-center mb-14">
            <span className="inline-block bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">Our Fleet</span>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mb-4">Meet Our Speedboats</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Six modern speedboats ready to carry you across the Indian Ocean in comfort and style.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: "Yoosuf Emperor", img: boatImg1 },
              { name: "Yoosuf Rasgefaanu", img: boatImg2 },
              { name: "Yoosuf Empire", img: boatImg1 },
              { name: "Yoosuf Empower", img: boatImg2 },
              { name: "Yoosuf Explorer", img: boatImg1 },
              { name: "Yoosuf Eros", img: boatImg2 },
            ].map((boat) => (
              <div
                key={boat.name}
                className="group relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={boat.img}
                    alt={boat.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="flex items-center gap-2">
                    <Ship className="h-4 w-4 text-primary flex-shrink-0" />
                    <h3 className="text-white font-bold text-lg tracking-tight">{boat.name}</h3>
                  </div>
                  <p className="text-slate-300 text-xs mt-1 ml-6">Yoosufspeed Ferry Service</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
