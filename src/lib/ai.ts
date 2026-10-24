import type { Analysis, CandidateLocation } from "./types";
import { computeFeasibility } from "./finance";
import { scoreLocation, rankLocations } from "./scoring";

const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

export interface AIAnalysisResult {
  summary: string;
  competitiveVerdict: string;
  financialViability: string;
  keyRisks: string[];
  fieldChecklistSuggestions: string[];
  dataConfidenceNotes: string;
  isAiGenerated: boolean;
  timestamp: string;
}

/**
 * Generate evidence-grounded AI evaluation for a specific location.
 * When Gemini API key is configured, uses Gemini Flash; otherwise uses deterministic rule engine.
 */
export async function evaluateLocationWithAI(
  analysis: Analysis,
  location: CandidateLocation
): Promise<AIAnalysisResult> {
  const score = scoreLocation(location, analysis);
  const feas = computeFeasibility(location.financials, analysis.profile.targetDailySales);
  const competitors = location.nearby.filter((b) => b.competitor);
  const anchors = location.nearby.filter((b) => !b.competitor);
  const verifiedCount = location.nearby.filter((b) => b.status === "verified").length;
  const verifiedPct = Math.round(score.verifiedShare * 100);

  // If Gemini API Key is available, call Gemini API
  if (geminiApiKey && geminiApiKey.length > 5 && !geminiApiKey.includes("your-api-key")) {
    try {
      const prompt = `
You are a senior retail location intelligence consultant for RetailRadar AI.
Analyze this candidate retail location with strict adherence to evidence and uncertainty principles.
DO NOT fabricate numbers or external guarantees. Ground your insights exclusively on the provided data.

Business Profile:
- Business: ${analysis.profile.name} (${analysis.profile.category})
- Concept: ${analysis.profile.concept}
- Target Daily Sales: ${analysis.profile.targetDailySales} units/day

Candidate Location:
- Name: ${location.name}
- Address: ${location.address}
- Micro-market: ${location.micro}
- Frontage: ${location.metrics.frontage}, Parking: ${location.metrics.parking}, Transit: ${location.metrics.transit}
- Footfall Index (Proxy): ${location.metrics.footfallIndex}/100

Financial Assumptions:
- Average Price/Ticket: ₹${location.financials.avgPrice}
- Direct Variable Cost: ₹${location.financials.variableCost}
- Monthly Rent: ₹${location.financials.rentMonthly}
- Monthly Fixed Costs: ₹${feas.fixedMonthly}
- Break-Even Daily Sales: ${isFinite(feas.breakEvenDaily) ? `${feas.breakEvenDaily} sales/day` : "Unreachable (negative margin)"}
- Startup Cash Required: ₹${feas.startupCash}
- Rent-to-Revenue at Target: ${feas.rentToRevenue.toFixed(1)}%

Competitive Landscape:
- Competitors Mapped: ${competitors.length} (${competitors.map((c) => c.name).join(", ") || "None mapped"})
- Non-competitor Anchors: ${anchors.length} (${anchors.map((a) => a.name).join(", ") || "None mapped"})
- Data Verification: ${verifiedCount}/${location.nearby.length} records verified (${verifiedPct}%)
- Declared Missing Information: ${location.missingInfo.join("; ") || "None recorded"}

Site Score: ${score.total}/100 (${score.verdict.label})

Provide a JSON object response with these keys:
{
  "summary": "2-3 concise sentences evaluating suitability for ${analysis.profile.name}",
  "competitiveVerdict": "Assessment of the competitor cluster vs whitespace",
  "financialViability": "Analysis of break-even attainability and rent burden",
  "keyRisks": ["Risk 1 grounded in data", "Risk 2 grounded in data"],
  "fieldChecklistSuggestions": ["Field observation 1 to verify on-site", "Field observation 2"],
  "dataConfidenceNotes": "Statement highlighting data verified vs assumptions"
}
Return only valid JSON.
`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text);
          return {
            summary: parsed.summary,
            competitiveVerdict: parsed.competitiveVerdict,
            financialViability: parsed.financialViability,
            keyRisks: parsed.keyRisks || [],
            fieldChecklistSuggestions: parsed.fieldChecklistSuggestions || [],
            dataConfidenceNotes: parsed.dataConfidenceNotes || `Evidence confidence: ${verifiedPct}% verified.`,
            isAiGenerated: true,
            timestamp: new Date().toISOString(),
          };
        }
      }
    } catch (e) {
      console.warn("Gemini API call failed, falling back to deterministic reasoning engine:", e);
    }
  }

  // Deterministic rule-based analytical engine fallback
  const compAnalysis =
    competitors.length === 0
      ? `No direct competitors currently mapped in the survey zone. While this presents an open field, it may indicate unproven customer demand for ${analysis.profile.category}.`
      : competitors.length <= 3
      ? `Healthy competitive cluster with ${competitors.length} mapped peer(s) (${competitors.map((c) => c.name).join(", ")}). This validates trade-area demand without immediate saturation.`
      : `High competitor concentration (${competitors.length} venues mapped). Customer acquisition will rely heavily on distinct pricing or product differentiation.`;

  const finAnalysis = !isFinite(feas.breakEvenDaily)
    ? `Unit economics are currently broken: direct costs equal or exceed average selling price. Adjust menu pricing before committing.`
    : feas.breakEvenDaily > analysis.profile.targetDailySales
    ? `Challenging break-even: Requires ${feas.breakEvenDaily} sales/day to clear fixed overhead, which exceeds your target of ${analysis.profile.targetDailySales}/day.`
    : `Viable break-even runway: Requires ${feas.breakEvenDaily} transactions/day against your target of ${analysis.profile.targetDailySales}/day (${feas.targetHeadroomPct.toFixed(0)}% safety headroom). Rent represents ${feas.rentToRevenue.toFixed(1)}% of target gross revenue.`;

  const risks: string[] = [];
  if (location.metrics.parking === "Poor" || location.metrics.parking === "Limited") {
    risks.push(`Parking constraint: "${location.metrics.parking}" rating may limit drive-in or four-wheeler customers during peak evening hours.`);
  }
  if (feas.rentToRevenue > 20) {
    risks.push(`High rent burden: Rent consumes ${feas.rentToRevenue.toFixed(1)}% of target revenue (healthy benchmark is 10–18%).`);
  }
  if (location.missingInfo.length > 0) {
    risks.push(`Unverified variables: ${location.missingInfo.length} unverified open questions recorded in the site audit.`);
  }
  if (risks.length === 0) {
    risks.push("Execution risk: Success depends on local footfall conversion and customer retention.");
  }

  const checklistSuggestions: string[] = [
    `Perform physical pedestrian count on ${location.name} across weekday morning (8-10 AM) and evening peak (5-8 PM).`,
    `Inspect lease agreement for CAM charges, power backup availability (kVA), and grease-trap approvals.`,
    `Verify operating hours and average order tickets of nearby establishments (${competitors.slice(0, 2).map((c) => c.name).join(", ") || "adjacent shops"}).`,
  ];

  return {
    summary: `${location.name} achieves a Site Score of ${score.total}/100 (${score.verdict.label}). It features ${location.metrics.frontage.toLowerCase()} frontage and footfall index of ${location.metrics.footfallIndex}/100.`,
    competitiveVerdict: compAnalysis,
    financialViability: finAnalysis,
    keyRisks: risks,
    fieldChecklistSuggestions: checklistSuggestions,
    dataConfidenceNotes: `Evidence Confidence: ${verifiedPct}% of ${location.nearby.length} mapped records are verified/observed. ${location.missingInfo.length} unresolved questions noted.`,
    isAiGenerated: false,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generate side-by-side comparative AI appraisal across candidate locations.
 */
export async function evaluateComparisonWithAI(analysis: Analysis): Promise<string> {
  const ranked = rankLocations(analysis);
  if (ranked.length === 0) return "No candidate locations available to compare.";

  const best = ranked[0];
  const bestLoc = analysis.locations.find((l) => l.id === best.locationId)!;
  const bestFeas = computeFeasibility(bestLoc.financials, analysis.profile.targetDailySales);

  if (geminiApiKey && geminiApiKey.length > 5 && !geminiApiKey.includes("your-api-key")) {
    try {
      const prompt = `
You are a senior retail location intelligence consultant for RetailRadar AI.
Compare these ${analysis.locations.length} candidate sites for "${analysis.profile.name}" (${analysis.profile.concept}).
Target Daily Transactions: ${analysis.profile.targetDailySales} units/day.

Candidate Sites:
${analysis.locations.map((loc, idx) => {
  const sc = ranked.find((r) => r.locationId === loc.id);
  const f = computeFeasibility(loc.financials, analysis.profile.targetDailySales);
  const compCount = loc.nearby.filter((b) => b.competitor).length;
  const verifiedCount = loc.nearby.filter((b) => b.status === "verified").length;
  return `Site ${idx + 1}: ${loc.name} (${loc.micro})
- Score: ${sc?.total || 0}/100 (${sc?.verdict.label || "Evaluating"})
- Daily Break-even: ${f.breakEvenDaily} orders/day (Rent: ₹${loc.financials.rentMonthly}/mo)
- Frontage: ${loc.metrics.frontage}, Parking: ${loc.metrics.parking}, Transit: ${loc.metrics.transit}
- Competitors: ${compCount}, Verified Records: ${verifiedCount}/${loc.nearby.length}
- Missing Data: ${loc.missingInfo.join(", ") || "None declared"}`;
}).join("\n\n")}

Provide an executive comparative memorandum with:
1. Primary site selection & why.
2. Key trade-offs between sites.
3. Decisive risk or missing data point to verify before lease signing.
Keep concise (under 200 words), professional, and grounded solely on provided data.
`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2 },
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text.trim();
      }
    } catch {
      /* Fallback to deterministic synthesis */
    }
  }

  return `Comparative Appraisal:
Across ${analysis.locations.length} evaluated site(s), **${bestLoc.name}** ranks highest with an aggregate Site Score of **${best.total}/100** (${best.verdict.label}).

Key decision drivers:
1. **Break-Even Runway**: Requires ${isFinite(bestFeas.breakEvenDaily) ? `${bestFeas.breakEvenDaily} transactions/day` : "unreachable margin"} against your target of ${analysis.profile.targetDailySales}/day.
2. **Access & Trade Anchor**: Features ${bestLoc.metrics.frontage.toLowerCase()} frontage with ${bestLoc.metrics.transit.toLowerCase()} transit access.
3. **Audit Status**: ${Math.round(best.verifiedShare * 100)}% of mapped nearby records have been verified via open-data or field inspection.

Recommendation: Before executing the lease, complete the ${bestLoc.missingInfo.length} open questions in the Field Verification tab.`;
}
