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
