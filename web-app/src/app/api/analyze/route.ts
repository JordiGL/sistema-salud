import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Ensure GEMINI_API_KEY is in .env.local
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    // 1. Read FormData
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file received" },
        { status: 400 }
      );
    }

    // 2. Validate Image Type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Invalid file type. Only images are allowed." },
        { status: 400 }
      );
    }

    // 3. Convert to Base64
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    // 4. Initialize Model with Production settings
    // Using gemini-1.5-flash for speed and JSON mode support
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0, // Deterministic output
      },
    });

    // 5. Refined Prompt for Strict Extraction
    const prompt = `
      Analyze this image of a medical device display (e.g., blood pressure monitor, oximeter, scale).
      Extract the numeric readings strictly.
      
      Return a RAW JSON object with the following schema:
      {
        "bloodPressure": string | null, // Format "SYS/DIA" (e.g., "120/80"). Use null if not a BP monitor or values are unclear.
        "pulse": number | null,         // Heart rate in BPM.
        "spo2": number | null,          // Oxygen saturation %.
        "weight": number | null,        // Weight in kg.
        "ca125": number | null          // CA125 marker.
      }

      Rules:
      - STRICTNESS: If a value is not clearly visible, blurry, or ambiguous, return null. DO NOT GUESS.
      - If the image is not a medical device or contains no readable numbers at all, return all nulls.
      - For Blood Pressure, look for two numbers usually displayed together (SYS/DIA).
      - Ignore units (kg, mmHg, bpm) in the output numbers.
      - Your priority is ACCURACY over completeness. Better to return null than a wrong number.
    `;

    // 6. Generate Content
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType: file.type } },
    ]);

    const response = await result.response;
    const text = response.text();

    // 7. Parse JSON safely (JSON mode ensures valid JSON, but good to be safe)
    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      console.error("AI JSON Parse Error:", text);
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    // 8. Return formatted response
    return NextResponse.json(json);

  } catch (error: any) {
    console.error("Server Error /api/analyze:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
