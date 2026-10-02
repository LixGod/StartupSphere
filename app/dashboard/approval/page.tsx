"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react"

export default function ApprovalPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    loadData()

    const channel = supabase
      .channel("approval-requests-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "employee_requests" }, () => {
        console.log("Employee request changed, reloading...")
        loadData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const loadData = async () => {
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data: profileData, error: profileError } = await supabase.from("profiles").select("*").eq("id", user.id).single()
    
    if (profileError) {
      console.error("Error fetching profile:", profileError)
      setLoading(false)
      return
    }
    
    setProfile(profileData)

    if (profileData?.role === "owner") {
      console.log("Owner email from auth:", user.email)
      
      const { data: reqData, error } = await supabase
        .from("employee_requests")
        .select("*")
        .eq("owner_email", user.email)
        .eq("status", "pending")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading employee requests:", error)
      } else {
        console.log("Loaded employee requests:", reqData, "Error:", error)
      }
      
      setRequests(reqData || [])
    }

    setLoading(false)
  }

  const handleApprove = async (request: any) => {
    try {
      console.log("Approving request:", request)

      const { data: newUser, error: signUpError } = await supabase.auth.signUp({
        email: request.employee_email,
        password: request.employee_password_hash,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin,
        },
      })

      if (signUpError) throw signUpError

      if (newUser.user) {
        const { error: profileError } = await supabase.from("profiles").insert({
          id: newUser.user.id,
          company_name: profile.company_name,
          role: "employee",
          owner_id: profile.id,
          email: request.employee_email,
          can_manage_inventory: false,
          can_manage_sales: false,
          can_manage_accounting: false,
        })

        if (profileError) throw profileError
      }

      const { error: deleteError } = await supabase.from("employee_requests").delete().eq("id", request.id)

      if (deleteError) throw deleteError

      alert("Employee approved successfully! They can now log in.")
      loadData()
    } catch (error: any) {
      console.error("Error approving employee:", error)
      alert("Error approving employee: " + error.message)
    }
  }

  const handleReject = async (requestId: string) => {
    try {
      console.log("Rejecting request:", requestId)

      const { error } = await supabase.from("employee_requests").delete().eq("id", requestId)

      if (error) throw error

      alert("Request rejected and removed.")
      loadData()
    } catch (error: any) {
      console.error("Error rejecting request:", error)
      alert("Error rejecting request: " + error.message)
    }
  }

  if (profile?.role !== "owner") {
    return (
      <div className="p-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <p className="text-slate-400">Only owners can approve employee requests</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Clock className="w-8 h-8 text-amber-400" />
          Pending Employee Requests
        </h1>
        <p className="text-slate-400 mt-1">Review and approve employee access requests</p>
      </div>

      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <p className="text-slate-400">Loading requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No pending requests</p>
          <p className="text-sm text-slate-500 mt-2">New employee requests will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="bg-slate-900 border border-amber-600/30 rounded-xl p-6 hover:bg-slate-800/50 transition-all shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center">
                      <span className="text-blue-400 font-bold text-sm">
                        {request.employee_email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-white text-lg">{request.employee_email}</p>
                      <p className="text-sm text-slate-400">
                        Requested {new Date(request.created_at).toLocaleDateString()} at{" "}
                        {new Date(request.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="ml-13 mt-3">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-600/10 border border-amber-600/30 rounded-full text-xs text-amber-400 font-medium">
                      <Clock className="w-3 h-3" />
                      Pending Approval
                    </span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => handleApprove(request)} className="bg-green-600 hover:bg-green-700 shadow-lg">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleReject(request.id)}
                    variant="outline"
                    className="border-red-900/50 text-red-400 hover:bg-red-950/50 hover:text-red-300"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
