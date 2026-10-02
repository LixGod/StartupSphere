"use client"

import { Package, ShoppingCart, TrendingUp, TrendingDown, DollarSign, AlertTriangle, BarChart3, Calendar, HelpCircle } from "lucide-react"
import Link from "next/link"

export function DashboardOverview({ stats }: { stats: any }) {
  // Provide default values for stats to prevent blank overview
  const safeStats = {
    totalProducts: stats?.totalProducts || 0,
    totalOrders: stats?.totalOrders || 0,
    totalRevenue: stats?.totalRevenue || 0,
    totalExpenses: stats?.totalExpenses || 0,
    monthlyOrders: stats?.monthlyOrders || 0,
    monthlyRevenue: stats?.monthlyRevenue || 0,
    monthlyExpenses: stats?.monthlyExpenses || 0,
    lowStockProducts: stats?.lowStockProducts || [],
  }

  const profit = safeStats.totalRevenue - safeStats.totalExpenses
  const monthlyProfit = safeStats.monthlyRevenue - safeStats.monthlyExpenses

  // Tooltip helper
  const Tooltip = ({ text, children }: { text: string; children: React.ReactNode }) => (
    <div className="group relative inline-block">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {text}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Low Stock Alerts */}
      {safeStats.lowStockProducts && safeStats.lowStockProducts.length > 0 && (
        <div className="bg-red-900/20 border border-red-600/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <h3 className="text-lg font-semibold text-white">⚠️ Low Stock Alerts</h3>
          </div>
          <div className="space-y-2">
            {safeStats.lowStockProducts.slice(0, 3).map((product: any) => (
              <div key={product.id} className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3">
                <div>
                  <p className="text-white font-medium">{product.name}</p>
                  <p className="text-sm text-slate-400">SKU: {product.sku}</p>
                </div>
                <div className="text-right">
                  <p className="text-red-400 font-bold">{product.stock_quantity} left</p>
                  <p className="text-xs text-slate-500">Need: {product.min_stock_level || 5}</p>
                </div>
              </div>
            ))}
            {safeStats.lowStockProducts.length > 3 && (
              <Link href="/dashboard/inventory" className="text-blue-400 hover:text-blue-300 text-sm">
                View all {safeStats.lowStockProducts.length} low stock items →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Main Stats Grid - Simplified */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Products */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-blue-600/50 transition-all shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-400" />
            </div>
            <Tooltip text="Total items in your inventory">
              <HelpCircle className="w-4 h-4 text-slate-500 hover:text-slate-400 cursor-help" />
            </Tooltip>
          </div>
          <p className="text-slate-400 text-sm mb-1">📦 Total Products</p>
          <p className="text-3xl font-bold text-white">{safeStats.totalProducts}</p>
          <p className="text-xs text-slate-500 mt-2">
            {safeStats.lowStockProducts?.length || 0} need restocking
          </p>
        </div>

        {/* Total Orders */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-cyan-600/50 transition-all shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-cyan-600/20 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-cyan-400" />
            </div>
            <Tooltip text="Every order = a sale from a customer">
              <HelpCircle className="w-4 h-4 text-slate-500 hover:text-slate-400 cursor-help" />
            </Tooltip>
          </div>
          <p className="text-slate-400 text-sm mb-1">🛒 Total Orders</p>
          <p className="text-3xl font-bold text-white">{safeStats.totalOrders}</p>
          <p className="text-xs text-slate-500 mt-2">
            {safeStats.monthlyOrders} orders this month
          </p>
        </div>

        {/* Total Revenue */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-green-600/50 transition-all shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
            <Tooltip text="Total money from all orders (all time)">
              <HelpCircle className="w-4 h-4 text-slate-500 hover:text-slate-400 cursor-help" />
            </Tooltip>
          </div>
          <p className="text-slate-400 text-sm mb-1">💰 Total Money In (All Time)</p>
          <p className="text-3xl font-bold text-green-400">₹{safeStats.totalRevenue?.toLocaleString() || '0'}</p>
          <p className="text-xs text-slate-500 mt-2">
            ₹{safeStats.monthlyRevenue?.toLocaleString() || '0'} this month
          </p>
        </div>

        {/* Net Profit */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-amber-600/50 transition-all shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-600/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-amber-400" />
            </div>
            <Tooltip text="Money left after all expenses (all time)">
              <HelpCircle className="w-4 h-4 text-slate-500 hover:text-slate-400 cursor-help" />
            </Tooltip>
          </div>
          <p className="text-slate-400 text-sm mb-1">📊 Net Profit (All Time)</p>
          <p className={`text-3xl font-bold ${profit >= 0 ? "text-blue-400" : "text-red-400"}`}>
            ₹{profit.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            {profit >= 0 ? "+" : ""}₹{monthlyProfit.toLocaleString()} this month
          </p>
        </div>
      </div>

      {/* Simplified Monthly Breakdown */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* This Month's Revenue */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">This Month's Income</h3>
          </div>
          <p className="text-3xl font-bold text-green-400 mb-2">₹{safeStats.monthlyRevenue?.toLocaleString() || '0'}</p>
          <p className="text-sm text-slate-400">
            From <span className="text-cyan-400 font-bold">{safeStats.monthlyOrders}</span> orders
          </p>
          <div className="mt-4 pt-4 border-t border-slate-700">
            <p className="text-xs text-slate-500">Average per order: <span className="text-white">₹{safeStats.monthlyOrders > 0 ? (safeStats.monthlyRevenue / safeStats.monthlyOrders).toFixed(0) : '0'}</span></p>
          </div>
        </div>

        {/* This Month's Expenses */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <TrendingDown className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-semibold text-white">This Month's Expenses</h3>
          </div>
          <p className="text-3xl font-bold text-amber-400 mb-2">₹{safeStats.monthlyExpenses?.toLocaleString() || '0'}</p>
          <p className="text-sm text-slate-400">
            Spending on operations
          </p>
          <div className="mt-4 pt-4 border-t border-slate-700">
            <p className="text-xs text-slate-500">
              <span className="text-white">{safeStats.monthlyRevenue > 0 ? ((safeStats.monthlyExpenses / safeStats.monthlyRevenue) * 100).toFixed(1) : '0'}%</span> of income
            </p>
          </div>
        </div>

        {/* This Month's Profit */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">This Month's Profit</h3>
          </div>
          <p className={`text-3xl font-bold mb-2 ${monthlyProfit >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
            ₹{monthlyProfit?.toLocaleString() || '0'}
          </p>
          <p className="text-sm text-slate-400">
            Income minus expenses
          </p>
          <div className="mt-4 pt-4 border-t border-slate-700">
            <p className="text-xs text-slate-500">
              <span className={monthlyProfit >= 0 ? 'text-green-400' : 'text-red-400'}>
                {monthlyProfit >= 0 ? '✓ Profitable' : '✗ At loss'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Quick Facts for Beginners */}
      <div className="bg-blue-900/20 border border-blue-600/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">💡 Understanding Your Dashboard</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="flex gap-3">
            <span className="text-blue-400">•</span>
            <div>
              <p className="text-white font-medium">Orders = Sales</p>
              <p className="text-slate-400">Each order is money from a customer</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-blue-400">•</span>
            <div>
              <p className="text-white font-medium">Revenue = Total Money In</p>
              <p className="text-slate-400">Sum of all orders' totals</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-blue-400">•</span>
            <div>
              <p className="text-white font-medium">Expenses = Money You Spend</p>
              <p className="text-slate-400">Salaries, rent, supplies, etc.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-blue-400">•</span>
            <div>
              <p className="text-white font-medium">Profit = What You Keep</p>
              <p className="text-slate-400">Revenue minus Expenses</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
