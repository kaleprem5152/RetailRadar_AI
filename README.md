# RetailRadar AI — Retail Location Intelligence Platform

> **Find the right location. Before you make the investment.**

RetailRadar AI is a commercial-grade, evidence-driven location intelligence and retail site-selection platform. It empowers retail entrepreneurs, expansion managers, and location analysts to evaluate candidate properties, analyze competitor clusters, stress-test financial break-even requirements, record ground-truth field observations, and generate board-ready investment memorandums.

---

## 🌟 Key Capabilities

### 1. Interactive Location Intelligence Explorer
- **CARTO Dark Vector Raster Tiles**: Authenticated high-contrast cartography with custom retina rendering.
- **Live OpenStreetMap Geocoding**: Real-time address and landmark search powered by OSM Nominatim.
- **Overpass Turbo POI Scanner**: Live discovery of cafes, restaurants, banks, transit stops, and competitor businesses within any radius of candidate sites.
- **Concentric Walking Catchments**: Multi-ring pedestrian buffers at **400m** (5-minute walk), **800m** (10-minute walk), and **1,200m** (15-minute walk).
- **Two-Way Synchronized Spatial Ledger**: Direct interaction between map markers and the evidence table.

### 2. Explainable 5-Factor Scoring Model
Evaluates candidate sites with complete transparency and zero fabricated numbers:
$$\text{Site Score} = 0.30D + 0.20C + 0.20A + 0.20R + 0.10P$$
- **$D$ (Demand Proxy)**: Pedestrian footfall and anchor destination density.
- **$C$ (Competition Balance)**: Relative to business type (healthy retail agglomeration vs. market saturation).
- **$A$ (Accessibility)**: Frontage visibility, road hierarchy, parking, and transit proximity.
- **$R$ (Rent Affordability)**: Measured rent cost relative to modeled ticket size and revenue potential.
- **$P$ (Proximity to Anchors)**: Density of synergistic retail draws and complementary businesses.
- **Live Sensitivity Sliders**: Interactive tuning panel to adjust weights and test ranking shifts in real time.

### 3. Financial Decision Engine & Sensitivity Modeling
- **Unit Economics**: Contribution margin per transaction, monthly fixed costs, daily break-even orders, and payback periods.
- **Crossover Break-Even Chart**: Visual representation of fixed costs, total costs, and gross revenue across sales volumes.
- **Multi-Factor Sensitivity Matrix**: Stress-tests rent variations against ticket price swings.
- **Macro Scenarios**: One-click scenario simulations (**Conservative / Recession**, **Rent Spike $+25\%$**, **Bull Case**).

### 4. Ground Truth & Field Verification Pipeline
- **Street-Level Observations**: Record unmapped businesses, missing transit points, construction hoardings, and footfall bottlenecks directly to GPS coordinates.
- **Three-Tier Provenance**: Tracks data lifecycle (`Unverified` $\rightarrow$ `Field-Observed` $\rightarrow$ `Verified`).
- **Due Diligence Checklist**: Interactive pre-lease audit covering lease agreements, footfall counts, competitor hours, and municipal licenses.

### 5. Grounded AI Decision Synthesis
- Powered by **Google Gemini AI** (`models/gemini-3.5-flash-lite`).
- Generates structured site evaluations and executive comparative memorandums grounded exclusively in saved empirical data.

### 6. Investment Committee Reporting & Exports
- **Print-Ready PDF Memo**: Formal executive memorandums formatted for investment committees.
- **Tabular CSV Export**: Complete spatial and financial datasets for custom spreadsheet modeling.

---

## 🛠️ Technology Stack

- **Frontend Core**: React 19, TypeScript, Vite, TailwindCSS
- **GIS & Cartography**: Leaflet, React-Leaflet, CARTO Basemaps, OpenStreetMap, Overpass QL
- **Data Visualization**: Recharts, Lucide Icons
- **Cloud Backend**: Supabase (PostgreSQL with Row-Level Security, Auth, Table Constraints)
- **AI Intelligence**: Google Gemini API (`gemini-3.5-flash-lite`)
- **PDF Generation**: jsPDF, jsPDF-AutoTable
- **Testing**: Vitest, React Testing Library

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/kaleprem5152/RetailRadar_AI.git
cd RetailRadar_AI

# Install dependencies
npm install
```

### Environment Configuration
Create a `.env` file in the root folder:
```env
# CARTO Basemaps API Key
VITE_MAPS_API_KEY=your-carto-maps-api-key
VITE_CARTO_API_KEY=your-carto-maps-api-key

# Supabase PostgreSQL & Auth (Optional - Local persistence active by default)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key

# Google Gemini API Key (Optional - Rule-based reasoner active by default)
VITE_GEMINI_API_KEY=your-gemini-api-key
```

### Development
```bash
npm run dev
```
Open `http://localhost:5173` to access the application.

### Test Suite
```bash
npm test
```

### Production Build
```bash
npm run build
```
Generates an optimized, single-bundle distribution in the `dist/` directory ready for deployment.

---

## 📄 License
MIT License. Built for modern commercial retail expansion.
