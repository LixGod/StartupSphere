"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle, Shield, User, Mail, Building, Calendar, Edit2, Check, X, MapPin, Phone, Globe } from "lucide-react"

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editingCompany, setEditingCompany] = useState(false)
  const [companyName, setCompanyName] = useState("")
  const [gstin, setGstin] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [website, setWebsite] = useState("")
  const [description, setDescription] = useState("")
  const [updating, setUpdating] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/owner-login")
      return
    }

     const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single()
    setProfile({ ...data, email: user.email })
    setCompanyName(data.company_name || "")
    setGstin(data.gstin || "")
    setAddress(data.address || "")
    setPhone(data.phone || "")
    setWebsite(data.website || "")
    setDescription(data.description || "")
    setLoading(false)
  }

  const handleUpdateCompanyName = async () => {
    if (!companyName.trim()) return

    setUpdating(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from("profiles")
        .update({
          company_name: companyName.trim(),
          gstin: gstin.trim(),
          address: address.trim(),
          phone: phone.trim(),
          website: website.trim(),
          description: description.trim(),
        })
        .eq("id", user.id)

      if (error) throw error

      setProfile({
        ...profile,
        company_name: companyName.trim(),
        gstin: gstin.trim(),
        address: address.trim(),
        phone: phone.trim(),
        website: website.trim(),
        description: description.trim(),
      })
      setEditingCompany(false)
    } catch (error: any) {
      alert("Error updating company name: " + error.message)
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteProfile = async () => {
    setDeleting(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    try {
      // Delete profile
      await supabase.from("profiles").delete().eq("id", user.id)

      // Signout
      await supabase.auth.signOut()

      // Redirect to home
      router.push("/")
    } catch (error: any) {
      alert("Error deleting profile: " + error.message)
      setDeleting(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">My Profile</h1>
        <p className="text-slate-400 mt-1">View and manage your account information</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading profile...</div>
      ) : profile ? (
        <div className="max-w-3xl space-y-6">
          {/* Profile Info Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-xl">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-400" />
              Account Information
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Mail className="w-4 h-4" />
                  <span>Email Address</span>
                </div>
                <p className="text-lg text-white font-medium">{profile.email}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Building className="w-4 h-4" />
                  <span>Company Name</span>
                </div>
                {editingCompany ? (
                  <div className="flex items-center gap-2">
                     <div className="flex flex-col gap-2 flex-1">
                      <Input
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="bg-slate-800 border-slate-700 text-white"
                        placeholder="Company Name"
                      />
                      <Input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="bg-slate-800 border-slate-700 text-white text-sm"
                        placeholder="Company Slogan / One-line Description"
                      />
                      <Input
                        value={gstin}
                        onChange={(e) => setGstin(e.target.value)}
                        className="bg-slate-800 border-slate-700 text-white"
                        placeholder="GSTIN"
                      />
                      <Input
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="bg-slate-800 border-slate-700 text-white"
                        placeholder="Business Address"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="bg-slate-800 border-slate-700 text-white"
                          placeholder="Phone Number"
                        />
                        <Input
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          className="bg-slate-800 border-slate-700 text-white"
                          placeholder="Website (Optional)"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        onClick={handleUpdateCompanyName}
                        disabled={updating}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {updating ? (
                          <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingCompany(false)
                          setCompanyName(profile.company_name || "")
                          setGstin(profile.gstin || "")
                          setAddress(profile.address || "")
                          setPhone(profile.phone || "")
                          setWebsite(profile.website || "")
                          setDescription(profile.description || "")
                        }}
                        className="border-slate-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-1">
                      <p className="text-lg text-white font-medium">{profile.company_name || "Not set"}</p>
                      {profile.description && (
                        <p className="text-sm text-slate-400 italic">{profile.description}</p>
                      )}
                      <div className="space-y-1 mt-2">
                        {profile.gstin && (
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <span className="font-semibold">GSTIN:</span> {profile.gstin}
                          </p>
                        )}
                        {profile.address && (
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {profile.address}
                          </p>
                        )}
                        {profile.phone && (
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {profile.phone}
                          </p>
                        )}
                        {profile.website && (
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <Globe className="w-3 h-3" /> {profile.website}
                          </p>
                        )}
                      </div>
                    </div>
                    {profile.role === "owner" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingCompany(true)}
                        className="text-slate-400 hover:text-white p-1 h-6 w-6"
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Shield className="w-4 h-4" />
                  <span>Role</span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-lg text-white font-medium capitalize">{profile.role}</p>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      profile.role === "owner"
                        ? "bg-blue-600/20 text-blue-400 border border-blue-600/30"
                        : "bg-cyan-600/20 text-cyan-400 border border-cyan-600/30"
                    }`}
                  >
                    {profile.role === "owner" ? "Owner" : "Employee"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Calendar className="w-4 h-4" />
                  <span>Member Since</span>
                </div>
                <p className="text-lg text-white font-medium">
                  {new Date(profile.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            {profile.role === "employee" && profile.owner_id && (
              <div className="mt-6 bg-cyan-600/10 border border-cyan-600/30 rounded-lg p-4">
                <p className="text-sm text-cyan-300 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  You are an employee of this startup
                </p>
              </div>
            )}
          </div>

          {/* Danger Zone */}
          <div className="bg-red-950/20 border border-red-900/50 rounded-xl p-8 shadow-xl">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h2 className="text-lg font-bold text-white mb-2">Danger Zone</h2>
                <p className="text-sm text-slate-400 mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>

                {deleteConfirm ? (
                  <div className="space-y-3">
                    <div className="bg-red-950/50 border border-red-900/50 rounded-lg p-4">
                      <p className="text-sm font-medium text-red-300 mb-2">
                        Are you absolutely sure you want to delete your account?
                      </p>
                      <p className="text-xs text-red-400">
                        All your data including inventory, sales, and reports will be permanently deleted.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={handleDeleteProfile}
                        disabled={deleting}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        {deleting ? "Deleting Account..." : "Yes, Delete My Account"}
                      </Button>
                      <Button
                        onClick={() => setDeleteConfirm(false)}
                        variant="outline"
                        className="border-slate-700 hover:bg-slate-800"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => setDeleteConfirm(true)}
                    className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-900/50"
                  >
                    Delete Account Permanently
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400">No profile data found</div>
      )}
    </div>
  )
}
