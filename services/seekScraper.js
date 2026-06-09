import https from 'https';
import { URL } from 'url';

const SEEK_HOSTS = {
  au: 'www.seek.com.au',
  nz: 'www.seek.co.nz',
};

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (compatible; JobifySeekImporter/1.0; +https://github.com/jobify)';

const HTML_ENTITY_MAP = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

const normalizeText = value => {
  if (value === undefined || value === null) return '';
  return decodeHtmlEntities(String(value))
    .replace(/\s+/g, ' ')
    .trim();
};

const decodeHtmlEntities = value => {
  return String(value).replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity) => {
    if (entity[0] === '#') {
      const isHex = entity[1]?.toLowerCase() === 'x';
      const codePoint = parseInt(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }
    return HTML_ENTITY_MAP[entity] || match;
  });
};

const truncate = (value, maxLength) => {
  const text = normalizeText(value);
  return text.length > maxLength ? text.slice(0, maxLength).trim() : text;
};

const mapSeekEmploymentType = value => {
  const employmentType = Array.isArray(value) ? value.join(' ') : normalizeText(value);
  const lowerType = employmentType.toLowerCase();

  if (lowerType.includes('part')) return 'part-time';
  if (lowerType.includes('intern') || lowerType.includes('graduate')) return 'internship';
  if (lowerType.includes('remote') || lowerType.includes('work from home')) return 'remote';
  return 'full-time';
};

const getCompanyName = hiringOrganization => {
  if (!hiringOrganization) return '';
  if (typeof hiringOrganization === 'string') return hiringOrganization;
  return hiringOrganization.name || hiringOrganization.legalName || '';
};

const getLocationText = location => {
  const locations = Array.isArray(location) ? location : [location];
  return locations
    .map(item => {
      if (!item) return '';
      if (typeof item === 'string') return item;
      const address = item.address || item;
      return [address.addressLocality, address.addressRegion, address.addressCountry?.name || address.addressCountry]
        .filter(Boolean)
        .join(', ');
    })
    .filter(Boolean)
    .join(' / ');
};

const getSalaryText = value => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  const amount = value.value || value;
  if (typeof amount === 'string') return amount;
  if (!amount) return '';
  const min = amount.minValue || amount.value || '';
  const max = amount.maxValue || '';
  const unit = amount.unitText || value.unitText || '';
  const currency = value.currency || amount.currency || '';
  return normalizeText([currency, [min, max].filter(Boolean).join(' - '), unit].filter(Boolean).join(' '));
};

const toAbsoluteSeekUrl = (rawUrl, country = 'au') => {
  if (!rawUrl) return '';
  try {
    return new URL(rawUrl, `https://${SEEK_HOSTS[country] || SEEK_HOSTS.au}`).toString();
  } catch (error) {
    return '';
  }
};

const normalizeSeekJob = (job, country = 'au') => {
  const externalId = normalizeText(
    job.identifier?.value || job.identifier || job.id || job.jobId || job.listingId || job.advertisementId
  );
  const sourceUrl = toAbsoluteSeekUrl(job.url || job.jobUrl || job.jobLink || job.href, country);
  const company =
    getCompanyName(job.hiringOrganization) ||
    job.companyName ||
    job.advertiserName ||
    job.advertiser?.description ||
    job.advertiser?.name ||
    'Unknown company';

  return {
    externalId: externalId || sourceUrl,
    position: truncate(job.title || job.position || job.jobTitle || job.roleTitle, 100),
    company: truncate(company, 50),
    jobLocation: truncate(getLocationText(job.jobLocation || job.location) || job.locationLabel || job.suburb || 'Unknown location', 100),
    jobType: mapSeekEmploymentType(job.employmentType || job.workType || job.jobType),
    source: 'seek',
    sourceUrl,
    salary: truncate(getSalaryText(job.baseSalary || job.salary) || job.salaryLabel || job.salary, 120),
    listedAt: job.datePosted || job.created || job.listingDate || null,
  };
};

const isUsableJob = job => Boolean(job.position && job.company && job.jobLocation);

const extractJsonLdJobs = (html, country) => {
  const jobs = [];
  const scriptRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(decodeHtmlEntities(match[1].trim()));
      const nodes = Array.isArray(parsed) ? parsed : [parsed];
      for (const node of nodes) {
        const graph = node?.['@graph'] ? node['@graph'] : [node];
        for (const item of graph) {
          if (item?.['@type'] === 'JobPosting') {
            const normalized = normalizeSeekJob(item, country);
            if (isUsableJob(normalized)) jobs.push(normalized);
          }
        }
      }
    } catch (error) {
      // Ignore unrelated or malformed JSON-LD blocks.
    }
  }

  return jobs;
};

const looksLikeSeekJobCard = value => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const title = value.title || value.jobTitle || value.position || value.roleTitle;
  const company = value.companyName || value.advertiserName || value.advertiser?.description || value.advertiser?.name;
  const location = value.jobLocation || value.location || value.locationLabel || value.suburb;
  return Boolean(title && company && location);
};

const collectJobCards = (node, country, jobs, seenObjects = new WeakSet()) => {
  if (!node || typeof node !== 'object') return;
  if (seenObjects.has(node)) return;
  seenObjects.add(node);

  if (looksLikeSeekJobCard(node)) {
    const normalized = normalizeSeekJob(node, country);
    if (isUsableJob(normalized)) jobs.push(normalized);
  }

  if (Array.isArray(node)) {
    for (const item of node) collectJobCards(item, country, jobs, seenObjects);
    return;
  }

  for (const value of Object.values(node)) {
    collectJobCards(value, country, jobs, seenObjects);
  }
};

const extractNextDataJobs = (html, country) => {
  const match = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!match) return [];

  try {
    const parsed = JSON.parse(decodeHtmlEntities(match[1].trim()));
    const jobs = [];
    collectJobCards(parsed, country, jobs);
    return jobs;
  } catch (error) {
    return [];
  }
};

const dedupeJobs = jobs => {
  const seen = new Set();
  return jobs.filter(job => {
    const key = job.externalId || `${job.position}|${job.company}|${job.jobLocation}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const fetchHtml = (url, redirects = 0) => {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        headers: {
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'User-Agent': process.env.SEEK_USER_AGENT || DEFAULT_USER_AGENT,
        },
      },
      response => {
        if ([301, 302, 303, 307, 308].includes(response.statusCode) && response.headers.location) {
          response.resume();
          if (redirects >= 5) {
            reject(new Error('Too many redirects while fetching SEEK'));
            return;
          }
          resolve(fetchHtml(new URL(response.headers.location, url).toString(), redirects + 1));
          return;
        }

        if (response.statusCode < 200 || response.statusCode >= 300) {
          response.resume();
          reject(new Error(`SEEK returned HTTP ${response.statusCode}`));
          return;
        }

        let html = '';
        response.setEncoding('utf8');
        response.on('data', chunk => {
          html += chunk;
          if (html.length > 5_000_000) request.destroy(new Error('SEEK response exceeded 5 MB'));
        });
        response.on('end', () => resolve(html));
      }
    );

    request.setTimeout(20000, () => request.destroy(new Error('Timed out while fetching SEEK')));
    request.on('error', reject);
  });
};

const fetchJson = url => {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': process.env.SEEK_USER_AGENT || DEFAULT_USER_AGENT,
        },
      },
      response => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          response.resume();
          reject(new Error(`Job search API returned HTTP ${response.statusCode}`));
          return;
        }

        let body = '';
        response.setEncoding('utf8');
        response.on('data', chunk => {
          body += chunk;
          if (body.length > 5_000_000) request.destroy(new Error('Job search API response exceeded 5 MB'));
        });
        response.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (error) {
            reject(new Error('Job search API returned invalid JSON'));
          }
        });
      }
    );

    request.setTimeout(20000, () => request.destroy(new Error('Timed out while fetching job search API')));
    request.on('error', reject);
  });
};

const buildSeekSearchUrl = ({ keywords = '', where = '', page = 1, country = 'au' } = {}) => {
  const host = SEEK_HOSTS[country] || SEEK_HOSTS.au;
  const url = new URL(`https://${host}/jobs`);
  if (keywords) url.searchParams.set('keywords', keywords);
  if (where) url.searchParams.set('where', where);
  if (Number(page) > 1) url.searchParams.set('page', Number(page));
  return url.toString();
};

const parseSeekJobsFromHtml = (html, { country = 'au', limit } = {}) => {
  const jobs = dedupeJobs([...extractJsonLdJobs(html, country), ...extractNextDataJobs(html, country)]);
  return Number(limit) > 0 ? jobs.slice(0, Number(limit)) : jobs;
};

const scrapeDirectSeekJobs = async ({ keywords = '', where = '', pages = 1, limit = 20, country = 'au' } = {}) => {
  const pageCount = Math.min(Math.max(Number(pages) || 1, 1), 5);
  const perRunLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const jobs = [];
  const fetchedUrls = [];

  for (let page = 1; page <= pageCount && jobs.length < perRunLimit; page += 1) {
    const url = buildSeekSearchUrl({ keywords, where, page, country });
    fetchedUrls.push(url);
    const html = await fetchHtml(url);
    jobs.push(...parseSeekJobsFromHtml(html, { country, limit: perRunLimit - jobs.length }));
  }

  return { jobs: dedupeJobs(jobs).slice(0, perRunLimit), fetchedUrls, provider: 'direct' };
};

const getSerpApiSeekUrl = job => {
  const links = [job.share_link, job.link, ...(job.related_links || []).map(link => link.link), ...(job.apply_options || []).map(option => option.link)]
    .filter(Boolean);
  return links.find(link => /seek\.co(m\.au|\.nz)/i.test(link)) || '';
};

const isSeekSerpApiJob = job => {
  return /seek/i.test(job.via || '') || Boolean(getSerpApiSeekUrl(job));
};

const normalizeSerpApiSeekJob = (job, country = 'au') => {
  const sourceUrl = getSerpApiSeekUrl(job);
  const detectedExtensions = job.detected_extensions || {};
  const jobHighlights = Array.isArray(job.job_highlights) ? job.job_highlights : [];
  const salaryHighlight = jobHighlights
    .flatMap(highlight => highlight.items || [])
    .find(item => /\$|salary|compensation|remuneration/i.test(item));

  return {
    externalId: normalizeText(job.job_id || sourceUrl),
    position: truncate(job.title, 100),
    company: truncate(job.company_name || 'Unknown company', 50),
    jobLocation: truncate(job.location || 'Unknown location', 100),
    jobType: mapSeekEmploymentType(detectedExtensions.schedule_type || job.extensions || job.description),
    source: 'seek',
    sourceUrl: toAbsoluteSeekUrl(sourceUrl, country),
    salary: truncate(detectedExtensions.salary || salaryHighlight, 120),
    listedAt: null,
  };
};

const buildSerpApiSearchUrl = ({ keywords = '', where = '', page = 1, country = 'au', apiKey } = {}) => {
  const url = new URL('https://serpapi.com/search.json');
  url.searchParams.set('engine', 'google_jobs');
  url.searchParams.set('q', [keywords, 'SEEK'].filter(Boolean).join(' '));
  if (where) url.searchParams.set('location', where);
  url.searchParams.set('gl', country === 'nz' ? 'nz' : 'au');
  url.searchParams.set('api_key', apiKey);
  if (Number(page) > 1) url.searchParams.set('start', String((Number(page) - 1) * 10));
  return url.toString();
};

const searchSerpApiSeekJobs = async ({ keywords = '', where = '', pages = 1, limit = 20, country = 'au' } = {}) => {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    throw new Error('SERPAPI_KEY is required when using the serpapi SEEK import provider');
  }

  const pageCount = Math.min(Math.max(Number(pages) || 1, 1), 5);
  const perRunLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const jobs = [];
  const fetchedUrls = [];

  for (let page = 1; page <= pageCount && jobs.length < perRunLimit; page += 1) {
    const url = buildSerpApiSearchUrl({ keywords, where, page, country, apiKey });
    fetchedUrls.push(url.replace(apiKey, '[redacted]'));
    const data = await fetchJson(url);
    const pageJobs = (data.jobs_results || [])
      .filter(isSeekSerpApiJob)
      .map(job => normalizeSerpApiSeekJob(job, country))
      .filter(isUsableJob);
    jobs.push(...pageJobs);
  }

  return { jobs: dedupeJobs(jobs).slice(0, perRunLimit), fetchedUrls, provider: 'serpapi' };
};

const scrapeSeekJobs = async ({ keywords = '', where = '', pages = 1, limit = 20, country = 'au', provider = 'auto' } = {}) => {
  if (provider === 'direct') {
    return scrapeDirectSeekJobs({ keywords, where, pages, limit, country });
  }

  if (provider === 'serpapi') {
    return searchSerpApiSeekJobs({ keywords, where, pages, limit, country });
  }

  try {
    const result = await scrapeDirectSeekJobs({ keywords, where, pages, limit, country });
    return { ...result, provider: 'direct' };
  } catch (error) {
    if (!process.env.SERPAPI_KEY) {
      throw new Error(
        `${error.message}. Direct SEEK fetch failed and no SERPAPI_KEY is configured for the compliant fallback provider.`
      );
    }

    const fallbackResult = await searchSerpApiSeekJobs({ keywords, where, pages, limit, country });
    return { ...fallbackResult, directError: error.message };
  }
};

export {
  buildSeekSearchUrl,
  buildSerpApiSearchUrl,
  parseSeekJobsFromHtml,
  scrapeDirectSeekJobs,
  scrapeSeekJobs,
  searchSerpApiSeekJobs,
};
