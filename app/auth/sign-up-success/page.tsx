import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
          <div className="text-5xl mb-4">✓</div>
          <h1 className="text-3xl font-bold text-white mb-2">Account Created!</h1>
          <p className="text-slate-400 mb-6">
            Please check your email to confirm your account and get started with StartupSphere.
          </p>
          <Link href="/auth/employee-login">
            <Button className="w-full bg-blue-600 hover:bg-blue-700">Back to Login</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
