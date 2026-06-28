import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const VISION_PROMPT = `You are an expert facial aesthetics analyst with deep knowledge of PSL (Pretty Scale Looksmaxxing) principles, aesthetic surgery, and facial harmony assessment. Analyze this face and provide precise numerical scores for each category below.

Be honest and accurate — do not be overly generous. An average face should score 5.0, exceptional faces 8.5+, below average faces below 4.0.

Score each category from 0.0 to 10.0 with one decimal place:

1. JAW_DEFINITION: Sharpness and definition of the jawline. 10 = razor sharp defined jaw with clear mandibular line. 5 = average definition. 1 = completely soft/undefined jaw blending into neck.

2. CHEEKBONE_PROMINENCE: How prominent and projected the cheekbones are. 10 = extremely prominent high cheekbones with clear zygomatic projection. 5 = average cheekbones. 1 = flat face with no cheekbone definition.

3. SKIN_QUALITY: Clarity, smoothness, and overall skin health. 10 = perfect clear skin. 5 = average with minor blemishes. 1 = severe acne/scarring/poor texture.

4. SEXUAL_DIMORPHISM: How masculine this face appears (for males) or feminine (for females). For males: 10 = extremely masculine strong features. 5 = average masculine. 1 = very feminine features on a male face. Assess the gender presented.

5. FACIAL_FAT: How lean the face appears. 10 = extremely lean, no excess fat, sharp features. 5 = average. 1 = very chubby/round face with significant fat obscuring structure.

6. OVERALL_HARMONY: How well all features work together as a complete face. 10 = perfect harmony, every feature complements the others. 5 = some features work together. 1 = features clash, face looks disjointed.

7. EYE_APPEAL: Overall attractiveness and impact of the eyes including shape, spacing, tilt, expression. 10 = extremely attractive compelling eyes. 5 = average eyes. 1 = very unappealing eyes.

8. OVERALL_IMPRESSION: Your overall aesthetic impression of this face ignoring hairstyle and grooming. Pure bone structure and facial features only. 10 = top 1% attractive. 5 = average. 1 = bottom 5%.

Respond ONLY with a JSON object in exactly this format, no other text:
{
  "jaw_definition": 7.2,
  "cheekbone_prominence": 6.8,
  "skin_quality": 8.1,
  "sexual_dimorphism": 7.5,
  "facial_fat": 6.9,
  "overall_harmony": 7.3,
  "eye_appeal": 8.0,
  "overall_impression": 7.4,
  "reasoning": "Brief 2 sentence explanation of key strengths and weaknesses"
}`;

export async function POST(request: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured" },
        { status: 500 }
      );
    }

    const client = new Anthropic({
      apiKey: apiKey,
    });

    const { imageBase64, imageMediaType } = await request.json();

    if (!imageBase64 || !imageMediaType) {
      return NextResponse.json(
        { error: "Missing imageBase64 or imageMediaType" },
        { status: 400 }
      );
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: imageMediaType,
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: VISION_PROMPT,
            },
          ],
        },
      ],
    });

    // Extract text content from response
    const textContent = response.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json(
        { error: "No text response from Claude" },
        { status: 500 }
      );
    }

    // Parse the JSON response
    try {
      const result = JSON.parse(textContent.text);
      return NextResponse.json({ result });
    } catch {
      // If JSON parsing fails, try to extract JSON from the response
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return NextResponse.json({ result });
      }
      return NextResponse.json(
        { error: "Failed to parse Claude response as JSON", raw: textContent.text },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Vision score API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
