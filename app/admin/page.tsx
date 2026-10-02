"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Plus, Users, Mail, Phone, Calendar, ShieldAlert, CheckCircle } from "lucide-react"

export default function SuperAdminPage() {
  const [leads, setLeads] = useState<any[]>([])
  const [approvedOwners, setApprovedOwners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [newOwnerEmail, setNewOwnerEmail] = useState("")
  
  const supabase = createClient()

  useEffect(() => {
    checkAdminAndLoad()
  }, [])

  async function checkAdminAndLoad() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
       window.location.href = "/auth/login"
       return
    }

    const { data: profile } = await supabase.from("profiles").select("is_super_admin").eq("id", user.id).single()
    
    if (!profile?.is_super_admin) {
        setIsSuperAdmin(false)
        setLoading(false)
        return
    }

    setIsSuperAdmin(true)
    
    const [leadsRes, approvedRes] = await Promise.all([
      supabase.from("owner_leads").select("*").order("created_at", { ascending: false }),
      supabase.from("approved_owners").select("*").order("approved_at", { ascending: false })
    ])

    setLeads(leadsRes.data || [])
    setApprovedOwners(approvedRes.data || [])
    setLoading(false)
  }

  const handleApprove = async (email: string) => {
    try {
      await supabase.from("approved_owners").insert({ email })
      await supabase.from("owner_leads").update({ status: 'closed' }).eq("email", email)
      checkAdminAndLoad()
      alert(`Owner Approved: ${email}`)
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleDeleteApproved = async (email: string) => {
    if(!confirm("Remove access for this owner?")) return
    await supabase.from("approved_owners").delete().eq("email", email)
    checkAdminAndLoad()
  }

  const handleAddManualOwner = async () => {
    if(!newOwnerEmail) return
    await supabase.from("approved_owners").insert({ email: newOwnerEmail })
    setNewOwnerEmail("")
    checkAdminAndLoad()
  }

  if (loading) return <div className="p-8 text-white">Verifying Admin Access...</div>

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center text-white">
        <ShieldAlert className="w-20 h-20 text-red-500 mb-6" />
        <h1 className="text-4xl font-black mb-4">ACCESS DENIED</h1>
        <p className="text-slate-400 max-w-md">You do not have permission to access the Super Admin Dashboard. Only the developer of StartupSphere can manage business invitations.</p>
        <Button onClick={() => window.location.href = "/"} className="mt-8 bg-white text-black hover:bg-slate-200">Go Home</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-black flex items-center gap-4">
            <Users className="text-blue-500 w-10 h-10" />
            Super Admin Control
          </h1>
          <p className="text-slate-400 mt-2 text-lg">Manage business access and view incoming leads.</p>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Approved Owners List */}
          <div className="lg:col-span-1 space-y-6">
             <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-xl">Authorize New Owner</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input 
                        placeholder="owner@business.com" 
                        value={newOwnerEmail}
                        onChange={(e) => setNewOwnerEmail(e.target.value)}
                        className="bg-slate-800 border-slate-700"
                    />
                    <Button onClick={handleAddManualOwner} className="bg-blue-600 hover:bg-blue-700">
                       <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
             </Card>

             <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                   <CardTitle className="text-xl">Approved Emails ({approvedOwners.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   {approvedOwners.map(owner => (
                     <div key={owner.email} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg border border-slate-700 group">
                        <span className="text-sm font-medium">{owner.email}</span>
                        <Button 
                            onClick={() => handleDeleteApproved(owner.email)}
                            variant="ghost" 
                            className="text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                           <Trash2 className="w-4 h-4" />
                        </Button>
                     </div>
                   ))}
                </CardContent>
             </Card>
          </div>

          {/* Incoming Leads Table */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">Interested Leads ({leads.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {leads.length === 0 ? (
                  <p className="text-slate-500 py-8 text-center italic">No new leads. Your marketing is quiet!</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="border-b border-slate-800">
                        <tr className="text-slate-400 text-sm uppercase">
                          <th className="pb-4 font-semibold">Business / Owner</th>
                          <th className="pb-4 font-semibold">Contact Info</th>
                          <th className="pb-4 font-semibold">Date</th>
                          <th className="pb-4 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {leads.map(lead => (
                          <tr key={lead.id} className="hover:bg-slate-800/20 transition-colors">
                            <td className="py-6">
                               <div className="font-bold text-white mb-1">{lead.business_name}</div>
                               <div className="flex items-center text-xs text-slate-500">
                                  <Mail className="w-3 h-3 mr-1" /> {lead.email}
                               </div>
                            </td>
                            <td className="py-6">
                               <div className="flex items-center text-sm font-medium text-blue-400">
                                  <Phone className="w-3 h-3 mr-1" /> {lead.phone}
                               </div>
                            </td>
                            <td className="py-6">
                               <div className="flex items-center text-xs text-slate-500">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {new Date(lead.created_at).toLocaleDateString()}
                               </div>
                            </td>
                            <td className="py-6 text-right">
                              <Button 
                                onClick={() => handleApprove(lead.email)}
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-1 ml-[-2px]" />
                                Approve
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
