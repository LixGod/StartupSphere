"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { Trash2, Edit, X, Plus, MessageCircle, Mail, Printer } from "lucide-react"
import { sendNotification } from "@/lib/notifications"

export default function SalesPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateSale, setShowCreateSale] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState("")
  const [saleFormData, setSaleFormData] = useState({
    quantity: "1",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    gstRate: "18",
  })
  const [editingOrder, setEditingOrder] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([])
  const [showPOS, setShowPOS] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadData()

    const channel = supabase
      .channel("sales-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "sales_orders" }, (payload) => {
        console.log("Sales order changed:", payload)
        loadData()
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, (payload) => {
        console.log("Product changed:", payload)
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
      // Middleware will handle redirect, just return
      setLoading(false)
      return
    }

    const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()
    setProfile(profileData)

    const ownerId = profileData?.role === "owner" ? user.id : profileData?.owner_id

    const [ordersRes, productsRes] = await Promise.all([
      supabase
        .from("sales_orders")
        .select("*, order_items(*, products(name))")
        .eq("owner_id", ownerId)
        .order("order_date", { ascending: false }),
      supabase.from("products").select("*").eq("owner_id", ownerId).gt("stock_quantity", 0),
    ])

    setOrders(ordersRes.data || [])
    setProducts(productsRes.data || [])
    setLoading(false)
  }

  const addToCart = (product: any) => {
    const existing = cart.find((item) => item.product.id === product.id)
    if (existing) {
      setCart(cart.map((item) => (item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)))
    } else {
      setCart([...cart, { product, quantity: 1 }])
    }
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setCart(cart.map((item) => (item.product.id === productId ? { ...item, quantity } : item)))
  }

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  }

  const handleCheckout = async () => {
    if (cart.length === 0) return

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const ownerId = profile?.role === "owner" ? user.id : profile?.owner_id
    const total = calculateTotal()
    const gstAmount = total * 0.18

    try {
      const { data: order, error: orderError } = await supabase
        .from("sales_orders")
        .insert({
          owner_id: ownerId,
          created_by: user.id,
          customer_name: saleFormData.customerName || "Walk-in Customer",
          customer_phone: saleFormData.customerPhone || "",
          customer_email: saleFormData.customerEmail || "",
          total_amount: total + gstAmount,
          gst_amount: gstAmount,
          status: "completed",
        })
        .select()
        .single()

      if (orderError) throw orderError

      for (const item of cart) {
        await supabase.from("order_items").insert({
          order_id: order.id,
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.product.price,
          line_total: item.product.price * item.quantity,
        })

      }

      // Automatically create an invoice for this POS sale
      const invoiceNumber = `INV-POS-${order.id.slice(-6).toUpperCase()}`
      await supabase.from("invoices").insert({
        owner_id: ownerId,
        order_id: order.id,
        invoice_number: invoiceNumber,
        customer_name: saleFormData.customerName || "Walk-in Customer",
        subtotal: total,
        gst_rate: 18,
        gst_amount: gstAmount,
        total_amount: total + gstAmount,
        status: "paid", // POS sales are usually paid immediately
      })

      // Automatically create COGS expense for the sale
      const totalCost = cart.reduce((sum, item) => sum + (item.product.cost_price * item.quantity), 0)
      if (totalCost > 0) {
        await supabase.from("expenses").insert({
          owner_id: ownerId,
          category: "Cost of Goods Sold",
          description: `COGS for Order #${order.id.slice(-8)} - ${cart.length} item(s)`,
          amount: totalCost,
          expense_date: new Date().toISOString().split("T")[0],
          gst_applicable: false,
          gst_amount: 0,
        })
      }

      await sendNotification({
        actionType: "sale_created",
        entityType: "order",
        entityId: order.id,
        message: `Order for ${saleFormData.customerName || "Walk-in Customer"} (₹${(total + gstAmount).toFixed(2)}) created by ${profile?.email || "team member"}`,
        ownerId,
        userId: user.id,
      })

      setCart([])
      setSaleFormData({ quantity: "1", customerName: "", gstRate: "18" })
      setShowPOS(false)
      loadData()
      alert("Order completed successfully!")
    } catch (error: any) {
      alert("Error creating order: " + error.message)
    }
  }

  const handleCreateSaleFromInventory = async (e: React.FormEvent) => {
    e.preventDefault()

    const product = products.find((p) => p.id === selectedProductId)
    if (!product) return

    const quantity = Number.parseInt(saleFormData.quantity)
    if (quantity <= 0 || quantity > product.stock_quantity) {
      alert(`Invalid quantity. Available stock: ${product.stock_quantity}`)
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const ownerId = profile?.role === "owner" ? user.id : profile?.owner_id

    const subtotal = product.price * quantity
    const gstRate = saleFormData.gstRate === "none" ? 0 : Number.parseFloat(saleFormData.gstRate) / 100
    const gstAmount = subtotal * gstRate
    const totalAmount = subtotal + gstAmount

    try {
      const { data: order, error: orderError } = await supabase
        .from("sales_orders")
        .insert({
          owner_id: ownerId,
          created_by: user.id,
          customer_name: saleFormData.customerName || "Walk-in Customer",
          customer_phone: saleFormData.customerPhone || "",
          customer_email: saleFormData.customerEmail || "",
          total_amount: totalAmount,
          gst_amount: gstAmount,
          status: "completed",
        })
        .select()
        .single()

      if (orderError) throw orderError

      await supabase.from("order_items").insert({
        order_id: order.id,
        product_id: product.id,
        quantity: quantity,
        unit_price: product.price,
        line_total: subtotal,
      })

      await supabase
        .from("products")
        .update({
          stock_quantity: product.stock_quantity - quantity,
        })
        .eq("id", product.id)

      // Automatically create an invoice for this inventory sale
      const invoiceNumber = `INV-INV-${order.id.slice(-6).toUpperCase()}`
      await supabase.from("invoices").insert({
        owner_id: ownerId,
        order_id: order.id,
        invoice_number: invoiceNumber,
        customer_name: saleFormData.customerName || "Walk-in Customer",
        subtotal: subtotal,
        gst_rate: Number.parseFloat(saleFormData.gstRate) || 0,
        gst_amount: gstAmount,
        total_amount: totalAmount,
        status: "paid",
      })

      // Automatically create COGS expense for the sale
      const totalCost = product.cost_price * quantity
      if (totalCost > 0) {
        await supabase.from("expenses").insert({
          owner_id: ownerId,
          category: "Cost of Goods Sold",
          description: `COGS for Sale #${order.id.slice(-8)} - ${product.name}`,
          amount: totalCost,
          expense_date: new Date().toISOString().split("T")[0],
          gst_applicable: false,
          gst_amount: 0,
        })
      }

      await sendNotification({
        actionType: "sale_created",
        entityType: "order",
        entityId: order.id,
        message: `Sale of ${product.name} created by ${profile?.email || "team member"}`,
        ownerId,
        userId: user.id,
      })

      setSaleFormData({ quantity: "1", customerName: "", gstRate: "18" })
      setSelectedProductId("")
      setShowCreateSale(false)
      alert("Sale created successfully!")
      loadData()
    } catch (error: any) {
      alert("Error creating sale: " + error.message)
    }
  }

  const handleEditOrder = async () => {
    if (!editingOrder) return

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const ownerId = profile?.role === "owner" ? user.id : profile?.owner_id

      // 1. Fetch original items to reconcile stock
      const { data: originalItems } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", editingOrder.id)

      // 2. Update each item and reconcile stock
      if (editingOrder.order_items) {
        for (const item of editingOrder.order_items) {
          const original = originalItems?.find(oi => oi.id === item.id)
          
          if (original) {
            // Reconcile stock: Add back original qty, subtract new qty
            const qtyDiff = original.quantity - item.quantity;
            if (qtyDiff !== 0) {
              await supabase.rpc('increment_stock', { 
                product_id: item.product_id, 
                amount: qtyDiff 
              })
            }
            
            await supabase
              .from("order_items")
              .update({
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                line_total: item.line_total
              })
              .eq("id", item.id)
          }
        }
      }

      // 3. Update the main order
      const { error } = await supabase
        .from("sales_orders")
        .update({
          customer_name: editingOrder.customer_name,
          customer_phone: editingOrder.customer_phone,
          customer_email: editingOrder.customer_email,
          total_amount: editingOrder.total_amount,
          gst_amount: editingOrder.gst_amount,
          status: editingOrder.status,
        })
        .eq("id", editingOrder.id)

      if (error) throw error

      await sendNotification({
        actionType: "sale_updated",
        entityType: "order",
        entityId: editingOrder.id,
        message: `Order #${editingOrder.id.slice(-8)} updated by ${profile?.email || "team member"}`,
        ownerId,
        userId: user.id,
      })

      setEditingOrder(null)
      loadData()
      alert("Order updated successfully!")
    } catch (error: any) {
      alert("Error updating order: " + error.message)
    }
  }

  const handleBulkDeleteOrders = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedOrderIds.length} orders?`)) return
    
    try {
      const { error } = await supabase.from("sales_orders").delete().in("id", selectedOrderIds)
      if (error) throw error
      setSelectedOrderIds([])
      alert("Selected orders deleted successfully!")
      loadData()
    } catch (error: any) {
      alert("Error deleting orders: " + error.message)
    }
  }

  const toggleSelectAllOrders = () => {
    if (selectedOrderIds.length === orders.length) {
      setSelectedOrderIds([])
    } else {
      setSelectedOrderIds(orders.map(o => o.id))
    }
  }

  const toggleSelectOrder = (id: string) => {
    if (selectedOrderIds.includes(id)) {
      setSelectedOrderIds(selectedOrderIds.filter(i => i !== id))
    } else {
      setSelectedOrderIds([...selectedOrderIds, id])
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to delete this order?")) return

    try {
      const { error } = await supabase.from("sales_orders").delete().eq("id", orderId)

      if (error) throw error

      // Real-time subscription will automatically reload data
    } catch (error: any) {
      alert("Error deleting order: " + error.message)
    }
  }
  const shareOnWhatsApp = (order: any) => {
    const bizName = profile?.company_name || "Our Store"
    const invoiceNo = `INV-${order.id.slice(-6).toUpperCase()}`

    const text =
      `*OFFICIAL INVOICE FROM ${bizName.toUpperCase()}* 📄\n\n` +
      `Hello *${order.customer_name || "Valued Customer"}*,\n\n` +
      `Thank you for choosing ${bizName}! Your order has been successfully processed.\n\n` +
      `--- *ORDER DETAILS* ---\n` +
      `📍 *Receipt No:* ${invoiceNo}\n` +
      `💰 *Total Amount:* ₹${order.total_amount.toFixed(2)}\n` +
      `⚖️ *GST Included:* ₹${order.gst_amount.toFixed(2)}\n` +
      `✅ *Status:* ${order.status?.toUpperCase()}\n\n` +
      `🔗 *View Digital Receipt:* ${window.location.host}/receipt/${order.id}\n\n` +
      `Regards,\n*${bizName} Team*`

    const phone = order.customer_phone ? order.customer_phone.replace(/\D/g, "") : ""
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
    window.open(url, "_blank")
  }

  const shareViaEmail = (order: any) => {
    const bizName = profile?.company_name || 'StartupSphere Business'
    const invoiceNo = `INV-${order.id.slice(-6).toUpperCase()}`
    
    const subject = `Invoice ${invoiceNo} from ${bizName}`
    const body = `Dear ${order.customer_name || 'Valued Customer'},\n\n` +
      `We are pleased to share the invoice for your recent purchase at ${bizName}.\n\n` +
      `INVOICE SUMMARY:\n` +
      `--------------------------------\n` +
      `Invoice Number: ${invoiceNo}\n` +
      `Order Date: ${new Date(order.order_date).toLocaleDateString('en-IN')}\n` +
      `Total Payable: ₹${order.total_amount.toFixed(2)}\n` +
      `Payment Status: ${order.status?.toUpperCase()}\n` +
      `--------------------------------\n\n` +
      `You can view and download your full digital receipt here:\n` +
      `${window.location.origin}/receipt/${order.id}\n\n` +
      `Thank you for your business! If you have any questions, feel free to reach out to us.\n\n` +
      `Best Regards,\n` +
      `${bizName} Team\n` +
      `${profile?.address || ''}`

    const email = order.customer_email || ''
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(url, '_blank')
  }

  const [cart, setCart] = useState<{ product: any; quantity: number }[]>([])
  const [customerName, setCustomerName] = useState("")

  if (!profile?.can_manage_sales) {
    return (
      <div className="p-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <p className="text-slate-400 text-lg">You don't have permission to manage sales</p>
          <p className="text-slate-500 text-sm mt-2">Contact your owner to request access</p>
        </div>
      </div>
    )
  }

  const selectedProduct = products.find((p) => p.id === selectedProductId)
  const salePreview = selectedProduct
    ? {
        subtotal: selectedProduct.price * (Number.parseInt(saleFormData.quantity) || 0),
        gst:
          selectedProduct.price *
          (Number.parseInt(saleFormData.quantity) || 0) *
          (saleFormData.gstRate === "none" ? 0 : Number.parseFloat(saleFormData.gstRate) / 100),
        get total() {
          return this.subtotal + this.gst
        },
      }
    : { subtotal: 0, gst: 0, total: 0 }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Sales Management</h1>
          <p className="text-slate-400 mt-1">Create sales and track orders</p>
        </div>
        <Button onClick={() => setShowCreateSale(!showCreateSale)} className="bg-blue-600 hover:bg-blue-700 shadow-lg">
          <Plus className="w-4 h-4 mr-2" />
          {showCreateSale ? "Cancel" : "Create Sale"}
        </Button>
      </div>

      {showCreateSale && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8 shadow-xl">
          <h3 className="text-lg font-semibold text-white mb-4">Create New Sale</h3>
          <form onSubmit={handleCreateSaleFromInventory} className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Select Product</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2"
              >
                <option value="">-- Select a product --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} - ₹{p.price.toFixed(2)} (Stock: {p.stock_quantity})
                  </option>
                ))}
              </select>
            </div>

            {selectedProduct && (
              <div className="p-4 bg-slate-800 rounded-lg">
                <p className="text-white font-medium">{selectedProduct.name}</p>
                <p className="text-sm text-slate-400">SKU: {selectedProduct.sku}</p>
                <p className="text-sm text-slate-400">Available: {selectedProduct.stock_quantity} units</p>
                <p className="text-lg font-bold text-blue-400 mt-2">₹{selectedProduct.price.toFixed(2)} per unit</p>
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Customer Name</label>
                <Input
                  placeholder="e.g. John Doe"
                  value={saleFormData.customerName}
                  onChange={(e) => setSaleFormData({ ...saleFormData, customerName: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">WhatsApp Number</label>
                <Input
                  placeholder="e.g. 919876543210"
                  value={saleFormData.customerPhone}
                  onChange={(e) => setSaleFormData({ ...saleFormData, customerPhone: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Email Address</label>
                <Input
                  placeholder="e.g. customer@example.com"
                  value={saleFormData.customerEmail}
                  onChange={(e) => setSaleFormData({ ...saleFormData, customerEmail: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Quantity</label>
                <Input
                  type="number"
                  min="1"
                  max={selectedProduct?.stock_quantity || 1}
                  value={saleFormData.quantity}
                  onChange={(e) => setSaleFormData({ ...saleFormData, quantity: e.target.value })}
                  required
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-1 block">GST Rate</label>
                <select
                  value={saleFormData.gstRate}
                  onChange={(e) => setSaleFormData({ ...saleFormData, gstRate: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2"
                >
                  <option value="none">No GST</option>
                  <option value="12">12% GST</option>
                  <option value="18">18% GST</option>
                  <option value="28">28% GST</option>
                </select>
              </div>
            </div>

            {selectedProduct && (
              <div className="border-t border-slate-700 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Subtotal</span>
                  <span>₹{salePreview.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-400">
                  <span>GST ({saleFormData.gstRate === "none" ? "0" : saleFormData.gstRate}%)</span>
                  <span>₹{salePreview.gst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-white border-t border-slate-700 pt-2">
                  <span>Total</span>
                  <span>₹{salePreview.total.toFixed(2)}</span>
                </div>
              </div>
            )}

            <Button type="submit" disabled={!selectedProductId} className="w-full bg-green-600 hover:bg-green-700">
              Create Sale
            </Button>
          </form>
        </div>
      )}

      {selectedOrderIds.length > 0 && (
        <div className="bg-red-900/20 border border-red-900/30 p-4 rounded-xl mb-6 flex justify-between items-center animate-in slide-in-from-top duration-300">
           <p className="text-red-400 text-sm font-medium">
             {selectedOrderIds.length} sales selected for deletion
           </p>
           <Button 
            onClick={handleBulkDeleteOrders}
            variant="destructive" 
            size="sm"
            className="bg-red-600 hover:bg-red-700 h-8"
           >
             <Trash2 className="w-3 h-3 mr-2" />
             Delete Selected
           </Button>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No orders yet. Create your first sale!</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-800 bg-slate-950">
                    <tr>
                      <th className="px-6 py-4 text-left">
                         <input 
                          type="checkbox" 
                          checked={selectedOrderIds.length === orders.length && orders.length > 0}
                          onChange={toggleSelectAllOrders}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-800 accent-blue-500" 
                        />
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Order Date</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Customer</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Total</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">GST</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Actions</th>
                    </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {orders.map((order) => (
                  <tr key={order.id} className={`hover:bg-slate-800/50 transition-colors ${selectedOrderIds.includes(order.id) ? 'bg-blue-900/10' : ''}`}>
                    <td className="px-6 py-4">
                        <input 
                          type="checkbox" 
                          checked={selectedOrderIds.includes(order.id)}
                          onChange={() => toggleSelectOrder(order.id)}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-800 accent-blue-500" 
                        />
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {new Date(order.order_date).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-6 py-4 text-white">{order.customer_name || "Walk-in"}</td>
                    <td className="px-6 py-4 text-white font-semibold">₹{order.total_amount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-slate-400">₹{order.gst_amount.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-600/20 text-green-400 border border-green-600/30">
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => shareOnWhatsApp(order)}
                          variant="outline"
                          size="sm"
                          title="WhatsApp"
                          className="border-green-900/50 text-green-400 hover:bg-green-950/50"
                        >
                          <MessageCircle className="w-3 h-3" />
                        </Button>
                        <Button
                          onClick={() => shareViaEmail(order)}
                          variant="outline"
                          size="sm"
                          title="Email"
                          className="border-blue-900/50 text-blue-400 hover:bg-blue-950/50"
                        >
                          <Mail className="w-3 h-3" />
                        </Button>
                        <Button
                          onClick={() => setEditingOrder(order)}
                          variant="outline"
                          size="sm"
                          className="border-slate-700 hover:bg-slate-800"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteOrder(order.id)}
                          variant="outline"
                          size="sm"
                          className="border-red-900/50 text-red-400 hover:bg-red-950/50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingOrder && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Edit Order</h3>
              <Button onClick={() => setEditingOrder(null)} variant="outline" size="sm" className="border-slate-700">
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Customer Name</label>
                <Input
                  value={editingOrder.customer_name}
                  onChange={(e) => setEditingOrder({ ...editingOrder, customer_name: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">WhatsApp</label>
                  <Input
                    value={editingOrder.customer_phone || ""}
                    onChange={(e) => setEditingOrder({ ...editingOrder, customer_phone: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Email</label>
                  <Input
                    value={editingOrder.customer_email || ""}
                    onChange={(e) => setEditingOrder({ ...editingOrder, customer_email: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Total Amount (₹) - Read Only</label>
                <Input
                  type="number"
                  value={editingOrder.total_amount}
                  disabled
                  className="bg-slate-800/50 border-slate-700 text-slate-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">GST Amount (₹) - Read Only</label>
                <Input
                  type="number"
                  value={editingOrder.gst_amount}
                  disabled
                  className="bg-slate-800/50 border-slate-700 text-slate-500 cursor-not-allowed"
                />
              </div>
              <div className="border-t border-slate-700 pt-4">
                <label className="text-sm font-semibold text-white mb-2 block">Order Items</label>
                {editingOrder.order_items?.map((item: any, idx: number) => (
                  <div key={item.id || idx} className="space-y-2 mb-4 bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Item #${idx + 1}</span>
                    </div>
                    <select
                      value={item.product_id}
                      onChange={(e) => {
                        const newProdId = e.target.value
                        const newProd = products.find(p => p.id === newProdId)
                        if (!newProd) return
                        
                        const newItems = [...editingOrder.order_items]
                        newItems[idx] = { 
                          ...item, 
                          product_id: newProdId, 
                          unit_price: newProd.price,
                          line_total: newProd.price * item.quantity,
                          products: { name: newProd.name }
                        }
                        
                        const subtotal = newItems.reduce((sum, item) => sum + item.line_total, 0)
                        const gst = subtotal * 0.18
                        
                        setEditingOrder({
                          ...editingOrder,
                          order_items: newItems,
                          total_amount: subtotal + gst,
                          gst_amount: gst
                        })
                      }}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded px-2 py-1 text-sm"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (₹{p.price})</option>
                      ))}
                    </select>
                    <div className="flex items-center gap-2">
                       <label className="text-xs text-slate-400 min-w-8">Qty:</label>
                       <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const newQty = Number.parseInt(e.target.value) || 1
                          const newItems = [...editingOrder.order_items]
                          newItems[idx] = { 
                            ...item, 
                            quantity: newQty,
                            line_total: item.unit_price * newQty
                          }
                          
                          const subtotal = newItems.reduce((sum, item) => sum + item.line_total, 0)
                          const gst = subtotal * 0.18
                          
                          setEditingOrder({
                            ...editingOrder,
                            order_items: newItems,
                            total_amount: subtotal + gst,
                            gst_amount: gst
                          })
                        }}
                        className="bg-slate-700 border-slate-600 text-white h-8"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-1 block">Status</label>
                <select
                  value={editingOrder.status}
                  onChange={(e) => setEditingOrder({ ...editingOrder, status: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2"
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              <Button onClick={handleEditOrder} className="w-full bg-blue-600 hover:bg-blue-700">
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
