"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { sendNotification } from "@/lib/notifications"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { TrendingUp, TrendingDown, DollarSign, Plus, Edit, Trash2, X, Printer, MessageCircle, Mail, ExternalLink } from "lucide-react"

export default function AccountingPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [salesOrders, setSalesOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvoiceForm, setShowInvoiceForm] = useState(false)
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<any>(null)
  const [editingExpense, setEditingExpense] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [formData, setFormData] = useState({
    invoiceNumber: "",
    customerName: "",
    subtotal: "",
    gstRate: "18",
    includeGst: true,
    customerGstin: "",
    customerCompany: "",
  })
  const [expenseData, setExpenseData] = useState({
    amount: "",
    gstApplicable: false,
    taxCategory: "General",
    itcEligible: true,
  })
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([])
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>([])
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadData()

    const channel = supabase
      .channel("accounting-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "invoices" }, (payload) => {
        console.log("Invoice changed:", payload)
        loadData()
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, (payload) => {
        console.log("Expense changed:", payload)
        loadData()
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "sales_orders" }, (payload) => {
        console.log("Sales order changed:", payload)
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

    const [invoicesRes, expensesRes, salesRes] = await Promise.all([
      supabase
        .from("invoices")
        .select(`
          *,
          sales_orders (
            id,
            status,
            order_items (
              id,
              quantity,
              unit_price,
              line_total,
              products (
                name
              )
            )
          )
        `)
        .eq("owner_id", ownerId)
        .order("created_at", { ascending: false }),
      supabase.from("expenses").select("*").eq("owner_id", ownerId).order("created_at", { ascending: false }),
      supabase.from("sales_orders").select("*").eq("owner_id", ownerId).order("created_at", { ascending: false }),
    ])

    setInvoices(invoicesRes.data || [])
    setExpenses(expensesRes.data || [])
    setSalesOrders(salesRes.data || [])
    setLoading(false)
  }

  const handleBulkDeleteInvoices = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedInvoiceIds.length} invoices?`)) return
    try {
      const { error } = await supabase.from("invoices").delete().in("id", selectedInvoiceIds)
      if (error) throw error
      setSelectedInvoiceIds([])
      alert("Selected invoices deleted successfully!")
      loadData()
    } catch (error: any) {
      alert("Error deleting invoices: " + error.message)
    }
  }

  const handleBulkDeleteExpenses = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedExpenseIds.length} expenses?`)) return
    try {
      const { error } = await supabase.from("expenses").delete().in("id", selectedExpenseIds)
      if (error) throw error
      setSelectedExpenseIds([])
      alert("Selected expenses deleted successfully!")
      loadData()
    } catch (error: any) {
      alert("Error deleting expenses: " + error.message)
    }
  }

  const handleAddInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const ownerId = profile?.role === "owner" ? user.id : profile?.owner_id
    const subtotal = Number.parseFloat(formData.subtotal)
    const gstRate = formData.includeGst ? Number.parseFloat(formData.gstRate) : 0
    const gstAmount = subtotal * (gstRate / 100)

    const { data: newInvoice } = await supabase
      .from("invoices")
      .insert({
        owner_id: ownerId,
        invoice_number: formData.invoiceNumber,
        customer_name: formData.customerName,
        customer_company: formData.customerCompany,
        customer_gst_no: formData.includeGst ? formData.customerGstin : null,
        subtotal,
        gst_amount: gstAmount,
        total_amount: subtotal + gstAmount,
        gst_rate: gstRate,
      })
      .select()
      .single()

    if (newInvoice) {
      await sendNotification({
        actionType: "invoice_added",
        entityType: "invoice",
        entityId: newInvoice.id,
        message: `Invoice ${formData.invoiceNumber} for ${formData.customerName} created by ${profile?.email || "team member"}`,
        ownerId,
        userId: user.id,
      })
    }

    setFormData({ invoiceNumber: "", customerName: "", customerCompany: "", subtotal: "", gstRate: "18", includeGst: true, customerGstin: "" })
    setShowInvoiceForm(false)
    loadData()
  }

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const ownerId = profile?.role === "owner" ? user.id : profile?.owner_id
    const amount = Number.parseFloat(expenseData.amount)
    const gstAmount = expenseData.gstApplicable ? amount * 0.18 : 0

    const { data: newExpense } = await supabase
      .from("expenses")
      .insert({
        owner_id: ownerId,
        category: expenseData.category,
        description: expenseData.description,
        amount,
        expense_date: new Date().toISOString().split("T")[0],
        gst_applicable: expenseData.gstApplicable,
        gst_amount: gstAmount,
        tax_category: expenseData.taxCategory || 'General',
        itc_eligible: expenseData.itcEligible !== false,
      })
      .select()
      .single()

    if (newExpense) {
      await sendNotification({
        actionType: "expense_added",
        entityType: "expense",
        entityId: newExpense.id,
        message: `Expense of ₹${amount.toFixed(2)} (${expenseData.category}) added by ${profile?.email || "team member"}`,
        ownerId,
        userId: user.id,
      })
    }

    setExpenseData({ category: "", description: "", amount: "", gstApplicable: false, taxCategory: "General", itcEligible: true })
    setShowExpenseForm(false)
    loadData()
  }


  const handleDeleteInvoice = async (id: string) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return

    try {
      const { error } = await supabase.from("invoices").delete().eq("id", id)

      if (error) throw error

      // Real-time subscription will automatically reload data
    } catch (error: any) {
      alert("Error deleting invoice: " + error.message)
    }
  }

  const handleUpdateExpense = async () => {
    if (!editingExpense) return

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const ownerId = profile?.role === "owner" ? user.id : profile?.owner_id

      const { error } = await supabase
        .from("expenses")
        .update({
          category: editingExpense.category,
          description: editingExpense.description,
          amount: editingExpense.amount,
          gst_applicable: editingExpense.gst_applicable,
          gst_amount: editingExpense.gst_amount,
          expense_date: editingExpense.expense_date,
          tax_category: editingExpense.tax_category,
          itc_eligible: editingExpense.itc_eligible,
        })
        .eq("id", editingExpense.id)

      if (error) throw error

      await sendNotification({
        actionType: "accounting_updated",
        entityType: "expense",
        entityId: editingExpense.id,
        message: `Expense in ${editingExpense.category} updated by ${profile?.email || "team member"}`,
        ownerId,
        userId: user.id,
      })

      setEditingExpense(null)
      loadData()
      alert("Expense updated successfully!")
    } catch (error: any) {
      alert("Error updating expense: " + error.message)
    }
  }

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return

    try {
      const { error } = await supabase.from("expenses").delete().eq("id", id)

      if (error) throw error

      // Real-time subscription will automatically reload data
    } catch (error: any) {
      alert("Error deleting expense: " + error.message)
    }
  }


   const shareOnWhatsApp = (invoice: any) => {
    const text = `Hi ${invoice.customer_name}, here is your invoice ${invoice.invoice_number} from ${profile?.company_name || 'us'}.\nTotal: ₹${invoice.total_amount.toFixed(2)}\nStatus: ${invoice.status?.toUpperCase()}`
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  const shareViaEmail = (invoice: any) => {
    const subject = `Invoice ${invoice.invoice_number} from ${profile?.company_name || 'StartupSphere'}`
    const body = `Hi ${invoice.customer_name},\n\nPlease find your invoice details below:\n\nInvoice No: ${invoice.invoice_number}\nTotal Amount: ₹${invoice.total_amount.toFixed(2)}\nStatus: ${invoice.status?.toUpperCase()}\n\nThank you for your business!`
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(url, '_blank')
  }


   const printPurchaseBill = (expense: any) => {
    const isInventoryPurchase = expense.category === 'Inventory Purchase'
    const totalWithGst = expense.gst_applicable ? expense.amount + expense.gst_amount : expense.amount
    
    const billHTML = `
      <html>
        <head>
          <title>Purchase Invoice - ${expense.id.slice(0,8)}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
            .bill-wrapper { max-width: 800px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 30px; border-radius: 8px; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; }
            .company-info h1 { margin: 0; color: #1e3a8a; font-size: 24px; }
            .bill-to, .issued-by { margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
            .box { padding: 15px; background: #f8fafc; border-radius: 6px; }
            .box h3 { margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; color: #64748b; }
            table { width: 100%; border-collapse: collapse; margin-top: 30px; }
            th { background: #3b82f6; color: white; padding: 12px; text-align: left; }
            td { border-bottom: 1px solid #e2e8f0; padding: 12px; }
            .totals { margin-top: 30px; float: right; width: 300px; }
            .totals div { display: flex; justify-content: space-between; padding: 8px 0; }
            .grand-total { border-top: 2px solid #3b82f6; font-weight: bold; font-size: 18px; color: #1e3a8a; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #94a3b8; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="bill-wrapper">
            <div class="header">
              <div class="company-info">
                <h1>PURCHASE INVOICE</h1>
                <p>Date: ${new Date(expense.expense_date).toLocaleDateString('en-IN')}</p>
                <p>Ref: #EXP-${expense.id.slice(-8).toUpperCase()}</p>
              </div>
              <div class="no-print">
                <button onclick="window.print()" style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer;">Print Copy</button>
              </div>
            </div>

            <div class="issued-by">
              <div class="box">
                <h3>Supplier / Manufacturer:</h3>
                <p style="font-weight: bold; font-size: 16px;">${expense.description?.split('from ')[1] || 'Manufacturer'}</p>
                <p>Nature of Goods: ${expense.tax_category || 'Raw Materials'}</p>
              </div>
              <div class="box">
                <h3>Billed To (Your Startup):</h3>
                <p style="font-weight: bold;">${profile?.company_name}</p>
                <p>GSTIN: ${profile?.gstin || 'N/A'}</p>
                <p>${profile?.address || 'N/A'}</p>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Category</th>
                  <th style="text-align: right">Amount (Base)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${expense.description}</td>
                  <td>${expense.category}</td>
                  <td style="text-align: right">₹${expense.amount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            <div class="totals">
              <div><span>Taxable Amount</span><span>₹${expense.amount.toFixed(2)}</span></div>
              ${expense.gst_applicable ? `<div><span>Input GST (18%)</span><span>₹${expense.gst_amount.toFixed(2)}</span></div>` : ''}
              <div class="grand-total"><span>Total Payable</span><span>₹${totalWithGst.toFixed(2)}</span></div>
            </div>

            <div style="clear: both"></div>
            
            <div class="footer">
              <p>Generated via StartupSphere ITR Assistant</p>
              <p>This is a system-generated purchase record for tax filing purposes.</p>
            </div>
          </div>
        </body>
      </html>
    `
    const win = window.open('', '_blank')
    win?.document.write(billHTML)
    win?.document.close()
  }

   const printInvoice = (invoice: any) => {
    // Check for missing profile info before printing
    const missingInfo = []
    if (!profile?.company_name) missingInfo.push("Company Name")
    if (!profile?.address) missingInfo.push("Business Address")
    if (!profile?.phone) missingInfo.push("Phone Number")
    if (invoice.gst_amount > 0 && !profile?.gstin) missingInfo.push("GSTIN (for Tax Invoice)")

    if (missingInfo.length > 0) {
      const confirmPrint = window.confirm(
        `Warning: The following profile details are missing: ${missingInfo.join(", ")}. \n\nYour invoice might look incomplete. Do you want to continue printing?`
      )
      if (!confirmPrint) return
    }

    const isTaxInvoice = invoice.gst_amount > 0
    const subtotal = invoice.subtotal || 0
    const gstAmount = invoice.gst_amount || 0
    const totalAmount = invoice.total_amount || 0
    const gstRate = invoice.gst_rate || 18

    const invoiceHTML = `
      <html>
        <head>
          <title>${isTaxInvoice ? 'TAX INVOICE' : 'INVOICE'} - ${invoice.invoice_number}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
            
            body { 
              font-family: 'Inter', sans-serif; 
              margin: 0; 
              padding: 0; 
              background: #fff;
              color: #1e293b;
              line-height: 1.5;
            }
            .page {
              padding: 40px;
              max-width: 850px;
              margin: 0 auto;
            }
            .header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 50px;
            }
            .company-brand h1 {
              font-size: 32px;
              font-weight: 700;
              margin: 0;
              color: #0f172a;
            }
            .company-brand p {
              font-size: 14px;
              color: #64748b;
              margin: 4px 0 0 0;
              letter-spacing: 0.5px;
            }
            .invoice-title {
              text-align: right;
            }
            .invoice-title h2 {
              font-size: 40px;
              font-weight: 700;
              margin: 0;
              color: #3b82f6;
              text-transform: uppercase;
            }
            .metadata {
              margin-top: 30px;
              display: flex;
              justify-content: flex-end;
            }
            .metadata-table {
              border-collapse: collapse;
              width: 250px;
            }
            .metadata-table td {
              padding: 8px;
              border: 1px solid #e2e8f0;
              font-size: 13px;
            }
            .metadata-table td:first-child {
              background: #f8fafc;
              font-weight: 600;
              color: #475569;
            }
            .billing-section {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 40px;
              margin-bottom: 40px;
            }
            .bill-box h3 {
              font-size: 14px;
              font-weight: 700;
              background: #1e293b;
              color: white;
              padding: 6px 12px;
              margin: 0 0 12px 0;
              text-transform: uppercase;
            }
            .bill-box p {
              margin: 0 0 4px 0;
              font-size: 14px;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            .items-table th {
              background: #1e293b;
              color: white;
              padding: 10px 15px;
              text-align: left;
              font-size: 13px;
              font-weight: 600;
            }
            .items-table td {
              padding: 12px 15px;
              border-bottom: 1px solid #f1f5f9;
              font-size: 14px;
            }
            .items-table .text-right {
              text-align: right;
            }
            .totals-container {
              display: flex;
              justify-content: space-between;
              gap: 40px;
            }
            .notes {
              flex: 1;
            }
            .notes h3 {
              font-size: 14px;
              font-weight: 700;
              background: #1e293b;
              color: white;
              padding: 6px 12px;
              margin: 0 0 10px 0;
            }
            .notes-content {
              font-size: 13px;
              color: #64748b;
              min-height: 100px;
              border: 1px solid #e2e8f0;
              padding: 12px;
            }
            .totals-table {
              width: 300px;
              border-collapse: collapse;
            }
            .totals-table td {
              padding: 8px 12px;
              font-size: 14px;
            }
            .totals-table .label {
              text-align: right;
              color: #64748b;
            }
            .totals-table .value {
              text-align: right;
              width: 120px;
              font-weight: 600;
            }
            .total-row td {
              font-size: 18px !important;
              font-weight: 700 !important;
              border-top: 2px solid #3b82f6;
              padding-top: 15px !important;
              color: #0f172a;
            }
            .footer {
              margin-top: 60px;
              text-align: center;
              border-top: 1px solid #e2e8f0;
              padding-top: 30px;
            }
            .footer p {
              margin: 0 0 4px 0;
              font-size: 13px;
              color: #475569;
            }
            .footer .contact {
              font-size: 12px;
              color: #94a3b8;
              margin-top: 10px;
            }
            @media print {
              .page { margin: 0; padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="header">
              <div class="company-brand">
                <h1>${profile?.company_name || "STARTUP NAME"}</h1>
                <p>${profile?.description || "Your Brand Motto Goes Here"}</p>
              </div>
              <div class="invoice-title">
                <h2>${isTaxInvoice ? 'Tax Invoice' : 'Invoice'}</h2>
                <div class="metadata">
                  <table class="metadata-table">
                    <tr><td>Date</td><td>${new Date(invoice.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</td></tr>
                    <tr><td>Invoice #</td><td>${invoice.invoice_number}</td></tr>
                    ${isTaxInvoice ? `<tr><td>GSTIN</td><td>${profile?.gstin || ''}</td></tr>` : ''}
                  </table>
                </div>
              </div>
            </div>

            <div class="billing-section">
              <div class="bill-box">
                <h3>Bill To:</h3>
                <p style="font-weight: 700">${invoice.customer_name}${invoice.customer_company ? ` | ${invoice.customer_company}` : ''}</p>
                ${invoice.customer_gst_no ? `<p>GSTIN: ${invoice.customer_gst_no}</p>` : ''}
              </div>
              <div class="bill-box">
                <h3>Issued From:</h3>
                <p style="font-weight: 700">${profile?.company_name}</p>
                <p>${profile?.address || 'Set address in profile'}</p>
                <p>Phone: ${profile?.phone || 'N/A'}</p>
                ${profile?.website ? `<p>Web: ${profile.website}</p>` : ''}
              </div>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th width="10%">#</th>
                  <th width="50%">Description</th>
                  <th width="10%" class="text-right">Qty</th>
                  <th width="15%" class="text-right">Unit Price</th>
                  <th width="15%" class="text-right">Line Total</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.sales_orders?.order_items && invoice.sales_orders.order_items.length > 0 
                  ? invoice.sales_orders.order_items.map((item: any, idx: number) => `
                    <tr>
                      <td>${idx + 1}</td>
                      <td>${item.products?.name || 'Product'}</td>
                      <td class="text-right">${item.quantity}</td>
                      <td class="text-right">₹${item.unit_price.toFixed(2)}</td>
                      <td class="text-right">₹${item.line_total.toFixed(2)}</td>
                    </tr>
                  `).join('')
                  : `
                    <tr>
                      <td>1</td>
                      <td>General Service / Service Rendered</td>
                      <td class="text-right">1</td>
                      <td class="text-right">₹${subtotal.toFixed(2)}</td>
                      <td class="text-right">₹${subtotal.toFixed(2)}</td>
                    </tr>
                  `
                }
              </tbody>
            </table>

            <div class="totals-container">
              <div class="notes">
                <h3>Special Notes</h3>
                <div class="notes-content">
                  Thank you for choosing ${profile?.company_name}. Please make payment within 15 days using your preferred UPI or Bank Transfer.
                </div>
              </div>
              <table class="totals-table">
                <tr>
                  <td class="label">Subtotal</td>
                  <td class="value">₹${subtotal.toFixed(2)}</td>
                </tr>
                ${isTaxInvoice ? `
                <tr>
                  <td class="label">GST (${gstRate}%)</td>
                  <td class="value">₹${gstAmount.toFixed(2)}</td>
                </tr>
                ` : ''}
                <tr>
                  <td class="label">S&H</td>
                  <td class="value">₹0.00</td>
                </tr>
                <tr class="total-row">
                  <td class="label">Total</td>
                  <td class="value">₹${totalAmount.toFixed(2)}</td>
                </tr>
              </table>
            </div>

            <div class="footer">
              <p style="font-weight: 700">Thank you for your business!</p>
              <p>Should you have any enquiries, please contact us at ${profile?.email || 'via dashboard'}</p>
              <div class="contact">
                ${profile?.address ? `${profile.address} | ` : ''}
                ${profile?.phone ? `Tel: ${profile.phone} | ` : ''}
                ${profile?.website ? `Web: ${profile.website}` : ''}
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(invoiceHTML)
      printWindow.document.close()
      setTimeout(() => {
        printWindow.print()
      }, 500)
    }
  }
  if (!profile?.can_manage_accounting) {
    return (
      <div className="p-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <p className="text-slate-400 text-lg">You don't have permission to manage accounting</p>
          <p className="text-slate-500 text-sm mt-2">Contact your owner to request access</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Accounting & Financial Reports</h1>
        <p className="text-slate-400 mt-1">Track invoices, expenses, and profitability</p>
      </div>


      <div className="grid lg:grid-cols-2 gap-8">
        {/* Invoices Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">GST Invoices</h2>
            <Button
              onClick={() => setShowInvoiceForm(!showInvoiceForm)}
              className="bg-blue-600 hover:bg-blue-700 shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              {showInvoiceForm ? "Cancel" : "New Invoice"}
            </Button>
          </div>

          {showInvoiceForm && (
            <form
              onSubmit={handleAddInvoice}
              className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-4 space-y-4 shadow-xl"
            >
              <Input
                placeholder="Invoice Number (e.g., INV-001)"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                required
                className="bg-slate-800 border-slate-700 text-white"
              />
               <Input
                placeholder="Customer Name"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                required
                className="bg-slate-800 border-slate-700 text-white"
              />
              <Input
                placeholder="Customer Company (Optional)"
                value={formData.customerCompany}
                onChange={(e) => setFormData({ ...formData, customerCompany: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
              <Input
                placeholder="Subtotal Amount (₹)"
                type="number"
                step="0.01"
                value={formData.subtotal}
                onChange={(e) => setFormData({ ...formData, subtotal: e.target.value })}
                required
                className="bg-slate-800 border-slate-700 text-white"
              />
               <Input
                placeholder="GST Rate (%)"
                type="number"
                step="0.01"
                value={formData.gstRate}
                onChange={(e) => setFormData({ ...formData, gstRate: e.target.value })}
                disabled={!formData.includeGst}
                className="bg-slate-800 border-slate-700 text-white"
              />
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.includeGst}
                    onChange={(e) => setFormData({ ...formData, includeGst: e.target.checked })}
                    className="w-4 h-4"
                  />
                  Include GST in Invoice
                </label>
                {formData.includeGst && (
                  <Input
                    placeholder="Customer GSTIN"
                    value={formData.customerGstin}
                    onChange={(e) => setFormData({ ...formData, customerGstin: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                )}
              </div>
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                Create Invoice
              </Button>
            </form>
          )}

          {selectedInvoiceIds.length > 0 && (
            <div className="bg-red-900/20 border border-red-900/30 p-4 rounded-xl mb-6 flex justify-between items-center animate-in slide-in-from-top duration-300">
              <p className="text-red-400 text-sm font-medium">{selectedInvoiceIds.length} invoices selected</p>
              <Button onClick={handleBulkDeleteInvoices} variant="destructive" size="sm" className="bg-red-600 hover:bg-red-700 h-8">
                <Trash2 className="w-3 h-3 mr-2" /> Delete Selected
              </Button>
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl mb-8">
            {loading ? (
              <div className="p-6 text-center text-slate-400">Loading...</div>
            ) : invoices.length === 0 ? (
              <div className="p-6 text-center text-slate-400">No invoices yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-800 bg-slate-950">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input 
                          type="checkbox" 
                          checked={selectedInvoiceIds.length === invoices.length && invoices.length > 0}
                          onChange={() => {
                            if (selectedInvoiceIds.length === invoices.length) setSelectedInvoiceIds([])
                            else setSelectedInvoiceIds(invoices.map(i => i.id))
                          }}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-800 accent-blue-500" 
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-slate-300 font-semibold">Invoice #</th>
                      <th className="px-4 py-3 text-left text-slate-300 font-semibold">Customer</th>
                      <th className="px-4 py-3 text-left text-slate-300 font-semibold">Total</th>
                      <th className="px-4 py-3 text-left text-slate-300 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className={`hover:bg-slate-800/50 transition-colors ${selectedInvoiceIds.includes(invoice.id) ? 'bg-blue-900/10' : ''}`}>
                        <td className="px-4 py-3">
                          <input 
                            type="checkbox" 
                            checked={selectedInvoiceIds.includes(invoice.id)}
                            onChange={() => {
                               if (selectedInvoiceIds.includes(invoice.id)) setSelectedInvoiceIds(selectedInvoiceIds.filter(id => id !== invoice.id))
                               else setSelectedInvoiceIds([...selectedInvoiceIds, invoice.id])
                            }}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-800 accent-blue-500" 
                          />
                        </td>
                        <td className="px-4 py-3 text-white font-mono">{invoice.invoice_number}</td>
                        <td className="px-4 py-3 text-slate-300">{invoice.customer_name}</td>
                        <td className="px-4 py-3 text-green-400 font-semibold">₹{invoice.total_amount.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button
                              onClick={() => printInvoice(invoice)}
                              variant="outline"
                              size="sm"
                              title="Print Invoice"
                              className="border-slate-700 hover:bg-slate-800 text-slate-300"
                            >
                              <Printer className="w-3 h-3" />
                            </Button>
                            <Button
                              onClick={() => shareOnWhatsApp(invoice)}
                              variant="outline"
                              size="sm"
                              title="Share on WhatsApp"
                              className="border-green-900/50 text-green-400 hover:bg-green-950/50"
                            >
                              <MessageCircle className="w-3 h-3" />
                            </Button>
                            <Button
                              onClick={() => shareViaEmail(invoice)}
                              variant="outline"
                              size="sm"
                              title="Send Email"
                              className="border-blue-900/50 text-blue-400 hover:bg-blue-950/50"
                            >
                              <Mail className="w-3 h-3" />
                            </Button>
                            <Button
                              onClick={() => handleDeleteInvoice(invoice.id)}
                              variant="outline"
                              size="sm"
                              title="Delete Invoice"
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
        </div>

        {/* Expenses Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Business Expenses</h2>
            <Button
              onClick={() => setShowExpenseForm(!showExpenseForm)}
              className="bg-blue-600 hover:bg-blue-700 shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              {showExpenseForm ? "Cancel" : "Add Expense"}
            </Button>
          </div>

          {showExpenseForm && (
            <form
              onSubmit={handleAddExpense}
              className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-4 space-y-4 shadow-xl"
            >
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Expense Category</label>
                  <Input
                    placeholder="e.g., Office Supplies"
                    value={expenseData.category}
                    onChange={(e) => setExpenseData({ ...expenseData, category: e.target.value })}
                    required
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Amount (₹)</label>
                  <Input
                    placeholder="0.00"
                    type="number"
                    step="0.01"
                    value={expenseData.amount}
                    onChange={(e) => setExpenseData({ ...expenseData, amount: e.target.value })}
                    required
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
              <Input
                placeholder="Description"
                value={expenseData.description}
                onChange={(e) => setExpenseData({ ...expenseData, description: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Business Category (GST)</label>
                  <select
                    value={expenseData.taxCategory}
                    onChange={(e) => setExpenseData({ ...expenseData, taxCategory: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2"
                  >
                    <option value="General">General Business Expense</option>
                    <option value="COGS">Raw Materials / Inventory (COGS)</option>
                    <option value="Assets">Capital Goods / Assets</option>
                    <option value="Rent">Rent / Office Space</option>
                    <option value="Utilities">Utilities (Bills)</option>
                    <option value="Salaries">Salaries & Employee Benefits</option>
                  </select>
                </div>
                <div className="flex flex-col justify-center gap-2">
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={expenseData.gstApplicable}
                      onChange={(e) => setExpenseData({ ...expenseData, gstApplicable: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-800"
                    />
                    GST Input (18%)
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={expenseData.itcEligible}
                      onChange={(e) => setExpenseData({ ...expenseData, itcEligible: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-800"
                    />
                    Tax Deductible Benefit
                  </label>
                </div>
              </div>
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                Add Expense Record
              </Button>
            </form>
          )}

          {selectedExpenseIds.length > 0 && (
            <div className="bg-red-900/20 border border-red-900/30 p-4 rounded-xl mb-6 flex justify-between items-center animate-in slide-in-from-top duration-300">
              <p className="text-red-400 text-sm font-medium">{selectedExpenseIds.length} expenses selected for deletion</p>
              <Button onClick={handleBulkDeleteExpenses} variant="destructive" size="sm" className="bg-red-600 hover:bg-red-700 h-8">
                <Trash2 className="w-3 h-3 mr-2" /> Delete Selected
              </Button>
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            {loading ? (
              <div className="p-6 text-center text-slate-400">Loading...</div>
            ) : expenses.length === 0 ? (
              <div className="p-6 text-center text-slate-400">No expenses yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-800 bg-slate-950">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input 
                          type="checkbox" 
                          checked={selectedExpenseIds.length === expenses.length && expenses.length > 0}
                          onChange={() => {
                            if (selectedExpenseIds.length === expenses.length) setSelectedExpenseIds([])
                            else setSelectedExpenseIds(expenses.map(e => e.id))
                          }}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-800 accent-blue-500" 
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-slate-300 font-semibold">Expense Category</th>
                      <th className="px-4 py-3 text-left text-slate-300 font-semibold">Business Category</th>
                      <th className="px-4 py-3 text-left text-slate-300 font-semibold">Amount</th>
                      <th className="px-4 py-3 text-left text-slate-300 font-semibold">Benefit Status</th>
                      <th className="px-4 py-3 text-right text-slate-300 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {expenses.map((exp) => (
                      <tr key={exp.id} className={`hover:bg-slate-800/50 transition-colors ${selectedExpenseIds.includes(exp.id) ? 'bg-blue-900/10' : ''}`}>
                         <td className="px-4 py-3">
                          <input 
                            type="checkbox" 
                            checked={selectedExpenseIds.includes(exp.id)}
                            onChange={() => {
                               if (selectedExpenseIds.includes(exp.id)) setSelectedExpenseIds(selectedExpenseIds.filter(id => id !== exp.id))
                               else setSelectedExpenseIds([...selectedExpenseIds, exp.id])
                            }}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-800 accent-blue-500" 
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-white font-medium text-sm">{exp.category}</span>
                            <span className="text-[10px] text-slate-500 truncate max-w-[150px]">{exp.description}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-900/40 text-blue-300 border border-blue-800/50">
                            {exp.tax_category || "General"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-red-400 font-semibold">₹{exp.amount.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          {exp.itc_eligible ? (
                            <span className="text-[10px] text-green-400 flex items-center gap-1">✓ Tax Deductible</span>
                          ) : (
                            <span className="text-[10px] text-slate-500">Non-deductible</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            {exp.category === "Inventory Purchase" && (
                              <Button
                                onClick={() => printPurchaseBill(exp)}
                                variant="outline"
                                size="sm"
                                title="Print Purchase Bill"
                                className="border-blue-900/50 text-blue-400 hover:bg-blue-950/50"
                              >
                                <Printer className="w-3 h-3" />
                              </Button>
                            )}
                            <Button
                              onClick={() => setEditingExpense(exp)}
                              variant="outline"
                              size="sm"
                              className="border-slate-700 hover:bg-slate-800"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              onClick={() => handleDeleteExpense(exp.id)}
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
        </div>
      </div>

      {/* Edit Expense Modal */}
      {editingExpense && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Edit Expense</h3>
              <Button onClick={() => setEditingExpense(null)} variant="outline" size="sm" className="border-slate-700">
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Category</label>
                <Input
                  value={editingExpense.category}
                  onChange={(e) => setEditingExpense({ ...editingExpense, category: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Description</label>
                <Input
                  value={editingExpense.description || ""}
                  onChange={(e) => setEditingExpense({ ...editingExpense, description: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Amount (₹)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={editingExpense.amount}
                  onChange={(e) => setEditingExpense({ ...editingExpense, amount: Number.parseFloat(e.target.value) })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Expense Date</label>
                <Input
                  type="date"
                  value={editingExpense.expense_date}
                  onChange={(e) => setEditingExpense({ ...editingExpense, expense_date: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingExpense.gst_applicable}
                  onChange={(e) => {
                    const gstApplicable = e.target.checked
                    const gstAmount = gstApplicable ? editingExpense.amount * 0.18 : 0
                    setEditingExpense({ ...editingExpense, gst_applicable: gstApplicable, gst_amount: gstAmount })
                  }}
                  className="w-4 h-4"
                />
                GST Applicable (18%)
              </label>
              {editingExpense.gst_applicable && (
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">GST Amount (₹)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingExpense.gst_amount}
                    onChange={(e) =>
                      setEditingExpense({ ...editingExpense, gst_amount: Number.parseFloat(e.target.value) })
                    }
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              )}
              <Button onClick={handleUpdateExpense} className="w-full bg-blue-600 hover:bg-blue-700">
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sales Orders & Invoices */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Sales Orders & Invoices</h2>
        </div>

        {loading ? (
          <div className="text-center text-slate-400 py-8">Loading sales orders...</div>
        ) : salesOrders.length === 0 ? (
          <div className="text-center text-slate-400 py-8">No sales orders yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-800 bg-slate-950">
                <tr>
                  <th className="px-4 py-3 text-left text-slate-300 font-semibold">Order #</th>
                  <th className="px-4 py-3 text-left text-slate-300 font-semibold">Customer</th>
                  <th className="px-4 py-3 text-left text-slate-300 font-semibold">Date</th>
                  <th className="px-4 py-3 text-left text-slate-300 font-semibold">Subtotal</th>
                  <th className="px-4 py-3 text-left text-slate-300 font-semibold">GST</th>
                  <th className="px-4 py-3 text-left text-slate-300 font-semibold">Total</th>
                  <th className="px-4 py-3 text-left text-slate-300 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {salesOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/50">
                    <td className="px-4 py-3 text-white font-mono text-xs">
                      {order.id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{order.customer_name}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      ₹{(order.total_amount - order.gst_amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-slate-300">₹{order.gst_amount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-green-400 font-semibold">
                      ₹{order.total_amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        onClick={() => printInvoice(order)}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-xs"
                      >
                        <Printer className="w-3 h-3 mr-1" />
                        Print
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
