import type { FinancialAssumptions } from "./types";

/** Sanitize numeric input — clamp to >= 0, NaN → 0. */
export function n0(v: unknown): number {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  if (typeof n !== "number" || isNaN(n) || !isFinite(n)) return 0;
  return Math.max(0, n);
}

/** Contribution earned on each sale after direct costs. */
export function contributionPerSale(a: FinancialAssumptions): number {
  return a.avgPrice - a.variableCost;
}

export function contributionMargin(a: FinancialAssumptions): number {
  if (a.avgPrice <= 0) return 0;
  return contributionPerSale(a) / a.avgPrice;
}

/** All recurring monthly fixed costs. */
export function monthlyFixedCosts(a: FinancialAssumptions): number {
  return a.rentMonthly + a.salariesMonthly + a.utilitiesMonthly + a.marketingMonthly + a.otherFixedMonthly;
}

/** Sales per month required to cover fixed costs. Infinity if margin is non-positive. */
export function breakEvenMonthlySales(a: FinancialAssumptions): number {
  const c = contributionPerSale(a);
  if (c <= 0) return Infinity;
  return Math.ceil(monthlyFixedCosts(a) / c);
}

export function breakEvenDailySales(a: FinancialAssumptions): number {
  const m = breakEvenMonthlySales(a);
  if (!isFinite(m)) return Infinity;
  const days = Math.max(1, a.operatingDays);
  return Math.ceil(m / days);
}

/** One-time establishment cost incl. refundable deposit. */
export function setupCostTotal(a: FinancialAssumptions): number {
  return a.fitOutCost + a.equipmentCost + a.licencesCost + a.preOpeningCost + a.depositMonths * a.rentMonthly;
}

/** Cash buffer reserved to survive the ramp-up. */
export function workingCapitalReserve(a: FinancialAssumptions): number {
  return a.workingCapitalMonths * monthlyFixedCosts(a);
}

/** Total cash required before the doors open. */
export function startupCashRequired(a: FinancialAssumptions): number {
  return setupCostTotal(a) + workingCapitalReserve(a);
}

/** Monthly operating profit at a given average daily sales volume. */
export function monthlyProfitAt(a: FinancialAssumptions, dailySales: number): number {
  return dailySales * Math.max(1, a.operatingDays) * contributionPerSale(a) - monthlyFixedCosts(a);
}

/** Simple payback: months for cumulative profit to repay startup cash (excl. refundable deposit? kept simple & explainable). */
export function paybackMonths(a: FinancialAssumptions, dailySales: number): number {
  const profit = monthlyProfitAt(a, dailySales);
  if (profit <= 0) return Infinity;
  return Math.ceil(startupCashRequired(a) / profit);
}

/** Rent as share of revenue at target volume — classic affordability test. */
export function rentToRevenuePct(a: FinancialAssumptions, targetDailySales: number): number {
  const revenue = targetDailySales * Math.max(1, a.operatingDays) * a.avgPrice;
  if (revenue <= 0) return 0;
  return (a.rentMonthly / revenue) * 100;
}

export interface Feasibility {
  contribution: number;
  margin: number;
  contributionMarginPct: number;
  fixedMonthly: number;
  breakEvenMonthly: number;
  breakEvenDaily: number;
  setupTotal: number;
  workingCapital: number;
  startupCash: number;
  targetDaily: number;
  targetHeadroomPct: number; // how far target is above break-even
  marginOfSafetyPct: number;
  monthlyRevenueAtTarget: number;
  monthlyProfitAtTarget: number;
  rentToRevenue: number;
  paybackAtTarget: number;
  paybackMonths: number;
}

export function computeFeasibility(a: FinancialAssumptions, targetDailySales: number): Feasibility {
  const beD = breakEvenDailySales(a);
  const headroom = isFinite(beD) && targetDailySales > 0 ? ((targetDailySales - beD) / targetDailySales) * 100 : 0;
  const rev = targetDailySales * Math.max(1, a.operatingDays) * a.avgPrice;
  const prof = monthlyProfitAt(a, targetDailySales);
  const pb = paybackMonths(a, targetDailySales);
  const cm = contributionMargin(a);
  return {
    contribution: contributionPerSale(a),
    margin: cm,
    contributionMarginPct: cm * 100,
    fixedMonthly: monthlyFixedCosts(a),
    breakEvenMonthly: breakEvenMonthlySales(a),
    breakEvenDaily: beD,
    setupTotal: setupCostTotal(a),
    workingCapital: workingCapitalReserve(a),
    startupCash: startupCashRequired(a),
    targetDaily: targetDailySales,
    targetHeadroomPct: headroom,
    marginOfSafetyPct: headroom,
    monthlyRevenueAtTarget: rev,
    monthlyProfitAtTarget: prof,
    rentToRevenue: rentToRevenuePct(a, targetDailySales),
    paybackAtTarget: pb,
    paybackMonths: pb,
  };
}

export const FINANCE_FIELDS: { key: keyof FinancialAssumptions; label: string; group: "Revenue model" | "Monthly fixed costs" | "One-time setup"; hint?: string }[] = [
  { key: "avgPrice", label: "Average selling price / sale", group: "Revenue model", hint: "Blended average order value" },
  { key: "variableCost", label: "Direct cost / sale", group: "Revenue model", hint: "Ingredients, packaging, commissions" },
  { key: "operatingDays", label: "Operating days / month", group: "Revenue model" },
  { key: "rentMonthly", label: "Rent", group: "Monthly fixed costs" },
  { key: "salariesMonthly", label: "Salaries & wages", group: "Monthly fixed costs" },
  { key: "utilitiesMonthly", label: "Utilities & internet", group: "Monthly fixed costs" },
  { key: "marketingMonthly", label: "Marketing", group: "Monthly fixed costs" },
  { key: "otherFixedMonthly", label: "Other fixed costs", group: "Monthly fixed costs" },
  { key: "fitOutCost", label: "Interiors & fit-out", group: "One-time setup" },
  { key: "equipmentCost", label: "Equipment & machines", group: "One-time setup" },
  { key: "depositMonths", label: "Rent deposit (months)", group: "One-time setup" },
  { key: "licencesCost", label: "Licences & registrations", group: "One-time setup" },
  { key: "preOpeningCost", label: "Pre-opening & launch", group: "One-time setup" },
  { key: "workingCapitalMonths", label: "Working-capital buffer (months)", group: "One-time setup", hint: "Months of fixed costs kept in reserve" },
];
