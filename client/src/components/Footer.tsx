import { Link } from "wouter";
import { Facebook, Instagram, Twitter } from "lucide-react";
import logoImg from "@assets/67479162_2414021002167097_5524966927945957376_n_1768948773017.jpg";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-200 mt-auto">
      <div className="container py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-white font-display text-xl font-bold">
              <img 
                src={logoImg} 
                alt="Yoosufspeed Logo" 
                className="h-10 w-auto object-contain brightness-0 invert" 
              />
              Yoosufspeed
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
              <li><Link href="/testimonials" className="hover:text-white transition-colors">New Review</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-white mb-4">Contact</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>Male', Maldives</li>
              <li>+960 777-1234</li>
              <li>info@yoosufspeed.com</li>
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
          © {new Date().getFullYear()} Yoosufspeed Ferry Services. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
