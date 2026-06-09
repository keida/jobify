const STORAGE_KEY = 'insightReportsDemo';

const seedReports = [
  {
    id: 'report-1',
    title: 'Weekly revenue dashboard',
    source: 'CRM + billing warehouse',
    audience: 'Executive team',
    category: 'sales',
    status: 'published',
  },
  {
    id: 'report-2',
    title: 'Campaign performance summary',
    source: 'Ads platform',
    audience: 'Marketing',
    category: 'marketing',
    status: 'review',
  },
  {
    id: 'report-3',
    title: 'Monthly cashflow report',
    source: 'Finance system',
    audience: 'Finance',
    category: 'finance',
    status: 'draft',
  },
];

let reports = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || seedReports;

const form = document.querySelector('#reportForm');
const formTitle = document.querySelector('#formTitle');
const resetButton = document.querySelector('#resetForm');
const searchInput = document.querySelector('#search');
const reportsList = document.querySelector('#reportsList');
const fields = {
  id: document.querySelector('#reportId'),
  title: document.querySelector('#title'),
  source: document.querySelector('#source'),
  audience: document.querySelector('#audience'),
  category: document.querySelector('#category'),
  status: document.querySelector('#status'),
};

const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
const normalize = value => value.trim().toLowerCase();
const escapeHtml = value =>
  value.replace(/[&<>"']/g, character => {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[character];
  });

const updateStats = () => {
  const counts = reports.reduce(
    (acc, report) => {
      acc[report.status] = (acc[report.status] || 0) + 1;
      acc.total += 1;
      return acc;
    },
    { draft: 0, review: 0, published: 0, total: 0 }
  );

  document.querySelector('#draftCount').textContent = counts.draft;
  document.querySelector('#reviewCount').textContent = counts.review;
  document.querySelector('#publishedCount').textContent = counts.published;
  document.querySelector('#totalCount').textContent = counts.total;
};

const resetForm = () => {
  form.reset();
  fields.id.value = '';
  fields.category.value = 'sales';
  fields.status.value = 'draft';
  formTitle.textContent = 'Create report';
};

const renderReports = () => {
  const term = normalize(searchInput.value || '');
  const visibleReports = reports.filter(report => {
    return [report.title, report.source, report.audience, report.category, report.status]
      .map(normalize)
      .some(value => value.includes(term));
  });

  if (!visibleReports.length) {
    reportsList.innerHTML = '<p class="empty">No reports match your search yet.</p>';
    updateStats();
    return;
  }

  reportsList.innerHTML = visibleReports
    .map(
      report => `
        <article class="report-card">
          <div class="report-top">
            <div>
              <h3>${escapeHtml(report.title)}</h3>
              <p>${escapeHtml(report.source)} · ${escapeHtml(report.audience)}</p>
            </div>
            <span class="badge ${report.status}">${escapeHtml(report.status)}</span>
          </div>
          <div class="badges">
            <span class="badge">${escapeHtml(report.category)}</span>
            <span class="badge">${escapeHtml(report.audience)}</span>
          </div>
          <div class="card-actions">
            <button class="edit" type="button" data-action="edit" data-id="${report.id}">Edit</button>
            <button class="delete" type="button" data-action="delete" data-id="${report.id}">Delete</button>
          </div>
        </article>
      `
    )
    .join('');

  updateStats();
};

form.addEventListener('submit', event => {
  event.preventDefault();
  const report = {
    id: fields.id.value || `report-${Date.now()}`,
    title: fields.title.value.trim(),
    source: fields.source.value.trim(),
    audience: fields.audience.value.trim(),
    category: fields.category.value,
    status: fields.status.value,
  };

  reports = fields.id.value
    ? reports.map(item => (item.id === report.id ? report : item))
    : [report, ...reports];
  save();
  resetForm();
  renderReports();
});

reportsList.addEventListener('click', event => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const report = reports.find(item => item.id === button.dataset.id);
  if (!report) return;

  if (button.dataset.action === 'delete') {
    reports = reports.filter(item => item.id !== report.id);
    save();
    renderReports();
    return;
  }

  fields.id.value = report.id;
  fields.title.value = report.title;
  fields.source.value = report.source;
  fields.audience.value = report.audience;
  fields.category.value = report.category;
  fields.status.value = report.status;
  formTitle.textContent = 'Edit report';
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

resetButton.addEventListener('click', resetForm);
searchInput.addEventListener('input', renderReports);

save();
renderReports();
