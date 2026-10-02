"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Printer, CheckCircle2, Package, Calendar, User } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ReceiptPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    async function loadReceipt() {
      // Fetch order details publicly
      const { data: orderData, error } = await supabase
        .from("sales_orders")
        .select("*, order_items(*, products(name)), owner:profiles(company_name, address, email, gstin)")
        .eq("id", params.id)
        .single()

      if (error) {
        console.error("Error loading receipt:", error)
      } else {
        setOrder(orderData)
        setProfile(orderData.owner)
      }
      setLoading(false)
    }
    loadReceipt()
  }, [params.id, supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Invoice Not Found</h1>
          <p className="text-slate-400">The requested receipt could not be located.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Success Header */}
        <div className="bg-green-500 p-8 text-center text-white">
          <CheckCircle2 className="w-16 h-16 mx-auto mb-4 animate-bounce" />
          <h1 className="text-3xl font-bold uppercase tracking-tight">Payment Successful</h1>
          <p className="opacity-90 mt-1">Thank you for your purchase from {profile?.company_name}</p>
        </div>

        <div className="p-8 md:p-12">
          {/* Business & Customer Header */}
          <div className="flex flex-col md:flex-row justify-between gap-8 border-bottom pb-8 border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Issued By</h2>
              <div className="space-y-1">
                <p className="text-xl font-black text-slate-900">{profile?.company_name}</p>
                <p className="text-slate-500 text-sm max-w-[250px]">{profile?.address}</p>
                <p className="text-slate-500 text-sm">GSTIN: {profile?.gstin || "N/A"}</p>
              </div>
            </div>
            <div className="md:text-right">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Order Receipt</h2>
              <div className="space-y-1">
                <p className="text-slate-900 font-bold">#{order.id.slice(-8).toUpperCase()}</p>
                <p className="text-slate-500 text-sm">{new Date(order.order_date).toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
                <span className="inline-block bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase mt-2">
                  {order.status}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-10 mb-6 flex items-center gap-2 text-slate-900 font-bold border-b-2 border-slate-900 pb-2">
             <Package className="w-5 h-5" />
             Order Items
          </div>

          {/* Items Table */}
          <table className="w-full text-left mb-10">
            <thead>
              <tr className="text-slate-400 text-xs uppercase tracking-widest border-b border-slate-100">
                <th className="py-4 font-semibold">Item</th>
                <th className="py-4 font-semibold text-center">Qty</th>
                <th className="py-4 font-semibold text-right">Price</th>
                <th className="py-4 font-semibold text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {order.order_items?.map((item: any) => (
                <tr key={item.id}>
                  <td className="py-5 font-medium text-slate-800">{item.products?.name || "Product"}</td>
                  <td className="py-5 text-center text-slate-600">{item.quantity}</td>
                  <td className="py-5 text-right text-slate-600">₹{item.unit_price.toFixed(2)}</td>
                  <td className="py-5 text-right font-bold text-slate-900">₹{item.line_total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Section */}
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8 pt-8 border-t border-slate-100">
             <div className="space-y-4">
                <div className="flex items-center gap-3 text-slate-600">
                   <User className="w-4 h-4" />
                   <div className="text-sm">
                      <p className="font-semibold text-slate-900">{order.customer_name || "Walk-in Customer"}</p>
                      <p className="text-xs text-slate-400">{order.customer_phone || "No phone provided"}</p>
                   </div>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                   <Calendar className="w-4 h-4" />
                   <p className="text-sm">Paid on {new Date(order.order_date).toLocaleTimeString('en-IN', { timeStyle: 'short' })}</p>
                </div>
             </div>

             <div className="bg-slate-50 p-6 rounded-xl w-full md:w-80">
                <div className="flex justify-between text-slate-600 mb-2">
                   <span>Subtotal</span>
                   <span>₹{(order.total_amount - order.gst_amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600 mb-4 border-b border-slate-200 pb-2">
                   <span>GST (18%)</span>
                   <span>₹{order.gst_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-2xl font-black text-slate-900">
                   <span>Total Paid</span>
                   <span>₹{order.total_amount.toFixed(2)}</span>
                </div>
             </div>
          </div>

          <div className="mt-12 text-center no-print">
            <Button 
                onClick={() => window.print()}
                className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-6 rounded-full shadow-xl transition-all hover:scale-105 active:scale-95"
            >
              <Printer className="w-5 h-5 mr-2" />
              Download Receipt (PDF)
            </Button>
            <p className="text-slate-400 text-xs mt-6">
              This is a digital receipt for your transaction at {profile?.company_name}.
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .min-h-screen { py-0 !important; }
          .max-w-3xl { shadow: none !important; border: none !important; }
        }
      `}</style>
    </div>
  )
}
