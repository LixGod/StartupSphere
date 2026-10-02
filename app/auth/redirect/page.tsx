"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function AuthRedirect() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function checkRole() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          router.replace("/auth/login")
          return
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()

        if (profileError || !profile) {
          // If no profile, maybe it's a fresh signup, wait a bit or go to login
          router.replace("/auth/login")
          return
        }

        // Both roles go to overview for now, but this allows for future divergence
        if (profile.role === "owner" || profile.role === "employee") {
          router.replace("/dashboard/overview")
        } else {
          router.replace("/auth/login")
        }
      } catch (err) {
        console.error("Redirect error:", err)
        router.replace("/auth/login")
      }
    }
    
    // Small delay to ensure cookies are processed
    const timer = setTimeout(() => {
      checkRole()
    }, 500)
    
    return () => clearTimeout(timer)
  }, [router, supabase])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-medium">Verifying account...</p>
      </div>
    </div>
  )
}
