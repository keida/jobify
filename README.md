# Insight Reports Dashboard

A full-stack MERN dashboard for creating and tracking the data reports your team needs. The app keeps the existing authentication flow and turns the original job-tracking workflow into a report management workspace.

## What you can track

Each report record includes:

- **Report title** — the report or dashboard name.
- **Data source** — where the report data comes from, such as CRM, finance system, ads platform, or warehouse table.
- **Audience** — who the report is for, such as executive team, sales, marketing, finance, or operations.
- **Report category** — sales, marketing, finance, or operations.
- **Report status** — draft, review, or published.

## Dashboard features

- Secure login and registration.
- Create, edit, delete, search, filter, sort, and paginate report records.
- Dashboard cards for draft, review, and published report counts.
- Monthly report trend chart with bar/area chart toggle.

## Development

```bash
npm start
```

Then open `http://localhost:5000`. The checked-in static dashboard runs without rebuilding the React client and stores demo reports in browser localStorage.

For authenticated API and MongoDB-backed report data, set `MONGO_URL`, `JWT_SECRET`, and `JWT_LIFETIME` before starting the server. To work on the original React client source, install client dependencies and run `npm run dev`.
