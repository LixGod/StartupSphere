import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Groq API key not configured" }, { status: 500 });
    }

    // Call Groq Llama-4-Scout Vision to identify the product
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
                text: "Identify this product from the image. Return a JSON object with: 'name', 'category' (suggest one), 'sku' (generate a likely one or extract from barcode if visible), and 'suggested_price' (in INR). If you cannot identify it, state 'Unknown'. Return ONLY the JSON.",
              },
              {
                type: "image_url",
                image_url: {
                  url: image, // This should be a base64 string including the data:image prefix
                },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
        return NextResponse.json({ error: data.error?.message || "AI Identification failed" }, { status: response.status });
    }

    const result = JSON.parse(data.choices[0].message.content);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Product ID error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
