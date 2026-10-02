"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Copy, Check, Loader2, Video, Camera, Hash, Zap, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ReelIdea {
  concept: string
  shootingDirections: string[]
  captions: string[]
  hashtags: string[]
}

export default function AIMarketingPage() {
  const supabase = createClient()
  const { toast } = useToast()

  const [userEmail, setUserEmail] = useState("")
  const [activeService, setActiveService] = useState<"shoot" | "strategy" | null>(null)

  const [serviceForm, setServiceForm] = useState({
    location: "",
    time: "",
    phone: "",
    description: "",
    budget: "",
  })

  // AI Generator State
  const [productName, setProductName] = useState("")
  const [eventDescription, setEventDescription] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [reelIdea, setReelIdea] = useState<ReelIdea | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  /* ---------------- FETCH USER EMAIL ---------------- */
  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user?.email) setUserEmail(user.email)
    }
    loadUser()
  }, [supabase])

  /* ---------------- SERVICE EMAIL ---------------- */
  const submitService = async () => {
    try {
      const res = await fetch("/api/service-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: activeService!,
          userEmail,
          phone: serviceForm.phone,
          location: serviceForm.location,
          time: serviceForm.time,
          budget: serviceForm.budget,
          description: serviceForm.description,
        }),
      })
      if (!res.ok) throw new Error("Mail failed")
      alert("Request sent – we’ll contact you soon!")
      setActiveService(null)
    } catch (err: any) {
      alert(err.message || "Failed to send request")
    }
  }

  const handleServiceChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setServiceForm({ ...serviceForm, [e.target.name]: e.target.value })
  }

  /* ---------------- AI REEL GENERATOR ---------------- */
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productName || !eventDescription) return

    setIsGenerating(true)
    setReelIdea(null)

    try {
      const response = await fetch("/api/ai/generate-reel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName, eventDescription }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to generate reel idea")
      }

      const data = await response.json()
      setReelIdea(data.reelIdea)
      toast({
        title: "Success",
        description: "Your trending reel idea is ready!",
      })
    } catch (error: any) {
      console.error("Error generating reel:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate reel idea. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = (text: string, index?: number) => {
    navigator.clipboard.writeText(text)
    if (index !== undefined) {
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    }
    toast({
      title: "Copied!",
      description: "Content copied to clipboard",
    })
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold text-white flex items-center gap-3">
          <Sparkles className="text-blue-400 size-8" /> AI Social Media Marketing
        </h1>
        <p className="text-slate-400 text-lg">Generate viral content ideas and request professional services</p>
      </div>

      {/* ---------------- SERVICE CARDS ---------------- */}
      <div className="grid md:grid-cols-2 gap-6">
        <div
          onClick={() => setActiveService("shoot")}
          className={`cursor-pointer transition-all duration-300 p-8 rounded-2xl border-2 hover:scale-105 active:scale-95 ${
            activeService === "shoot"
              ? "bg-purple-900/40 border-purple-500 shadow-purple-500/20 shadow-2xl"
              : "bg-slate-900 border-slate-800 hover:border-purple-500/50"
          }`}
        >
          <div className="bg-purple-500/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
            <Camera className="text-purple-400 size-6" />
          </div>
          <h2 className="text-2xl text-white font-bold mb-2">Request Reel Shoot</h2>
          <p className="text-slate-400">Get professional reel shooting done by our expert team in your city.</p>
        </div>

        <div
          onClick={() => setActiveService("strategy")}
          className={`cursor-pointer transition-all duration-300 p-8 rounded-2xl border-2 hover:scale-105 active:scale-95 ${
            activeService === "strategy"
              ? "bg-blue-900/40 border-blue-500 shadow-blue-500/20 shadow-2xl"
              : "bg-slate-900 border-slate-800 hover:border-blue-500/50"
          }`}
        >
          <div className="bg-blue-500/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
            <Zap className="text-blue-400 size-6" />
          </div>
          <h2 className="text-2xl text-white font-bold mb-2">Custom Reel Strategy</h2>
          <p className="text-slate-400">Get a tailored 30-day reel strategy and growth planning for your brand.</p>
        </div>
      </div>

      {/* ---------------- SERVICE FORM MODAL-LIKE ---------------- */}
      {activeService && (
        <Card className="bg-slate-900 border-slate-800 shadow-2xl relative animate-in fade-in zoom-in duration-300">
          <button
            onClick={() => setActiveService(null)}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
          >
            <X className="size-5" />
          </button>
          <CardHeader>
            <CardTitle className="text-2xl text-white">
              {activeService === "shoot" ? "Professional Reel Shoot Request" : "Custom Marketing Strategy Request"}
            </CardTitle>
            <CardDescription className="text-slate-400">
              Fill in the details below and we will get back to you within 24 hours.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Email Address</Label>
                <Input value={userEmail} disabled className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Contact Number</Label>
                <Input
                  name="phone"
                  placeholder="+91 98765 43210"
                  onChange={handleServiceChange}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Location</Label>
                <Input
                  name="location"
                  placeholder="e.g. Mumbai, Maharashtra"
                  onChange={handleServiceChange}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Preferred Time/Month</Label>
                <Input
                  name="time"
                  placeholder="e.g. Next week, December 2024"
                  onChange={handleServiceChange}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              {activeService === "strategy" && (
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-slate-300">Current Monthly Budget (₹)</Label>
                  <Input
                    name="budget"
                    placeholder="e.g. 50,000"
                    onChange={handleServiceChange}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Describe Your Requirements</Label>
              <Textarea
                name="description"
                placeholder="What kind of reels are you looking for? Who is your target audience?"
                onChange={handleServiceChange}
                className="bg-slate-800 border-slate-700 text-white min-h-[100px]"
              />
            </div>

            <Button onClick={submitService} size="lg" className="w-full bg-blue-600 hover:bg-blue-700">
              Submit Request
            </Button>
          </CardContent>
        </Card>
      )}

      <hr className="border-slate-800" />

      {/* ---------------- AI TRENDLYZER GENERATOR ---------------- */}
      <div className="space-y-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <Zap className="text-yellow-400 size-7" /> Trendlyzer: AI Reel Generator
          </h2>
          <p className="text-slate-400">Generate viral-ready reel concepts, shooting steps, and captions in seconds.</p>
        </div>

        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm shadow-xl">
          <CardContent className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product" className="text-lg font-medium text-slate-200">
                  Product/Brand Name
                </Label>
                <Input
                  id="product"
                  placeholder="e.g. Eco-Friendly Yoga Mats, Gourmet Coffee"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white h-12 text-lg"
                  disabled={isGenerating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="event" className="text-lg font-medium text-slate-200">
                  The Occasion or Theme
                </Label>
                <Textarea
                  id="event"
                  placeholder="e.g. Diwali Sale, Morning Routine Trend, Brand Launch Celebration"
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white min-h-[120px] text-lg"
                  disabled={isGenerating}
                />
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={!productName || !eventDescription || isGenerating}
              className="w-full h-14 text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 shadow-lg shadow-blue-500/20"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-3 size-6 animate-spin" />
                  Generating Viral Content...
                </>
              ) : (
                <>
                  <Sparkles className="mr-3 size-6" />
                  Generate Trending Idea
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* ---------------- AI RESULTS ---------------- */}
        {reelIdea && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <Card className="border-blue-500/30 bg-blue-500/5 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl text-white">
                  <Video className="size-7 text-blue-400" />
                  Reel Concept
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl leading-relaxed text-slate-200">{reelIdea.concept}</p>
              </CardContent>
            </Card>

            <div className="grid lg:grid-cols-2 gap-8">
              <Card className="border-slate-800 bg-slate-900">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl text-white">
                    <Camera className="size-6 text-purple-400" />
                    Shooting Directions
                  </CardTitle>
                  <CardDescription>Step-by-step instructions for your video</CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-4">
                    {reelIdea.shootingDirections.map((direction, idx) => (
                      <li key={idx} className="flex gap-4 items-start">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-sm font-bold text-blue-400 mt-1">
                          {idx + 1}
                        </div>
                        <p className="text-slate-300 leading-relaxed text-lg">{direction}</p>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="border-slate-800 bg-slate-900 h-fit">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl text-white">
                      <Sparkles className="size-6 text-yellow-400" />
                      Captions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {reelIdea.captions.map((caption, idx) => (
                      <div
                        key={idx}
                        className="group relative rounded-xl border border-slate-800 bg-slate-800/50 p-4 hover:bg-slate-800 transition-colors cursor-pointer"
                        onClick={() => copyToClipboard(caption, idx)}
                      >
                        <p className="text-slate-200 text-base leading-relaxed pr-8">{caption}</p>
                        <button className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          {copiedIndex === idx ? (
                            <Check className="size-5 text-green-400" />
                          ) : (
                            <Copy className="size-5 text-slate-400 hover:text-white" />
                          )}
                        </button>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-slate-800 bg-slate-900">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl text-white">
                      <Hash className="size-6 text-cyan-400" />
                      Hashtags
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {reelIdea.hashtags.map((tag, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="bg-slate-800 text-slate-300 hover:bg-cyan-500/20 hover:text-cyan-400 transition-colors border-slate-700 cursor-pointer text-sm py-1 px-3"
                          onClick={() => copyToClipboard(`#${tag}`)}
                        >
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full border-slate-700 hover:bg-slate-800"
                      onClick={() => copyToClipboard(reelIdea.hashtags.map((h) => `#${h}`).join(" "))}
                    >
                      <Copy className="mr-2 size-4" /> Copy All Hashtags
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}