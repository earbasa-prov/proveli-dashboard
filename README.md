# Proveli Production & eCommerce Dashboard

Standalone dashboard for production KPIs, backlog management, and order analytics.

## Features

- **File Upload**: Drag-and-drop .xlsx or .csv files
- **Executive KPIs**: On-Time Delivery, Same-Day Shipping, Defect %
- **Production & Backlog**: Status distribution, backlog heatmap, channel performance
- **Late Order Tracking**: Critical late list with ageing days
- **Defect Analysis**: Dept. Responsible and Reason breakdown

## Getting Started

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:3001](http://127.0.0.1:3001) — the app runs on port 3001 to avoid conflict with quotes-app (3000).

## Required Columns

Uploaded files must include: **Order No**, **Channel**, **Ship By Date**, **Status**

Optional: Total Quantity, Ship Date, Department Responsible, Defect Analysis

## Sample Data

Use `public/sample-production-data.csv` for testing.
