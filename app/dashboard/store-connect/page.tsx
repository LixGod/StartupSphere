"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Store, LinkIcon, CheckCircle, AlertCircle, Loader2 } from "lucide-react"

export default function StoreConnectPage() {
  const [platform, setPlatform] = useState<string>("")
  const [storeUrl, setStoreUrl] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [accessToken, setAccessToken] = useState("")
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState("")

  const platforms = [
    { id: "shopify", name: "Shopify", icon: "🛍️", description: "Connect your Shopify store for real-time inventory sync" },
    { id: "woocommerce", name: "WooCommerce", icon: "🛒", description: "Sync with your WordPress WooCommerce store" },
    { id: "amazon", name: "Amazon Seller", icon: "📦", description: "Connect your Amazon Seller Central account" },
    { id: "custom", name: "Custom API", icon: "🔌", description: "Connect via custom REST API" },
  ]

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setConnecting(true)
    setError("")

    try {
      if (platform === "shopify") {
        // Validate Shopify credentials
        const response = await fetch(`https://${storeUrl}/admin/api/2024-01/products.json`, {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('Invalid Shopify credentials or store URL')
        }

        const data = await response.json()
        console.log('Shopify connection successful:', data.products?.length || 0, 'products found')

        // Here you would typically save the connection to your database
        // For now, we'll just simulate success
        setTimeout(() => {
          setConnected(true)
          setConnecting(false)
        }, 2000)

      } else if (platform === "woocommerce") {
        // Validate WooCommerce credentials
        const wcAuth = btoa(`${apiKey}:${accessToken}`)
        const response = await fetch(`${storeUrl}/wp-json/wc/v3/products`, {
          headers: {
            'Authorization': `Basic ${wcAuth}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('Invalid WooCommerce credentials or store URL')
        }

        const data = await response.json()
        console.log('WooCommerce connection successful:', data.length, 'products found')

        setTimeout(() => {
          setConnected(true)
          setConnecting(false)
        }, 2000)

      } else {
        // For other platforms, simulate connection for now
        setTimeout(() => {
          setConnected(true)
          setConnecting(false)
        }, 2000)
      }
    } catch (err: any) {
      setError(err.message || 'Connection failed. Please check your credentials.')
      setConnecting(false)
    }
  }

  const getPlatformFields = () => {
    switch (platform) {
      case "shopify":
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Store URL</label>
              <Input
                type="url"
                placeholder="your-store.myshopify.com"
                value={storeUrl}
                onChange={(e) => setStoreUrl(e.target.value)}
                required
                className="bg-slate-800 border-slate-700 text-white"
              />
              <p className="text-xs text-slate-500 mt-2">
                Your Shopify store domain (without https://)
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Access Token</label>
              <Input
                type="password"
                placeholder="Enter your Shopify access token"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                required
                className="bg-slate-800 border-slate-700 text-white"
              />
              <p className="text-xs text-slate-500 mt-2">
                Create this in Shopify Admin → Apps → Develop apps
              </p>
            </div>
          </>
        )
      case "woocommerce":
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Store URL</label>
              <Input
                type="url"
                placeholder="https://yourstore.com"
                value={storeUrl}
                onChange={(e) => setStoreUrl(e.target.value)}
                required
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Consumer Key</label>
              <Input
                type="password"
                placeholder="ck_..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Consumer Secret</label>
              <Input
                type="password"
                placeholder="cs_..."
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                required
                className="bg-slate-800 border-slate-700 text-white"
              />
              <p className="text-xs text-slate-500 mt-2">
                Generate API keys in WooCommerce → Settings → Advanced → REST API
              </p>
            </div>
          </>
        )
      default:
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">API Endpoint</label>
              <Input
                type="url"
                placeholder="https://api.yourstore.com"
                value={storeUrl}
                onChange={(e) => setStoreUrl(e.target.value)}
                required
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">API Key</label>
              <Input
                type="password"
                placeholder="Enter your API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </>
        )
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Store className="w-8 h-8 text-blue-400" />
          Connect Your Store
        </h1>
        <p className="text-slate-400 mt-1">Sync inventory and sales from your e-commerce platform in real-time</p>
      </div>

      {!platform ? (
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Select Your Platform</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {platforms.map((p) => (
              <button
                key={p.id}
                onClick={() => setPlatform(p.id)}
                className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:bg-slate-800 hover:border-blue-600 transition-all text-left group"
              >
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{p.icon}</div>
                <h3 className="font-semibold text-white mb-1">{p.name}</h3>
                <p className="text-sm text-slate-400">{p.description}</p>
              </button>
            ))}
          </div>
        </div>
      ) : connected ? (
        <div className="bg-slate-900 border border-green-600/30 rounded-xl p-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Successfully Connected!</h2>
          <p className="text-slate-400 mb-6">
            Your {platforms.find((p) => p.id === platform)?.name} store is now syncing with StartupSphere
          </p>
          <div className="space-y-4 max-w-md mx-auto">
            <div className="bg-slate-800 rounded-lg p-4 flex justify-between items-center">
              <span className="text-slate-300">Auto-sync Inventory</span>
              <span className="text-green-400 font-medium">Active</span>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 flex justify-between items-center">
              <span className="text-slate-300">Auto-sync Orders</span>
              <span className="text-green-400 font-medium">Active</span>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 flex justify-between items-center">
              <span className="text-slate-300">Sync Frequency</span>
              <span className="text-blue-400 font-medium">Every 15 minutes</span>
            </div>
          </div>
          <Button
            onClick={() => {
              setPlatform("")
              setConnected(false)
              setStoreUrl("")
              setApiKey("")
              setAccessToken("")
            }}
            variant="outline"
            className="mt-6 border-slate-700"
          >
            Connect Another Store
          </Button>
        </div>
      ) : (
        <div className="max-w-2xl">
          <Button onClick={() => setPlatform("")} variant="ghost" className="mb-4 text-slate-400 hover:text-white">
            ← Back to platforms
          </Button>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              Connect {platforms.find((p) => p.id === platform)?.name}
            </h2>
            {error && (
              <div className="mb-4 p-4 bg-red-900/20 border border-red-600/30 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}
            <form onSubmit={handleConnect} className="space-y-4">
              {getPlatformFields()}
              <Button type="submit" disabled={connecting} className="w-full bg-blue-600 hover:bg-blue-700 shadow-lg">
                {connecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Connect Store
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
