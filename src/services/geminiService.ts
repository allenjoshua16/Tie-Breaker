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
    interrogation: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          question: { type: Type.STRING },
          type: { type: Type.STRING, enum: ["weighting", "clarification", "confrontation"] }
        },
        required: ["id", "question", "type"]
      }
    },
    weightBreakdown: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          criteria: { type: Type.STRING },
          impactScore: { type: Type.NUMBER },
          description: { type: Type.STRING }
        },
        required: ["criteria", "impactScore", "description"]
      }
    },
    sensitivityAnalysis: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          criteria: { type: Type.STRING },
          currentWeight: { type: Type.NUMBER },
          flipThreshold: { type: Type.NUMBER },
          direction: { type: Type.STRING, enum: ["increase", "decrease"] },
          newVerdict: { type: Type.STRING }
        },
        required: ["criteria", "currentWeight", "flipThreshold", "direction", "newVerdict"]
      }
    },
    brutalTruth: { type: Type.STRING },
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
  required: ["summary", "confidence", "criticalVariable", "nextSteps", "scenarios", "sources", "prosCons", "comparison", "swot", "weightBreakdown", "sensitivityAnalysis"]
};

export async function analyzeDecision(decision: string, preferences?: UserPreferences, previousHistory?: string): Promise<AnalysisResult> {
  const startTime = Date.now();
  try {
    const prefBlock = preferences 
      ? `User Preferences (weighting 1-100):
         - Risk Tolerance: ${preferences.risk}
         - Cost Sensitivity: ${preferences.cost}
         - Growth Orientation: ${preferences.growth}
         - Stability Preference: ${preferences.stability}
         - Mode: ${preferences.brutalHonesty ? 'BRUTAL HONESTY (Challenge the user, highlight biases, be blunt)' : 'Balanced Professional'}
         ${preferences.deadline ? `- Deadline: ${preferences.deadline}` : ""}
         Prioritize the analysis based on these weights.`
      : "Provide a balanced objective analysis.";

    const historyBlock = previousHistory ? `Context from User's Decision History:\n${previousHistory}\nLook for patterns or recurring biases.` : "";

    const isRetrospective = decision.includes('RETROSPECTIVE ANALYSIS');
    
    const prompt = isRetrospective 
      ? `Evaluate this RETROSPECTIVE feedback: "${decision}". 
         The user previously made a decision that resulted in a ${preferences?.brutalHonesty ? 'MISTAKE' : 'LEARNING'}.
         
         TASK:
         1. Root Cause Analysis: Use Google Search to find real-time 2026 reasons why the user's observed outcome occurred. Locate recent market data, news reports, or economic shifts from late 2025/early 2026.
         2. Corrected Logic: Provide a new, hardened decision framework.
         3. Specific Solutions: List 3 actionable ways to fix the current situation or prevent it next time.
         
         Format the response using the standard AnalysisResult structure, but prioritize the Brutal Truth and Next Steps sections for remediation.`
      : `Evaluate the following decision: "${decision}". 
          ${prefBlock}
          ${historyBlock}

          Analyze using real-world data and Google Search. IMPORTANT: Access current 2026 information, latest tech trends, market benchmarks, and news to ensure this intelligence is up-to-the-minute accurate.
          Respond following this structure:
          1. Summary: A definitive verdict.
          2. Brutal Truth: ${preferences?.brutalHonesty ? "A brutally honest critique of the user's thinking. Focus on biases like Sunk Cost or Confirmation Bias." : "N/A"}
          3. Confidence Level: Score (0-100), label, and justification.
          4. Weight Breakdown: Quantitative impact of each criteria (Risk, Cost, Growth, Stability) based on user weights.
          5. Sensitivity Analysis: Identify a 'Decision Flip' point—exactly how much one weight (e.g. Risk) would need to change to reverse this verdict.
          6. Critical Variable: The factor that would flip this.
          7. Scenarios: Model 3 'What If' scenarios.
          8. Next Steps: 3-5 actionable items.
          9. Interrogation: 3 follow-up questions.
          10. Sources, Pros/Cons, Comparison Matrix, and SWOT.`;

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
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      decision,
      ...data,
      preferences,
      outcome: { status: 'pending' },
      metrics: {
        iterations: 1,
        timeToDecision: Date.now() - startTime,
        inputComplexity: decision.length
      }
    };
  } catch (error) {
    console.error("Error analyzing decision:", error);
    throw error;
  }
}
