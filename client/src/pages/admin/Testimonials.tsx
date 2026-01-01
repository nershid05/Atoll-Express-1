import { AdminLayout } from "@/components/AdminLayout";
import { useAdminTestimonials, useApproveTestimonial } from "@/hooks/use-testimonials";
import { Star, CheckCircle, XCircle } from "lucide-react";

export default function AdminTestimonials() {
  const { data: testimonials } = useAdminTestimonials();
  const { mutate: setApproval } = useApproveTestimonial();

  return (
    <AdminLayout>
       <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Moderate Reviews</h1>
        <p className="text-slate-500">Approve or reject customer testimonials.</p>
      </div>

      <div className="grid gap-4">
        {testimonials?.map((review) => (
          <div key={review.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-bold text-slate-900">{review.name}</span>
                <div className="flex text-yellow-400">
                  {[...Array(review.rating)].map((_, i) => <Star key={i} className="h-3 w-3 fill-current" />)}
                </div>
                {!review.approved && (
                  <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full">Pending</span>
                )}
              </div>
              <p className="text-slate-600 italic">"{review.content}"</p>
              <p className="text-xs text-slate-400 mt-2">{new Date(review.createdAt || '').toLocaleDateString()}</p>
            </div>
            
            <div className="flex gap-3">
              {review.approved ? (
                <button 
                  onClick={() => setApproval({ id: review.id, approved: false })}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg"
                >
                  <XCircle className="h-4 w-4" /> Unapprove
                </button>
              ) : (
                <button 
                  onClick={() => setApproval({ id: review.id, approved: true })}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg"
                >
                  <CheckCircle className="h-4 w-4" /> Approve
                </button>
              )}
            </div>
          </div>
        ))}
        {!testimonials?.length && (
           <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed">No testimonials submitted yet.</div>
        )}
      </div>
    </AdminLayout>
  );
}
