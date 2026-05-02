export type AnalysisMode = 'pros_cons' | 'comparison' | 'swot';

export interface ProsCons {
  pros: string[];
  cons: string[];
}

export interface ComparisonTable {
  headers: string[];
  rows: string[][];
}

export interface SWOT {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface ConfidenceScore {
  score: number;
  label: string;
  justification: string;
}

export interface CriticalVariable {
  variable: string;
  currentState: string;
  flipCondition: string;
}

export interface Scenario {
  title: string;
  impact: string;
  outcome: string;
}

export interface Source {
  title: string;
  url?: string;
  reliability: 'High' | 'Medium' | 'Low';
}

export interface UserPreferences {
  risk: number;
  cost: number;
  growth: number;
  stability: number;
}

export interface AnalysisResult {
  decision: string;
  summary: string;
  confidence: ConfidenceScore;
  criticalVariable: CriticalVariable;
  nextSteps: string[];
  scenarios: Scenario[];
  sources: Source[];
  prosCons?: ProsCons;
  comparison?: ComparisonTable;
  swot?: SWOT;
  preferences?: UserPreferences;
}
