# Jobify

## SEEK job importer

Jobify can import public SEEK search results into the authenticated user's job list.
Imported jobs are saved as `pending` applications with `source: "seek"` so they can be
managed the same way as manually created jobs.

### API usage

Send an authenticated request to:

```http
POST /api/v1/jobs/import/seek
```

Request body:

```json
{
  "keywords": "software engineer",
  "where": "Sydney NSW",
  "country": "au",
  "provider": "auto",
  "pages": 1,
  "limit": 20
}
```

Options:

- `keywords` — SEEK keyword search text.
- `where` — SEEK location search text.
- `country` — `au` for seek.com.au or `nz` for seek.co.nz. Defaults to `au`.
- `provider` — `auto`, `direct`, or `serpapi`. Defaults to `auto`; it tries direct SEEK HTML parsing first and falls back to SerpApi if `SERPAPI_KEY` is configured.
- `pages` — number of search-result pages to fetch. Maximum is 5.
- `limit` — maximum jobs to import. Maximum is 100.

The response includes imported jobs, duplicate count, fetched job count, and fetched SEEK URLs.
Existing SEEK jobs are de-duplicated by user, source, and SEEK external ID.

### CLI usage

You can also print SEEK results as JSON without saving them to MongoDB:

```bash
npm run crawl:seek -- --keywords="software engineer" --where="Sydney NSW" --country=au --provider=auto --pages=1 --limit=20
```

### If direct SEEK fetching is blocked

Do not try to bypass SEEK anti-bot controls with stealth browsers, rotating proxies, CAPTCHA evasion,
or other techniques intended to defeat access controls. Those approaches are brittle and may violate
site terms. Use one of these safer alternatives instead:

1. **SerpApi / Google Jobs fallback (implemented)** — configure `SERPAPI_KEY` and use
   `provider=serpapi` or leave `provider=auto` so Jobify tries direct SEEK parsing first and then
   falls back to SerpApi if direct fetching fails.
2. **Official or partner data access** — if the deployment is commercial or high-volume, request
   permission or API/data-feed access from SEEK or an approved data provider. This is the most
   reliable option when you need guaranteed coverage.
3. **User-supplied imports** — let users paste job details, paste SEEK URLs, or upload data they
   already have access to from alerts/spreadsheets. This avoids server-side crawling entirely and
   keeps the existing Jobify create-job flow as the source of truth.
4. **Search-provider APIs** — use APIs that are designed for automated access, then filter results
   to SEEK links before importing. SerpApi is the provider currently wired into this codebase.

```bash
export SERPAPI_KEY="your-serpapi-key"
npm run crawl:seek -- --keywords="software engineer" --where="Sydney NSW" --provider=serpapi
```

The SerpApi fallback uses the Google Jobs API and only imports results that appear to be SEEK postings
(for example, `via` says SEEK or an apply/related link points to seek.com.au or seek.co.nz).

#### What is `SERPAPI_KEY`?

`SERPAPI_KEY` is the private API key for your SerpApi account. Jobify reads it from the server
environment when `provider=serpapi` or when `provider=auto` needs to fall back after direct SEEK
fetching fails. Keep this key on the server only; do not commit it to git or expose it in React client
code.

Local development example:

```bash
# .env
SERPAPI_KEY=your-serpapi-key
```

One-off CLI example:

```bash
SERPAPI_KEY=your-serpapi-key npm run crawl:seek -- --keywords="software engineer" --where="Sydney NSW" --provider=serpapi
```

Please use conservative `pages` and `limit` values and make sure your usage complies with SEEK's,
SerpApi's, and Google Jobs' current terms and robots guidance.
