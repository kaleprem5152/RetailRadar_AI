/* RetailRadar AI — domain model. All demo content is fictional. */

export type ID = string;

export type EvidenceSource = "open-data" | "demo-survey" | "user-added";
export type EvidenceStatus = "verified" | "field-observed" | "unverified";

export interface BusinessProfile {
  name: string;
  category: string;
  concept: string;
  targetDailySales: number;
}

export interface Budget {
  maxInvestment: number; // total setup ceiling, ₹
  monthlyRentCeiling: number; // ₹/month
}

export interface FinancialAssumptions {
  avgPrice: number; // average selling price per sale, ₹
  variableCost: number; // direct cost per sale, ₹
  rentMonthly: number;
  salariesMonthly: number;
  utilitiesMonthly: number;
  marketingMonthly: number;
  otherFixedMonthly: number;
  fitOutCost: number;
  equipmentCost: number;
  depositMonths: number; // refundable deposit, months of rent
  licencesCost: number;
  preOpeningCost: number;
  workingCapitalMonths: number; // buffer months of fixed costs
  operatingDays: number; // days open per month
}

export interface LocationMetrics {
  sizeSqft: number;
  rentPerSqft: number;
  footfallIndex: number; // 0–100 composite indicator
  parking: "Excellent" | "Good" | "Limited" | "Poor";
  frontage: "Corner" | "Primary" | "Secondary" | "Interior";
  transit: "High" | "Medium" | "Low";
}

export interface NearbyBusiness {
  id: ID;
  name: string;
  category: string;
  lat: number;
  lng: number;
  distanceM: number;
  source: EvidenceSource;
  status: EvidenceStatus;
  competitor: boolean;
  note?: string;
  addedBy?: string;
}

export interface Risk {
  label: string;
  severity: "low" | "medium" | "high";
  basis: "observed" | "assumed";
}

export interface CandidateLocation {
  id: ID;
  name: string;
  address: string;
  micro: string; // micro-market description
  lat: number;
  lng: number;
  metrics: LocationMetrics;
  financials: FinancialAssumptions;
  nearby: NearbyBusiness[];
  risks: Risk[];
  missingInfo: string[];
}

export interface Scenario {
  id: ID;
  name: string;
  baseLocationId: ID;
  patch: Partial<FinancialAssumptions>;
  note?: string;
  savedAt: string;
}

export type ChecklistState = "pending" | "confirmed" | "issue";

export interface ChecklistItem {
  id: ID;
  group: string;
  label: string;
  hint?: string;
  state: ChecklistState;
  note: string;
}

export interface ActivityEvent {
  id: ID;
  at: string; // ISO
  actor: string;
  text: string;
  kind: "create" | "edit" | "verify" | "finance" | "report" | "system";
}

export interface Analysis {
  id: ID;
  title: string;
  status: "draft" | "active" | "concluded";
  createdAt: string;
  updatedAt: string;
  profile: BusinessProfile;
  budget: Budget;
  locations: CandidateLocation[];
  scenarios: Scenario[];
  checklist: ChecklistItem[];
  activity: ActivityEvent[];
  scoringWeights?: ScoringWeights;
}

export interface ScoringWeights {
  D: number; // Demand (0.30)
  C: number; // Competition (0.20)
  A: number; // Accessibility & visibility (0.20)
  R: number; // Rent affordability & break-even (0.20)
  P: number; // Proximity to relevant destinations (0.10)
}

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  D: 0.30,
  C: 0.20,
  A: 0.20,
  R: 0.20,
  P: 0.10,
};

export interface SavedReport {
  id: ID;
  analysisId: ID;
  title: string;
  createdAt: string;
  verdict: string;
  recommendation?: string;
  score?: number;
  contentJson?: string;
}

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  role: string;
  org: string;
  avatarUrl?: string;
  scoringWeights?: ScoringWeights;
}

export const CATEGORY_OPTIONS = [
  "Specialty coffee & café",
  "Quick-service restaurant",
  "Bakery & patisserie",
  "Fashion boutique",
  "Beauty & grooming studio",
  "Fitness & wellness",
  "Pharmacy & wellness retail",
  "Grocery & fresh market",
  "Electronics & accessories",
  "Other retail format",
];
