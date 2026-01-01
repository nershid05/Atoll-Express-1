import { Link } from "wouter";
import { Anchor, Facebook, Instagram, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-200 mt-auto">
      <div className="container py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white font-display text-xl font-bold">
              <Anchor className="h-6 w-6" />
              YoosuSpeed
            </div>
            <p className="text-sm text-slate-400">
              Reliable and fast ferry services connecting Baa Atoll with Male' & Hulhumale'.
            </p>
          </div>
          
          <div>
            <h3 className="font-bold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link href="/schedule" className="hover:text-white transition-colors">Schedule</Link></li>
              <li><Link href="/book" className="hover:text-white transition-colors">Book a Seat</Link></li>
              <li><Link href="/testimonials" className="hover:text-white transition-colors">Testimonials</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-white mb-4">Contact</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>Male', Maldives</li>
              <li>+960 777-1234</li>
              <li>info@yoosuspeed.com</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-white mb-4">Follow Us</h3>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition-colors"><Facebook className="h-5 w-5" /></a>
              <a href="#" className="hover:text-white transition-colors"><Instagram className="h-5 w-5" /></a>
              <a href="#" className="hover:text-white transition-colors"><Twitter className="h-5 w-5" /></a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} YoosuSpeed Ferry Services. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
