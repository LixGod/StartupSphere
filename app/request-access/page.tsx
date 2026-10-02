"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { CheckCircle2, ArrowRight, ShieldCheck, Zap } from "lucide-react"
import Link from "next/link"

export default function RequestAccessPage() {
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    businessName: "",
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.from("owner_leads").insert({
        email: formData.email,
        phone: formData.phone,
        business_name: formData.businessName,
      })

      if (error) throw error
      setSubmitted(true)
    } catch (error: any) {
      alert("Error: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-slate-900 border-green-500/30 text-center p-8">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-2">Request Received!</h2>
          <p className="text-slate-400 mb-8">
            Thank you for your interest in StartupSphere. Our team will reach out to <strong>{formData.email}</strong> shortly to discuss your business needs and set up your account.
          </p>
          <Link href="/">
            <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white">Return Home</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="grid lg:grid-cols-2 gap-12 max-w-6xl w-full items-center">
        <div>
          <Badge className="bg-blue-600/20 text-blue-400 mb-4 px-4 py-1 border-blue-500/30">Premium Business Access</Badge>
          <h1 className="text-5xl font-black text-white leading-tight mb-6">
            Everything you need to <span className="text-blue-500">Scale</span> your Business.
          </h1>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="bg-blue-500/10 p-3 rounded-lg h-fit">
                <Zap className="text-blue-400 w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-bold">AI Inventory & Invoicing</h3>
                <p className="text-slate-400 text-sm">Scan products and manage GST-compliant invoices in seconds.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="bg-purple-500/10 p-3 rounded-lg h-fit">
                <ShieldCheck className="text-purple-400 w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-bold">Role-Based Team Control</h3>
                <p className="text-slate-400 text-sm">Onboard employees and control their permissions securely.</p>
              </div>
            </div>
          </div>
        </div>

        <Card className="bg-slate-900 border-slate-800 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl text-white font-bold">Join the Exclusive Circle</CardTitle>
            <CardDescription className="text-slate-400">
              Enter your details to request access to the StartupSphere platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Business/Owner Email</label>
                <Input
                  required
                  type="email"
                  placeholder="name@business.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Phone Number (WhatsApp)</label>
                <Input
                  required
                  placeholder="+91 9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Business Name</label>
                <Input
                  required
                  placeholder="Your Startup Ltd."
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <Button disabled={loading} type="submit" className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-lg font-bold">
                {loading ? "Submitting..." : "Request Invitiation"}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <p className="text-center text-slate-500 text-xs mt-4">
                Already have an invite? <Link href="/auth/owner-login" className="text-blue-400 hover:underline">Sign In</Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>
      {children}
    </span>
  )
}
