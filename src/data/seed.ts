import type {
  Analysis,
  CandidateLocation,
  ChecklistItem,
  EvidenceSource,
  EvidenceStatus,
  NearbyBusiness,
  SavedReport,
  UserProfile,
} from "../lib/types";

/* Demo content — every record below is fictional and presented
   as demonstration data inside the product. */

export const DEMO_USER: UserProfile = {
  name: "Amara Shetty",
  email: "amara@kaasara.in",
  role: "Founder & Operator",
  org: "Ka'sara Hospitality LLP",
};

const DEG_LAT = 111320;
const DEG_LNG = 107900;

let seq = 0;
function nb(
  center: { lat: number; lng: number },
  name: string,
  category: string,
  dxM: number,
  dyM: number,
  opts: Partial<Pick<NearbyBusiness, "source" | "status" | "competitor" | "note" | "addedBy">> = {}
): NearbyBusiness {
  seq += 1;
  return {
    id: `nb_${seq.toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    name,
    category,
    lat: center.lat + dyM / DEG_LAT,
    lng: center.lng + dxM / DEG_LNG,
    distanceM: Math.round(Math.hypot(dxM, dyM)),
    source: (opts.source ?? "open-data") as EvidenceSource,
    status: (opts.status ?? "unverified") as EvidenceStatus,
    competitor: opts.competitor ?? false,
    note: opts.note,
    addedBy: opts.addedBy,
  };
}

export function defaultChecklist(): ChecklistItem[] {
  let i = 0;
  const mk = (group: string, label: string, hint?: string, state: ChecklistItem["state"] = "pending"): ChecklistItem => ({
    id: `ck_${(i++).toString(36)}`,
    group,
    label,
    hint,
    state,
    note: "",
  });
  return [
    mk("Accessibility", "Pavement approach is step-free and unobstructed"),
    mk("Accessibility", "Two-wheeler parking possible within 50 m"),
    mk("Accessibility", "Safe pedestrian crossing from main traffic flow", "Check during evening peak"),
    mk("Visibility & signage", "Unit is visible from the primary traffic direction", "", "confirmed"),
    mk("Visibility & signage", "Facade allows a compliant signboard"),
    mk("Visibility & signage", "Night visibility after 8 pm confirmed", "", "pending"),
    mk("Competition walk-by", "Photographed every competing storefront within 250 m"),
    mk("Competition walk-by", "Counted seated customers at two peak windows", "15-min counts, 8–9 am and 5–6 pm"),
    mk("Competition walk-by", "Price points of the three nearest competitors noted", "", "issue"),
    mk("Commercial surroundings", "Anchor draws (offices, colleges, transit) confirmed open and active", "", "confirmed"),
    mk("Commercial surroundings", "Vacancy rate of the street block observed"),
    mk("Commercial surroundings", "Upcoming construction or road works checked"),
    mk("Lease & compliance", "Lock-in period and escalation clause reviewed"),
    mk("Lease & compliance", "Trade licence and FSSAI eligibility confirmed for the address"),
    mk("Lease & compliance", "Electrical load (kW) sufficient for equipment"),
  ];
}

function balmattaFinancials() {
  return {
    avgPrice: 245, variableCost: 96,
    rentMonthly: 135000, salariesMonthly: 86000, utilitiesMonthly: 16500, marketingMonthly: 9000, otherFixedMonthly: 8500,
    fitOutCost: 1150000, equipmentCost: 640000, depositMonths: 6, licencesCost: 58000, preOpeningCost: 120000,
    workingCapitalMonths: 3, operatingDays: 30,
  };
}

function seedLocations(): CandidateLocation[] {
  const balmatta = { lat: 12.87016, lng: 74.88311 };
  const nanthoor = { lat: 12.87342, lng: 74.85767 };
  const kankanady = { lat: 12.86186, lng: 74.86038 };

  return [
    {
      id: "loc_balmatta",
      name: "Balmatta High Street",
      address: "Unit 4, Empire Trade Centre, Balmatta Road",
      micro: "Prime high-street retail strip with offices, education and evening dining draw.",
      lat: balmatta.lat, lng: balmatta.lng,
      metrics: { sizeSqft: 1050, rentPerSqft: 129, footfallIndex: 84, parking: "Limited", frontage: "Primary", transit: "High" },
      financials: balmattaFinancials(),
      nearby: [
        nb(balmatta, "Brew District", "Café", -140, 90, { competitor: true, status: "verified", source: "demo-survey", note: "62 covers, specialty menu, avg ticket ~₹260" }),
        nb(balmatta, "Mocha Lane", "Café", 210, -120, { competitor: true, status: "field-observed", source: "demo-survey", note: "Busy 5–7 pm; limited seating" }),
        nb(balmatta, "The Filter House", "Café", 320, 240, { competitor: true, status: "unverified", note: "Listed on open map data — confirm still trading" }),
        nb(balmatta, "Café Aarra", "Café", -260, -180, { competitor: true, status: "verified", source: "user-added", addedBy: "Amara S.", note: "Added after field walk on 12 Nov" }),
        nb(balmatta, "Smoke & Batter", "Fast food", 60, -200, { status: "field-observed", source: "demo-survey" }),
        nb(balmatta, "Threadline Boutique", "Fashion retail", -90, 140, { status: "verified", source: "demo-survey" }),
        nb(balmatta, "Orbit Salon", "Beauty & grooming", 150, 60, { status: "unverified" }),
        nb(balmatta, "CityScript Bookstore", "Books & stationery", -320, -40, { status: "verified", source: "demo-survey", note: "Strong weekend family footfall" }),
        nb(balmatta, "WellKare Pharmacy", "Pharmacy", 240, 180),
        nb(balmatta, "Nimbus Co-work", "Co-working (1,800 seats)", -180, 260, { status: "verified", source: "demo-survey", note: "Weekday daytime demand anchor" }),
        nb(balmatta, "Pulse Fitness", "Gym", 300, -260, { status: "unverified" }),
        nb(balmatta, "Amigo Dessert Bar", "Desserts", -60, -300, { competitor: true, status: "unverified", note: "Partial overlap — dessert-led" }),
      ],
      risks: [
        { label: "Rent ₹129/sqft sits ~18% above the micro-market median", severity: "medium", basis: "assumed" },
        { label: "Evening parking congestion observed on the Block 4 approach", severity: "low", basis: "observed" },
        { label: "A national café chain has announced a store 400 m north", severity: "high", basis: "assumed" },
      ],
      missingInfo: ["Landlord lock-in clause not reviewed", "Power backup availability unknown"],
    },
    {
      id: "loc_nanthoor",
      name: "Nanthoor Junction · Kadri",
      address: "Ground Floor, Coral Crest, Nanthoor Circle",
      micro: "Signalised junction between two arterial roads; strong morning commuter flow.",
      lat: nanthoor.lat, lng: nanthoor.lng,
      metrics: { sizeSqft: 1200, rentPerSqft: 71, footfallIndex: 71, parking: "Good", frontage: "Corner", transit: "Medium" },
      financials: {
        avgPrice: 230, variableCost: 92,
        rentMonthly: 85000, salariesMonthly: 78000, utilitiesMonthly: 14500, marketingMonthly: 8000, otherFixedMonthly: 7000,
        fitOutCost: 980000, equipmentCost: 610000, depositMonths: 6, licencesCost: 52000, preOpeningCost: 95000,
        workingCapitalMonths: 3, operatingDays: 30,
      },
      nearby: [
        nb(nanthoor, "Kadri Coffee Works", "Café", 180, -60, { competitor: true, status: "verified", source: "demo-survey", note: "South-Indian filter focus, low ticket" }),
        nb(nanthoor, "Tea Point 24", "Tea kiosk", -120, 140, { competitor: true, status: "field-observed", source: "demo-survey" }),
        nb(nanthoor, "Froth & Co.", "Café", 340, 220, { competitor: true, status: "unverified" }),
        nb(nanthoor, "BrightSpark Tuition Centre", "Education (est. 400 students)", -220, 80, { status: "verified", source: "demo-survey", note: "After-school parent waiting demand" }),
        nb(nanthoor, "MedPlus Pharmacy", "Pharmacy", 90, -180, { status: "verified", source: "demo-survey" }),
        nb(nanthoor, "GreenPlate Restaurant", "Restaurant", -300, -120, { status: "unverified" }),
        nb(nanthoor, "UrbanCart Supermarket", "Grocery", 260, 160, { status: "verified", source: "demo-survey", note: "Evening anchor until 10 pm" }),
        nb(nanthoor, "Style Studio Salon", "Beauty & grooming", -90, 240, { status: "unverified" }),
        nb(nanthoor, "City Bus Depot (Nanthoor)", "Transit node", 160, 300, { status: "verified", source: "demo-survey", note: "Morning peak 7:30–9:30 am" }),
        nb(nanthoor, "Bakehouse 41", "Bakery", -340, 60, { competitor: true, status: "unverified", note: "Bread-led; limited beverage overlap" }),
      ],
      risks: [
        { label: "Signal island blocks the sightline from southbound traffic", severity: "medium", basis: "observed" },
        { label: "Waterlogging reported at the junction during heavy monsoon", severity: "medium", basis: "assumed" },
      ],
      missingInfo: ["Signage rights on the facade pending landlord confirmation"],
    },
    {
      id: "loc_kankanady",
      name: "Kankanady Market Road",
      address: "Shop 2, Marina Square, Kankanady",
      micro: "Dense value-retail market street near the hospital district; price-sensitive catchment.",
      lat: kankanady.lat, lng: kankanady.lng,
      metrics: { sizeSqft: 820, rentPerSqft: 76, footfallIndex: 58, parking: "Poor", frontage: "Secondary", transit: "Medium" },
      financials: {
        avgPrice: 215, variableCost: 88,
        rentMonthly: 62000, salariesMonthly: 68000, utilitiesMonthly: 12000, marketingMonthly: 6000, otherFixedMonthly: 6000,
        fitOutCost: 720000, equipmentCost: 480000, depositMonths: 6, licencesCost: 48000, preOpeningCost: 75000,
        workingCapitalMonths: 3, operatingDays: 30,
      },
      nearby: [
        nb(kankanady, "Chai Sutta Point", "Tea & snacks", 80, -40, { competitor: true, status: "field-observed", source: "demo-survey", note: "High volume, very low ticket" }),
        nb(kankanady, "Daily Brews", "Café", -160, 100, { competitor: true, status: "unverified" }),
        nb(kankanady, "Juice Junction", "Juice bar", 140, 180, { competitor: true, status: "unverified" }),
        nb(kankanady, "Mercy Hospital East Gate", "Hospital (2,100 beds)", -260, 220, { status: "verified", source: "demo-survey", note: "All-day attendant footfall" }),
        nb(kankanady, "Sannidhi Sweets", "Sweets & snacks", -60, -160, { status: "verified", source: "demo-survey" }),
        nb(kankanady, "Wellness Forever Pharmacy", "Pharmacy", 220, -120, { status: "unverified" }),
        nb(kankanady, "Campus Stationery", "Books & stationery", 300, 60),
        nb(kankanady, "Megha Textiles", "Fashion retail", -220, -220, { status: "unverified" }),
        nb(kankanady, "Aroma Bakes", "Bakery", 260, 260, { competitor: true, status: "unverified", note: "New board sighted — fit-out in progress" }),
      ],
      risks: [
        { label: "Single-lane access road congested 12–3 pm daily", severity: "high", basis: "observed" },
        { label: "Evening footfall drops sharply after 7:30 pm", severity: "medium", basis: "observed" },
        { label: "Price-sensitive catchment may cap average ticket", severity: "medium", basis: "assumed" },
      ],
      missingInfo: ["Footfall counts not yet collected", "Competitor list is unverified", "Lease tenure and renewal terms unknown"],
    },
  ];
}

export function seedAnalyses(): Analysis[] {
  const locations = seedLocations();
  const now = Date.now();
  const h = 3600e3;
  const d = 86400e3;

  return [
    {
      id: "an_kaasara",
      title: "Ka'sara Brew Co. — Second outlet",
      status: "active",
      createdAt: new Date(now - 12 * d).toISOString(),
      updatedAt: new Date(now - 5 * h).toISOString(),
      profile: {
        name: "Ka'sara Brew Co.",
        category: "Specialty coffee & café",
        concept: "45-seat specialty coffee bar with an all-day brunch menu and retail bean shelf.",
        targetDailySales: 96,
      },
      budget: { maxInvestment: 4200000, monthlyRentCeiling: 150000 },
      locations,
      scenarios: [
        {
          id: "sc_rent",
          name: "Balmatta · negotiated rent",
          baseLocationId: "loc_balmatta",
          patch: { rentMonthly: 118800 },
          note: "Broker signalled 12% headroom on the quoting rent.",
          savedAt: new Date(now - 2 * d).toISOString(),
        },
        {
          id: "sc_lean",
          name: "Nanthoor · lean staffing",
          baseLocationId: "loc_nanthoor",
          patch: { salariesMonthly: 62000 },
          note: "Cross-trained barista lead, one fewer junior on weekdays.",
          savedAt: new Date(now - 26 * h).toISOString(),
        },
      ],
      checklist: defaultChecklist(),
      activity: [
        { id: "ev1", at: new Date(now - 12 * d).toISOString(), actor: "Amara S.", text: "Analysis created with two candidate locations.", kind: "create" },
        { id: "ev2", at: new Date(now - 11 * d).toISOString(), actor: "Amara S.", text: "Added candidate location Kankanady Market Road.", kind: "edit" },
        { id: "ev3", at: new Date(now - 9 * d).toISOString(), actor: "Rohan K.", text: "Field-observed 6 storefronts near Balmatta High Street.", kind: "verify" },
        { id: "ev4", at: new Date(now - 7 * d).toISOString(), actor: "Amara S.", text: "Verified Café Aarra and added competitor note.", kind: "verify" },
        { id: "ev5", at: new Date(now - 4 * d).toISOString(), actor: "Amara S.", text: "Updated Balmatta rent assumption to ₹1,35,000/month.", kind: "finance" },
        { id: "ev6", at: new Date(now - 2 * d).toISOString(), actor: "Rohan K.", text: "Saved scenario “Balmatta · negotiated rent”.", kind: "finance" },
        { id: "ev7", at: new Date(now - 26 * h).toISOString(), actor: "Amara S.", text: "Flagged issue: competitor price points still missing for Kankanady.", kind: "verify" },
        { id: "ev8", at: new Date(now - 5 * h).toISOString(), actor: "System", text: "Decision scores recomputed after latest edits.", kind: "system" },
      ],
    },
    {
      id: "an_kneads",
      title: "Daily Kneads — Artisan bakery",
      status: "concluded",
      createdAt: new Date(now - 68 * d).toISOString(),
      updatedAt: new Date(now - 30 * d).toISOString(),
      profile: {
        name: "Daily Kneads",
        category: "Bakery & patisserie",
        concept: "Compact sourdough bakery with a 12-seat coffee counter.",
        targetDailySales: 140,
      },
      budget: { maxInvestment: 2800000, monthlyRentCeiling: 90000 },
      locations: [
        {
          id: "loc_pandeshwar",
          name: "Pandeshwar Main Road",
          address: "Shop 8, Regal Arcade, Pandeshwar",
          micro: "Office-district lunch economy with weekend brunch traffic.",
          lat: 12.8744, lng: 74.8446,
          metrics: { sizeSqft: 640, rentPerSqft: 98, footfallIndex: 66, parking: "Good", frontage: "Primary", transit: "High" },
          financials: {
            avgPrice: 165, variableCost: 68,
            rentMonthly: 63000, salariesMonthly: 54000, utilitiesMonthly: 14000, marketingMonthly: 5000, otherFixedMonthly: 6000,
            fitOutCost: 620000, equipmentCost: 740000, depositMonths: 6, licencesCost: 42000, preOpeningCost: 80000,
            workingCapitalMonths: 3, operatingDays: 30,
          },
          nearby: [
            nb({ lat: 12.8744, lng: 74.8446 }, "Crumb Culture", "Bakery", 120, 80, { competitor: true, status: "verified", source: "demo-survey" }),
            nb({ lat: 12.8744, lng: 74.8446 }, "Infiniti Software Park Gate 2", "Office (est. 2,600 staff)", -200, 150, { status: "verified", source: "demo-survey" }),
            nb({ lat: 12.8744, lng: 74.8446 }, "Late Latte Café", "Café", 240, -100, { competitor: true, status: "field-observed", source: "demo-survey" }),
          ],
          risks: [{ label: "Weekend daytime dip when offices close", severity: "low", basis: "observed" }],
          missingInfo: [],
        },
      ],
      scenarios: [],
      checklist: defaultChecklist().map((c) => ({ ...c, state: "confirmed" as const })),
      activity: [
        { id: "evk1", at: new Date(now - 68 * d).toISOString(), actor: "Amara S.", text: "Analysis created.", kind: "create" },
        { id: "evk2", at: new Date(now - 30 * d).toISOString(), actor: "Amara S.", text: "Final decision report generated — Pandeshwar selected.", kind: "report" },
      ],
    },
    {
      id: "an_palette",
      title: "Palette & Pour — Art café",
      status: "draft",
      createdAt: new Date(now - 2 * d).toISOString(),
      updatedAt: new Date(now - 2 * d).toISOString(),
      profile: {
        name: "Palette & Pour",
        category: "Specialty coffee & café",
        concept: "Art-supplies retail blended with a 20-seat pour-over bar and weekend workshops.",
        targetDailySales: 60,
      },
      budget: { maxInvestment: 2400000, monthlyRentCeiling: 80000 },
      locations: [
        {
          id: "loc_kudla",
          name: "Kudla Art District",
          address: "14, Car Street Galleries",
          micro: "Tourist-facing heritage block; workshop-led demand model.",
          lat: 12.8652, lng: 74.8402,
          metrics: { sizeSqft: 900, rentPerSqft: 64, footfallIndex: 44, parking: "Limited", frontage: "Secondary", transit: "Low" },
          financials: {
            avgPrice: 260, variableCost: 110,
            rentMonthly: 58000, salariesMonthly: 50000, utilitiesMonthly: 9000, marketingMonthly: 12000, otherFixedMonthly: 5000,
            fitOutCost: 680000, equipmentCost: 380000, depositMonths: 6, licencesCost: 40000, preOpeningCost: 90000,
            workingCapitalMonths: 4, operatingDays: 26,
          },
          nearby: [
            nb({ lat: 12.8652, lng: 74.8402 }, "Gallery Nine", "Art gallery", 60, 40, { status: "field-observed", source: "user-added", addedBy: "Amara S." }),
            nb({ lat: 12.8652, lng: 74.8402 }, "Old Port Café", "Café", -140, -60, { competitor: true, status: "unverified" }),
          ],
          risks: [{ label: "Seasonal tourist dependence", severity: "medium", basis: "assumed" }],
          missingInfo: ["No footfall data collected yet", "Workshop demand unvalidated"],
        },
      ],
      scenarios: [],
      checklist: defaultChecklist(),
      activity: [
        { id: "evp1", at: new Date(now - 2 * d).toISOString(), actor: "Amara S.", text: "Draft analysis created from the new-analysis wizard.", kind: "create" },
      ],
    },
  ];
}

export function seedReports(): SavedReport[] {
  const now = Date.now();
  return [
    {
      id: "rep_kneads",
      analysisId: "an_kneads",
      title: "Daily Kneads — Final decision report",
      createdAt: new Date(now - 30 * 86400e3).toISOString(),
      verdict: "Pandeshwar Main Road selected — break-even at 68 covers/day vs 140 target.",
    },
  ];
}

export const MAP_CENTER: [number, number] = [12.8698, 74.8686];
