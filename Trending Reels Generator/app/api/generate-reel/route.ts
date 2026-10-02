import { generateText } from "ai"
import { createGroq } from "@ai-sdk/groq"

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { productName, eventDescription } = await req.json()

    if (!productName || !eventDescription) {
      return Response.json({ error: "Product name and event description are required" }, { status: 400 })
    }

    if (!process.env.GROQ_API_KEY) {
      return Response.json({ error: "GROQ_API_KEY environment variable is not set" }, { status: 500 })
    }

    const prompt = `You are a social media expert specializing in creating viral TikTok and Instagram reels for the Indian and global market.

Product: ${productName}
Event/Occasion: ${eventDescription}

Generate a complete trending reel idea that includes:

1. A creative and engaging reel concept that connects the product with the event
2. Detailed shooting directions (5-7 specific steps covering camera angles, transitions, props, and actions)
3. Multiple caption options (3 variations: one emotional, one humorous, one straightforward)
4. Trending hashtags relevant to India and global audiences (8-12 hashtags including trending, niche, and branded)

Format your response as a JSON object with this structure:
{
  "concept": "Brief overview of the reel idea",
  "shootingDirections": ["Step 1...", "Step 2...", ...],
  "captions": ["Caption 1...", "Caption 2...", "Caption 3..."],
  "hashtags": ["hashtag1", "hashtag2", ...]
}

Make the reel idea trendy, authentic, and optimized for virality. Consider current trends in Indian social media and global platforms.`

    // Try different models in order of preference (using latest recommended models)
    // Note: llama3-70b-8192 and llama3-8b-8192 were deprecated on 08/30/25
    const models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"]
    let text = ""
    let lastError: Error | null = null

    for (const modelName of models) {
      try {
        const result = await generateText({
          model: groq(modelName),
          prompt,
          maxTokens: 2000,
          temperature: 0.8,
        })
        text = result.text
        break // Success, exit loop
      } catch (modelError) {
        console.warn(`Model ${modelName} failed:`, modelError)
        lastError = modelError instanceof Error ? modelError : new Error(String(modelError))
        continue // Try next model
      }
    }

    if (!text) {
      throw lastError || new Error("All models failed")
    }

    // Parse the AI response as JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error("Failed to parse AI response. Raw text:", text)
      return Response.json({ error: "Failed to parse AI response. Please try again." }, { status: 500 })
    }

    try {
      const reelIdea = JSON.parse(jsonMatch[0])
      
      // Validate the response structure
      if (!reelIdea.concept || !reelIdea.shootingDirections || !reelIdea.captions || !reelIdea.hashtags) {
        console.error("Invalid response structure:", reelIdea)
        return Response.json({ error: "Invalid response format from AI. Please try again." }, { status: 500 })
      }

      return Response.json({ reelIdea })
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "JSON string:", jsonMatch[0])
      return Response.json({ error: "Failed to parse AI response as JSON. Please try again." }, { status: 500 })
    }
  } catch (error) {
    console.error("Error generating reel:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to generate reel idea"
    return Response.json({ error: errorMessage }, { status: 500 })
  }
}
