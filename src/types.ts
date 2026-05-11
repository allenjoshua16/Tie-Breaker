export type AnalysisMode = 'pros_cons' | 'comparison' | 'swot';

export interface ProsCons {
  pros: string[];
  cons: string[];
}

export interface ComparisonRow {
  cells: string[];
}

export interface ComparisonTable {
  headers: string[];
  rows: ComparisonRow[];
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

export interface MapData {
  origin: string;
  destination: string;
  travelMode: 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT';
  description?: string;
}

export interface VisualAsset {
  url?: string;
  prompt: string;
  description: string;
}

export interface UserPreferences {
  risk: number;
  cost: number;
  growth: number;
  stability: number;
  brutalHonesty: boolean;
  deepIntelligence: boolean;
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

export interface ScoringNode {
  option: string;
  scores: Record<string, number>; // Criteria -> 0-100 score
  totalWeightedScore: number;
}

export interface EmotionalBias {
  bias: string;
  severity: number; // 0-100
  mitigation: string;
}

export interface ConfidenceBreakdown {
  consistency: number;
  dataReliability: number;
  variance: number;
  formula: string;
}
export interface SWOTAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}


export interface AnalysisResult {
  id: string;
  timestamp: number;
  decision: string;
  summary: string;
  verdict: string; // Explicit option chosen by AI
  pros?: string[];
  cons?: string[];
  comparisonMatrix?: any[];
  confidence: ConfidenceScore;
  confidenceBreakdown?: ConfidenceBreakdown;
  criticalVariable: CriticalVariable;
  nextSteps: string[];
  scenarios: Scenario[];
  sources: Source[];
  interrogation: InterrogationQuestion[];
  brutalTruth?: string;
  weightBreakdown: WeightBreakdown[];
  sensitivityAnalysis: SensitivityPoint[];
  scoringEngine?: {
    nodes: ScoringNode[];
    criteriaWeights: Record<string, number>;
  };
  emotionalIntelligence?: {
    biases: EmotionalBias[];
    decisionEnvironment: string;
  };
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
  mapData?: MapData;
  visualAsset?: VisualAsset;
  outcome?: {
    status: 'pending' | 'success' | 'mistake' | 'learning';
    notes?: string;
    regretScore?: number; // 1-10
    loggedAt?: number;
    committedAt?: number;
  };
  error?: string;
}

export interface AppAnalytics {
  totalDecisions: number;
  avgConfidence: number;
  accuracyRate: number; // based on success/total logged
  regretAverage: number;
  popularCategories: Record<string, number>;
  avgIterations: number;
}
