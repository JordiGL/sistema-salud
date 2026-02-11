import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Ensure GEMINI_API_KEY is in .env.local
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // --- CASE A: TEXT/JSON ANALYSIS (Briefing) ---
    if (contentType.includes("application/json")) {
      const { metrics, context, locale } = await req.json();

      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });

      const prompt = `
        You are a medical assistant providing a Daily Briefing based on the user's recent health metrics.
        
        Recent History (Last 5 records):
        ${JSON.stringify(metrics, null, 2)}
        
        Context (optional user tags): ${context || "None"}

        Create a JSON summary with exactly these fields, providing the briefing in both Spanish (es) and Catalan (ca):
        {
          "es": {
            "status": "Brief summary of current status (e.g., 'Estable', 'PA elevada'). 1 sentence.",
            "trend": "Insight on the trend vs previous days. 1-2 sentences."
          },
          "ca": {
            "status": "Brief summary of current status (e.g., 'Estable', 'PA elevada'). 1 sentence.",
            "trend": "Insight on the trend vs previous days. 1-2 sentences."
          }
        }
        
        Rules:
        - Be objective and factual.
        - DO NOT provide medical advice or recommendations.
        - If data is empty, say "No hay datos recientes" / "No hi ha dades recents".
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const json = JSON.parse(text);

      // Save to Database (External API)
      try {
        const today = new Date().toISOString().split('T')[0];
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

        await fetch(`${apiUrl}/daily-briefing`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: today,
            status_es: json.es.status,
            trend_es: json.es.trend,
            status_ca: json.ca.status,
            trend_ca: json.ca.trend
          })
        });
      } catch (err) {
        console.error("Failed to save briefing to DB:", err);
        // We continue to return the generated data even if save fails
      }

      // Return the requested locale
      const requestedLocale = locale === 'ca' ? 'ca' : 'es';
      return NextResponse.json(json[requestedLocale]);
    }

    // --- CASE B: IMAGE ANALYSIS (Existing) ---
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
