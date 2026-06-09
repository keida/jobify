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

Do not try to bypass SEEK anti-bot controls with stealth browsers, rotating proxies, or CAPTCHA evasion.
Instead, configure a compliant fallback provider:

```bash
export SERPAPI_KEY="your-serpapi-key"
npm run crawl:seek -- --keywords="software engineer" --where="Sydney NSW" --provider=serpapi
```

The SerpApi fallback uses the Google Jobs API and only imports results that appear to be SEEK postings
(for example, `via` says SEEK or an apply/related link points to seek.com.au or seek.co.nz).

Please use conservative `pages` and `limit` values and make sure your usage complies with SEEK's,
SerpApi's, and Google Jobs' current terms and robots guidance.
