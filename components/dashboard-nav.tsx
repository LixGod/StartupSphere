"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { LogOut, UserIcon, ChevronDown, Package, ShoppingCart, TrendingUp, Bot, Users, Store, Home, ShieldCheck } from "lucide-react"

export function DashboardNav({ user }: { user: any }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()
      if (error) {
        console.error("Error loading profile:", error)
        return
      }
      setProfile(data)
    } catch (error) {
      console.error("Error loading profile:", error)
    }
  }

  const handleLogout = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    router.push("/")
  }

  const navItems = [
    { href: "/dashboard/overview", label: "Overview", icon: Home },
    { href: "/dashboard/inventory", label: "Inventory", icon: Package },
    { href: "/dashboard/sales", label: "Sales & POS", icon: ShoppingCart },
    { href: "/dashboard/accounting", label: "Accounting", icon: TrendingUp },
    { href: "/dashboard/ai-marketing", label: "AI Marketing", icon: Bot },
    { href: "/dashboard/employees", label: "Employees", icon: Users },
    { href: "/dashboard/store-connect", label: "Connect Store", icon: Store },
  ]

  if (profile?.is_super_admin) {
    navItems.push({ href: "/admin", label: "Super Admin", icon: ShieldCheck })
  }

  return (
    <nav className="w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col min-h-screen">
      {/* Company Header with Dropdown */}
      <div className="relative mb-8">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full text-left hover:bg-slate-800 rounded-lg p-3 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{profile?.company_name || user.email?.split('@')[0] + "'s Startup" || "Dashboard"}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
              />
            </div>
          </div>
        </button>

        {dropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50">
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 first:rounded-t-lg transition-colors"
              onClick={() => setDropdownOpen(false)}
            >
              <UserIcon className="w-4 h-4" />
              Profile
            </Link>
            <button
              onClick={handleLogout}
              disabled={loading}
              className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 last:rounded-b-lg transition-colors border-t border-slate-700"
            >
              <LogOut className="w-4 h-4" />
              {loading ? "Logging out..." : "Logout"}
            </button>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
