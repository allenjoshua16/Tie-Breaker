import { AnalysisResult, UserPreferences } from "../types";

export async function analyzeDecision(
  decision: string, 
  preferences?: UserPreferences, 
  previousHistory?: string
): Promise<AnalysisResult> {
  const startTime = Date.now();
  
  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        decision,
        preferences,
        previousHistory
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "Backend analysis failed");
    }

    const data = await response.json();
    
    // The backend returns the raw AI result, so we augment it here
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
    console.error("Analysis service error:", error);
    throw error;
  }
}
