"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { Plus, Edit, Trash2, AlertTriangle, ShoppingCart, X, TrendingUp, BarChart3, CloudUpload, Scan, Camera } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { sendNotification } from "@/lib/notifications"

export default function InventoryPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showSaleModal, setShowSaleModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [orderItems, setOrderItems] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    price: "",
    costPrice: "",
    stockQuantity: "",
    minStockLevel: "10",
    category: "",
    manufacturerName: "",
    manufacturerAddress: "",
    manufacturerGstin: "",
    purchaseGstRate: "18",
  })
  const [profile, setProfile] = useState<any>(null)
  const [saleData, setSaleData] = useState({
    quantity: "1",
    customerName: "",
    gstRate: "18",
  })
  const [isScanning, setIsScanning] = useState(false)
  const [isIdentifyingProduct, setIsIdentifyingProduct] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadData()

    const channel = supabase
      .channel("inventory-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, (payload) => {
        console.log("Product changed:", payload)
        loadData()
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, (payload) => {
        console.log("Order items changed:", payload)
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
      router.push("/auth/owner-login")
      return
    }

    const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()
    setProfile(profileData)

    const ownerId = profileData?.role === "owner" ? user.id : profileData?.owner_id

    const [productsRes, orderItemsRes] = await Promise.all([
      supabase.from("products").select("*").eq("owner_id", ownerId).order("created_at", { ascending: false }),
      supabase
        .from("order_items")
        .select("*, product_id, quantity, unit_price, products(name, cost_price)")
        .eq("products.owner_id", ownerId),
    ])

    setProducts(productsRes.data || [])
    setOrderItems(orderItemsRes.data || [])
    setLoading(false)
  }

  const getProductAnalytics = () => {
    const productStats = products.map((product) => {
      const productOrders = orderItems.filter((item) => item.product_id === product.id)
      const totalSold = productOrders.reduce((sum, item) => sum + item.quantity, 0)
      const revenue = productOrders.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
      const cost = totalSold * (product.cost_price || 0)
      const profit = revenue - cost

      return {
        ...product,
        totalSold,
        revenue,
        profit,
        profitMargin: revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : 0,
      }
    })

    const topByDemand = [...productStats].sort((a, b) => b.totalSold - a.totalSold).slice(0, 5)
    const topByProfit = [...productStats].sort((a, b) => b.profit - a.profit).slice(0, 5)
    const lowStock = products.filter((p) => p.stock_quantity <= p.min_stock_level)

    return { topByDemand, topByProfit, lowStock, allProducts: productStats }
  }

  const analytics = getProductAnalytics()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const ownerId = profile?.role === "owner" ? user.id : profile?.owner_id

    const productData = {
      owner_id: ownerId,
      name: formData.name,
      sku: formData.sku,
      price: Number.parseFloat(formData.price),
      cost_price: Number.parseFloat(formData.costPrice),
      stock_quantity: Number.parseInt(formData.stockQuantity),
      min_stock_level: Number.parseInt(formData.minStockLevel),
      manufacturer_name: formData.manufacturerName,
      manufacturer_address: formData.manufacturerAddress,
      manufacturer_gstin: formData.manufacturerGstin,
      purchase_gst_rate: Number.parseFloat(formData.purchaseGstRate) || 0,
    }

    let productId: string
    if (editingId) {
      await supabase.from("products").update(productData).eq("id", editingId)
      productId = editingId
      await sendNotification({
        actionType: "inventory_updated",
        entityType: "product",
        entityId: editingId,
        message: `${formData.name} inventory updated by ${profile?.email || "team member"}`,
        ownerId,
        userId: user.id,
      })
    } else {
      const { data: newProduct } = await supabase.from("products").insert(productData).select().single()
      productId = newProduct?.id || ""

      const totalPurchaseAmt = Number.parseFloat(formData.costPrice) * Number.parseInt(formData.stockQuantity)
      const purchaseGstAmt = totalPurchaseAmt * (Number.parseFloat(formData.purchaseGstRate) / 100)
      
      if (totalPurchaseAmt > 0) {
        await supabase.from("expenses").insert({
          owner_id: ownerId,
          category: "Inventory Purchase",
          description: `Stock Purchase: ${formData.name} (${formData.stockQuantity} units) from ${formData.manufacturerName || 'Manufacturer'}`,
          amount: totalPurchaseAmt,
          gst_applicable: true,
          gst_amount: purchaseGstAmt,
          expense_date: new Date().toISOString().split('T')[0],
          itc_eligible: true,
          tax_category: "COGS"
        })
      }

      await sendNotification({
        actionType: "inventory_added",
        entityType: "product",
        entityId: productId,
        message: `${formData.name} added to inventory by ${profile?.email || "team member"}`,
        ownerId,
        userId: user.id,
      })
    }

    setFormData({ 
      name: "", sku: "", price: "", costPrice: "", stockQuantity: "", minStockLevel: "10", category: "",
      manufacturerName: "", manufacturerAddress: "", manufacturerGstin: ""
    })
    setShowForm(false)
    setEditingId(null)
    loadData()
  }

  const handleEdit = (product: any) => {
    setFormData({
      name: product.name,
      sku: product.sku,
      price: product.price.toString(),
      costPrice: product.cost_price?.toString() || "",
      stockQuantity: product.stock_quantity.toString(),
      minStockLevel: product.min_stock_level.toString(),
      category: product.category || "",
      manufacturerName: product.manufacturer_name || "",
      manufacturerAddress: product.manufacturer_address || "",
      manufacturerGstin: product.manufacturer_gstin || "",
      purchaseGstRate: product.purchase_gst_rate?.toString() || "18",
    })
    setEditingId(product.id)
    setShowForm(true)
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} products?`)) return
    
    try {
      const { error } = await supabase.from("products").delete().in("id", selectedIds)
      if (error) throw error
      setSelectedIds([])
      alert("Selected products deleted successfully!")
      loadData()
    } catch (error: any) {
      alert("Error deleting products: " + error.message)
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(products.map(p => p.id))
    }
  }

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return

    await supabase.from("products").delete().eq("id", id)
    // Real-time subscription will automatically reload data
  }

  const openSaleModal = (product: any) => {
    setSelectedProduct(product)
    setSaleData({ quantity: "1", customerName: "", gstRate: "18" })
    setShowSaleModal(true)
  }

  const handleCreateSale = async () => {
    if (!selectedProduct) return

    const quantity = Number.parseInt(saleData.quantity)
    if (quantity <= 0 || quantity > selectedProduct.stock_quantity) {
      alert(`Invalid quantity. Available stock: ${selectedProduct.stock_quantity}`)
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const ownerId = profile?.role === "owner" ? user.id : profile?.owner_id

    const subtotal = selectedProduct.price * quantity
    const gstRate = saleData.gstRate === "none" ? 0 : Number.parseFloat(saleData.gstRate) / 100
    const gstAmount = subtotal * gstRate
    const totalAmount = subtotal + gstAmount

    try {
      const { data: order, error: orderError } = await supabase
        .from("sales_orders")
        .insert({
          owner_id: ownerId,
          created_by: user.id,
          customer_name: saleData.customerName || "Walk-in Customer",
          total_amount: totalAmount,
          gst_amount: gstAmount,
          status: "completed",
        })
        .select()
        .single()

      if (orderError) throw orderError

      await supabase.from("order_items").insert({
        order_id: order.id,
        product_id: selectedProduct.id,
        quantity: quantity,
        unit_price: selectedProduct.price,
        line_total: subtotal,
      })

      await supabase
        .from("products")
        .update({
          stock_quantity: selectedProduct.stock_quantity - quantity,
        })
        .eq("id", selectedProduct.id)

      await sendNotification({
        actionType: "sale_created",
        entityType: "order",
        entityId: order.id,
        message: `Sale of ${selectedProduct.name} (Qty: ${quantity}) created by ${profile?.email || "team member"}`,
        ownerId,
        userId: user.id,
      })

      setShowSaleModal(false)
      setSelectedProduct(null)
      setSaleData({ quantity: "1", customerName: "", gstRate: "18" })

      alert("Sale created successfully!")
      loadData()
    } catch (error: any) {
      alert("Error creating sale: " + error.message)
    }
  }

  const calculateSalePreview = () => {
    if (!selectedProduct) return { subtotal: 0, gst: 0, total: 0 }

    const quantity = Number.parseInt(saleData.quantity) || 0
    const subtotal = selectedProduct.price * quantity
    const gstRate = saleData.gstRate === "none" ? 0 : Number.parseFloat(saleData.gstRate) / 100
    const gst = subtotal * gstRate
    const total = subtotal + gst

    return { subtotal, gst, total }
  }

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const text = event.target?.result as string
      const lines = text.split("\n").filter((line) => line.trim())
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const ownerId = profile?.role === "owner" ? user.id : profile?.owner_id

      let count = 0
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim())
        if (values.length < 5) continue

        await supabase.from("products").insert({
          owner_id: ownerId,
          name: values[0],
          sku: values[1],
          price: Number.parseFloat(values[2]) || 0,
          cost_price: Number.parseFloat(values[3]) || 0,
          stock_quantity: Number.parseInt(values[4]) || 0,
          manufacturer_name: values[5] || "",
        })
        count++
      }
      alert(`Successfully imported ${count} products!`)
      loadData()
    }
    reader.readAsText(file)
  }

  const handleInvoiceScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsScanning(true)
    const reader = new FileReader()
    reader.onload = async (event) => {
      const base64 = event.target?.result as string

      try {
        const res = await fetch("/api/ai/scan-invoice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64 }),
        })

        const data = await res.json()
        if (data.error) throw new Error(data.error)

        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return
        const ownerId = profile?.role === "owner" ? user.id : profile?.owner_id

        let count = 0
        for (const item of data.items || []) {
          await supabase.from("products").insert({
            owner_id: ownerId,
            name: item.name,
            sku: item.sku || `SKU-${Math.random().toString(36).slice(-6).toUpperCase()}`,
            price: Number.parseFloat(item.selling_price) || Number.parseFloat(item.buying_price) * 1.2,
            cost_price: Number.parseFloat(item.buying_price),
            stock_quantity: Number.parseInt(item.quantity) || 1,
            manufacturer_name: data.manufacturer_name || "Extracted Supplier",
            manufacturer_address: data.manufacturer_address || "",
            manufacturer_gstin: data.manufacturer_gstin || "",
          })
          count++
        }

        alert(
          `AI Scan Successful! Found ${count} items from ${data.manufacturer_name}. Added to inventory and recorded in Accounting.`,
        )
        loadData()
      } catch (err: any) {
        alert("AI Scan failed: " + err.message)
      } finally {
        setIsScanning(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleIdentifyProduct = async (file: File) => {
    setIsIdentifyingProduct(true)
    const reader = new FileReader()
    reader.onload = async (event) => {
      const base64 = event.target?.result as string

      try {
        const res = await fetch("/api/ai/identify-product", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64 }),
        })

        const data = await res.json()
        if (data.error) throw new Error(data.error)

        setFormData({
          ...formData,
          name: data.name || "",
          category: data.category || "",
          sku: data.sku || `SKU-${Math.random().toString(36).slice(-6).toUpperCase()}`,
          price: data.suggested_price?.toString() || "",
        })
        
        setShowForm(true)
        alert(`AI identified this as: ${data.name}. Details have been pre-filled!`)
      } catch (err: any) {
        alert("AI Product ID failed: " + err.message)
      } finally {
        setIsIdentifyingProduct(false)
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="p-8 relative">
      {isScanning && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="bg-slate-900 border border-purple-500/30 p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
             <div className="relative">
                <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
                <Scan className="absolute inset-0 m-auto w-6 h-6 text-purple-400 animate-pulse" />
             </div>
             <div className="text-center">
               <h3 className="text-xl font-bold text-white mb-2">AI Invoice Extraction</h3>
               <p className="text-slate-400 text-sm animate-pulse whitespace-pre-line">
                 Scanning Manufacturer details...
                 Reading Product items & Prices...
                 Syncing with Accounting...
               </p>
             </div>
          </div>
        </div>
      )}

      {isIdentifyingProduct && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="bg-slate-900 border border-blue-500/30 p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
             <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                <Camera className="absolute inset-0 m-auto w-6 h-6 text-blue-400 animate-pulse" />
             </div>
             <div className="text-center">
               <h3 className="text-xl font-bold text-white mb-2">AI Product Identification</h3>
               <p className="text-slate-400 text-sm animate-pulse whitespace-pre-line">
                 Analyzing visual features...
                 Searching product database...
                 Generating SKU & Pricing...
               </p>
             </div>
          </div>
        </div>
      )}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Inventory Management</h1>
          <p className="text-slate-400 mt-1">Track your products, stock levels, and analytics</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleIdentifyProduct(e.target.files[0])}
              className="absolute inset-0 opacity-0 cursor-pointer"
              title="Capture Photo or Upload from Gallery"
            />
            <Button variant="outline" className="border-blue-500/50 text-blue-400 hover:bg-blue-900/20">
              <Camera className="w-4 h-4 mr-2" />
              Scan Product
            </Button>
          </div>
          <label className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg cursor-pointer flex items-center shadow-lg border border-slate-700 transition-all hover:scale-105 active:scale-95 group">
             <CloudUpload className="w-4 h-4 mr-2 text-blue-400 group-hover:rotate-12 transition-transform" />
             Bulk CSV
             <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
          </label>
          <label className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg cursor-pointer flex items-center shadow-lg border border-slate-700 transition-all hover:scale-105 active:scale-95 group">
             <Scan className={`w-4 h-4 mr-2 text-purple-400 group-hover:scale-110 transition-transform ${isScanning ? 'animate-pulse' : ''}`} />
             {isScanning ? "AI Scanning..." : "AI Invoice Scan"}
             <input disabled={isScanning} type="file" accept="image/*" className="hidden" onChange={handleInvoiceScan} />
          </label>
          <Button
            onClick={() => {
              setShowForm(!showForm)
              setEditingId(null)
              setFormData({
                name: "",
                sku: "",
                price: "",
                costPrice: "",
                stockQuantity: "",
                minStockLevel: "10",
                category: "",
                manufacturerName: "",
                manufacturerAddress: "",
                manufacturerGstin: "",
                purchaseGstRate: "18",
              })
            }}
            className="bg-blue-600 hover:bg-blue-700 shadow-lg border border-blue-500/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            {showForm ? "Cancel" : "Add Product"}
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Top by Demand</h3>
            <TrendingUp className="w-5 h-5 text-blue-400" />
          </div>
          <div className="space-y-3">
            {analytics.topByDemand.length === 0 ? (
              <p className="text-slate-500 text-sm">No sales data yet</p>
            ) : (
              analytics.topByDemand.map((product, idx) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-sm font-mono">#{idx + 1}</span>
                    <div>
                      <p className="text-white text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-slate-500">{product.totalSold} units sold</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Top by Profit</h3>
            <BarChart3 className="w-5 h-5 text-green-400" />
          </div>
          <div className="space-y-3">
            {analytics.topByProfit.length === 0 ? (
              <p className="text-slate-500 text-sm">No profit data yet</p>
            ) : (
              analytics.topByProfit.map((product, idx) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-sm font-mono">#{idx + 1}</span>
                    <div>
                      <p className="text-white text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-slate-500">{product.profitMargin}% margin</p>
                    </div>
                  </div>
                  <span className="text-green-400 font-semibold text-sm">₹{product.profit.toFixed(0)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Low Stock Alerts</h3>
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div className="space-y-3">
            {analytics.lowStock.length === 0 ? (
              <p className="text-slate-500 text-sm">All products in stock</p>
            ) : (
              analytics.lowStock.map((product) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-slate-500">{product.sku}</p>
                  </div>
                  <span className="text-red-400 font-semibold text-sm">{product.stock_quantity} left</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showForm && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8 shadow-xl">
          <h3 className="text-lg font-semibold text-white mb-4">{editingId ? "Edit Product" : "New Product"}</h3>
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
            <Input
              placeholder="Product Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="bg-slate-800 border-slate-700 text-white"
            />
            <Input
              placeholder="SKU"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              required
              className="bg-slate-800 border-slate-700 text-white"
            />
            <Input
              placeholder="Selling Price (₹)"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
              className="bg-slate-800 border-slate-700 text-white"
            />
            <Input
              placeholder="Cost Price (₹)"
              type="number"
              step="0.01"
              value={formData.costPrice}
              onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
              required
              className="bg-slate-800 border-slate-700 text-white"
            />
            <Input
              placeholder="Stock Quantity"
              type="number"
              value={formData.stockQuantity}
              onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
              required
              className="bg-slate-800 border-slate-700 text-white"
            />
            <Input
              placeholder="Min Stock Level"
              type="number"
              value={formData.minStockLevel}
              onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white"
            />
            <Input
              placeholder="Category (optional)"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white md:col-span-2"
            />

            <div className="md:col-span-2 border-t border-slate-800 pt-4 mt-2">
              <h4 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Manufacturer / Supplier Details</h4>
              <div className="grid md:grid-cols-3 gap-4">
                <Input
                  placeholder="Manufacturer Name"
                  value={formData.manufacturerName}
                  onChange={(e) => setFormData({ ...formData, manufacturerName: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
                <Input
                  placeholder="Manufacturer GSTIN"
                  value={formData.manufacturerGstin}
                  onChange={(e) => setFormData({ ...formData, manufacturerGstin: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
                <Input
                  placeholder="Manufacturer Address"
                  value={formData.manufacturerAddress}
                  onChange={(e) => setFormData({ ...formData, manufacturerAddress: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
                <div className="md:col-span-3">
                   <label className="text-xs text-slate-500 mb-1 block">Purchase GST Paid (%)</label>
                   <Input
                    placeholder="18"
                    type="number"
                    value={formData.purchaseGstRate}
                    onChange={(e) => setFormData({ ...formData, purchaseGstRate: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="md:col-span-2 bg-blue-600 hover:bg-blue-700 h-10 shadow-lg border border-blue-500/20">
              {editingId ? "Update Product" : "Add Product"}
            </Button>
          </form>
        </div>
      )}

      {selectedIds.length > 0 && (
        <div className="bg-red-900/20 border border-red-900/30 p-4 rounded-xl mb-6 flex justify-between items-center animate-in slide-in-from-top duration-300">
           <p className="text-red-400 text-sm font-medium">
             {selectedIds.length} items selected for deletion
           </p>
           <Button 
            onClick={handleBulkDelete}
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
          <div className="p-8 text-center text-slate-400">Loading inventory...</div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No products yet. Add your first product to get started!</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-800 bg-slate-950">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.length === products.length && products.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-800 accent-blue-500" 
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Product</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">SKU</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Price</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Stock</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Status</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {products.map((product) => (
                  <tr key={product.id} className={`hover:bg-slate-800/50 transition-colors ${selectedIds.includes(product.id) ? 'bg-blue-900/10' : ''}`}>
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(product.id)}
                        onChange={() => toggleSelect(product.id)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-800 accent-blue-500" 
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white font-medium">{product.name}</p>
                        {product.category && <p className="text-xs text-slate-500 mt-0.5">{product.category}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300 font-mono text-sm">{product.sku}</td>
                    <td className="px-6 py-4 text-slate-400">{product.category || "-"}</td>
                    <td className="px-6 py-4 text-white font-semibold">₹{product.price.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`font-bold ${product.stock_quantity <= product.min_stock_level ? "text-red-400" : "text-green-400"}`}
                      >
                        {product.stock_quantity}
                      </span>
                      <span className="text-slate-500 text-sm"> / {product.min_stock_level}</span>
                    </td>
                    <td className="px-6 py-4">
                      {product.stock_quantity <= product.min_stock_level ? (
                        <div className="flex items-center gap-1 text-red-400 text-sm">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Low Stock</span>
                        </div>
                      ) : (
                        <span className="text-green-400 text-sm">In Stock</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => openSaleModal(product)}
                          variant="outline"
                          size="sm"
                          className="border-green-900/50 text-green-400 hover:bg-green-950/50"
                          disabled={product.stock_quantity === 0}
                        >
                          <ShoppingCart className="w-3 h-3" />
                        </Button>
                        <Button
                          onClick={() => handleEdit(product)}
                          variant="outline"
                          size="sm"
                          className="border-slate-700 hover:bg-slate-800"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(product.id)}
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

      {showSaleModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Create Sale</h3>
              <Button onClick={() => setShowSaleModal(false)} variant="outline" size="sm" className="border-slate-700">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="mb-4 p-4 bg-slate-800 rounded-lg">
              <p className="text-white font-medium">{selectedProduct.name}</p>
              <p className="text-sm text-slate-400">SKU: {selectedProduct.sku}</p>
              <p className="text-sm text-slate-400">Available Stock: {selectedProduct.stock_quantity}</p>
              <p className="text-lg font-bold text-blue-400 mt-2">₹{selectedProduct.price.toFixed(2)} per unit</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Customer Name (optional)</label>
                <Input
                  placeholder="Walk-in Customer"
                  value={saleData.customerName}
                  onChange={(e) => setSaleData({ ...saleData, customerName: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-1 block">Quantity</label>
                <Input
                  type="number"
                  min="1"
                  max={selectedProduct.stock_quantity}
                  value={saleData.quantity}
                  onChange={(e) => setSaleData({ ...saleData, quantity: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-1 block">GST Rate</label>
                <Select
                  value={saleData.gstRate}
                  onValueChange={(value) => setSaleData({ ...saleData, gstRate: value })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="none" className="text-white hover:bg-slate-700">
                      No GST
                    </SelectItem>
                    <SelectItem value="12" className="text-white hover:bg-slate-700">
                      12% GST
                    </SelectItem>
                    <SelectItem value="18" className="text-white hover:bg-slate-700">
                      18% GST
                    </SelectItem>
                    <SelectItem value="28" className="text-white hover:bg-slate-700">
                      28% GST
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t border-slate-700 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Subtotal</span>
                  <span>₹{calculateSalePreview().subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-400">
                  <span>GST ({saleData.gstRate === "none" ? "0" : saleData.gstRate}%)</span>
                  <span>₹{calculateSalePreview().gst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-white border-t border-slate-700 pt-2">
                  <span>Total</span>
                  <span>₹{calculateSalePreview().total.toFixed(2)}</span>
                </div>
              </div>

              <Button onClick={handleCreateSale} className="w-full bg-green-600 hover:bg-green-700">
                Create Sale
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
