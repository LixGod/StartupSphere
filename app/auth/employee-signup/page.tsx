"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle, CheckCircle } from "lucide-react"

export default function EmployeeSignUpPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState<"input" | "success">("input")
  const [successEmail, setSuccessEmail] = useState("")
  const [formData, setFormData] = useState({
    ownerEmail: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setLoading(true)

    try {
      // For now, skip owner validation to avoid RLS issues
      // TODO: Re-enable owner validation once RLS policies are updated
      const { error: requestError } = await supabase.from("employee_requests").insert({
        owner_email: formData.ownerEmail,
        employee_email: formData.email,
        employee_password_hash: formData.password,
        status: "pending",
      })

      if (requestError) throw requestError

      // Store the email before clearing the form
      setSuccessEmail(formData.ownerEmail)
      setStep("success")
      // Reset form data after successful submission
      setFormData({
        ownerEmail: "",
        email: "",
        password: "",
        confirmPassword: "",
      })
    } catch (err: any) {
      setError(err.message || "Failed to submit request")
    } finally {
      setLoading(false)
    }
  }

  if (step === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-green-900/20 border border-green-700/50 rounded-xl p-8 backdrop-blur-sm shadow-2xl text-center">
            <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Request Submitted!</h1>
            <p className="text-slate-400 mb-6">
              Your access request has been sent to <span className="text-blue-400">{successEmail}</span>
            </p>
            <p className="text-sm text-slate-500 mb-8">
              You'll be able to log in once the owner approves your request. Check your email for updates.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => setStep("input")}
                className="w-full bg-slate-700 hover:bg-slate-600"
              >
                Submit Another Request
              </Button>
              <Link href="/auth/employee-login">
                <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-800">
                  Back to Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-8 backdrop-blur-sm shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Join a Startup</h1>
            <p className="text-slate-400">Create your account and request access to join a startup</p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Owner's Email</label>
              <Input
                type="email"
                value={formData.ownerEmail}
                onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                placeholder="owner@startup.com"
                required
                className="bg-slate-800 border-slate-700 text-white"
              />
              <p className="text-xs text-slate-500 mt-1">Ask your owner for their registered email</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Your Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@company.com"
                required
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                required
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
              <Input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="••••••••"
                required
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-300 flex gap-2 p-3 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-900/50"
            >
              {loading ? "Submitting..." : "Request Access"}
            </Button>
          </form>

          <p className="text-center text-slate-400 mt-6 text-sm">
            Already approved?{" "}
            <Link href="/auth/employee-login" className="text-blue-400 hover:text-blue-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
