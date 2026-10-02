"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle } from "lucide-react"

export default function OwnerSignUpPage() {
  const router = useRouter()
  const supabase = createClient()
  const [formData, setFormData] = useState({
    companyName: "",
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
      // 1. Check if email is in approved_owners
      const { data: approved, error: checkError } = await supabase
        .from("approved_owners")
        .select("*")
        .eq("email", formData.email)
        .single()

      if (!approved || checkError) {
        setError("Your email has not been authorized. Please request access first.");
        setLoading(false);
        // Give the user a moment to read the error before redirecting or show a link
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password
      })

      if (signUpError) throw signUpError

      if (data.user) {
        await supabase.from("profiles").insert({
          id: data.user.id,
          company_name: formData.companyName,
          role: "owner",
          email: formData.email,
          can_manage_inventory: true,
          can_manage_sales: true,
          can_manage_accounting: true,
        })

        router.replace("/auth/redirect")
      }
    } catch (err: any) {
      setError(err.message || "Failed to create account")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 backdrop-blur-sm shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Create Your Startup</h1>
            <p className="text-slate-400">Get started with StartupSphere</p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Company Name</label>
              <Input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="My Startup Inc."
                required
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="owner@startup.com"
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
              {loading ? "Creating account..." : "Create Owner Account"}
            </Button>
          </form>

          <p className="text-center text-slate-400 mt-6 text-sm">
            Don't have an invite?{" "}
            <Link href="/request-access" className="text-blue-400 hover:text-blue-300 font-medium">
              Request Access
            </Link>
          </p>
          <p className="text-center text-slate-400 mt-2 text-sm">
            Already have an account?{" "}
            <Link href="/auth/owner-login" className="text-blue-400 hover:text-blue-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
