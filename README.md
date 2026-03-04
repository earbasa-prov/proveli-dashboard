# Proveli Production & eCommerce Dashboard

Standalone dashboard for production KPIs, backlog management, and order analytics.

## Project Structure

```
Proveli Dashboard/           # Parent folder
└── proveli-dashboard/       # This app
    ├── src/
    ├── public/
    └── ...
```

## Features

- **File Upload**: Drag-and-drop .xlsx or .csv files
- **Executive KPIs**: On-Time Delivery, Same-Day Shipping, Defect %
- **Production & Backlog**: Status distribution, backlog heatmap, channel performance
- **Late Order Tracking**: Critical late list with ageing days
- **Defect Analysis**: Dept. Responsible and Reason breakdown
- **Dashboard Save**: Export as `Dashboard-{Date Range}.json` with versioning
- **Recommendations**: Data-driven improvement suggestions
- **Defect Projection**: Next-month projection if defects improve

## Getting Started

```bash
cd proveli-dashboard
npm install
npm run dev
```

Open [http://127.0.0.1:3001](http://127.0.0.1:3001). The app runs on port 3001.

## Required Columns

**Order file**: Order No, Channel, Ship By Date, Status  
**Defect file** (optional): Original Order No., Channel of original order

Optional: Total Quantity, Ship Date, Final Department, Defect Type, Reason

## Sample Data

Use `public/sample-production-data.csv` for testing.

## Deploy on Vercel + Neon

### 1. Neon (PostgreSQL)

1. Go to [console.neon.tech](https://console.neon.tech) and create a project
2. Copy the connection string (Connection pooling recommended)
3. Add to your `.env` locally:
   ```bash
   cp .env.example .env
   # Edit .env and set DATABASE_URL=your_neon_connection_string
   ```
4. Test the connection: `GET /api/health` returns `{ ok: true, neon: true }` when connected

### 2. Vercel

1. Push your repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New** → **Project**
3. Import your `proveli-dashboard` (or `earbasa-prov/proveli-dashboard`) repo
4. Add **Environment Variable**: `DATABASE_URL` = your Neon connection string
5. Deploy — Vercel will build and host the app
6. Optionally connect Neon project to Vercel via the [Vercel integration](https://vercel.com/integrations/neon) for automatic env sync
