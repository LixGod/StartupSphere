import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { image } = await req.json()
    const apiKey = process.env.GROQ_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "Groq API key not configured" }, { status: 500 })
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this manufacturer invoice and extract the details as a JSON object. Return ONLY the JSON. Include: manufacturer_name, manufacturer_address, manufacturer_gstin, and a list of 'items' each with: name, sku, buying_price, selling_price (estimated 20% markup if not present), and quantity. Format: { \"manufacturer_name\": \"...\", \"items\": [ { ... } ] }",
              },
              {
                type: "image_url",
                image_url: {
                  url: image,
                },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    })

    const data = await response.json()
    
    if (!data.choices || data.choices.length === 0) {
      console.error("Groq API Error:", data)
      return NextResponse.json({ error: data.error?.message || "AI failed to process the invoice image." }, { status: 400 })
    }

    const content = data.choices[0].message.content
    const result = JSON.parse(content)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("AI Scan Error:", error)
    return NextResponse.json({ error: "Failed to parse invoice. Please ensure the image is clear and contains text." }, { status: 500 })
  }
}
