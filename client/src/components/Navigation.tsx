import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Menu, X, Anchor, LayoutDashboard, LogOut } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Navigation() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { href: "/", label: "Home" },
    { href: "/schedule", label: "Schedule" },
    { href: "/book", label: "Book Now" },
    { href: "/testimonials", label: "Reviews" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center px-4">
        <Link href="/" className="mr-6 flex items-center gap-2 font-display text-2xl font-bold text-primary">
          <Anchor className="h-6 w-6" />
          <span>YoosuSpeed</span>
        </Link>
        
        {/* Desktop Nav */}
        <div className="hidden md:flex md:gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                location === link.href ? "text-primary" : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-4">
          {user && (
            <div className="hidden md:flex items-center gap-4">
              <Link href="/admin/dashboard" className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <button 
                onClick={() => logout()}
                className="flex items-center gap-2 text-sm font-medium text-destructive hover:text-destructive/80"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t p-4 bg-background">
          <div className="flex flex-col space-y-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "text-base font-medium transition-colors hover:text-primary",
                  location === link.href ? "text-primary" : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <>
                 <Link href="/admin/dashboard" onClick={() => setIsOpen(false)} className="text-base font-medium text-foreground">
                    Dashboard
                 </Link>
                 <button onClick={() => logout()} className="text-left text-base font-medium text-destructive">
                   Logout
                 </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
