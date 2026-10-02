"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Loader2, Video, Camera, Hash, Zap, Copy, Check } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface ReelIdea {
  concept: string
  shootingDirections: string[]
  captions: string[]
  hashtags: string[]
}

export default function Home() {
  const [productName, setProductName] = useState("")
  const [eventDescription, setEventDescription] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [reelIdea, setReelIdea] = useState<ReelIdea | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const { toast } = useToast()

  const handleGenerate = async () => {
    if (!productName || !eventDescription) return

    setIsGenerating(true)
    setReelIdea(null)

    try {
      const response = await fetch("/api/generate-reel", {
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
    } catch (error) {
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
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/20">
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-xl">
        <div className="container flex items-center gap-4 py-6 md:py-8">
          <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 shadow-lg backdrop-blur-sm md:size-14">
            <Sparkles className="size-6 text-primary md:size-8" />
          </div>
          <div>
            <h1 className="text-balance text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent md:text-4xl">
              Trendlyzer
            </h1>
            <p className="text-balance text-sm leading-relaxed text-muted-foreground md:text-base">
              AI-Powered Reel Idea Generator for Viral Content
            </p>
          </div>
        </div>
      </header>

      <main className="container flex-1 py-8 md:py-12">
        <div className="mx-auto max-w-4xl">
          <Card className="mb-8 border-border/50 bg-card/50 backdrop-blur-sm shadow-2xl">
            <CardHeader className="space-y-3">
              <CardTitle className="flex items-center gap-2 text-2xl font-semibold">
                <Zap className="size-6 text-primary" />
                Create Your Trending Reel
              </CardTitle>
              <CardDescription className="text-base leading-relaxed text-muted-foreground">
                Enter your product and event details to get a complete reel concept with shooting directions, captions, and hashtags powered by AI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="product" className="text-base font-medium">
                  Product Name
                </Label>
                <Input
                  id="product"
                  type="text"
                  placeholder="e.g., Organic Face Cream, Smart Watch, Eco-Friendly Water Bottle"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="text-base bg-background/50 border-border/50 focus:border-primary/50"
                  disabled={isGenerating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="event" className="text-base font-medium">
                  Event Description
                </Label>
                <Textarea
                  id="event"
                  placeholder="e.g., New Year Sale, Summer Festival, Diwali Celebration, Product Launch Event"
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  className="min-h-32 text-base bg-background/50 border-border/50 focus:border-primary/50 resize-none"
                  disabled={isGenerating}
                />
                <p className="text-sm text-muted-foreground">
                  Describe the occasion, target audience, or campaign theme
                </p>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={!productName || !eventDescription || isGenerating}
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 py-6 text-lg font-semibold shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 size-5 animate-spin" />
                    Generating Your Trending Reel...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 size-5" />
                    Generate Reel Idea
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {reelIdea && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl font-semibold">
                    <Video className="size-6 text-primary" />
                    Reel Concept
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-balance text-base leading-relaxed text-foreground/90">{reelIdea.concept}</p>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl font-semibold">
                    <Camera className="size-6 text-primary" />
                    Shooting Directions
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">Step-by-step guide to create your reel</CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-4">
                    {reelIdea.shootingDirections.map((direction, idx) => (
                      <li key={idx} className="flex gap-4 group">
                        <Badge
                          variant="outline"
                          className="flex size-8 shrink-0 items-center justify-center rounded-full border-primary/30 bg-primary/10 text-sm font-bold text-primary group-hover:bg-primary/20 transition-colors"
                        >
                          {idx + 1}
                        </Badge>
                        <p className="flex-1 pt-1 leading-relaxed text-foreground/90">{direction}</p>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

              <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                      <Sparkles className="size-5 text-primary" />
                      Caption Ideas
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">Ready-to-use captions for your reel</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {reelIdea.captions.map((caption, idx) => (
                        <div
                          key={idx}
                          className="group relative rounded-lg border border-border/50 bg-muted/30 p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => copyToClipboard(caption, idx)}
                        >
                          <p className="text-pretty text-sm leading-relaxed text-foreground/90 pr-8">{caption}</p>
                          <button
                            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-background/50"
                            onClick={(e) => {
                              e.stopPropagation()
                              copyToClipboard(caption, idx)
                            }}
                          >
                            {copiedIndex === idx ? (
                              <Check className="size-4 text-primary" />
                            ) : (
                              <Copy className="size-4 text-muted-foreground hover:text-foreground" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                      <Hash className="size-5 text-primary" />
                      Trending Hashtags
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">Boost your reach with these hashtags</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {reelIdea.hashtags.map((hashtag, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="px-3 py-1.5 text-sm cursor-pointer hover:bg-primary/20 hover:text-primary transition-colors border-border/50"
                          onClick={() => copyToClipboard(`#${hashtag}`)}
                        >
                          #{hashtag}
                        </Badge>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 w-full border-border/50 hover:bg-primary/10 hover:text-primary"
                      onClick={() => copyToClipboard(reelIdea.hashtags.map((h) => `#${h}`).join(" "))}
                    >
                      <Copy className="mr-2 size-4" />
                      Copy All Hashtags
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {!reelIdea && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-lg">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">What You Get</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-relaxed text-muted-foreground">
                  <ul className="ml-4 list-disc space-y-2">
                    <li>Creative reel concept tailored to your product</li>
                    <li>Complete step-by-step shooting directions</li>
                    <li>Multiple caption variations for different tones</li>
                    <li>Trending hashtags for maximum reach globally</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-lg">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Powered by AI</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-relaxed text-muted-foreground">
                  <p>
                    Using advanced AI models, we analyze current trends globally to generate reel ideas that resonate with your target audience and maximize engagement.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-border/40 py-6 mt-auto">
        <div className="container text-center text-sm text-muted-foreground">
          <p>Built for creators and marketers</p>
        </div>
      </footer>
    </div>
  )
}
