import { AdminLayout } from "@/components/AdminLayout";
import { useContactMessages } from "@/hooks/use-contact";
import { Mail } from "lucide-react";

export default function AdminMessages() {
  const { data: messages } = useContactMessages();

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Contact Messages</h1>
        <p className="text-slate-500">Inquiries from the contact form.</p>
      </div>

      <div className="space-y-4">
        {messages?.map((msg) => (
          <div key={msg.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center text-primary">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{msg.subject}</h3>
                  <p className="text-sm text-slate-500">From: {msg.name} ({msg.email})</p>
                </div>
              </div>
              <span className="text-xs text-slate-400">{new Date(msg.createdAt || '').toLocaleString()}</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg text-slate-700 text-sm">
              {msg.message}
            </div>
          </div>
        ))}
        {!messages?.length && (
           <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed">No messages received yet.</div>
        )}
      </div>
    </AdminLayout>
  );
}
