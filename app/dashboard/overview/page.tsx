import { createClient } from "@/lib/supabase/server"
import { DashboardOverview } from "@/components/dashboard-overview"

export default async function OverviewPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const [productsRes, ordersRes, expensesRes] = await Promise.all([
    supabase.from("products").select("*").eq("owner_id", user.id),
    supabase.from("sales_orders").select("*").eq("owner_id", user.id),
    supabase.from("expenses").select("*").eq("owner_id", user.id),
  ])

  const products = productsRes.error ? [] : (productsRes.data || [])
  const orders = ordersRes.error ? [] : (ordersRes.data || [])
  const expenses = expensesRes.error ? [] : (expensesRes.data || [])

  // Calculate low stock alerts
  const lowStockProducts = products.filter((product: any) =>
    product.stock_quantity <= (product.min_stock_level || 5)
  )

  // Calculate additional analytics
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const monthlyOrders = orders.filter((order: any) => {
    const orderDate = new Date(order.created_at)
    return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear
  })

  const monthlyRevenue = monthlyOrders.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0)
  const monthlyExpenses = expenses.filter((expense: any) => {
    const expenseDate = new Date(expense.created_at)
    return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
  }).reduce((sum: number, e: any) => sum + (e.amount || 0), 0)

  const stats = {
    totalProducts: products.length,
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0),
    totalExpenses: expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0),
    monthlyOrders: monthlyOrders.length,
    monthlyRevenue,
    monthlyExpenses,
    lowStockProducts,
  }

  return (
    <div className="p-8">
      <DashboardOverview stats={stats} />
    </div>
  )
}