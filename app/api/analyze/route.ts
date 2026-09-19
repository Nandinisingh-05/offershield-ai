import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(request: Request) {
  try {
    const { offerText, file } = await request.json();
    if ((!offerText || !offerText.trim()) && !file?.data) return NextResponse.json({ error: "Offer text or file is required" }, { status: 400 });
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Gemini API key is missing" }, { status: 500 });
    const ai = new GoogleGenAI({ apiKey });
    const instruction = `Analyze this job offer for scam indicators. Return ONLY valid JSON with this structure: {"riskScore":0,"riskLevel":"Low","summary":"","redFlags":[{"title":"","description":""}],"recommendations":[],"verificationSteps":[],"disclaimer":"This analysis is informational and cannot confirm fraud with certainty."}. riskScore must be 0-100, riskLevel Low/Medium/High. Do not claim certainty. Explain payment requests, urgency, impersonation, contact methods, company details, salary promises, and missing information. Offer text: ${offerText || "(See attached file)"}`;
   type GeminiPart =
  | { text: string }
  | {
      inlineData: {
        mimeType: string;
        data: string;
      };
    };

const parts: GeminiPart[] = [{ text: instruction }];
    if (file?.data && file?.mimeType) parts.push({ inlineData: { mimeType: file.mimeType, data: file.data } });
    const response = await ai.models.generateContent({ model: "gemini-3.5-flash-lite", contents: [{ role: "user", parts }], config: { responseMimeType: "application/json" } });
    if (!response.text) throw new Error("Empty response from Gemini");
    const analysis = JSON.parse(response.text);
    const safeAnalysis = {
      riskLevel: ["High", "Medium", "Low"].includes(analysis.riskLevel) ? analysis.riskLevel : "Low",
      riskScore: typeof analysis.riskScore === "number" ? Math.max(0, Math.min(100, analysis.riskScore)) : 0,
      summary: typeof analysis.summary === "string" ? analysis.summary : "No summary available.",
      redFlags: Array.isArray(analysis.redFlags) ? analysis.redFlags.map((flag: { title?: string; description?: string }) => ({ title: flag.title || "Potential Warning", explanation: flag.description || "No explanation available." })) : [],
      recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations.filter((x: unknown): x is string => typeof x === "string") : [],
      verificationSteps: Array.isArray(analysis.verificationSteps) ? analysis.verificationSteps.filter((x: unknown): x is string => typeof x === "string") : [],
      disclaimer: typeof analysis.disclaimer === "string" ? analysis.disclaimer : "This analysis is informational only.",
    };
    return NextResponse.json({ success: true, analysis: safeAnalysis });
  } catch (error) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gemini API request failed" }, { status: 500 });
  }
}
