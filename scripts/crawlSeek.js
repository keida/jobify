import { scrapeSeekJobs } from '../services/seekScraper.js';

const getArg = (name, fallback = '') => {
  const prefix = `--${name}=`;
  const arg = process.argv.find(item => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : fallback;
};

const main = async () => {
  const keywords = getArg('keywords', process.env.SEEK_KEYWORDS || '');
  const where = getArg('where', process.env.SEEK_WHERE || '');
  const pages = Number(getArg('pages', process.env.SEEK_PAGES || '1'));
  const limit = Number(getArg('limit', process.env.SEEK_LIMIT || '20'));
  const country = getArg('country', process.env.SEEK_COUNTRY || 'au');
  const provider = getArg('provider', process.env.SEEK_PROVIDER || 'auto');

  const result = await scrapeSeekJobs({ keywords, where, pages, limit, country, provider });
  console.log(JSON.stringify(result, null, 2));
};

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
