import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { useTestimonials, useCreateTestimonial } from "@/hooks/use-testimonials";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Quote, Star, User, Loader2 } from "lucide-react";

const testimonialSchema = z.object({
  name: z.string().min(2, "Name is required"),
  content: z.string().min(10, "Review must be at least 10 characters"),
  rating: z.coerce.number().min(1).max(5),
});

type TestimonialFormValues = z.infer<typeof testimonialSchema>;

export default function Testimonials() {
  const { data: testimonials, isLoading } = useTestimonials();
  const { mutateAsync: submitReview, isPending } = useCreateTestimonial();
  
  const form = useForm<TestimonialFormValues>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: { rating: 5 }
  });

  const onSubmit = async (data: TestimonialFormValues) => {
    await submitReview(data);
    form.reset();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <SEO
        title="Passenger Reviews & Testimonials"
        description="Read honest reviews from our passengers. Yoosufspeed delivers a fast, comfortable speedboat service between Malé and Baa Atoll in the Maldives."
        keywords="yoosufspeed reviews, maldives ferry testimonials, baa atoll speedboat reviews, passenger feedback"
        canonical="https://yoosuf.mv/testimonials"
      />
      <Navigation />
      
      <main className="flex-1">
        <div className="bg-primary text-white py-16">
          <div className="container px-4 text-center">
            <h1 className="text-4xl font-display font-bold mb-4">Customer Reviews</h1>
            <p className="text-blue-100 max-w-2xl mx-auto">
              See what our travelers have to say about their journey with YoosuSpeed.
            </p>
          </div>
        </div>

        <div className="container px-4 py-12">
          {/* Reviews Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {isLoading ? (
              <div className="col-span-full flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : testimonials?.length === 0 ? (
              <div className="col-span-full text-center py-10 text-muted-foreground">
                No reviews yet. Be the first to share your experience!
              </div>
            ) : (
              testimonials?.map((review) => (
                <div key={review.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                  <div className="flex gap-1 mb-4 text-yellow-400">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-slate-600 flex-1 mb-6 italic leading-relaxed">"{review.content}"</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-900">{review.name}</p>
                      <p className="text-xs text-slate-500">Verified Traveler</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Submission Form */}
          <div className="max-w-xl mx-auto bg-white p-8 rounded-3xl shadow-lg border border-slate-100">
            <div className="text-center mb-8">
              <Quote className="h-10 w-10 text-primary/20 mx-auto mb-4" />
              <h2 className="text-2xl font-display font-bold">Share your experience</h2>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Name</label>
                <input 
                  {...form.register("name")}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                  placeholder="John Doe"
                />
                {form.formState.errors.name && <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Rating</label>
                <select 
                  {...form.register("rating")}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (Excellent)</option>
                  <option value={4}>⭐⭐⭐⭐ (Good)</option>
                  <option value={3}>⭐⭐⭐ (Average)</option>
                  <option value={2}>⭐⭐ (Poor)</option>
                  <option value={1}>⭐ (Terrible)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Your Review</label>
                <textarea 
                  {...form.register("content")}
                  rows={4}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all outline-none resize-none"
                  placeholder="Tell us about your trip..."
                />
                {form.formState.errors.content && <p className="text-xs text-red-500">{form.formState.errors.content.message}</p>}
              </div>

              <button 
                type="submit"
                disabled={isPending}
                className="w-full py-3 bg-primary text-white rounded-xl font-bold shadow-lg hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                {isPending ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
