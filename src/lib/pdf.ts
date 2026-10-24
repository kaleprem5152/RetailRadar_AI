import { jsPDF } from "jspdf";
import type { Analysis } from "./types";
import { computeFeasibility } from "./finance";
import { rankLocations } from "./scoring";
import { fmtDate, fmtINR, fmtINRCompact } from "./utils";

/**
 * Generate and trigger download of a professional, board-ready PDF decision report
 * from actual saved analysis data.
 */
export function generateAnalysisPDF(analysis: Analysis, userName: string, orgName: string) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Helper for adding new page if needed
  const checkPageOverflow = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
      addPageHeader();
    }
  };

  const addPageHeader = () => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150, 148, 141);
    doc.text("RetailRadar AI — Location Intelligence Decision Report", margin, 10);
    doc.text(fmtDate(new Date().toISOString()), pageWidth - margin, 10, { align: "right" });
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, 12, pageWidth - margin, 12);
  };

  // --- COVER / HEADER ---
  // Background brand accent bar
  doc.setFillColor(26, 29, 36);
  doc.rect(0, 0, pageWidth, 36, "F");

  doc.setTextColor(242, 209, 139); // Brass accent
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("RetailRadar AI", margin, 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(200, 200, 200);
  doc.text("COMMERCIAL LOCATION EVALUATION & FEASIBILITY REPORT", margin, 23);

  doc.setTextColor(160, 160, 160);
  doc.setFontSize(8);
  doc.text(`Prepared for: ${userName} · ${orgName}`, margin, 30);
  doc.text(`Date: ${fmtDate(new Date().toISOString())}`, pageWidth - margin, 30, { align: "right" });

  y = 44;

  // --- REPORT TITLE ---
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(analysis.title, margin, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  doc.text(`${analysis.profile.category} · Concept: "${analysis.profile.concept}"`, margin, y);
  y += 10;

  // --- EXECUTIVE SUMMARY ---
  const ranked = rankLocations(analysis);
  const best = ranked[0];

  if (best) {
    const bestLoc = analysis.locations.find((l) => l.id === best.locationId)!;
    const bestFeas = computeFeasibility(bestLoc.financials, analysis.profile.targetDailySales);

    doc.setFillColor(248, 248, 246);
    doc.setDrawColor(217, 164, 65);
    doc.setLineWidth(0.6);
    doc.roundedRect(margin, y, contentWidth, 28, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(160, 110, 20);
    doc.text("EXECUTIVE RECOMMENDATION", margin + 5, y + 6);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text(`Top Candidate: ${bestLoc.name} (Site Score: ${best.total}/100 — ${best.verdict.label})`, margin + 5, y + 13);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(60, 60, 60);
    const summaryText = `Break-even requires ${isFinite(bestFeas.breakEvenDaily) ? `${bestFeas.breakEvenDaily} daily sales` : "non-positive margin"} against target of ${analysis.profile.targetDailySales}/day. Total startup cash needed is ${fmtINRCompact(bestFeas.startupCash)}. Mapped ${best.competitorCount} competitor(s) with ${Math.round(best.verifiedShare * 100)}% verified survey data.`;
    doc.text(summaryText, margin + 5, y + 19, { maxWidth: contentWidth - 10 });

    y += 35;
  }

  // --- CANDIDATE COMPARISON MATRIX ---
  checkPageOverflow(40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(20, 20, 20);
  doc.text("1. Candidate Sites Comparison Matrix", margin, y);
  y += 6;

  // Table header
  doc.setFillColor(235, 237, 240);
  doc.rect(margin, y, contentWidth, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(40, 40, 40);

  doc.text("Location Name", margin + 2, y + 5);
  doc.text("Site Score", margin + 65, y + 5);
  doc.text("Break-Even", margin + 90, y + 5);
  doc.text("Rent/Mo", margin + 115, y + 5);
  doc.text("Startup Cash", margin + 140, y + 5);
  doc.text("Competitors", margin + 165, y + 5);
  y += 7;

  // Table rows
  analysis.locations.forEach((loc, idx) => {
    checkPageOverflow(14);
    const score = ranked.find((r) => r.locationId === loc.id);
    const feas = computeFeasibility(loc.financials, analysis.profile.targetDailySales);

    doc.setFillColor(idx % 2 === 0 ? 255 : 250, 250, 250);
    doc.rect(margin, y, contentWidth, 10, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(20, 20, 20);
    doc.text(loc.name, margin + 2, y + 4.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);
    doc.text(loc.address.slice(0, 38), margin + 2, y + 8.5);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(score && score.total >= 65 ? 30 : 120, 80, 40);
    doc.text(score ? `${score.total}/100` : "—", margin + 65, y + 6);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    doc.text(isFinite(feas.breakEvenDaily) ? `${feas.breakEvenDaily}/day` : "N/A", margin + 90, y + 6);
    doc.text(fmtINR(loc.financials.rentMonthly), margin + 115, y + 6);
    doc.text(fmtINRCompact(feas.startupCash), margin + 140, y + 6);
    doc.text(`${loc.nearby.filter((b) => b.competitor).length} mapped`, margin + 165, y + 6);

    y += 10;
  });

  y += 6;

  // --- SCORING METHODOLOGY BREAKDOWN ---
  checkPageOverflow(40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(20, 20, 20);
  doc.text("2. Scoring Methodology & Normalized Weights", margin, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  doc.text(
    "PRD Illustrative Model: Site Score = 0.30D + 0.20C + 0.20A + 0.20R + 0.10P",
    margin,
    y
  );
  y += 7;

  if (best) {
    best.components.forEach((c) => {
      checkPageOverflow(8);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(40, 40, 40);
      doc.text(`[${c.code}] ${c.label} (${c.weight}%):`, margin + 2, y);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      doc.text(`Score: ${c.score}/100 · ${c.detail}`, margin + 55, y, { maxWidth: contentWidth - 58 });
      y += 6;
    });
  }

  y += 6;

  // --- FIELD VERIFICATION & UNCERTAINTIES ---
  checkPageOverflow(35);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(20, 20, 20);
  doc.text("3. Field Verification & Ground Truth Audit", margin, y);
  y += 6;

  const confirmedCount = analysis.checklist.filter((c) => c.state === "confirmed").length;
  const totalChecklist = analysis.checklist.length;
  const issueCount = analysis.checklist.filter((c) => c.state === "issue").length;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);
  doc.text(`Checklist Progress: ${confirmedCount} of ${totalChecklist} verified · ${issueCount} issues flagged.`, margin, y);
  y += 6;

  analysis.checklist.slice(0, 4).forEach((item) => {
    checkPageOverflow(7);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    const color = item.state === "confirmed" ? [34, 139, 34] : item.state === "issue" ? [200, 50, 50] : [120, 120, 120];
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(`[${item.state.toUpperCase()}]`, margin + 2, y);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);
    doc.text(`${item.label} (${item.group}) ${item.note ? `— Note: ${item.note}` : ""}`, margin + 28, y, { maxWidth: contentWidth - 30 });
    y += 5.5;
  });

  // --- FOOTER & DISCLAIMER ---
  y = Math.max(y + 8, pageHeight - 20);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(140, 140, 140);
  doc.text(
    "Disclaimer: RetailRadar AI scores and estimates represent evidence-grounded decision models based on declared assumptions and available survey records. They do not constitute commercial guarantees of business profitability.",
    margin,
    y,
    { maxWidth: contentWidth }
  );

  // Save the PDF
  const filename = `${analysis.profile.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-retailradar-report.pdf`;
  doc.save(filename);
}

/**
 * Export analysis locations & financial assumptions as clean CSV
 */
export function exportAnalysisCSV(analysis: Analysis) {
  const headers = [
    "Location Name",
    "Address",
    "Micro Market",
    "Frontage",
    "Parking",
    "Transit",
    "Footfall Index",
    "Size Sqft",
    "Monthly Rent",
    "Salaries Monthly",
    "Average Price",
    "Variable Cost",
    "Operating Days",
    "Break Even Daily",
    "Startup Cash",
  ];

  const rows = analysis.locations.map((loc) => {
    const feas = computeFeasibility(loc.financials, analysis.profile.targetDailySales);
    return [
      `"${loc.name}"`,
      `"${loc.address}"`,
      `"${loc.micro}"`,
      loc.metrics.frontage,
      loc.metrics.parking,
      loc.metrics.transit,
      loc.metrics.footfallIndex,
      loc.metrics.sizeSqft,
      loc.financials.rentMonthly,
      loc.financials.salariesMonthly,
      loc.financials.avgPrice,
      loc.financials.variableCost,
      loc.financials.operatingDays,
      isFinite(feas.breakEvenDaily) ? feas.breakEvenDaily : "N/A",
      feas.startupCash,
    ];
  });

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${analysis.profile.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-sites.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
