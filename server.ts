import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  console.log(
    `Starting server in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`
  );

  app.use(express.json({ limit: "50mb" }));

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || ""
  });

  const isQuotaError = (error: any) => {
    const msg = JSON.stringify(error).toLowerCase();

    return (
      msg.includes("429") ||
      msg.includes("resource_exhausted") ||
      msg.includes("quota")
    );
  };

  async function generateWithFallback(promptText: string) {
    const models = [
      "gemini-3.1-pro-preview",
      "gemini-3-flash-preview",
      "gemini-2.5-flash",
      "gemini-2.0-flash"
    ];

    let lastError: any;

    for (const model of models) {
      try {
        console.log(`Trying Gemini model: ${model}`);

        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: "user",
              parts: [{ text: promptText }]
            }
          ],
          config: {
            responseMimeType: "application/json"
          }
        });

        console.log(`Gemini model succeeded: ${model}`);
        return response;
      } catch (error: any) {
        lastError = error;
        console.error(`Gemini model failed: ${model}`, error?.message || error);

        if (!isQuotaError(error)) {
          throw error;
        }
      }
    }

    throw lastError;
  }

  // API ROUTE MUST COME BEFORE VITE / STATIC FRONTEND ROUTES
  app.post("/api/analyze", async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: "GEMINI_API_KEY is missing in Render Environment Variables."
        });
      }

      const { decision, preferences, previousHistory } = req.body;

      if (!decision || typeof decision !== "string") {
        return res.status(400).json({
          error: "Decision input is required."
        });
      }

      const promptText = `
Evaluate this decision: "${decision}"

User preferences:
- Risk: ${preferences?.risk ?? 50}
- Cost: ${preferences?.cost ?? 50}
- Growth: ${preferences?.growth ?? 50}
- Stability: ${preferences?.stability ?? 50}
- Brutal honesty: ${preferences?.brutalHonesty ?? true}

Previous history:
${previousHistory || "None"}

Return ONLY valid JSON. Do not include markdown.

The JSON must include these keys:
{
  "summary": "string",
  "verdict": "string",
  "confidence": {
    "score": number,
    "label": "string",
    "justification": "string"
  },
  "confidenceBreakdown": {
    "consistency": number,
    "dataReliability": number,
    "variance": number,
    "formula": "string"
  },
  "criticalVariable": {
    "variable": "string",
    "currentState": "string",
    "flipCondition": "string"
  },
  "weightBreakdown": [
    {
      "criteria": "string",
      "impactScore": number,
      "description": "string"
    }
  ],
  "sensitivityAnalysis": [
    {
      "criteria": "string",
      "currentWeight": number,
      "flipThreshold": number,
      "direction": "increase",
      "newVerdict": "string"
    }
  ],
  "scoringEngine": {
    "criteriaWeights": {},
    "nodes": [
      {
        "option": "string",
        "scores": {},
        "totalWeightedScore": number
      }
    ]
  },
  "emotionalIntelligence": {
    "biases": [
      {
        "bias": "string",
        "severity": number,
        "mitigation": "string"
      }
    ],
    "decisionEnvironment": "string"
  },
  "nextSteps": ["string"],
  "scenarios": [
    {
      "title": "string",
      "impact": "string",
      "outcome": "string"
    }
  ],
  "sources": [
    {
      "title": "string",
      "url": "string",
      "reliability": "High"
    }
  ],
  "prosCons": {
    "pros": ["string"],
    "cons": ["string"]
  },
  "comparison": {
    "headers": ["string"],
    "rows": [
      {
        "cells": ["string"]
      }
    ]
  },
  "swot": {
    "strengths": ["string"],
    "weaknesses": ["string"],
    "opportunities": ["string"],
    "threats": ["string"]
  }
}
`;

      const response = await generateWithFallback(promptText);

      if (!response.text) {
        throw new Error("Empty response from Gemini");
      }

      const result = JSON.parse(response.text);
      return res.json(result);
    } catch (error: any) {
      console.error("Gemini backend error:", error);

      return res.status(500).json({
        error: isQuotaError(error)
          ? "All Gemini model quotas failed. Check billing/quota or use another Google AI project."
          : error.message || "Gemini analysis failed."
      });
    }
  });

  // Vite / frontend serving comes AFTER API routes
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");

    app.use(express.static(distPath));

    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer();