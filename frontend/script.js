// frontend script.js — Blue Cyber Tech UI
// This file does frontend-only simulated progress, calls /generate-report, and handles downloads + dark mode

// Elements
const topicEl = document.getElementById('topic');
const depthEl = document.getElementById('depth');
const breadthEl = document.getElementById('breadth');
const notesEl = document.getElementById('notes');
const startBtn = document.getElementById('startBtn');
const clearBtn = document.getElementById('clearBtn');
const outputEl = document.getElementById('output');
const downloadMd = document.getElementById('downloadMd');
const downloadPdf = document.getElementById('downloadPdf');
const progressBar = document.getElementById('progressBar');
const progressLabel = document.getElementById('progressLabel');
const progressPct = document.getElementById('progressPct');
const metaInfo = document.getElementById('metaInfo');

const themeCheckbox = document.getElementById('themeCheckbox');
const knob = document.getElementById('knob');
const body = document.body;

// Persist theme
if (localStorage.getItem('theme') === 'light') {
  body.classList.add('light');
  themeCheckbox.checked = true;
  knob.classList.remove('off');
}

// Theme toggle
themeCheckbox.addEventListener('change', () => {
  if (themeCheckbox.checked) {
    body.classList.add('light');
    localStorage.setItem('theme', 'light');
    knob.classList.remove('off');
  } else {
    body.classList.remove('light');
    localStorage.setItem('theme', 'dark');
    knob.classList.add('off');
  }
});

// Simple simulated progress controller
let simInterval = null;
let simPct = 0;

function startSimulatedProgress() {
  stopSimulatedProgress();
  simPct = 2;
  updateProgress(simPct, 'Initializing…');
  simInterval = setInterval(() => {
    // simulate non-linear progress
    if (simPct < 25) simPct += Math.random() * 3 + 1;
    else if (simPct < 60) simPct += Math.random() * 2 + 0.5;
    else if (simPct < 85) simPct += Math.random() * 1 + 0.2;
    else simPct += Math.random() * 0.4 + 0.05;

    if (simPct >= 99) simPct = 99.2; // hold until server finishes
    updateProgress(simPct, 'Research in progress…');
  }, 700);
}

function stopSimulatedProgress(finalPct = 100, label = 'Completed') {
  if (simInterval) clearInterval(simInterval);
  simInterval = null;
  updateProgress(finalPct, label);
}

// UI helpers
function updateProgress(pct, label) {
  const clamped = Math.min(100, Math.max(0, Math.round(pct * 10) / 10));
  progressBar.style.width = clamped + '%';
  progressLabel.textContent = label;
  progressPct.textContent = clamped + '%';
  metaInfo.textContent = `Status: ${label}`;
}

// Download helpers
function downloadMarkdown(filename, content) {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  downloadMd.href = url;
  downloadMd.download = filename;
}

async function downloadPDF(filename, content) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  doc.setFontSize(12);

  const lines = doc.splitTextToSize(content, 520);
  let y = 40;
  for (let i = 0; i < lines.length; i++) {
    doc.text(lines[i], 40, y);
    y += 14;
    if (y > 780) {
      doc.addPage();
      y = 40;
    }
  }
  doc.save(filename);
}

// Clear output
clearBtn.addEventListener('click', () => {
  outputEl.textContent = 'No report yet — press Start Research.';
  updateProgress(0, 'Idle');
  downloadMd.style.display = 'none';
  downloadPdf.style.display = 'none';
});

// Main action
startBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  const topic = topicEl.value.trim();
  const depth = Number(depthEl.value) || 2;
  const breadth = Number(breadthEl.value) || 2;
  const notes = notesEl.value.trim();

  if (!topic || topic.length < 3) {
    updateProgress(0, 'Provide a topic (min 3 chars)');
    return;
  }

  // UI prep
  outputEl.textContent = '';
  downloadMd.style.display = 'none';
  downloadPdf.style.display = 'none';
  updateProgress(2, 'Queued');
  startSimulatedProgress();

  try {
    const res = await fetch('/generate-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, depth, breadth, notes })
    });

    // backend replies when done; stop simulated progress and show content
    const data = await res.json();

    if (data.error) {
      stopSimulatedProgress(0, 'Failed');
      outputEl.textContent = 'Error: ' + data.error;
      return;
    }

    // ensure UI shows 100%
    stopSimulatedProgress(100, 'Completed');

    const report = data.report || data; // fallback
    outputEl.textContent = report;

    // enable downloads
    const safeName = (topic.replace(/\s+/g, '_') || 'report') + '.md';
    downloadMarkdown(safeName, report);
    downloadMd.style.display = 'inline-block';
    downloadMd.onclick = () => {}; // anchor suffices

    downloadPdf.style.display = 'inline-block';
    downloadPdf.onclick = () => downloadPDF(safeName.replace('.md', '.pdf'), report);

  } catch (err) {
    stopSimulatedProgress(0, 'Failed');
    outputEl.textContent = 'Error: ' + (err?.message || String(err));
  }
});

// initialize UI state
updateProgress(0, 'Idle');
downloadMd.style.display = 'none';
downloadPdf.style.display = 'none';
