import { describe, it, expect } from "vitest";
import {
  contributionPerSale,
  contributionMargin,
  monthlyFixedCosts,
  breakEvenMonthlySales,
  breakEvenDailySales,
  setupCostTotal,
  workingCapitalReserve,
  startupCashRequired,
  monthlyProfitAt,
  computeFeasibility,
} from "../lib/finance";
import type { FinancialAssumptions } from "../lib/types";

const mockAssumptions: FinancialAssumptions = {
  avgPrice: 200,
  variableCost: 80,
  rentMonthly: 50000,
  salariesMonthly: 40000,
  utilitiesMonthly: 10000,
  marketingMonthly: 5000,
  otherFixedMonthly: 5000,
  fitOutCost: 500000,
  equipmentCost: 300000,
  depositMonths: 6,
  licencesCost: 30000,
  preOpeningCost: 40000,
  workingCapitalMonths: 3,
  operatingDays: 30,
};

describe("Finance Math Engine", () => {
  it("calculates contribution per sale correctly", () => {
    // 200 - 80 = 120
    expect(contributionPerSale(mockAssumptions)).toBe(120);
  });

  it("calculates contribution margin correctly", () => {
    // 120 / 200 = 0.60 (60%)
    expect(contributionMargin(mockAssumptions)).toBeCloseTo(0.6);
  });

  it("calculates total monthly fixed costs", () => {
    // 50000 + 40000 + 10000 + 5000 + 5000 = 110000
    expect(monthlyFixedCosts(mockAssumptions)).toBe(110000);
  });

  it("calculates break-even monthly and daily sales", () => {
    // Break-even monthly = 110000 / 120 = 916.666 -> ceil = 917
    const monthly = breakEvenMonthlySales(mockAssumptions);
    expect(monthly).toBe(917);

    // Break-even daily = 917 / 30 = 30.56 -> ceil = 31
    const daily = breakEvenDailySales(mockAssumptions);
    expect(daily).toBe(31);
  });

  it("handles non-positive margin gracefully with Infinity", () => {
    const lossMaking: FinancialAssumptions = { ...mockAssumptions, avgPrice: 50, variableCost: 60 };
    expect(breakEvenMonthlySales(lossMaking)).toBe(Infinity);
    expect(breakEvenDailySales(lossMaking)).toBe(Infinity);
  });

  it("calculates total setup costs including deposit", () => {
    // fitOut(500000) + equip(300000) + lic(30000) + pre(40000) + deposit(6 * 50000 = 300000) = 1,170,000
    expect(setupCostTotal(mockAssumptions)).toBe(1170000);
  });

  it("calculates working capital reserve and startup cash", () => {
    // 3 * 110000 = 330000
    expect(workingCapitalReserve(mockAssumptions)).toBe(330000);
    // 1170000 + 330000 = 1500000
    expect(startupCashRequired(mockAssumptions)).toBe(1500000);
  });

  it("calculates operating profit at given daily volume", () => {
    // At 50 sales/day: 50 * 30 days * 120 contribution = 180,000 gross profit
    // Operating profit = 180,000 - 110,000 = 70,000
    expect(monthlyProfitAt(mockAssumptions, 50)).toBe(70000);
  });

  it("computes complete feasibility snapshot", () => {
    const feas = computeFeasibility(mockAssumptions, 50);
    expect(feas.breakEvenDaily).toBe(31);
    expect(feas.targetDaily).toBe(50);
    expect(feas.targetHeadroomPct).toBeGreaterThan(0);
  });
});
