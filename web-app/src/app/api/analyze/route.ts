import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Assegura't que tens GEMINI_API_KEY a .env.local (sense NEXT_PUBLIC)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    // 1. Llegim el FormData
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No s'ha rebut cap fitxer" },
        { status: 400 }
      );
    }

    // 2. Comprovem que és una imatge (opcional, però recomanat)
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "L'arxiu no és una imatge vàlida" },
        { status: 400 }
      );
    }

    // 3. Convertim a Base64
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    // 4. Inicialitzem model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Actúa como un OCR médico experto. Analiza la imagen de este dispositivo médico.
    Extrae los valores visibles.
    Responde ÚNICAMENTE un objeto JSON válido con este formato: 
    {"bloodPressure": "SIS/DIA", "pulse": number, "spo2": number, "weight": number, "ca125": number}.
    Si un valor no aparece, usa null. No uses markdown.`;

    // 5. Generem contingut
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType: file.type } },
    ]);

    const response = await result.response;
    const text = response.text();

    // 6. Neteja JSON (per si la IA posa ```json ... ```)
    const cleanText = text.replace(/```json|```/g, "").trim();

    let json;
    try {
      json = JSON.parse(cleanText);
    } catch (e) {
      console.error("Error parsejant JSON de la IA:", cleanText);
      throw new Error("La IA no ha retornat un JSON vàlid.");
    }

    return NextResponse.json(json);
  } catch (error: any) {
    console.error("Server Error /api/analyze:", error);
    return NextResponse.json(
      { error: error.message || "Error intern del servidor" },
      { status: 500 }
    );
  }
}
