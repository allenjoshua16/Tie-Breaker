import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, UserPreferences } from "../types";

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    verdict: { type: Type.STRING },
    confidence: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        label: { type: Type.STRING },
        justification: { type: Type.STRING }
      },
      required: ["score", "label", "justification"]
    },
    confidenceBreakdown: {
      type: Type.OBJECT,
      properties: {
        consistency: { type: Type.NUMBER },
        dataReliability: { type: Type.NUMBER },
        variance: { type: Type.NUMBER },
        formula: { type: Type.STRING }
      },
      required: ["consistency", "dataReliability", "variance", "formula"]
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
    scoringEngine: {
      type: Type.OBJECT,
      properties: {
        criteriaWeights: { type: Type.OBJECT, additionalProperties: { type: Type.NUMBER } },
        nodes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              option: { type: Type.STRING },
              scores: { type: Type.OBJECT, additionalProperties: { type: Type.NUMBER } },
              totalWeightedScore: { type: Type.NUMBER }
            },
            required: ["option", "scores", "totalWeightedScore"]
          }
        }
      },
      required: ["criteriaWeights", "nodes"]
    },
    emotionalIntelligence: {
      type: Type.OBJECT,
      properties: {
        biases: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              bias: { type: Type.STRING },
              severity: { type: Type.NUMBER },
              mitigation: { type: Type.STRING }
            },
            required: ["bias", "severity", "mitigation"]
          }
        },
        decisionEnvironment: { type: Type.STRING }
      },
      required: ["biases", "decisionEnvironment"]
    },
    brutalTruth: { type: Type.STRING },
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
        rows: { 
          type: Type.ARRAY, 
          items: { 
            type: Type.OBJECT, 
            properties: {
              cells: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["cells"]
          } 
        }
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
    },
    mapData: {
      type: Type.OBJECT,
      properties: {
        origin: { type: Type.STRING },
        destination: { type: Type.STRING },
        travelMode: { type: Type.STRING, enum: ["DRIVING", "WALKING", "BICYCLING", "TRANSIT"] },
        description: { type: Type.STRING }
      },
      required: ["origin", "destination", "travelMode"]
    }
  },
  required: [
    "summary", "verdict", "confidence", "confidenceBreakdown", "criticalVariable", 
    "weightBreakdown", "sensitivityAnalysis", "scoringEngine", "emotionalIntelligence", 
    "nextSteps", "scenarios", "sources", "prosCons", "comparison", "swot"
  ]
};

export async function analyzeDecision(
  decision: string, 
  preferences?: UserPreferences, 
  previousHistory?: string
): Promise<AnalysisResult> {
  const startTime = Date.now();
  
  try {
    const ai = new GoogleGenAI({ apiKey: (process.env as any).GEMINI_API_KEY || "" });

    const prefBlock = preferences 
      ? `User Preferences:
         - Risk: ${preferences.risk}
         - Cost: ${preferences.cost}
         - Growth: ${preferences.growth}
         - Stability: ${preferences.stability}
         - Mode: ${preferences.brutalHonesty ? 'BRUTAL HONESTY' : 'Standard'}`
      : "Provide a balanced analysis.";

    const historyBlock = previousHistory ? `History:\n${previousHistory}` : "";

    const promptText = `Evaluate: "${decision}". 
          ${prefBlock}
          ${historyBlock}
          Respond strictly in JSON format. Provide strategic analysis including SWOT and Comparison Matrix.`;

    // Use gemini-3-flash-preview for all requests to ensure free-tier usage
    const modelName = "gemini-3-flash-preview";
    
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{ role: "user", parts: [{ text: promptText }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_SCHEMA as any,
        tools: [{ googleSearch: {} }]
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response from Gemini");
    }

    const data = JSON.parse(responseText);

    // Extract search grounding sources if available
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      const groundingSources = response.candidates[0].groundingMetadata.groundingChunks
        .map((chunk: any) => chunk.web)
        .filter((web: any) => web && web.uri);
        
      if (groundingSources.length > 0) {
        data.sources = [
          ...(data.sources || []),
          ...groundingSources.map((s: any) => ({
            title: s.title || "Web Research Intelligence",
            url: s.uri,
            reliability: "High"
          }))
        ];
      }
    }
    
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
  } catch (error: any) {
    console.error("Analysis service error:", error);
    if (error?.message?.includes("429") || error?.message?.includes("RESOURCE_EXHAUSTED")) {
      throw new Error("Gemini quota exceeded. Please check your API key and billing in Settings > Secrets.");
    }
    throw error;
  }
}
