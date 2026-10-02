import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Users, Building2, LogIn } from "lucide-react"

export default function Login() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Startup Sphere</h1>
          <p className="text-slate-400 text-lg">Manage your startup operations efficiently</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Owner Login Card */}
          <Link href="/auth/owner-login">
            <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-8 backdrop-blur-sm shadow-2xl hover:border-blue-600/50 hover:shadow-blue-900/20 transition-all cursor-pointer h-full">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-blue-600/20 rounded-lg flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Startup Owner</h2>
                  <p className="text-slate-400 text-sm">Access your company dashboard</p>
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-900/50 mt-4">
                  <LogIn className="w-4 h-4 mr-2" />
                  Owner Sign In
                </Button>
              </div>
            </div>
          </Link>

          {/* Employee Login Card */}
          <Link href="/auth/employee-login">
            <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-8 backdrop-blur-sm shadow-2xl hover:border-emerald-600/50 hover:shadow-emerald-900/20 transition-all cursor-pointer h-full">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-600/20 rounded-lg flex items-center justify-center">
                  <Users className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Team Member</h2>
                  <p className="text-slate-400 text-sm">Access your workspace</p>
                </div>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-900/50 mt-4">
                  <LogIn className="w-4 h-4 mr-2" />
                  Employee Sign In
                </Button>
              </div>
            </div>
          </Link>
        </div>

        {/* Join Startup Section */}
        <div className="mt-8 text-center">
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
            <p className="text-slate-400 mb-3">Don't have an account yet?</p>
            <Link href="/auth/employee-signup">
              <Button className="w-full md:w-auto bg-slate-700 hover:bg-slate-600">
                Join a Startup
              </Button>
            </Link>
          </div>
        </div>

        {/* Register New Startup */}
        <div className="mt-6 text-center">
          <p className="text-slate-400 text-sm">
            Starting a new company?{" "}
            <Link href="/auth/owner-signup" className="text-blue-400 hover:text-blue-300 font-medium">
              Create your startup
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
