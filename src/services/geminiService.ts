import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, UserPreferences } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    verdict: { type: Type.STRING, description: "The specific option the user should choose (e.g. 'Option A', 'Buy', 'Decline')" },
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
    }
  },
  required: [
    "summary", "verdict", "confidence", "confidenceBreakdown", "criticalVariable", 
    "weightBreakdown", "sensitivityAnalysis", "scoringEngine", "emotionalIntelligence", 
    "nextSteps", "scenarios", "sources", "prosCons", "comparison", "swot"
  ]
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
         - Analysis Depth: ${preferences.deepIntelligence ? 'DEEP INTELLIGENCE (Complex multi-variate modeling, second-order effects, rigorous risk assessment)' : 'Standard'}
         ${preferences.deadline ? `- Deadline: ${preferences.deadline}` : ""}
         Prioritize the analysis based on these weights.`
      : "Provide a balanced objective analysis.";

    const historyBlock = previousHistory ? `Context from User's Decision History:\n${previousHistory}\nLook for recurring patterns: If they often prefer high-risk and fail, be more conservative.` : "";

    const complexityInstruction = preferences?.deepIntelligence 
      ? `ACTIVATE DEEP INTELLIGENCE PROTOCOL:
         - Analyze second-order and third-order consequences of each option.
         - Identify hidden dependencies and systemic risks.
         - Use Game Theory principles to evaluate stakeholder reactions.
         - Perform an adversarial analysis: try to prove the current verdict wrong.
         - Ensure the summary reflects high-complexity reasoning and logic chains.`
      : "Standard professional analysis.";

    const prompt = `Evaluate the following decision/query: "${decision}". 
          ${prefBlock}
          ${historyBlock}
          ${complexityInstruction}

          TASK: Provide an ELITE Decision Intelligence analysis using real-world 2026 data.
          
          1. Scoring Engine: Break the decision into 2-3 logical options. Score each option across 4 criteria (Risk, Cost, Growth, Stability) from 0-100. Calculate weighted totals based on user preferences.
          2. Emotional Intelligence: Detect if the user is hesitant, over-confident, or prone to biases (Sunk Cost, Loss Aversion). Call them out.
          3. Confidence Formula: Earn your confidence score. Calculate based on (Consistency * Data_Reliability) / Variance.
          4. Decision Flip: Mathematical sensitivity analysis.
          5. Verdict: One definitive "Best" option.

          Respond strictly in JSON according to specified schema. Use Google Search for 2026 market benchmarks.`;

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
