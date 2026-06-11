import { mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';

const outputPath = resolve('docs/preview.svg');

const columns = [
  ['Revenue', 'numeric', 'Sum 526,500 · Avg 105,300 · Missing 1', '#dbeafe', '#1d4ed8'],
  ['Region', 'text', 'Top values: NSW (3), VIC (2), QLD (1)', '#fef3c7', '#a16207'],
  ['Product', 'text', 'Top values: Software (3), Service (2)', '#fef3c7', '#a16207'],
];

const escapeXml = value =>
  value.replace(/[&<>"']/g, character => {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&apos;',
    }[character];
  });

const columnRows = columns
  .map((column, index) => {
    const [title, type, summary, fill, color] = column;
    const y = 566 + index * 70;
    return `
      <g filter="url(#softShadow)">
        <rect x="482" y="${y}" width="608" height="54" rx="16" fill="#ffffff" stroke="#e2e8f0" />
        <text x="506" y="${y + 24}" class="card-title">${escapeXml(title)}</text>
        <text x="506" y="${y + 44}" class="muted">${escapeXml(summary)}</text>
        <rect x="984" y="${y + 13}" width="82" height="28" rx="14" fill="${fill}" />
        <text x="1025" y="${y + 32}" text-anchor="middle" class="badge" fill="${color}">${escapeXml(type)}</text>
      </g>`;
  })
  .join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="820" viewBox="0 0 1200 820" role="img" aria-labelledby="title desc">
  <title id="title">Excel Analytics Studio preview</title>
  <desc id="desc">Static preview of the runnable Excel analytics dashboard served from this repository.</desc>
  <defs>
    <linearGradient id="pageBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ccfbf1" />
      <stop offset="0.45" stop-color="#f8fafc" />
      <stop offset="1" stop-color="#eef2ff" />
    </linearGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#0f172a" flood-opacity="0.13" />
    </filter>
    <style>
      .eyebrow { font: 800 13px Inter, Arial, sans-serif; letter-spacing: 2.2px; fill: #0f766e; text-transform: uppercase; }
      .hero-title { font: 900 58px Inter, Arial, sans-serif; fill: #0f172a; }
      .hero-copy { font: 500 20px Inter, Arial, sans-serif; fill: #334155; }
      .section-title { font: 900 26px Inter, Arial, sans-serif; fill: #0f172a; }
      .card-title { font: 800 17px Inter, Arial, sans-serif; fill: #0f172a; }
      .muted { font: 500 14px Inter, Arial, sans-serif; fill: #64748b; }
      .stat-label { font: 800 13px Inter, Arial, sans-serif; letter-spacing: 1.3px; fill: #64748b; }
      .stat-value { font: 900 40px Inter, Arial, sans-serif; fill: #0f172a; }
      .badge { font: 800 12px Inter, Arial, sans-serif; }
      .field { font: 700 15px Inter, Arial, sans-serif; fill: #334155; }
      .step { font: 900 16px Inter, Arial, sans-serif; fill: #134e4a; }
    </style>
  </defs>
  <rect width="1200" height="820" fill="url(#pageBg)" />

  <g filter="url(#softShadow)">
    <rect x="70" y="48" width="1060" height="202" rx="28" fill="#ffffff" fill-opacity="0.94" stroke="#e2e8f0" />
    <text x="112" y="100" class="eyebrow">Step-by-step data analysis workflow</text>
    <text x="112" y="166" class="hero-title">Excel Analytics Studio</text>
    <text x="112" y="210" class="hero-copy">Upload multiple Excel/CSV files, clean rows, and generate summaries</text>
    <text x="112" y="238" class="hero-copy">based on the analysis requirement you describe.</text>
    <rect x="874" y="116" width="126" height="46" rx="23" fill="#0f172a" />
    <text x="937" y="145" text-anchor="middle" font-family="Inter, Arial" font-size="15" font-weight="800" fill="#ffffff">Upload files</text>
    <rect x="1012" y="116" width="108" height="46" rx="23" fill="#0f766e" />
    <text x="1066" y="145" text-anchor="middle" font-family="Inter, Arial" font-size="15" font-weight="800" fill="#ffffff">Analyze</text>
  </g>

  ${['数据收集', '数据存储', '数据处理', '数据清洗', '数据分析']
    .map((label, index) => {
      const x = 70 + index * 214;
      return `<g filter="url(#softShadow)"><rect x="${x}" y="278" width="194" height="92" rx="20" fill="#ffffff" stroke="#e2e8f0" /><circle cx="${x + 34}" cy="310" r="17" fill="#ccfbf1" /><text x="${x + 34}" y="316" text-anchor="middle" class="badge" fill="#134e4a">0${index + 1}</text><text x="${x + 22}" y="348" class="step">${label}</text></g>`;
    })
    .join('')}

  ${[
    ['FILES', '3', '#0f766e'],
    ['ROWS', '1,248', '#4f46e5'],
    ['COLUMNS', '18', '#d97706'],
    ['QUALITY', '94%', '#059669'],
  ]
    .map((stat, index) => {
      const x = 70 + index * 272;
      return `<g filter="url(#softShadow)"><rect x="${x}" y="400" width="245" height="116" rx="22" fill="#ffffff" stroke="#e2e8f0" /><rect x="${x}" y="400" width="245" height="7" rx="3" fill="${stat[2]}" /><text x="${x + 24}" y="442" class="stat-label">${stat[0]}</text><text x="${x + 24}" y="486" class="stat-value">${stat[1]}</text></g>`;
    })
    .join('')}

  <g filter="url(#softShadow)">
    <rect x="70" y="548" width="370" height="204" rx="24" fill="#ffffff" stroke="#e2e8f0" />
    <text x="100" y="594" class="eyebrow">Data collection</text>
    <text x="100" y="632" class="section-title">Upload files</text>
    <rect x="100" y="656" width="300" height="58" rx="16" fill="#f0fdfa" stroke="#99f6e4" stroke-dasharray="8 6" />
    <text x="250" y="691" text-anchor="middle" class="field">Drop .xlsx / .csv files here</text>
  </g>

  <g filter="url(#softShadow)">
    <rect x="460" y="548" width="670" height="204" rx="24" fill="#ffffff" stroke="#e2e8f0" />
    <text x="492" y="594" class="eyebrow">Data analysis</text>
    <text x="492" y="632" class="section-title">Generated dashboard</text>
    <rect x="810" y="576" width="280" height="42" rx="12" fill="#f8fafc" stroke="#e2e8f0" />
    <text x="830" y="603" class="muted">Search columns, values...</text>
  </g>
  ${columnRows}
</svg>
`;

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, svg);
console.log(`Generated ${outputPath}`);
