import { NextResponse } from "next/server";
import { z } from "zod";
type TrendingClip = { id: string; description: string; music: string; plays: number };
type ReelIdea      = { reel: string; caption: string; hashtags: string[] };
const { GROQ_API_KEY } = process.env as Record<string, string>;

/* ---------- Scraper (with debug + rotating fallback) ---------- */
const DAILY_TRENDS: TrendingClip[] = [
  // updated 2025-12-27 – rotate these once a week
  { id: "1", description: "Meww Meww dance break", music: "Meww Meww - DJ Kaito", plays: 1850000 },
  { id: "2", description: "Snap & flick transition", music: "Snap Beat - Rajan", plays: 1420000 },
  { id: "3", description: "Heel-toe shuffle", music: "Heel-Toe - Desi Trap", plays: 980000 },
  { id: "4", description: "Sock-slide reveal", music: "Slide Whistle - KV", plays: 760000 },
  { id: "5", description: "Cover-lens cut", music: "Camera Cover SFX", plays: 610000 },
];

async function scrapeTrendingReels(region: "india" | "global"): Promise<TrendingClip[]> {
  try {
    const country = region === "india" ? "IN" : "US";
    const url = `https://www.googleapis.com/youtube/v3/search` +
      `?part=snippet&regionCode=${country}&type=video&videoDuration=short` +
      `&order=viewCount&maxResults=10&key=${process.env.YOUTUBE_KEY!}`;

    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) throw new Error(`YouTube ${res.status}`);

    const data: any = await res.json();
    console.log("YouTube raw:", JSON.stringify(data, null, 2));
    const items: any[] = data.items || [];

    // map to our shape
    const clips: TrendingClip[] = items.map((v: any) => ({
      id: v.id.videoId,
      description: v.snippet?.title?.slice(0, 80) || "",
      music: v.snippet?.title?.split(" - ")[1] || "trending audio",
      plays: 0, // viewCount not in this endpoint, but order is by views
    }));

    if (!clips.length) throw new Error("Empty Shorts");
    return clips;
  } catch (err) {
    console.warn("YouTube fail → fallback", err);
  return (() => {
  const pick = DAILY_TRENDS[Math.floor(Math.random() * DAILY_TRENDS.length)];
  return [pick]; 
})();
  }
}


/* ---------- Groq (format-first, product slotted in) ---------- */
async function generateWithGroq(
  product: string,
  description: string,
  trending: TrendingClip[]
): Promise<ReelIdea> {
  const topAudio = trending[0]; // hottest format
  const prompt = `
You are an expert Instagram Reels trend analyst, familiar with the latest Indian trends.

Hottest audio/format right now (reuse count ${topAudio.plays}):
- Audio: ${topAudio.music}
- Typical hook: ${topAudio.description}

User wants a **complete shot-by-shot directions** list they can hand to any creator.
Product placeholder: ${product}
Offer / event: ${description}

Create **one** reel idea that follows the hottest format but only *mentions* the product/offer in 1-2 seconds or via text overlay.  
Return a **step-by-step shooting guide** (timings, camera angles, text, transitions).

Output STRICT JSON only in this format:

{
  "reel": "0-2s: Hook shot + camera move + text overlay\\n2-5s: Step 2… etc",
  "caption": "caption that includes the offer naturally",
  "hashtags": ["#tag1", "#tag2", "..."]
}
`;
  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "llama-3.1-8b-instant", temperature: 0.8, messages: [{ role: "user", content: prompt }] }),
  });

  const raw: any = await groqRes.json();
  const content: string = raw?.choices?.[0]?.message?.content || "";
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON block returned");
  return z.object({ reel: z.string(), caption: z.string(), hashtags: z.array(z.string()) }).parse(JSON.parse(jsonMatch[0]));
}
/* ---------- Route handler (bullet-proof) ---------- */
export async function POST(req: Request) {
  try {
    if (req.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    const body = await req.json();
    const { product, description, region } = z
      .object({
        product: z.string().min(1),
        description: z.string().min(1),
        region: z.enum(["india", "global"]),
      })
      .parse(body);

    let trending: TrendingClip[] = [];
    try {
      trending = await scrapeTrendingReels(region); // <-- no hashtag arg now
    } catch (scraperErr) {
      console.warn("Scraper fail", scraperErr);
    }

    let idea: ReelIdea;
    try {
      idea = await generateWithGroq(product, description, trending);
    } catch (groqErr) {
      console.warn("Groq fail", groqErr);
      // safe fallback so UI never breaks
      idea = {
        reel: "Hook: snap transition → show product → 2-step dance → CTA swipe. Text: 'Sale inside 🎁'",
        caption: `⚡ ${description} – link in bio!`,
        hashtags: ["#TrendingNow", "#ReelItFeelIt", "#OfferAlert"],
      };
    }

    return NextResponse.json(idea, {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
} catch (err: any) {
  console.error("Route crash:", err);        // ← will appear in Vercel/Node logs
  return NextResponse.json(
    { error: err.message || "Server error", stack: err.stack }, // ← sent to browser
    { status: 500 }
  );
}
}