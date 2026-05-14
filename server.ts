import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  // Render typically provides the PORT environment variable as a string.
  // We use Number() to ensure it's a number for Express's listen method.
  const PORT = Number(process.env.PORT) || 3000;

  console.log(`Starting server in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);

  app.use(express.json({ limit: "50mb" }));

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

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

  // Gemini Analyze Route
  app.post("/api/analyze", async (req, res) => {
    const { decision, preferences, previousHistory, images } = req.body;

    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
      }

      const prefBlock = preferences 
        ? `User Preferences:
           - Risk: ${preferences.risk}
           - Cost: ${preferences.cost}
           - Growth: ${preferences.growth}
           - Stability: ${preferences.stability}
           - Mode: ${preferences.brutalHonesty ? 'BRUTAL HONESTY' : 'Standard'}
           - Depth: ${preferences.deepIntelligence ? 'DEEP INTELLIGENCE' : 'Standard'}`
        : "Provide a balanced analysis.";

      const historyBlock = previousHistory ? `History:\n${previousHistory}` : "";

      const promptText = `Evaluate: "${decision}". 
            ${prefBlock}
            ${historyBlock}
            Respond strictly in JSON format. Provide strategic analysis including SWOT and Comparison Matrix.`;

      const parts: any[] = [{ text: promptText }];
      
      if (images && images.length > 0) {
        images.forEach((img: string) => {
          parts.push({
            inlineData: {
              mimeType: "image/png",
              data: img.split(',')[1] || img
            }
          });
        });
      }

      // Use the correct Gemini models based on the skill guidance
      const modelName = preferences?.deepIntelligence ? "gemini-3.1-pro-preview" : "gemini-3-flash-preview";
      
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: "user", parts }],
        config: {
          responseMimeType: "application/json",
          responseSchema: ANALYSIS_SCHEMA as any,
          tools: [{ googleSearch: {} }] // Add grounding for better intelligence
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response from Gemini");
      }

      const result = JSON.parse(responseText);

      // Extract search grounding sources if available
      if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        const groundingSources = response.candidates[0].groundingMetadata.groundingChunks
          .map((chunk: any) => chunk.web)
          .filter((web: any) => web && web.uri);
          
        if (groundingSources.length > 0) {
          result.sources = [
            ...result.sources,
            ...groundingSources.map((s: any) => ({
              title: s.title || "Web Research Intelligence",
              url: s.uri,
              reliability: "High"
            }))
          ];
        }
      }

      res.json(result);
    } catch (error: any) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serving from the bundled 'dist' directory
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Bind to 0.0.0.0 and the port provided by the environment (Render/Cloud Run requirement)
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer();
