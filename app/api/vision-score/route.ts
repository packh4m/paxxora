import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const VISION_PROMPT = `You are an expert facial aesthetics analyst with deep knowledge of PSL (Pretty Scale Looksmaxxing) principles, aesthetic surgery, and facial harmony assessment. Analyze this face and provide precise numerical scores for each category below.

Be honest and accurate — do not be overly generous. An average face should score 5.0, exceptional faces 8.5+, below average faces below 4.0.

Score each category from 0.0 to 10.0 with one decimal place:

1. JAW_DEFINITION: Sharpness and definition of the jawline. 10 = razor sharp defined jaw. 5 = average. 1 = soft/undefined.
2. CHEEKBONE_PROMINENCE: How prominent the cheekbones are. 10 = extremely prominent. 5 = average. 1 = flat with no definition.
3. SKIN_QUALITY: Clarity and smoothness. 10 = perfect skin. 5 = average. 1 = severe issues.
4. SEXUAL_DIMORPHISM: Overall masculine score. 10 = extremely masculine. 5 = average. 1 = very feminine.
5. FACIAL_FAT: How lean the face appears. 10 = extremely lean. 5 = average. 1 = very chubby.
6. OVERALL_HARMONY: How well all features work together. 10 = perfect harmony. 5 = some harmony. 1 = disjointed.
7. EYE_APPEAL: Attractiveness of the eyes. 10 = extremely attractive. 5 = average. 1 = unappealing.
8. OVERALL_IMPRESSION: Overall aesthetic impression, bone structure only. 10 = top 1%. 5 = average. 1 = bottom 5%.
9. FACIAL_HAIR: Facial hair visibility and masculinity contribution. 10 = full thick beard. 5 = moderate stubble. 0 = clean shaven.
10. NECK: Neck thickness and definition. 10 = thick muscular neck. 5 = average. 1 = very thin/undefined.
11. EYEBROW_THICKNESS: Thickness and density of eyebrows. 10 = very thick dense brows. 5 = average. 1 = very thin/sparse.
12. NOSE_MASCULINITY: How masculine the nose appears. 10 = strong wide masculine nose. 5 = average. 1 = very small/feminine.
13. BROW_RIDGE: Prominence of the brow ridge. 10 = very prominent heavy brow ridge. 5 = average. 1 = completely flat.
14. HAIRLINE: How masculine and well-defined the hairline is. 10 = strong defined masculine hairline. 5 = average. 1 = receding/undefined.
15. EYES_DIMORPHISM: How masculine the eyes appear. 10 = very masculine hunter eyes. 5 = average. 1 = very round/feminine.
16. LIP_MASCULINITY: How masculine the lips appear. 10 = thin masculine lips. 5 = average. 1 = very full/feminine.
17. FACE_SHAPE_DIMORPHISM: How masculine the face shape is. 10 = very square/angular. 5 = average. 1 = very round/oval.
18. JAW_DIMORPHISM: How masculine the jaw specifically is. 10 = very wide square jaw. 5 = average. 1 = very narrow/weak.
19. HAIR_LENGTH: How masculine the hair length appears. 10 = very short masculine cut. 5 = average. 1 = very long feminine.
20. HARMONY_DIMORPHISM: How harmoniously masculine features work together. 10 = perfect masculine harmony. 5 = some harmony. 1 = clash.

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
  "facial_hair": 3.0,
  "neck": 6.0,
  "eyebrow_thickness": 6.5,
  "nose_masculinity": 6.5,
  "brow_ridge": 7.0,
  "hairline": 7.5,
  "eyes_dimorphism": 7.8,
  "lip_masculinity": 8.0,
  "face_shape_dimorphism": 8.5,
  "jaw_dimorphism": 9.2,
  "hair_length": 9.5,
  "harmony_dimorphism": 7.0,
  "reasoning": "Brief 2 sentence explanation of key strengths and weaknesses"
}`;

export async function POST(request: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });

    const client = new Anthropic({ apiKey });
    const { imageBase64, imageMediaType } = await request.json();

    if (!imageBase64 || !imageMediaType) {
      return NextResponse.json({ error: "Missing imageBase64 or imageMediaType" }, { status: 400 });
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: imageMediaType, data: imageBase64 } },
          { type: "text", text: VISION_PROMPT },
        ],
      }],
    });

    const textContent = response.content.find(b => b.type === "text");
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json({ error: "No text response from Claude" }, { status: 500 });
    }

    try {
      const result = JSON.parse(textContent.text);
      return NextResponse.json({ result });
    } catch {
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return NextResponse.json({ result: JSON.parse(jsonMatch[0]) });
      return NextResponse.json({ error: "Failed to parse response", raw: textContent.text }, { status: 500 });
    }
  } catch (error) {
    console.error("Vision score API error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}