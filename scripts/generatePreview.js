import { mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';

const outputPath = resolve('docs/preview.svg');

const reports = [
  ['Weekly revenue dashboard', 'CRM + billing warehouse · Executive team', 'published', '#dcfce7', '#15803d'],
  ['Campaign performance summary', 'Ads platform · Marketing', 'review', '#e0e7ff', '#4338ca'],
  ['Monthly cashflow report', 'Finance system · Finance', 'draft', '#fef3c7', '#a16207'],
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

const reportRows = reports
  .map((report, index) => {
    const [title, subtitle, status, fill, color] = report;
    const y = 492 + index * 92;
    return `
      <g filter="url(#softShadow)">
        <rect x="482" y="${y}" width="608" height="74" rx="18" fill="#ffffff" stroke="#e2e8f0" />
        <text x="506" y="${y + 30}" class="card-title">${escapeXml(title)}</text>
        <text x="506" y="${y + 54}" class="muted">${escapeXml(subtitle)}</text>
        <rect x="970" y="${y + 22}" width="88" height="30" rx="15" fill="${fill}" />
        <text x="1014" y="${y + 42}" text-anchor="middle" class="badge" fill="${color}">${escapeXml(status)}</text>
      </g>`;
  })
  .join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="820" viewBox="0 0 1200 820" role="img" aria-labelledby="title desc">
  <title id="title">Insight Reports Dashboard preview</title>
  <desc id="desc">Static preview of the runnable reports dashboard served from this repository.</desc>
  <defs>
    <linearGradient id="pageBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#e0f2fe" />
      <stop offset="0.45" stop-color="#f8fafc" />
      <stop offset="1" stop-color="#eef2ff" />
    </linearGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#0f172a" flood-opacity="0.13" />
    </filter>
    <style>
      .eyebrow { font: 800 13px Inter, Arial, sans-serif; letter-spacing: 2.2px; fill: #2563eb; text-transform: uppercase; }
      .hero-title { font: 900 58px Inter, Arial, sans-serif; fill: #0f172a; }
      .hero-copy { font: 500 20px Inter, Arial, sans-serif; fill: #334155; }
      .section-title { font: 900 26px Inter, Arial, sans-serif; fill: #0f172a; }
      .card-title { font: 800 19px Inter, Arial, sans-serif; fill: #0f172a; }
      .muted { font: 500 15px Inter, Arial, sans-serif; fill: #64748b; }
      .stat-label { font: 800 13px Inter, Arial, sans-serif; letter-spacing: 1.3px; fill: #64748b; }
      .stat-value { font: 900 40px Inter, Arial, sans-serif; fill: #0f172a; }
      .badge { font: 800 13px Inter, Arial, sans-serif; }
      .field { font: 700 15px Inter, Arial, sans-serif; fill: #334155; }
    </style>
  </defs>
  <rect width="1200" height="820" fill="url(#pageBg)" />

  <g filter="url(#softShadow)">
    <rect x="70" y="48" width="1060" height="210" rx="28" fill="#ffffff" fill-opacity="0.94" stroke="#e2e8f0" />
    <text x="112" y="100" class="eyebrow">Repo runnable demo</text>
    <text x="112" y="166" class="hero-title">Insight Reports Dashboard</text>
    <text x="112" y="210" class="hero-copy">Create reports, move them through draft, review, and published stages,</text>
    <text x="112" y="238" class="hero-copy">and see the dashboard update instantly from Express.</text>
    <rect x="874" y="116" width="126" height="46" rx="23" fill="#0f172a" />
    <text x="937" y="145" text-anchor="middle" font-family="Inter, Arial" font-size="15" font-weight="800" fill="#ffffff">View reports</text>
    <rect x="1012" y="116" width="108" height="46" rx="23" fill="#2563eb" />
    <text x="1066" y="145" text-anchor="middle" font-family="Inter, Arial" font-size="15" font-weight="800" fill="#ffffff">Create</text>
  </g>

  <g filter="url(#softShadow)">
    <rect x="70" y="288" width="245" height="116" rx="22" fill="#ffffff" stroke="#e2e8f0" />
    <rect x="70" y="288" width="245" height="7" rx="3" fill="#eab308" />
    <text x="94" y="330" class="stat-label">DRAFT</text><text x="94" y="374" class="stat-value">1</text>
  </g>
  <g filter="url(#softShadow)">
    <rect x="342" y="288" width="245" height="116" rx="22" fill="#ffffff" stroke="#e2e8f0" />
    <rect x="342" y="288" width="245" height="7" rx="3" fill="#6366f1" />
    <text x="366" y="330" class="stat-label">IN REVIEW</text><text x="366" y="374" class="stat-value">1</text>
  </g>
  <g filter="url(#softShadow)">
    <rect x="614" y="288" width="245" height="116" rx="22" fill="#ffffff" stroke="#e2e8f0" />
    <rect x="614" y="288" width="245" height="7" rx="3" fill="#22c55e" />
    <text x="638" y="330" class="stat-label">PUBLISHED</text><text x="638" y="374" class="stat-value">1</text>
  </g>
  <g filter="url(#softShadow)">
    <rect x="886" y="288" width="245" height="116" rx="22" fill="#ffffff" stroke="#e2e8f0" />
    <rect x="886" y="288" width="245" height="7" rx="3" fill="#0ea5e9" />
    <text x="910" y="330" class="stat-label">TOTAL</text><text x="910" y="374" class="stat-value">3</text>
  </g>

  <g filter="url(#softShadow)">
    <rect x="70" y="438" width="370" height="314" rx="24" fill="#ffffff" stroke="#e2e8f0" />
    <text x="100" y="484" class="eyebrow">Create / update</text>
    <text x="100" y="524" class="section-title">Create report</text>
    <text x="100" y="572" class="field">Report title</text>
    <rect x="100" y="588" width="300" height="42" rx="12" fill="#f8fafc" stroke="#e2e8f0" />
    <text x="118" y="615" class="muted">Weekly revenue dashboard</text>
    <text x="100" y="660" class="field">Data source</text>
    <rect x="100" y="676" width="300" height="42" rx="12" fill="#f8fafc" stroke="#e2e8f0" />
    <text x="118" y="703" class="muted">CRM, warehouse, ads platform...</text>
  </g>

  <g filter="url(#softShadow)">
    <rect x="460" y="438" width="670" height="314" rx="24" fill="#ffffff" stroke="#e2e8f0" />
    <text x="492" y="484" class="eyebrow">Report library</text>
    <text x="492" y="524" class="section-title">All reports</text>
    <rect x="810" y="468" width="280" height="42" rx="12" fill="#f8fafc" stroke="#e2e8f0" />
    <text x="830" y="495" class="muted">Search by title, source...</text>
  </g>
  ${reportRows}
</svg>
`;

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, svg);
console.log(`Generated ${outputPath}`);
