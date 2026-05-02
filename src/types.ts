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
  brutalHonesty: boolean;
  deadline?: string;
}

export interface InterrogationQuestion {
  id: string;
  question: string;
  type: 'weighting' | 'clarification' | 'confrontation';
}

export interface WeightBreakdown {
  criteria: string;
  impactScore: number; // 0-100
  description: string;
}

export interface SensitivityPoint {
  criteria: string;
  currentWeight: number;
  flipThreshold: number;
  direction: 'increase' | 'decrease';
  newVerdict: string;
}

export interface AnalysisResult {
  id: string;
  timestamp: number;
  decision: string;
  summary: string;
  confidence: ConfidenceScore;
  criticalVariable: CriticalVariable;
  nextSteps: string[];
  scenarios: Scenario[];
  sources: Source[];
  interrogation: InterrogationQuestion[];
  brutalTruth?: string;
  weightBreakdown: WeightBreakdown[];
  sensitivityAnalysis: SensitivityPoint[];
  metrics: {
    iterations: number;
    timeToDecision: number; // ms
    inputComplexity: number; // char count/params
  };
  prosCons?: ProsCons;
  comparison?: ComparisonTable;
  swot?: SWOT;
  followUps?: AnalysisResult[];
  preferences?: UserPreferences;
  outcome?: {
    status: 'pending' | 'success' | 'mistake' | 'learning';
    notes?: string;
    regretScore?: number; // 1-10
    loggedAt?: number;
  };
}

export interface AppAnalytics {
  totalDecisions: number;
  avgConfidence: number;
  accuracyRate: number; // based on success/total logged
  regretAverage: number;
  popularCategories: Record<string, number>;
  avgIterations: number;
}
