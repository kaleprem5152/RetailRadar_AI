import { describe, it, expect } from "vitest";
import { scoreLocation, calculateProximityScore } from "../lib/scoring";
import type { Analysis, CandidateLocation } from "../lib/types";

const mockLocation: CandidateLocation = {
  id: "loc-test-1",
  name: "Koramangala 80ft Road",
  address: "Shop 4, 80 Feet Road, 4th Block",
  micro: "Prime commercial hub with high evening pedestrian and young professional density.",
  lat: 12.9352,
  lng: 77.6245,
  metrics: {
    sizeSqft: 1000,
    rentPerSqft: 100,
    footfallIndex: 85,
    parking: "Good",
    frontage: "Corner",
    transit: "High",
  },
  financials: {
    avgPrice: 250,
    variableCost: 90,
    rentMonthly: 100000,
    salariesMonthly: 80000,
    utilitiesMonthly: 15000,
    marketingMonthly: 10000,
    otherFixedMonthly: 10000,
    fitOutCost: 1000000,
    equipmentCost: 600000,
    depositMonths: 6,
    licencesCost: 50000,
    preOpeningCost: 100000,
    workingCapitalMonths: 3,
    operatingDays: 30,
  },
  nearby: [
    {
      id: "comp-1",
      name: "Third Wave Coffee",
      category: "Specialty coffee",
      lat: 12.9355,
      lng: 77.6249,
      distanceM: 120,
      source: "open-data",
      status: "verified",
      competitor: true,
    },
    {
      id: "anchor-1",
      name: "Sony World Signal Metro Bus Bay",
      category: "Transit Hub",
      lat: 12.9360,
      lng: 77.6250,
      distanceM: 180,
      source: "open-data",
      status: "verified",
      competitor: false,
    },
  ],
  risks: [],
  missingInfo: [],
};

const mockAnalysis: Analysis = {
  id: "an-test-1",
  title: "Test Coffee Bar",
  status: "active",
  createdAt: "2026-10-25T00:00:00.000Z",
  updatedAt: "2026-10-25T00:00:00.000Z",
  profile: {
    name: "Artisan Brew",
    category: "Specialty coffee & café",
    concept: "Neighborhood espresso bar",
    targetDailySales: 75,
  },
  budget: {
    maxInvestment: 4000000,
    monthlyRentCeiling: 120000,
  },
  locations: [mockLocation],
  scenarios: [],
  checklist: [],
  activity: [],
};

describe("PRD Location Scoring Model", () => {
  it("scores location using 0.30D + 0.20C + 0.20A + 0.20R + 0.10P", () => {
    const res = scoreLocation(mockLocation, mockAnalysis);
    expect(res.total).toBeGreaterThan(50);
    expect(res.components).toHaveLength(5);

    const d = res.components.find((c) => c.code === "D");
    const c = res.components.find((c) => c.code === "C");
    const a = res.components.find((c) => c.code === "A");
    const r = res.components.find((c) => c.code === "R");
    const p = res.components.find((c) => c.code === "P");

    expect(d?.weight).toBe(30);
    expect(c?.weight).toBe(20);
    expect(a?.weight).toBe(20);
    expect(r?.weight).toBe(20);
    expect(p?.weight).toBe(10);
  });

  it("calculates proximity score from nearby non-competitor anchors", () => {
    const pScore = calculateProximityScore(mockLocation);
    expect(pScore).toBeGreaterThanOrEqual(20);
    expect(pScore).toBeLessThanOrEqual(100);
  });

  it("supports configurable weights", () => {
    const customWeights = { D: 0.50, C: 0.10, A: 0.10, R: 0.20, P: 0.10 };
    const res = scoreLocation(mockLocation, mockAnalysis, customWeights);
    const d = res.components.find((c) => c.code === "D");
    expect(d?.weight).toBe(50);
    expect(res.weightsUsed.D).toBe(0.5);
  });

  it("applies penalty for missing information", () => {
    const incompleteLoc: CandidateLocation = {
      ...mockLocation,
      missingInfo: ["Unverified parking capacity", "No morning footfall survey", "Lease terms tentative"],
    };
    const cleanScore = scoreLocation(mockLocation, mockAnalysis);
    const incompleteScore = scoreLocation(incompleteLoc, mockAnalysis);
    expect(incompleteScore.total).toBeLessThan(cleanScore.total);
  });
});
