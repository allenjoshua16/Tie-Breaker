import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, UserPreferences } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    confidence: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        label: { type: Type.STRING },
        justification: { type: Type.STRING }
      },
      required: ["score", "label", "justification"]
    },
    criticalVariable: {
      type: Type.OBJECT,
      properties: {
        variable: { type: Type.STRING },
        currentState: { type: Type.STRING },
        flipCondition: { type: Type.STRING }
      },
      required: ["variable", "currentState", "flipCondition"]
    },
    nextSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
    scenarios: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          impact: { type: Type.STRING },
          outcome: { type: Type.STRING }
        },
        required: ["title", "impact", "outcome"]
      }
    },
    sources: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          url: { type: Type.STRING },
          reliability: { type: Type.STRING, enum: ["High", "Medium", "Low"] }
        },
        required: ["title", "reliability"]
      }
    },
    prosCons: {
      type: Type.OBJECT,
      properties: {
        pros: { type: Type.ARRAY, items: { type: Type.STRING } },
        cons: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["pros", "cons"]
    },
    comparison: {
      type: Type.OBJECT,
      properties: {
        headers: { type: Type.ARRAY, items: { type: Type.STRING } },
        rows: { type: Type.ARRAY, items: { type: Type.ARRAY, items: { type: Type.STRING } } }
      },
      required: ["headers", "rows"]
    },
    swot: {
      type: Type.OBJECT,
      properties: {
        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
        weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
        opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
        threats: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["strengths", "weaknesses", "opportunities", "threats"]
    }
  },
  required: ["summary", "confidence", "criticalVariable", "nextSteps", "scenarios", "sources", "prosCons", "comparison", "swot"]
};

export async function analyzeDecision(decision: string, preferences?: UserPreferences): Promise<AnalysisResult> {
  try {
    const prefBlock = preferences 
      ? `User Preferences (weighting 1-100):
         - Risk Tolerance: ${preferences.risk}
         - Cost Sensitivity: ${preferences.cost}
         - Growth Orientation: ${preferences.growth}
         - Stability Preference: ${preferences.stability}
         Prioritize the analysis based on these weights.`
      : "Provide a balanced objective analysis.";

    const prompt = `Evaluate the following decision: "${decision}". 
          ${prefBlock}

          Analyze using real-world data and Google Search. 
          Respond following this structure:
          1. Summary: A definitive verdict.
          2. Confidence Level: Score (0-100), label (e.g. 'High Confidence'), and WHY (data quality, market volatility, etc).
          3. Critical Variable: Identify the ONE thing that would flip this decision (e.g. 'If interest rates exceed 5%').
          4. Scenarios: Model 3 'What If' scenarios (e.g. 'Market crash', 'Salary hike', 'Competitor exit').
          5. Next Steps: 3-5 immediate actionable items if the user proceeds.
          6. Sources: 2-3 specific insights/benchmarks found, including reliability ratings.
          7. Pros/Cons, Comparison Table, and SWOT analysis.
          
          CITATIONS: Cite real-world benchmarks or trends where possible.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_SCHEMA as any,
      },
      tools: [{ googleSearch: {} }] as any,
      toolConfig: { includeServerSideToolInvocations: true } as any
    } as any);

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response from AI");
    }

    const data = JSON.parse(resultText);
    return {
      decision,
      ...data,
      preferences
    };
  } catch (error) {
    console.error("Error analyzing decision:", error);
    throw error;
  }
}
