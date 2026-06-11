# Excel Analytics Studio

A repo-runnable data analysis dashboard for uploading multiple Excel/CSV files and turning them into cleaned, dashboard-ready summaries. This is the first step toward the larger workflow you described: 数据收集 → 数据存储 → 数据处理 → 数据清洗 → 数据分析.

## Feasibility

The idea is highly feasible. The safest build plan is to do it in phases:

1. **Data collection** — upload multiple `.xlsx`, `.csv`, or `.tsv` files from the dashboard.
2. **Data storage** — keep parsed datasets in browser `localStorage` for the repo demo, then move to MongoDB/S3 or another database later.
3. **Data processing** — combine rows from multiple files, normalize headers, infer columns, and create preview tables.
4. **Data cleaning** — trim blank cells, remove duplicate rows, count missing values, and score data completeness.
5. **Data analysis** — generate numeric summaries, top category values, quality warnings, and recommendations based on the analysis requirement you describe.

## Current repo-runnable version

```bash
npm start
```

Then open `http://localhost:5000`.

The checked-in static page runs without rebuilding the React client and without MongoDB. It supports:

- Multiple file selection.
- Browser-side `.csv` / `.tsv` parsing.
- Browser-side `.xlsx` parsing for standard worksheet values in modern Chromium-based browsers.
- Local dataset storage with `localStorage`.
- Data processing and deduplication.
- Stored dataset recall: uploaded files are saved locally and can be called into or hidden from the current analysis.
- Useless-data deletion: remove individual stored files, remove useless columns, or run auto-clean to delete empty/high-missing columns and duplicate/blank rows.
- Clean-data export as CSV after the active datasets have been processed.
- Missing-cell counts and quality score.
- Numeric summaries: sum, average, min, max.
- Text/category summaries: top values and unique counts.
- An “Analysis requirement” text box that drives targeted recommendations from keywords such as revenue, region, top values, missing data, cleaning, and duplicates.

## Preview artifact

```bash
npm run preview:screenshot
```

This generates `docs/preview.svg`, a repo-local visual preview of the static dashboard that does not require Chromium, Playwright, or other browser dependencies.

## Does this need an agent?

Not for the first integrated workflow. The current repo version can collect files, store datasets, call selected datasets into analysis, delete useless data, process/clean rows, and generate rule-based summaries without an AI agent.

An agent becomes useful in the final step when you want natural-language requirements to control the analysis, for example: “compare sales by region, remove irrelevant columns, explain anomalies, and produce an executive report.” In that phase, the agent should read the cleaned dataset schema, choose the right metrics/dimensions, build charts/tables, and write the final answer.

## Future phases

Recommended next steps after this page:

- Store uploaded files and parsed rows on the server instead of only in browser storage.
- Add database-backed dataset history and user accounts for team usage.
- Add configurable cleaning rules, such as required columns, date formats, duplicate keys, and value mappings.
- Add custom analysis templates based on your instructions, such as sales analysis, finance reconciliation, marketing funnel analysis, inventory analysis, or operations KPIs.
- Add downloadable report exports as Excel, PDF, or dashboard snapshots.

## API / MongoDB mode

The older authenticated API is still present in the repo. For database-backed work, set `MONGO_URL`, `JWT_SECRET`, and `JWT_LIFETIME` before starting the server. The current Excel analytics demo intentionally runs without those settings so it can be opened directly from this repository.
