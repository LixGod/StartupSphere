import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Package, ShoppingCart, TrendingUp, Bot, Users, Store } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Navigation */}
      <nav className="border-b border-slate-800/50 bg-slate-900/30 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              StartupSphere
            </h1>
            <p className="text-xs text-slate-500">Enterprise Management</p>
          </div>
          <div className="flex gap-3">
            <Link href="/auth/owner-login">
              <Button
                variant="ghost"
                className="text-slate-300 hover:text-white hover:bg-slate-800 transition-all duration-200"
              >
                Owner Sign In
              </Button>
            </Link>
            <Link href="/auth/employee-login">
              <Button
                variant="ghost"
                className="text-slate-300 hover:text-white hover:bg-slate-800 transition-all duration-200"
              >
                Employee Sign In
              </Button>
            </Link>
            <Link href="/auth/owner-signup">
              <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-900/50 transition-all duration-200">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-24 text-center">
        <div className="inline-block px-4 py-2 bg-blue-600/10 border border-blue-500/20 rounded-full mb-6">
          <span className="text-blue-400 text-sm font-medium">Trusted by 500+ startups in India</span>
        </div>
        <h2 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
          All-in-One Business
          <br />
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Management Platform
          </span>
        </h2>
        <p className="text-xl text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed">
          Streamline inventory, sales, accounting, and AI-powered marketing. Built for ambitious startups that demand
          excellence.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/auth/owner-signup">
            <Button className="bg-blue-600 hover:bg-blue-700 px-8 py-6 text-lg shadow-lg shadow-blue-900/50 transition-all duration-200 hover:shadow-blue-900/80">
              Start 30-Day Free Trial
            </Button>
          </Link>
          <Link href="#features">
            <Button
              variant="outline"
              className="border-slate-700 hover:bg-slate-800 px-8 py-6 text-lg transition-all duration-200 bg-transparent"
            >
              Explore Features
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold text-white mb-4">Everything You Need To Scale</h3>
          <p className="text-slate-400">Professional tools for modern businesses</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: <Package className="w-8 h-8 text-blue-400" />,
              title: "Inventory Management",
              desc: "Real-time stock tracking, SKU management, and automated alerts",
            },
            {
              icon: <ShoppingCart className="w-8 h-8 text-cyan-400" />,
              title: "POS & Sales",
              desc: "Quick checkout, order management, and customer receipts",
            },
            {
              icon: <TrendingUp className="w-8 h-8 text-emerald-400" />,
              title: "GST Accounting",
              desc: "Compliant invoicing, expense tracking, and P&L reports",
            },
            {
              icon: <Bot className="w-8 h-8 text-violet-400" />,
              title: "AI Marketing",
              desc: "Generate captions, reel concepts, and hashtags instantly",
            },
            {
              icon: <Users className="w-8 h-8 text-amber-400" />,
              title: "Team Management",
              desc: "Employee invitations, role permissions, and approvals",
            },
            {
              icon: <Store className="w-8 h-8 text-rose-400" />,
              title: "E-commerce Sync",
              desc: "Auto-sync inventory and sales from your online store",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="group bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:bg-slate-800/50 hover:border-slate-700 transition-all duration-300 hover:shadow-xl hover:shadow-blue-900/10"
            >
              <div className="mb-4 group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
              <h4 className="font-semibold text-lg text-white mb-2">{feature.title}</h4>
              <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold text-white mb-4">Simple, Transparent Pricing</h3>
          <p className="text-slate-400">Choose the plan that fits your business</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            {
              name: "Starter",
              price: "₹999",
              features: ["Up to 5 employees", "Basic inventory & POS", "Email support", "30-day free trial"],
            },
            {
              name: "Professional",
              price: "₹2,999",
              features: [
                "Up to 20 employees",
                "Advanced inventory & POS",
                "GST accounting",
                "AI marketing",
                "Priority support",
              ],
              featured: true,
            },
            {
              name: "Enterprise",
              price: "₹9,999",
              features: [
                "Unlimited employees",
                "All features included",
                "E-commerce integration",
                "Dedicated account manager",
                "Custom integrations",
              ],
            },
          ].map((plan, i) => (
            <div
              key={i}
              className={`rounded-xl border p-8 transition-all duration-300 hover:shadow-2xl ${
                plan.featured
                  ? "bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-blue-500/50 shadow-xl shadow-blue-900/20 hover:shadow-blue-900/40"
                  : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
              }`}
            >
              {plan.featured && (
                <div className="inline-block px-3 py-1 bg-blue-600 rounded-full text-xs font-medium text-white mb-4">
                  Most Popular
                </div>
              )}
              <h4 className="text-xl font-bold text-white mb-2">{plan.name}</h4>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">{plan.price}</span>
                <span className="text-slate-400">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f, fi) => (
                  <li key={fi} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/auth/owner-signup">
                <Button
                  className={`w-full transition-all duration-200 ${
                    plan.featured
                      ? "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-900/50"
                      : "bg-slate-800 hover:bg-slate-700"
                  }`}
                >
                  {plan.featured ? "Start Free Trial" : "Get Started"}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 bg-slate-900/30 mt-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="text-center text-slate-500 text-sm">
            <p>© 2025 StartupSphere. All rights reserved.</p>
            <p className="mt-2">Built with Next.js, Supabase, and Tailwind CSS</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
