import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useCreateContactMessage } from "@/hooks/use-contact";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Phone, MapPin, Send } from "lucide-react";

const contactSchema = z.object({
  name: z.string().min(2, "Name required"),
  email: z.string().email("Invalid email"),
  subject: z.string().min(5, "Subject too short"),
  message: z.string().min(10, "Message too short"),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export default function Contact() {
  const { mutateAsync: sendMessage, isPending } = useCreateContactMessage();
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema)
  });

  const onSubmit = async (data: ContactFormValues) => {
    await sendMessage(data);
    form.reset();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navigation />
      
      <main className="flex-1 py-12 md:py-24">
        <div className="container px-4">
          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            
            {/* Contact Info */}
            <div className="space-y-8">
              <div>
                <h1 className="text-4xl font-display font-bold text-slate-900 mb-4">Get in Touch</h1>
                <p className="text-lg text-muted-foreground">
                  Have questions about our schedule, bookings, or services? We're here to help.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center text-primary shrink-0">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Our Office</h3>
                    <p className="text-slate-600">H. Marine Dream, 1st Floor<br />Boduthakurufaanu Magu<br />Male', Maldives</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center text-primary shrink-0">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Phone</h3>
                    <p className="text-slate-600">+960 777-1234</p>
                    <p className="text-sm text-slate-500">Mon-Sat, 9am - 5pm</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center text-primary shrink-0">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Email</h3>
                    <p className="text-slate-600">info@yoosuspeed.com</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <input 
                    {...form.register("name")}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="Your name"
                  />
                  {form.formState.errors.name && <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <input 
                    {...form.register("email")}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="email@example.com"
                  />
                  {form.formState.errors.email && <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject</label>
                  <input 
                    {...form.register("subject")}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="Booking inquiry"
                  />
                  {form.formState.errors.subject && <p className="text-xs text-red-500">{form.formState.errors.subject.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Message</label>
                  <textarea 
                    {...form.register("message")}
                    rows={4}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                    placeholder="How can we help?"
                  />
                  {form.formState.errors.message && <p className="text-xs text-red-500">{form.formState.errors.message.message}</p>}
                </div>

                <button 
                  type="submit"
                  disabled={isPending}
                  className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isPending ? "Sending..." : <><Send className="h-4 w-4" /> Send Message</>}
                </button>
              </form>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
