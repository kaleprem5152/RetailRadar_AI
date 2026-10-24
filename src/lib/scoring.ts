import type { CandidateLocation, Analysis, ScoringWeights } from "./types";
import { DEFAULT_SCORING_WEIGHTS } from "./types";
import { computeFeasibility } from "./finance";
import { clamp } from "./utils";

/* Decision scoring — PRD illustrative model:
   Site Score = 0.30D + 0.20C + 0.20A + 0.20R + 0.10P
   Normalized components (0–100) with configurable weights.
   D = Demand (footfall index, proxy density)
   C = Competition (cluster strength vs saturation)
   A = Accessibility (frontage, parking, transit)
   R = Rent Affordability (break-even vs target, rent-to-revenue)
   P = Proximity to relevant destinations (transit anchors, offices, colleges, hubs)
*/

export interface ScoreComponent {
  key: "demand" | "competition" | "access" | "affordability" | "proximity" | "evidence";
  code: "D" | "C" | "A" | "R" | "P";
  label: string;
  weight: number; // percentage (e.g. 30 for 0.30)
  score: number; // 0–100
  weighted: number;
  detail: string;
}

export interface LocationScore {
  locationId: string;
  total: number;
  verdict: { label: string; tone: "prime" | "strong" | "conditional" | "caution" | "risk" };
  components: ScoreComponent[];
  verifiedShare: number;
  competitorCount: number;
  missing: string[];
  weightsUsed: ScoringWeights;
}

const PARKING_SCORE = { Excellent: 96, Good: 80, Limited: 55, Poor: 30 } as const;
const FRONTAGE_SCORE = { Corner: 96, Primary: 82, Secondary: 58, Interior: 34 } as const;
const TRANSIT_SCORE = { High: 94, Medium: 66, Low: 36 } as const;

export function competitorCount(loc: CandidateLocation): number {
  return loc.nearby.filter((b) => b.competitor).length;
}

export function verifiedShare(loc: CandidateLocation): number {
  if (!loc.nearby.length) return 0;
  const w = loc.nearby.reduce(
    (acc, b) => acc + (b.status === "verified" ? 1 : b.status === "field-observed" ? 0.6 : 0),
    0
  );
  return w / loc.nearby.length;
}

/** Calculate Proximity (P) to key demand generators (transit hubs, offices, anchors, colleges) */
export function calculateProximityScore(loc: CandidateLocation): number {
  const anchors = loc.nearby.filter((b) => !b.competitor);
  if (anchors.length === 0) {
    // If no explicit anchors surveyed, estimate baseline from transit access
    return loc.metrics.transit === "High" ? 65 : loc.metrics.transit === "Medium" ? 45 : 30;
  }
  // Points for nearby anchors within 500m
  const closeAnchors = anchors.filter((b) => b.distanceM <= 500).length;
  const mediumAnchors = anchors.filter((b) => b.distanceM > 500 && b.distanceM <= 1000).length;
  const raw = 35 + closeAnchors * 15 + mediumAnchors * 8;
  return clamp(raw, 20, 98);
}

export function scoreLocation(
  loc: CandidateLocation,
  analysis: Analysis,
  customWeights?: ScoringWeights
): LocationScore {
  const weights: ScoringWeights =
    customWeights || analysis.scoringWeights || DEFAULT_SCORING_WEIGHTS;

  const feas = computeFeasibility(loc.financials, analysis.profile.targetDailySales);
  const comp = competitorCount(loc);
  const vShare = verifiedShare(loc);

  // 1. Demand indicators (D) — 0.30
  const demand = clamp(Math.round(loc.metrics.footfallIndex), 0, 100);

  // 2. Competition context (C) — 0.20
  // Healthy retail clusters benefit from 1–3 competitors; zero is unvalidated; >7 is saturated.
  const competition =
    comp === 0 ? 55 : comp <= 2 ? 90 : comp <= 4 ? 74 : comp <= 6 ? 54 : comp <= 8 ? 38 : 22;

  // 3. Accessibility & Visibility (A) — 0.20
  const access = Math.round(
    PARKING_SCORE[loc.metrics.parking] * 0.35 +
      FRONTAGE_SCORE[loc.metrics.frontage] * 0.40 +
      TRANSIT_SCORE[loc.metrics.transit] * 0.25
  );

  // 4. Rent Affordability & Break-Even (R) — 0.20
  let affordability = 8;
  if (isFinite(feas.breakEvenDaily) && feas.breakEvenDaily > 0) {
    const ratio = feas.breakEvenDaily / Math.max(1, analysis.profile.targetDailySales);
    affordability = clamp(Math.round(118 - ratio * 100), 5, 96);
  }

  // 5. Proximity to Relevant Destinations / Anchors (P) — 0.10
  const proximity = calculateProximityScore(loc);

  const wD = Math.round(weights.D * 100);
  const wC = Math.round(weights.C * 100);
  const wA = Math.round(weights.A * 100);
  const wR = Math.round(weights.R * 100);
  const wP = Math.round(weights.P * 100);

  const components: ScoreComponent[] = [
    {
      key: "demand",
      code: "D",
      label: "Demand indicators",
      weight: wD,
      score: demand,
      weighted: demand * weights.D,
      detail: `Footfall index ${loc.metrics.footfallIndex}/100 · based on pedestrian flow proxy indicators.`,
    },
    {
      key: "competition",
      code: "C",
      label: "Competition context",
      weight: wC,
      score: competition,
      weighted: competition * weights.C,
      detail: `${comp} competitor${comp === 1 ? "" : "s"} mapped (${
        comp === 0 ? "unvalidated whitespace" : comp <= 3 ? "healthy cluster" : "saturated market"
      }).`,
    },
    {
      key: "access",
      code: "A",
      label: "Access & visibility",
      weight: wA,
      score: access,
      weighted: access * weights.A,
      detail: `${loc.metrics.frontage.toLowerCase()} frontage · parking ${loc.metrics.parking.toLowerCase()} · transit ${loc.metrics.transit.toLowerCase()}.`,
    },
    {
      key: "affordability",
      code: "R",
      label: "Rent affordability & break-even",
      weight: wR,
      score: affordability,
      weighted: affordability * weights.R,
      detail: isFinite(feas.breakEvenDaily)
        ? `Break-even ${feas.breakEvenDaily} sales/day vs ${analysis.profile.targetDailySales}/day target (${feas.rentToRevenue.toFixed(1)}% rent/rev).`
        : "Margin non-positive — break-even unreachable at current price/cost assumptions.",
    },
    {
      key: "proximity",
      code: "P",
      label: "Proximity to destinations & anchors",
      weight: wP,
      score: proximity,
      weighted: proximity * weights.P,
      detail: `${loc.nearby.filter((b) => !b.competitor).length} non-competitor anchor destinations & transit draws within survey radius.`,
    },
  ];

  // Missing data penalty: explicit penalty for unverified records and missing info
  const missingPenalty = loc.missingInfo.length * 1.5;
  const rawTotal = components.reduce((a, c) => a + c.weighted, 0);
  const total = clamp(Math.round(rawTotal - missingPenalty), 0, 100);

  const verdict =
    total >= 78
      ? { label: "Prime candidate", tone: "prime" as const }
      : total >= 65
      ? { label: "Strong candidate", tone: "strong" as const }
      : total >= 50
      ? { label: "Viable with conditions", tone: "conditional" as const }
      : total >= 35
      ? { label: "Caution advised", tone: "caution" as const }
      : { label: "High risk", tone: "risk" as const };

  return {
    locationId: loc.id,
    total,
    verdict,
    components,
    verifiedShare: vShare,
    competitorCount: comp,
    missing: loc.missingInfo,
    weightsUsed: weights,
  };
}

export function scoreAnalysis(analysis: Analysis, customWeights?: ScoringWeights): LocationScore[] {
  return analysis.locations.map((l) => scoreLocation(l, analysis, customWeights));
}

/** Ranked best-first. */
export function rankLocations(analysis: Analysis, customWeights?: ScoringWeights): LocationScore[] {
  return scoreAnalysis(analysis, customWeights).sort((a, b) => b.total - a.total);
}
