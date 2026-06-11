const STORAGE_KEY = 'excelAnalyticsStudio';

const sampleDatasets = [
  {
    id: 'sample-sales',
    name: 'sample-sales.csv',
    sheet: 'CSV',
    uploadedAt: new Date().toISOString(),
    headers: ['Month', 'Region', 'Product', 'Revenue', 'Cost', 'Units'],
    rows: [
      ['2026-01', 'NSW', 'Software', '128000', '52000', '64'],
      ['2026-01', 'VIC', 'Service', '86000', '33000', '41'],
      ['2026-02', 'NSW', 'Software', '141500', '59000', '70'],
      ['2026-02', 'QLD', 'Hardware', '73000', '48000', '33'],
      ['2026-03', 'VIC', 'Service', '98000', '36000', '46'],
      ['2026-03', 'NSW', 'Software', '', '61000', '72'],
    ],
  },
];

let datasets = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || [];

const uploadForm = document.querySelector('#uploadForm');
const fileInput = document.querySelector('#fileInput');
const promptInput = document.querySelector('#analysisPrompt');
const loadSampleButton = document.querySelector('#loadSample');
const clearDataButton = document.querySelector('#clearData');
const statusLog = document.querySelector('#statusLog');
const searchInput = document.querySelector('#search');
const analysisSummary = document.querySelector('#analysisSummary');
const datasetsList = document.querySelector('#datasetsList');
const columnsList = document.querySelector('#columnsList');

const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(datasets));
const normalize = value => String(value ?? '').trim().toLowerCase();
const isBlank = value => normalize(value) === '';
const escapeHtml = value =>
  String(value ?? '').replace(/[&<>"']/g, character => {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[character];
  });

const log = (message, type = 'ok') => {
  const item = document.createElement('div');
  item.className = type;
  item.textContent = message;
  statusLog.prepend(item);
};

const updateCounters = analysis => {
  document.querySelector('#fileCount').textContent = datasets.length;
  document.querySelector('#rowCount').textContent = analysis.cleanRows.length;
  document.querySelector('#columnCount').textContent = analysis.headers.length;
  document.querySelector('#qualityScore').textContent = `${analysis.qualityScore}%`;
};

const decodeXml = value =>
  String(value ?? '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");

const parseDelimited = (text, delimiter) => {
  const rows = [];
  let row = [];
  let cell = '';
  let insideQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && insideQuotes && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === delimiter && !insideQuotes) {
      row.push(cell);
      cell = '';
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(cell);
      if (row.some(value => !isBlank(value))) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some(value => !isBlank(value))) rows.push(row);
  return rows;
};

const rowsToDataset = ({ name, sheet, rows }) => {
  const [rawHeaders = [], ...body] = rows;
  const headers = rawHeaders.map((header, index) => {
    const cleaned = String(header || '').trim();
    return cleaned || `Column ${index + 1}`;
  });
  const width = headers.length;
  const cleanedRows = body
    .map(row => Array.from({ length: width }, (_, index) => String(row[index] ?? '').trim()))
    .filter(row => row.some(value => !isBlank(value)));

  return {
    id: `${name}-${sheet}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name,
    sheet,
    uploadedAt: new Date().toISOString(),
    headers,
    rows: cleanedRows,
  };
};

const parseCsvFile = async file => {
  const text = await file.text();
  const delimiter = file.name.toLowerCase().endsWith('.tsv') ? '\t' : ',';
  return [rowsToDataset({ name: file.name, sheet: delimiter === '\t' ? 'TSV' : 'CSV', rows: parseDelimited(text, delimiter) })];
};

const readUInt16 = (view, offset) => view.getUint16(offset, true);
const readUInt32 = (view, offset) => view.getUint32(offset, true);

const inflateRaw = async bytes => {
  if (!('DecompressionStream' in window)) {
    throw new Error('This browser cannot unzip XLSX files offline. Please export the sheet as CSV, or use a modern Chromium browser.');
  }
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
};

const unzipXlsxEntries = async arrayBuffer => {
  const bytes = new Uint8Array(arrayBuffer);
  const view = new DataView(arrayBuffer);
  const entries = new Map();

  for (let offset = bytes.length - 22; offset >= 0; offset -= 1) {
    if (readUInt32(view, offset) !== 0x06054b50) continue;
    const centralDirectoryOffset = readUInt32(view, offset + 16);
    const totalEntries = readUInt16(view, offset + 10);
    let pointer = centralDirectoryOffset;

    for (let index = 0; index < totalEntries; index += 1) {
      if (readUInt32(view, pointer) !== 0x02014b50) break;
      const method = readUInt16(view, pointer + 10);
      const compressedSize = readUInt32(view, pointer + 20);
      const fileNameLength = readUInt16(view, pointer + 28);
      const extraLength = readUInt16(view, pointer + 30);
      const commentLength = readUInt16(view, pointer + 32);
      const localHeaderOffset = readUInt32(view, pointer + 42);
      const name = new TextDecoder().decode(bytes.slice(pointer + 46, pointer + 46 + fileNameLength));
      const localNameLength = readUInt16(view, localHeaderOffset + 26);
      const localExtraLength = readUInt16(view, localHeaderOffset + 28);
      const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength;
      const compressed = bytes.slice(dataStart, dataStart + compressedSize);
      const data = method === 0 ? compressed : await inflateRaw(compressed);
      entries.set(name, new TextDecoder().decode(data));
      pointer += 46 + fileNameLength + extraLength + commentLength;
    }
    return entries;
  }

  throw new Error('The XLSX file is not a valid zip workbook.');
};

const getXmlEntry = (entries, name) => entries.get(name) || '';

const parseSharedStrings = entries => {
  const xml = getXmlEntry(entries, 'xl/sharedStrings.xml');
  const strings = [];
  for (const item of xml.matchAll(/<si[\s\S]*?<\/si>/g)) {
    const text = [...item[0].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(match => decodeXml(match[1])).join('');
    strings.push(text);
  }
  return strings;
};

const parseWorkbookSheets = entries => {
  const workbook = getXmlEntry(entries, 'xl/workbook.xml');
  const rels = getXmlEntry(entries, 'xl/_rels/workbook.xml.rels');
  const relTargets = {};

  for (const rel of rels.matchAll(/<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"[^>]*>/g)) {
    const target = rel[2].replace(/^\//, '');
    relTargets[rel[1]] = target.startsWith('xl/') ? target : `xl/${target}`;
  }

  return [...workbook.matchAll(/<sheet[^>]*name="([^"]+)"[^>]*r:id="([^"]+)"[^>]*>/g)].map((match, index) => ({
    name: decodeXml(match[1]),
    path: relTargets[match[2]] || `xl/worksheets/sheet${index + 1}.xml`,
  }));
};

const cellColumnIndex = reference => {
  const letters = String(reference || '').replace(/[^A-Z]/gi, '').toUpperCase();
  return letters.split('').reduce((sum, letter) => sum * 26 + letter.charCodeAt(0) - 64, 0) - 1;
};

const parseSheetRows = (xml, sharedStrings) => {
  const rows = [];
  for (const rowMatch of xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const row = [];
    for (const cellMatch of rowMatch[1].matchAll(/<c([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attrs = cellMatch[1];
      const body = cellMatch[2];
      const ref = (attrs.match(/r="([^"]+)"/) || [])[1];
      const type = (attrs.match(/t="([^"]+)"/) || [])[1];
      const colIndex = cellColumnIndex(ref);
      const inlineText = [...body.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(match => decodeXml(match[1])).join('');
      const rawValue = (body.match(/<v[^>]*>([\s\S]*?)<\/v>/) || [])[1];
      const value = type === 's' ? sharedStrings[Number(rawValue)] || '' : inlineText || decodeXml(rawValue || '');
      row[colIndex >= 0 ? colIndex : row.length] = value;
    }
    if (row.some(value => !isBlank(value))) rows.push(row.map(value => value ?? ''));
  }
  return rows;
};

const parseXlsxFile = async file => {
  const entries = await unzipXlsxEntries(await file.arrayBuffer());
  const sharedStrings = parseSharedStrings(entries);
  const sheets = parseWorkbookSheets(entries);
  const parsed = [];

  for (const sheet of sheets) {
    const rows = parseSheetRows(getXmlEntry(entries, sheet.path), sharedStrings);
    if (rows.length > 1) parsed.push(rowsToDataset({ name: file.name, sheet: sheet.name, rows }));
  }

  if (!parsed.length) throw new Error('No worksheet rows were found in this XLSX file.');
  return parsed;
};

const parseFile = file => {
  const name = file.name.toLowerCase();
  if (name.endsWith('.csv') || name.endsWith('.tsv') || name.endsWith('.txt')) return parseCsvFile(file);
  if (name.endsWith('.xlsx')) return parseXlsxFile(file);
  throw new Error('Unsupported file type. Use .xlsx, .csv, or .tsv.');
};

const buildAnalysis = () => {
  const headers = [...new Set(datasets.flatMap(dataset => dataset.headers))];
  const combinedRows = datasets.flatMap(dataset =>
    dataset.rows.map(row => {
      const record = { __file: dataset.name, __sheet: dataset.sheet };
      dataset.headers.forEach((header, index) => {
        record[header] = row[index] ?? '';
      });
      return record;
    })
  );

  const uniqueKeys = new Set();
  const cleanRows = [];
  let duplicateRows = 0;
  let missingCells = 0;

  combinedRows.forEach(record => {
    const key = headers.map(header => normalize(record[header])).join('|');
    if (uniqueKeys.has(key)) {
      duplicateRows += 1;
      return;
    }
    uniqueKeys.add(key);
    headers.forEach(header => {
      if (isBlank(record[header])) missingCells += 1;
    });
    cleanRows.push(record);
  });

  const totalCells = Math.max(cleanRows.length * headers.length, 1);
  const qualityScore = Math.max(0, Math.round(((totalCells - missingCells) / totalCells) * 100));
  const columns = headers.map(header => analyzeColumn(header, cleanRows));

  return { headers, cleanRows, duplicateRows, missingCells, qualityScore, columns };
};

const analyzeColumn = (header, rows) => {
  const values = rows.map(row => String(row[header] ?? '').trim()).filter(value => value !== '');
  const numericValues = values.map(value => Number(value.replace(/[$,%\s,]/g, ''))).filter(value => Number.isFinite(value));
  const numericRatio = values.length ? numericValues.length / values.length : 0;
  const type = numericRatio > 0.75 ? 'numeric' : values.every(value => /^\d{4}[-/]\d{1,2}([-/]\d{1,2})?$/.test(value)) ? 'date' : 'text';
  const frequency = values.reduce((acc, value) => {
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
  const topValues = Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([value, count]) => ({ value, count }));

  const numericSummary = numericValues.length
    ? {
        sum: numericValues.reduce((sum, value) => sum + value, 0),
        avg: numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length,
        min: Math.min(...numericValues),
        max: Math.max(...numericValues),
      }
    : null;

  return {
    header,
    type,
    filled: values.length,
    missing: rows.length - values.length,
    unique: Object.keys(frequency).length,
    numericSummary,
    topValues,
  };
};

const formatNumber = value => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value || 0);

const buildPromptInsights = (analysis, prompt) => {
  const lowerPrompt = normalize(prompt);
  const insights = [];
  const numericColumns = analysis.columns.filter(column => column.type === 'numeric' && column.numericSummary);
  const textColumns = analysis.columns.filter(column => column.type === 'text' && column.topValues.length);
  const revenueColumn = numericColumns.find(column => /revenue|sales|amount|income|total/i.test(column.header));

  if (revenueColumn) {
    insights.push(`Revenue-like metric "${revenueColumn.header}" totals ${formatNumber(revenueColumn.numericSummary.sum)}.`);
  } else if (numericColumns[0]) {
    insights.push(`Primary metric "${numericColumns[0].header}" totals ${formatNumber(numericColumns[0].numericSummary.sum)}.`);
  }

  if (/region|area|state|city|location/.test(lowerPrompt)) {
    const regionColumn = textColumns.find(column => /region|area|state|city|location/i.test(column.header));
    if (regionColumn) insights.push(`Regional split is available in "${regionColumn.header}"; top value is ${regionColumn.topValues[0].value}.`);
  }

  if (/top|rank|best|highest/.test(lowerPrompt) && textColumns[0]) {
    insights.push(`Top category in "${textColumns[0].header}" is ${textColumns[0].topValues[0].value} (${textColumns[0].topValues[0].count} rows).`);
  }

  if (/missing|clean|quality|blank|duplicate/.test(lowerPrompt) || analysis.missingCells || analysis.duplicateRows) {
    insights.push(`Clean-up priority: ${formatNumber(analysis.missingCells)} missing cells and ${formatNumber(analysis.duplicateRows)} duplicate rows were detected.`);
  }

  if (!insights.length) {
    insights.push('Upload data and describe your business question to generate more targeted findings in the next phase.');
  }

  return insights.slice(0, 4);
};


const renderSummary = analysis => {
  const prompt = promptInput.value.trim();
  const numericColumns = analysis.columns.filter(column => column.type === 'numeric').length;
  const insights = buildPromptInsights(analysis, prompt);
  analysisSummary.innerHTML = `
    <article class="summary-card">
      <span class="eyebrow">Processing</span>
      <strong>${formatNumber(analysis.cleanRows.length)}</strong>
      <small>Rows after removing ${formatNumber(analysis.duplicateRows)} duplicate rows.</small>
    </article>
    <article class="summary-card">
      <span class="eyebrow">Cleaning</span>
      <strong>${formatNumber(analysis.missingCells)}</strong>
      <small>Missing cells found across ${formatNumber(analysis.headers.length)} columns.</small>
    </article>
    <article class="summary-card">
      <span class="eyebrow">Analysis request</span>
      <strong>${numericColumns} metrics</strong>
      <small>${escapeHtml(prompt || 'Add your business question on the left to guide the next analysis step.')}</small>
    </article>
    <article class="summary-card">
      <span class="eyebrow">Recommendations</span>
      <strong>${insights.length}</strong>
      <small>${insights.map(escapeHtml).join('<br>')}</small>
    </article>
  `;
};

const renderDatasets = analysis => {
  if (!datasets.length) {
    datasetsList.innerHTML = '<p class="empty">No files uploaded yet. Upload Excel/CSV files or load sample data.</p>';
    return;
  }

  datasetsList.innerHTML = datasets
    .map(dataset => {
      const previewRows = dataset.rows.slice(0, 3);
      const previewTable = previewRows.length
        ? `<table class="preview-table"><thead><tr>${dataset.headers
            .slice(0, 5)
            .map(header => `<th>${escapeHtml(header)}</th>`)
            .join('')}</tr></thead><tbody>${previewRows
            .map(row => `<tr>${row.slice(0, 5).map(cell => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
            .join('')}</tbody></table>`
        : '';
      return `
        <article class="dataset-card">
          <div class="dataset-top">
            <div>
              <h3>${escapeHtml(dataset.name)}</h3>
              <p>Sheet: ${escapeHtml(dataset.sheet)} · ${formatNumber(dataset.rows.length)} rows · ${formatNumber(dataset.headers.length)} columns</p>
            </div>
            <span class="badge">stored</span>
          </div>
          ${previewTable}
        </article>
      `;
    })
    .join('');
};

const renderColumns = analysis => {
  const term = normalize(searchInput.value || '');
  const visibleColumns = analysis.columns.filter(column => {
    return [column.header, column.type, ...column.topValues.map(item => item.value)].map(normalize).some(value => value.includes(term));
  });

  if (!visibleColumns.length) {
    columnsList.innerHTML = '<p class="empty">No matching columns found.</p>';
    return;
  }

  columnsList.innerHTML = visibleColumns
    .map(column => {
      const stats = column.numericSummary
        ? `Sum ${formatNumber(column.numericSummary.sum)} · Avg ${formatNumber(column.numericSummary.avg)} · Min ${formatNumber(
            column.numericSummary.min
          )} · Max ${formatNumber(column.numericSummary.max)}`
        : `Top values: ${column.topValues.map(item => `${escapeHtml(item.value)} (${item.count})`).join(', ') || 'none yet'}`;

      return `
        <article class="column-card">
          <div class="column-top">
            <div>
              <h3>${escapeHtml(column.header)}</h3>
              <p>${stats}</p>
            </div>
            <span class="badge ${column.type}">${column.type}</span>
          </div>
          <div class="badges">
            <span class="badge">filled ${formatNumber(column.filled)}</span>
            <span class="badge ${column.missing ? 'warning' : ''}">missing ${formatNumber(column.missing)}</span>
            <span class="badge">unique ${formatNumber(column.unique)}</span>
          </div>
        </article>
      `;
    })
    .join('');
};

const render = () => {
  const analysis = buildAnalysis();
  updateCounters(analysis);
  renderSummary(analysis);
  renderDatasets(analysis);
  renderColumns(analysis);
};

uploadForm.addEventListener('submit', async event => {
  event.preventDefault();
  const files = [...fileInput.files];
  if (!files.length) {
    log('Please choose at least one Excel/CSV file first.', 'warn');
    return;
  }

  const submitButton = uploadForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  statusLog.innerHTML = '';

  for (const file of files) {
    try {
      const parsedDatasets = await parseFile(file);
      datasets = [...parsedDatasets, ...datasets];
      log(`Parsed ${file.name}: ${parsedDatasets.length} dataset(s) collected and stored.`, 'ok');
    } catch (error) {
      log(`${file.name}: ${error.message}`, 'error');
    }
  }

  save();
  fileInput.value = '';
  submitButton.disabled = false;
  render();
});

loadSampleButton.addEventListener('click', () => {
  datasets = sampleDatasets.map(dataset => ({ ...dataset, uploadedAt: new Date().toISOString() }));
  promptInput.value = 'Analyze revenue by region and product, identify missing data, and recommend what to clean before building a formal report.';
  save();
  log('Sample dataset loaded for quick preview.', 'ok');
  render();
});

clearDataButton.addEventListener('click', () => {
  datasets = [];
  localStorage.removeItem(STORAGE_KEY);
  statusLog.innerHTML = '';
  log('Stored datasets cleared.', 'warn');
  render();
});

searchInput.addEventListener('input', render);
promptInput.addEventListener('input', render);

render();
