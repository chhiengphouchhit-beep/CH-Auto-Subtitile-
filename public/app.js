const state = {
  uploadId: null,
  duration: 0,
  captions: [],
  glossary: [],
  style: {
    fontName: 'Noto Sans Khmer',
    color: '#ffe066',
    strokeColor: '#000000',
    strokeWidth: 'none',
    bgStyle: 'pill',
    bgColor: '#000000',
    bgOpacity: 78,
    customFontSizePx: 48,
    position: 'bottom',
    posYPercent: 12,
  },
  editOptions: {
    aspectRatio: 'original',
    trimStart: 0,
    trimEnd: 0,
    bgmFilename: null,
    bgmVolume: 15,
    logoFilename: null,
    logoPos: 'top-right'
  }
};

function cleanKhmerSpaces(text) {
  if (!text) return '';
  let prev = '';
  let curr = String(text);
  const khmerCharRegex = /([\u1780-\u17FF\u19E0-\u19FF\u1770-\u1773])\s+([\u1780-\u17FF\u19E0-\u19FF\u1770-\u1773])/g;
  while (curr !== prev) {
    prev = curr;
    curr = curr.replace(khmerCharRegex, '$1$2');
  }
  return curr;
}

const el = {
  fileInput: document.getElementById('file-input'),
  video: document.getElementById('video'),
  videoEmpty: document.getElementById('video-empty'),
  captionOverlay: document.getElementById('caption-overlay'),
  captionOverlayText: document.getElementById('caption-overlay-text'),
  fontFamilySelect: document.getElementById('font-family-select'),
  fontColorPicker: document.getElementById('font-color-picker'),
  fontColorLabel: document.getElementById('font-color-label'),
  fontBgStyleSelect: document.getElementById('font-bg-style-select'),
  bgCustomColorGroup: document.getElementById('bg-custom-color-group'),
  fontBgColorPicker: document.getElementById('font-bg-color-picker'),
  fontBgColorLabel: document.getElementById('font-bg-color-label'),
  fontBgOpacitySlider: document.getElementById('font-bg-opacity-slider'),
  fontBgOpacityVal: document.getElementById('font-bg-opacity-val'),
  opacityPreset0: document.getElementById('opacity-preset-0'),
  opacityPreset50: document.getElementById('opacity-preset-50'),
  opacityPreset78: document.getElementById('opacity-preset-78'),
  opacityPreset100: document.getElementById('opacity-preset-100'),
  fontSizeSelect: document.getElementById('font-size-select'),
  fontPositionSlider: document.getElementById('font-position-slider'),
  fontPositionVal: document.getElementById('font-position-val'),
  posPresetBottom: document.getElementById('pos-preset-bottom'),
  posPresetCenter: document.getElementById('pos-preset-center'),
  posPresetTop: document.getElementById('pos-preset-top'),
  cleanSpacesBtn: document.getElementById('clean-spaces-btn'),
  languageSelect: document.getElementById('language-select'),
  context: document.getElementById('context-input'),
  glossaryTags: document.getElementById('glossary-tags'),
  glossaryInput: document.getElementById('glossary-input'),
  generateBtn: document.getElementById('generate-btn'),
  exportDropdown: document.getElementById('export-dropdown'),
  exportMainBtn: document.getElementById('export-main-btn'),
  exportSrtBtn: document.getElementById('export-srt-btn'),
  exportVttBtn: document.getElementById('export-vtt-btn'),
  exportAssBtn: document.getElementById('export-ass-btn'),
  exportTxtBtn: document.getElementById('export-txt-btn'),
  exportVideoBtn: document.getElementById('export-video-btn'),
  exportGreenscreenBtn: document.getElementById('export-greenscreen-btn'),
  exportScreenshotBtn: document.getElementById('export-screenshot-btn'),
  addEmojisBtn: document.getElementById('add-emojis-btn'),
  splitPhrasesBtn: document.getElementById('split-phrases-btn'),
  seekBackBtn: document.getElementById('seek-back-btn'),
  seekFwdBtn: document.getElementById('seek-fwd-btn'),
  addCaptionBtn: document.getElementById('add-caption-btn'),
  captionSearchInput: document.getElementById('caption-search-input'),
  aspectRatioSelect: document.getElementById('aspect-ratio-select'),
  trimStartInput: document.getElementById('trim-start-input'),
  trimEndInput: document.getElementById('trim-end-input'),
  setTrimStartBtn: document.getElementById('set-trim-start-btn'),
  setTrimEndBtn: document.getElementById('set-trim-end-btn'),
  bgmFileInput: document.getElementById('bgm-file-input'),
  bgmFilename: document.getElementById('bgm-filename'),
  bgmVolSlider: document.getElementById('bgm-vol-slider'),
  bgmVolVal: document.getElementById('bgm-vol-val'),
  logoFileInput: document.getElementById('logo-file-input'),
  logoFilename: document.getElementById('logo-filename'),
  logoPosSelect: document.getElementById('logo-pos-select'),
  exportModal: document.getElementById('export-modal'),
  exportModalTitle: document.getElementById('export-modal-title'),
  exportModalSub: document.getElementById('export-modal-sub'),
  exportFontName: document.getElementById('export-font-name'),
  exportProgressBar: document.getElementById('export-progress-bar'),
  exportProgressText: document.getElementById('export-progress-text'),
  exportStatusLabel: document.getElementById('export-status-label'),
  generateModal: document.getElementById('generate-modal'),
  generateProgressBar: document.getElementById('generate-progress-bar'),
  generateProgressText: document.getElementById('generate-progress-text'),
  generateStatusLabel: document.getElementById('generate-status-label'),
  accessKeyInput: document.getElementById('access-key-input'),
  keyStatusBadge: document.getElementById('key-status-badge'),
  adminPanelBtn: document.getElementById('admin-panel-btn'),
  adminModal: document.getElementById('admin-modal'),
  closeAdminBtn: document.getElementById('close-admin-btn'),
  newUserName: document.getElementById('new-user-name'),
  newUserLimit: document.getElementById('new-user-limit'),
  createKeyBtn: document.getElementById('create-key-btn'),
  keysListBody: document.getElementById('keys-list-body'),
  onlineCountText: document.getElementById('online-count-text'),
  adminOnlineCount: document.getElementById('admin-online-count'),
  adminOnlineUsersList: document.getElementById('admin-online-users-list'),
  status: document.getElementById('status-line'),
  captionsList: document.getElementById('captions-list'),
  captionCount: document.getElementById('caption-count'),
  modelBadge: document.getElementById('model-badge'),
};

function setStatus(msg, kind) {
  el.status.textContent = msg || '';
  el.status.className = 'status-line' + (kind ? ` is-${kind}` : '');
}

// ---------------------------------------------------------------------------
// Health / model badge
// ---------------------------------------------------------------------------

async function checkHealth() {
  try {
    const r = await fetch('/api/health');
    const info = await r.json();
    if (el.modelBadge) {
      el.modelBadge.textContent = info.geminiConfigured
        ? `Gemini: ${info.model}`
        : 'mock mode (no API key)';
    }
  } catch (e) {
    if (el.modelBadge) {
      el.modelBadge.textContent = '⚡ Waking server up...';
    }
    setTimeout(checkHealth, 3000);
  }
}
checkHealth();

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

async function handleFileUpload(file) {
  if (!file) return;

  setStatus('កំពុងផ្ទុកឡើង និងកែច្នៃ audio…');
  const form = new FormData();
  form.append('video', file);

  try {
    const res = await fetch('/api/upload', { method: 'POST', body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed.');

    state.uploadId = data.id;
    state.duration = data.duration;

    el.video.src = data.videoUrl;
    el.video.load();
    if (el.videoEmpty) el.videoEmpty.style.display = 'none';
    el.video.style.display = 'block';
    if (el.generateBtn) el.generateBtn.disabled = false;
    setStatus(`បានផ្ទុក — ប្រវែង ${data.duration.toFixed(1)}s`, 'ok');
  } catch (err) {
    setStatus(err.message, 'error');
  }
}

if (el.fileInput) {
  el.fileInput.addEventListener('change', () => {
    if (el.fileInput.files && el.fileInput.files[0]) {
      handleFileUpload(el.fileInput.files[0]);
    }
  });
}

const fileInputTopbar = document.getElementById('file-input-topbar');
if (fileInputTopbar) {
  fileInputTopbar.addEventListener('change', () => {
    if (fileInputTopbar.files && fileInputTopbar.files[0]) {
      handleFileUpload(fileInputTopbar.files[0]);
    }
  });
}

const videoShell = document.querySelector('.video-shell');
if (videoShell) {
  videoShell.addEventListener('dragover', (e) => {
    e.preventDefault();
    videoShell.classList.add('drag-over');
  });
  videoShell.addEventListener('dragleave', () => {
    videoShell.classList.remove('drag-over');
  });
  videoShell.addEventListener('drop', (e) => {
    e.preventDefault();
    videoShell.classList.remove('drag-over');
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  });
}

// ---------------------------------------------------------------------------
// Protected vocabulary tags
// ---------------------------------------------------------------------------

function renderGlossary() {
  el.glossaryTags.querySelectorAll('.tag-chip').forEach((n) => n.remove());
  state.glossary.forEach((term, i) => {
    const chip = document.createElement('span');
    chip.className = 'tag-chip';
    chip.innerHTML = `${escapeHtml(term)} <button type="button" aria-label="remove">×</button>`;
    chip.querySelector('button').addEventListener('click', () => {
      state.glossary.splice(i, 1);
      renderGlossary();
    });
    el.glossaryTags.insertBefore(chip, el.glossaryInput);
  });
}

el.glossaryInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && el.glossaryInput.value.trim()) {
    e.preventDefault();
    state.glossary.push(el.glossaryInput.value.trim());
    el.glossaryInput.value = '';
    renderGlossary();
  }
});

// ---------------------------------------------------------------------------
// Generate / regenerate captions
// ---------------------------------------------------------------------------

let generateProgressInterval = null;

function startGenerateAnimation() {
  if (el.generateModal) {
    el.generateModal.hidden = false;
    if (el.generateProgressBar) el.generateProgressBar.style.width = '5%';
    if (el.generateProgressText) el.generateProgressText.textContent = '5%';
    if (el.generateStatusLabel) el.generateStatusLabel.textContent = '🎙️ កំពុងស្ដាប់សំឡេង និង វិភាគភាសាខ្មែរ...';

    let currentPct = 5;
    if (generateProgressInterval) clearInterval(generateProgressInterval);
    generateProgressInterval = setInterval(() => {
      if (currentPct < 92) {
        currentPct += Math.floor(Math.random() * 5) + 2;
        if (currentPct > 92) currentPct = 92;
        if (el.generateProgressBar) el.generateProgressBar.style.width = `${currentPct}%`;
        if (el.generateProgressText) el.generateProgressText.textContent = `${currentPct}%`;

        if (currentPct > 70 && el.generateStatusLabel) {
          el.generateStatusLabel.textContent = '✨ កំពុងលុប Space និង ពិនិត្យពាក្យបច្ចេកទេស...';
        } else if (currentPct > 35 && el.generateStatusLabel) {
          el.generateStatusLabel.textContent = '🧠 Gemini AI កំពុងតម្រៀបជើងអក្សរ និង ស្រៈ...';
        }
      }
    }, 400);
  }
}

function finishGenerateAnimation() {
  if (generateProgressInterval) clearInterval(generateProgressInterval);
  if (el.generateProgressBar) el.generateProgressBar.style.width = '100%';
  if (el.generateProgressText) el.generateProgressText.textContent = '100%';
  if (el.generateStatusLabel) el.generateStatusLabel.textContent = '💖 បង្កើត Caption រួចរាល់ ១០០%! ចូលរួមរីករាយ...';

  setTimeout(() => {
    if (el.generateModal) el.generateModal.hidden = true;
  }, 1000);
}

function stopGenerateAnimation() {
  if (generateProgressInterval) clearInterval(generateProgressInterval);
  if (el.generateModal) el.generateModal.hidden = true;
}

el.generateBtn.addEventListener('click', async () => {
  if (!state.uploadId) return;
  setStatus('កំពុងបង្កើត caption…');
  el.generateBtn.disabled = true;
  startGenerateAnimation();

  try {
    const res = await fetch('/api/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Access-Key': getAccessKey() },
      body: JSON.stringify({
        id: state.uploadId,
        context: el.context.value,
        glossary: state.glossary,
        language: el.languageSelect ? el.languageSelect.value : 'km',
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Transcription failed.');

    state.captions = data.captions;
    finishGenerateAnimation();
    renderCaptions();
    el.exportMainBtn.disabled = state.captions.length === 0;
    el.generateBtn.textContent = 'Regenerate with context';
    setStatus(
      data.usedMock
        ? 'បង្ហាញ caption គំរូ (mock) — បន្ថែម GEMINI_API_KEY ក្នុង .env ដើម្បីបានលទ្ធផលពិត'
        : 'បានបង្កើត caption ដោយជោគជ័យ',
      data.usedMock ? 'error' : 'ok'
    );
  } catch (err) {
    stopGenerateAnimation();
    setStatus(err.message, 'error');
  } finally {
    el.generateBtn.disabled = false;
  }
});

// ---------------------------------------------------------------------------
// Timeline captions list
// ---------------------------------------------------------------------------

function fmtTime(t) {
  return Number(t).toFixed(2);
}

function renderCaptions() {
  el.captionCount.textContent = state.captions.length;
  el.captionsList.innerHTML = '';
  el.exportMainBtn.disabled = state.captions.length === 0;

  if (state.captions.length === 0) {
    el.captionsList.innerHTML = '<p class="empty-hint">Caption នឹងបង្ហាញនៅទីនេះ បន្ទាប់ពី Generate។</p>';
    return;
  }

  const query = el.captionSearchInput ? el.captionSearchInput.value.toLowerCase().trim() : '';

  state.captions.forEach((cap, i) => {
    if (query && !cap.text.toLowerCase().includes(query)) return;

    const row = document.createElement('div');
    row.className = 'caption-row';
    row.dataset.index = String(i);

    row.innerHTML = `
      <div class="caption-row-top">
        <input type="number" step="0.01" class="start-input" value="${fmtTime(cap.start)}" title="Start Time (seconds)" />
        <span class="sep">→</span>
        <input type="number" step="0.01" class="end-input" value="${fmtTime(cap.end)}" title="End Time (seconds)" />
        <button type="button" class="del-btn btn-del-cap" title="Delete this caption line">🗑️</button>
      </div>
      <input type="text" class="caption-text" value="${escapeAttr(cap.text)}" placeholder="បញ្ចូលអត្ថបទ Caption..." />
      <div class="cap-actions-row">
        <button type="button" class="btn-time-set btn-set-start" title="កំណត់ពេលចាប់ផ្តើមតាមវិនាទីវីដេអូបច្ចុប្បន្ន">⏱️ Set Start</button>
        <button type="button" class="btn-time-set btn-set-end" title="កំណត់ពេលបញ្ចប់តាមវិនាទីវីដេអូបច្ចុប្បន្ន">⏱️ Set End</button>
      </div>
    `;

    row.querySelector('.caption-text').addEventListener('input', (e) => {
      state.captions[i].text = e.target.value;
      updateVideoOverlay();
    });
    row.querySelector('.start-input').addEventListener('change', (e) => {
      state.captions[i].start = parseFloat(e.target.value) || 0;
      updateVideoOverlay();
    });
    row.querySelector('.end-input').addEventListener('change', (e) => {
      state.captions[i].end = parseFloat(e.target.value) || 0;
      updateVideoOverlay();
    });
    row.querySelector('.btn-set-start').addEventListener('click', (e) => {
      e.stopPropagation();
      state.captions[i].start = parseFloat(el.video.currentTime.toFixed(2));
      renderCaptions();
      updateVideoOverlay();
    });
    row.querySelector('.btn-set-end').addEventListener('click', (e) => {
      e.stopPropagation();
      state.captions[i].end = parseFloat(el.video.currentTime.toFixed(2));
      renderCaptions();
      updateVideoOverlay();
    });
    row.querySelector('.del-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      state.captions.splice(i, 1);
      renderCaptions();
      updateVideoOverlay();
    });
    row.addEventListener('click', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
      el.video.currentTime = cap.start;
      highlightRow(i);
      updateVideoOverlay();
    });

    el.captionsList.appendChild(row);
  });
}

// ---------------------------------------------------------------------------
// Caption Style Control Listeners
// ---------------------------------------------------------------------------
// Quick Style Themes
// ---------------------------------------------------------------------------

const themePresets = {
  tiktok: { color: '#ffe066', bgStyle: 'pill', bgColor: '#000000', bgOpacity: 78 },
  minimal: { color: '#ffffff', bgStyle: 'none', bgColor: '#000000', bgOpacity: 0 },
  pink: { color: '#ffb7c5', bgStyle: 'pill', bgColor: '#1c1917', bgOpacity: 85 },
  neon: { color: '#34d399', bgStyle: 'solid-black', bgColor: '#000000', bgOpacity: 100 },
};

document.querySelectorAll('.btn-theme-preset').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.btn-theme-preset').forEach((b) => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    const themeKey = btn.dataset.theme;
    const preset = themePresets[themeKey];
    if (preset) {
      if (preset.color) {
        state.style.color = preset.color;
        if (el.fontColorPicker) el.fontColorPicker.value = preset.color;
        if (el.fontColorLabel) el.fontColorLabel.textContent = preset.color.toUpperCase();
      }
      if (preset.bgStyle) {
        state.style.bgStyle = preset.bgStyle;
        if (el.fontBgStyleSelect) el.fontBgStyleSelect.value = preset.bgStyle;
        if (el.bgCustomColorGroup) el.bgCustomColorGroup.style.display = preset.bgStyle === 'custom' ? 'flex' : 'none';
      }
      if (preset.bgColor) {
        state.style.bgColor = preset.bgColor;
        if (el.fontBgColorPicker) el.fontBgColorPicker.value = preset.bgColor;
        if (el.fontBgColorLabel) el.fontBgColorLabel.textContent = preset.bgColor.toUpperCase();
      }
      if (preset.bgOpacity !== undefined) {
        setBgOpacity(preset.bgOpacity);
      }
      updateVideoOverlay();
      saveLocalBackup();
    }
  });
});

// Auto-Save Backup Helper
function saveLocalBackup() {
  try {
    if (state.captions && state.captions.length > 0) {
      localStorage.setItem('khmer_caption_studio_backup', JSON.stringify({
        captions: state.captions,
        style: state.style,
        savedAt: new Date().toISOString()
      }));
      const tag = document.getElementById('auto-save-tag');
      if (tag) {
        tag.style.opacity = '1';
        setTimeout(() => { tag.style.opacity = '0.7'; }, 1500);
      }
    }
  } catch (e) {}
}

function restoreLocalBackup() {
  try {
    const raw = localStorage.getItem('khmer_caption_studio_backup');
    if (raw) {
      const data = JSON.parse(raw);
      if (data && data.captions && data.captions.length > 0) {
        state.captions = data.captions;
        if (data.style) Object.assign(state.style, data.style);
        renderCaptions();
        if (el.exportMainBtn) el.exportMainBtn.disabled = false;
        setStatus('បានស្រង់យកទិន្នន័យ Caption ដែលបានរក្សាទុកចុងក្រោយ (Auto-Restored)!', 'ok');
      }
    }
  } catch (e) {}
}

el.fontFamilySelect.addEventListener('change', (e) => {
  state.style.fontName = e.target.value;
  updateVideoOverlay();
  saveLocalBackup();
});

el.fontColorPicker.addEventListener('input', (e) => {
  const val = e.target.value;
  state.style.color = val;
  el.fontColorLabel.textContent = val.toUpperCase();
  updateVideoOverlay();
  saveLocalBackup();
});



el.fontBgStyleSelect.addEventListener('change', (e) => {
  const val = e.target.value;
  state.style.bgStyle = val;
  el.bgCustomColorGroup.style.display = val === 'custom' ? 'flex' : 'none';
  updateVideoOverlay();
});

el.fontBgColorPicker.addEventListener('input', (e) => {
  const val = e.target.value;
  state.style.bgColor = val;
  el.fontBgColorLabel.textContent = val.toUpperCase();
  updateVideoOverlay();
});

function setBgOpacity(val) {
  const num = Math.max(0, Math.min(100, Number(val)));
  state.style.bgOpacity = num;
  if (el.fontBgOpacitySlider) el.fontBgOpacitySlider.value = num;
  if (el.fontBgOpacityVal) el.fontBgOpacityVal.textContent = `${num}%`;

  if (el.opacityPreset0) el.opacityPreset0.classList.toggle('is-active', num === 0);
  if (el.opacityPreset50) el.opacityPreset50.classList.toggle('is-active', num === 50);
  if (el.opacityPreset78) el.opacityPreset78.classList.toggle('is-active', num === 78);
  if (el.opacityPreset100) el.opacityPreset100.classList.toggle('is-active', num === 100);

  updateVideoOverlay();
}

if (el.fontBgOpacitySlider) {
  el.fontBgOpacitySlider.addEventListener('input', (e) => setBgOpacity(e.target.value));
}
if (el.opacityPreset0) el.opacityPreset0.addEventListener('click', () => setBgOpacity(0));
if (el.opacityPreset50) el.opacityPreset50.addEventListener('click', () => setBgOpacity(50));
if (el.opacityPreset78) el.opacityPreset78.addEventListener('click', () => setBgOpacity(78));
if (el.opacityPreset100) el.opacityPreset100.addEventListener('click', () => setBgOpacity(100));

function setCustomFontSize(val) {
  const num = Math.max(16, Math.min(120, Number(val) || 48));
  state.style.customFontSizePx = num;

  const slider = document.getElementById('font-size-slider');
  const valBadge = document.getElementById('font-size-val');
  if (slider) slider.value = num;
  if (valBadge) valBadge.textContent = `${num}px`;

  const btn32 = document.getElementById('size-preset-32');
  const btn48 = document.getElementById('size-preset-48');
  const btn64 = document.getElementById('size-preset-64');
  const btn84 = document.getElementById('size-preset-84');

  if (btn32) btn32.classList.toggle('is-active', num === 32);
  if (btn48) btn48.classList.toggle('is-active', num === 48);
  if (btn64) btn64.classList.toggle('is-active', num === 64);
  if (btn84) btn84.classList.toggle('is-active', num === 84);

  updateVideoOverlay();
  saveLocalBackup();
}

const fontSizeSliderEl = document.getElementById('font-size-slider');
if (fontSizeSliderEl) {
  fontSizeSliderEl.addEventListener('input', (e) => setCustomFontSize(e.target.value));
}

const sizePreset32 = document.getElementById('size-preset-32');
const sizePreset48 = document.getElementById('size-preset-48');
const sizePreset64 = document.getElementById('size-preset-64');
const sizePreset84 = document.getElementById('size-preset-84');

if (sizePreset32) sizePreset32.addEventListener('click', () => setCustomFontSize(32));
if (sizePreset48) sizePreset48.addEventListener('click', () => setCustomFontSize(48));
if (sizePreset64) sizePreset64.addEventListener('click', () => setCustomFontSize(64));
if (sizePreset84) sizePreset84.addEventListener('click', () => setCustomFontSize(84));

function setPosPercent(val) {
  state.style.posYPercent = Number(val);
  el.fontPositionSlider.value = val;
  el.fontPositionVal.textContent = `${val}%`;

  el.posPresetBottom.classList.toggle('is-active', Number(val) === 12);
  el.posPresetCenter.classList.toggle('is-active', Number(val) === 45);
  el.posPresetTop.classList.toggle('is-active', Number(val) === 78);

  updateVideoOverlay();
}

el.fontPositionSlider.addEventListener('input', (e) => {
  setPosPercent(e.target.value);
});

el.posPresetBottom.addEventListener('click', () => setPosPercent(12));
el.posPresetCenter.addEventListener('click', () => setPosPercent(45));
el.posPresetTop.addEventListener('click', () => setPosPercent(78));

// Clean Khmer Spaces Button
el.cleanSpacesBtn.addEventListener('click', () => {
  if (state.captions.length === 0) return setStatus('មិនទាន់មាន Caption សម្រាប់សំអាត Space', 'error');

  let cleanedCount = 0;
  state.captions.forEach((c) => {
    const cleaned = cleanKhmerSpaces(c.text);
    if (cleaned !== c.text) {
      c.text = cleaned;
      cleanedCount++;
    }
  });

  renderCaptions();
  updateVideoOverlay();
  saveLocalBackup();
  setStatus(`បានសំអាត Space រវាងពាក្យខ្មែរចំនួន ${cleanedCount} ជួររួចរាល់!`, 'ok');
});

// Auto Emoji Injection Engine
if (el.addEmojisBtn) {
  el.addEmojisBtn.addEventListener('click', () => {
    if (state.captions.length === 0) return setStatus('មិនទាន់មាន Caption សម្រាប់បន្ថែម Emojis', 'error');

    const emojiMap = [
      { keys: ['សាលា', 'រៀន', 'school', 'study'], emoji: '🏫' },
      { keys: ['សម្រាក', 'ដេក', 'sleep', 'rest', 'relax'], emoji: '😴' },
      { keys: ['ស្រឡាញ់', 'ស្រលាញ់', 'ស្នេហា', 'love', 'heart'], emoji: '💖' },
      { keys: ['សប្បាយ', 'ញញឹម', 'សើច', 'happy', 'fun', 'smile'], emoji: '😊' },
      { keys: ['ញ៉ាំ', 'បាយ', 'ហូប', 'ម្ហូប', 'eat', 'food'], emoji: '🍚' },
      { keys: ['លុយ', 'ប្រាក់', 'money', 'cash', 'dollar'], emoji: '💵' },
      { keys: ['វីដេអូ', 'ថត', 'video', 'movie', 'film'], emoji: '🎬' },
      { keys: ['ទូរស័ព្ទ', 'ទូរសព្ទ', 'phone', 'call', 'mobile'], emoji: '📱' },
      { keys: ['ឡាន', 'បើក', 'car', 'drive'], emoji: '🚗' },
      { keys: ['ផ្ទះ', 'home', 'house'], emoji: '🏠' },
      { keys: ['ហ្គេម', 'game', 'play'], emoji: '🎮' },
      { keys: ['ចម្រៀង', 'ច្រៀង', 'song', 'music', 'sing'], emoji: '🎙️' },
      { keys: ['ការងារ', 'ធ្វើការ', 'work', 'job'], emoji: '💼' },
      { keys: ['ស្រី', 'ស្អាត', 'beautiful', 'girl', 'cute'], emoji: '🌸' },
      { keys: ['ឆ្ឆាញ់', 'delicious', 'tasty'], emoji: '😋' },
      { keys: ['ក្តៅ', 'hot', 'fire'], emoji: '🔥' },
      { keys: ['ត្រជាក់', 'cold', 'ice'], emoji: '❄️' },
      { keys: ['អស្ចារ្យ', 'ល្អ', 'amazing', 'great', 'good'], emoji: '✨' },
    ];

    let addedCount = 0;
    state.captions.forEach((c) => {
      let text = c.text;
      emojiMap.forEach(({ keys, emoji }) => {
        if (!text.includes(emoji)) {
          const match = keys.some((k) => text.toLowerCase().includes(k));
          if (match) {
            text += ` ${emoji}`;
            addedCount++;
          }
        }
      });
      c.text = text;
    });

    renderCaptions();
    updateVideoOverlay();
    saveLocalBackup();
    setStatus(`បានបន្ថែម Emojis ស្វ័យប្រវត្តិចំនួន ${addedCount} កន្លែងរួចរាល់!`, 'ok');
  });
}

// Short Viral Phrase Splitter Engine
if (el.splitPhrasesBtn) {
  el.splitPhrasesBtn.addEventListener('click', () => {
    if (state.captions.length === 0) return setStatus('មិនទាន់មាន Caption សម្រាប់បំបែក', 'error');

    const newCaptions = [];
    let splitCount = 0;

    state.captions.forEach((c) => {
      const words = c.text.trim().split(/\s+/);
      if (words.length > 6) {
        const mid = Math.ceil(words.length / 2);
        const text1 = words.slice(0, mid).join(' ');
        const text2 = words.slice(mid).join(' ');
        const duration = c.end - c.start;
        const midTime = parseFloat((c.start + duration / 2).toFixed(2));

        newCaptions.push({ start: c.start, end: midTime, text: text1 });
        newCaptions.push({ start: midTime, end: c.end, text: text2 });
        splitCount++;
      } else {
        newCaptions.push(c);
      }
    });

    state.captions = newCaptions;
    renderCaptions();
    updateVideoOverlay();
    saveLocalBackup();
    setStatus(`បានបំបែកល្បះវែងៗចំនួន ${splitCount} ជួរទៅជាឃ្លាខ្លីៗរលូន!`, 'ok');
  });
}

function highlightRow(activeIndex) {
  el.captionsList.querySelectorAll('.caption-row').forEach((r) => {
    r.classList.toggle('is-active', Number(r.dataset.index) === activeIndex);
  });
}

function updateVideoOverlay() {
  const t = el.video.currentTime;
  const activeCap = state.captions.find((c) => t >= c.start && t < c.end);
  if (activeCap && activeCap.text.trim()) {
    el.captionOverlayText.textContent = activeCap.text.trim();
    el.captionOverlayText.style.fontFamily = `"${state.style.fontName}", sans-serif`;
    el.captionOverlayText.style.color = state.style.color;

    // Font size custom pixel scaling
    const sizePx = Number(state.style.customFontSizePx || 48);
    const fontSizeRem = (sizePx / 36).toFixed(2);
    el.captionOverlayText.style.fontSize = `${fontSizeRem}rem`;

    // Stroke / Outline
    let strokePx = '3px';
    if (state.style.strokeWidth === 'none') strokePx = '0px';
    if (state.style.strokeWidth === 'thin') strokePx = '1px';
    if (state.style.strokeWidth === 'medium') strokePx = '3px';
    if (state.style.strokeWidth === 'thick') strokePx = '5px';
    if (state.style.strokeWidth === 'xthick') strokePx = '8px';

    const strokeCol = state.style.strokeWidth === 'none' ? 'transparent' : (state.style.strokeColor || '#000000');
    el.captionOverlayText.style.webkitTextStroke = `${strokePx} ${strokeCol}`;
    el.captionOverlayText.style.textShadow = strokePx === '0px'
      ? 'none'
      : `1px 1px 3px ${strokeCol}, -1px -1px 3px ${strokeCol}, 1px -1px 3px ${strokeCol}, -1px 1px 3px ${strokeCol}`;

    // Background Shape / Box Opacity
    const opacityRatio = Math.max(0, Math.min(100, Number(state.style.bgOpacity !== undefined ? state.style.bgOpacity : 78))) / 100;

    if (state.style.bgStyle === 'none' || opacityRatio === 0) {
      el.captionOverlayText.style.background = 'transparent';
      el.captionOverlayText.style.boxShadow = 'none';
    } else {
      let targetHex = state.style.bgColor || '#000000';
      if (state.style.bgStyle === 'solid-black') targetHex = '#000000';
      if (state.style.bgStyle === 'solid-white') targetHex = '#ffffff';
      if (state.style.bgStyle === 'pill') targetHex = '#000000';

      const clean = targetHex.replace('#', '').trim();
      const r = parseInt(clean.slice(0, 2), 16) || 0;
      const g = parseInt(clean.slice(2, 4), 16) || 0;
      const b = parseInt(clean.slice(4, 6), 16) || 0;

      el.captionOverlayText.style.background = `rgba(${r}, ${g}, ${b}, ${opacityRatio})`;
      el.captionOverlayText.style.boxShadow = opacityRatio > 0 ? `0 4px 16px rgba(0, 0, 0, ${opacityRatio * 0.5})` : 'none';
    }

    // Position (Percentage from bottom)
    el.captionOverlay.style.bottom = `${state.style.posYPercent}%`;
    el.captionOverlay.style.display = 'block';
  } else {
    el.captionOverlay.style.display = 'none';
  }
}

el.video.addEventListener('timeupdate', () => {
  const t = el.video.currentTime;
  const idx = state.captions.findIndex((c) => t >= c.start && t < c.end);
  if (idx !== -1) highlightRow(idx);
  updateVideoOverlay();
});

// ---------------------------------------------------------------------------
// Pro Player Controls, Seek & Playback Speed
// ---------------------------------------------------------------------------

if (el.seekBackBtn) {
  el.seekBackBtn.addEventListener('click', () => {
    el.video.currentTime = Math.max(0, el.video.currentTime - 5);
  });
}

if (el.seekFwdBtn) {
  el.seekFwdBtn.addEventListener('click', () => {
    el.video.currentTime = Math.min(el.video.duration || 0, el.video.currentTime + 5);
  });
}

document.querySelectorAll('.btn-speed').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.btn-speed').forEach((b) => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    const speed = parseFloat(btn.dataset.speed) || 1.0;
    el.video.playbackRate = speed;
    setStatus(`បានប្តូរល្បឿនវីដេអូទៅ ${speed}x`, 'ok');
  });
});

// Drag and drop handled above

// Timeline Add Caption & Live Search Filter
if (el.addCaptionBtn) {
  el.addCaptionBtn.addEventListener('click', () => {
    const t = parseFloat(el.video.currentTime.toFixed(2)) || 0;
    const newCap = {
      start: t,
      end: parseFloat((t + 3.0).toFixed(2)),
      text: 'Caption ថ្មី...'
    };
    state.captions.push(newCap);
    state.captions.sort((a, b) => a.start - b.start);
    renderCaptions();
    updateVideoOverlay();
    setStatus('បានបន្ថែមជួរ Caption ថ្មី!', 'ok');
  });
}

if (el.captionSearchInput) {
  el.captionSearchInput.addEventListener('input', () => {
    renderCaptions();
  });
}

// Global Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
  const activeTag = document.activeElement ? document.activeElement.tagName : '';
  if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') return;

  if (e.code === 'Space') {
    e.preventDefault();
    if (el.video.paused) el.video.play();
    else el.video.pause();
  } else if (e.code === 'ArrowLeft') {
    e.preventDefault();
    el.video.currentTime = Math.max(0, el.video.currentTime - 2);
  } else if (e.code === 'ArrowRight') {
    e.preventDefault();
    el.video.currentTime = Math.min(el.video.duration || 0, el.video.currentTime + 2);
  }
});

// ---------------------------------------------------------------------------
// Export Dropdown & Handlers
// ---------------------------------------------------------------------------

el.exportMainBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  if (el.exportMainBtn.disabled) return;
  el.exportDropdown.classList.toggle('is-open');
});

document.addEventListener('click', (e) => {
  if (!el.exportDropdown.contains(e.target)) {
    el.exportDropdown.classList.remove('is-open');
  }
});

// Option 1: Export .SRT Subtitles
el.exportSrtBtn.addEventListener('click', async () => {
  el.exportDropdown.classList.remove('is-open');
  try {
    const res = await fetch('/api/export-srt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ captions: state.captions }),
    });
    if (!res.ok) throw new Error('Export SRT failed.');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'captions.srt';
    a.click();
    URL.revokeObjectURL(url);
    setStatus('ទាញយកឯកសារ .srt បានជោគជ័យ!', 'ok');
  } catch (err) {
    setStatus(err.message, 'error');
  }
});

// Option 1B: Export .VTT Subtitles
if (el.exportVttBtn) {
  el.exportVttBtn.addEventListener('click', () => {
    el.exportDropdown.classList.remove('is-open');
    if (state.captions.length === 0) return setStatus('មិនទាន់មាន Caption សម្រាប់ Export', 'error');

    let vttContent = 'WEBVTT\n\n';
    state.captions.forEach((c, idx) => {
      const s = fmtVttTime(c.start);
      const e = fmtVttTime(c.end);
      vttContent += `${idx + 1}\n${s} --> ${e}\n${c.text.trim()}\n\n`;
    });

    const blob = new Blob([vttContent], { type: 'text/vtt;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'captions.vtt';
    a.click();
    URL.revokeObjectURL(url);
    setStatus('ទាញយកឯកសារ .vtt បានជោគជ័យ!', 'ok');
  });
}

// Option 1D: Export Plain Text (.TXT)
if (el.exportTxtBtn) {
  el.exportTxtBtn.addEventListener('click', () => {
    el.exportDropdown.classList.remove('is-open');
    if (state.captions.length === 0) return setStatus('មិនទាន់មាន Caption សម្រាប់ Export', 'error');

    const txtContent = state.captions.map((c) => c.text.trim()).join('\n');
    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transcript.txt';
    a.click();
    URL.revokeObjectURL(url);
    setStatus('ទាញយកឯកសារអត្ថបទសុទ្ធ .txt រួចរាល់!', 'ok');
  });
}

function fmtVttTime(seconds) {
  const s = Math.max(0, Number(seconds) || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const ms = Math.floor((s - Math.floor(s)) * 1000);
  const pad = (n, len = 2) => String(n).padStart(len, '0');
  return `${pad(h)}:${pad(m)}:${pad(sec)}.${pad(ms, 3)}`;
}

// Option 1C: Export .ASS Subtitles
if (el.exportAssBtn) {
  el.exportAssBtn.addEventListener('click', async () => {
    el.exportDropdown.classList.remove('is-open');
    if (state.captions.length === 0) return setStatus('មិនទាន់មាន Caption សម្រាប់ Export', 'error');

    try {
      const res = await fetch('/api/export-ass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ captions: state.captions, style: state.style }),
      });
      if (!res.ok) throw new Error('Export ASS failed.');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'captions.ass';
      a.click();
      URL.revokeObjectURL(url);
      setStatus('ទាញយកឯកសារ .ass ជាមួយ Style រួចរាល់!', 'ok');
    } catch (err) {
      setStatus(err.message, 'error');
    }
  });
}

let progressInterval = null;

function startExportAnimation(titleText, fontName) {
  if (el.exportModal) {
    el.exportModal.hidden = false;
    if (el.exportModalTitle) el.exportModalTitle.textContent = titleText || '✨ កំពុងបង្កើត Magic Video... ✨';
    if (el.exportFontName) el.exportFontName.textContent = fontName || state.style.fontName;
    if (el.exportProgressBar) el.exportProgressBar.style.width = '5%';
    if (el.exportProgressText) el.exportProgressText.textContent = '5%';
    if (el.exportStatusLabel) el.exportStatusLabel.textContent = '🌸 កំពុងរៀបចំ PNG Overlays...';

    let currentPct = 5;
    if (progressInterval) clearInterval(progressInterval);
    progressInterval = setInterval(() => {
      if (currentPct < 92) {
        currentPct += Math.floor(Math.random() * 4) + 1;
        if (currentPct > 92) currentPct = 92;
        if (el.exportProgressBar) el.exportProgressBar.style.width = `${currentPct}%`;
        if (el.exportProgressText) el.exportProgressText.textContent = `${currentPct}%`;

        if (currentPct > 65 && el.exportStatusLabel) {
          el.exportStatusLabel.textContent = '🎬 កំពុង Overlay លើវីដេអូ ជិតរួចរាល់ហើយ...';
        } else if (currentPct > 35 && el.exportStatusLabel) {
          el.exportStatusLabel.textContent = `🎨 កំពុង Render ជើងអក្សរ ${fontName || state.style.fontName} 100% HD...`;
        }
      }
    }, 350);
  }
}

function finishExportAnimation() {
  if (progressInterval) clearInterval(progressInterval);
  if (el.exportProgressBar) el.exportProgressBar.style.width = '100%';
  if (el.exportProgressText) el.exportProgressText.textContent = '100%';
  if (el.exportStatusLabel) el.exportStatusLabel.textContent = '💖 Export រួចរាល់ ១០០%! កំពុងទាញយក...';

  setTimeout(() => {
    if (el.exportModal) el.exportModal.hidden = true;
  }, 1200);
}

function stopExportAnimation() {
  if (progressInterval) clearInterval(progressInterval);
  if (el.exportModal) el.exportModal.hidden = true;
}

// ---------------------------------------------------------------------------
// 1-Page Studio Fullscreen Workspace Navigation Tabs
// ---------------------------------------------------------------------------

const tabWorkspaceStyle = document.getElementById('tab-workspace-style');
const tabWorkspaceCapcut = document.getElementById('tab-workspace-capcut');
const tabWorkspaceCopyright = document.getElementById('tab-workspace-copyright');

const stylePanel = document.querySelector('.panel:not(.capcut-panel):not(.copyright-panel)');
const capcutStudioPanel = document.getElementById('capcut-studio-panel');
const copyrightCheckerPanel = document.getElementById('copyright-checker-panel');

function switchWorkspaceTab(activeTab) {
  if (tabWorkspaceStyle) tabWorkspaceStyle.classList.toggle('is-active', activeTab === 'style');
  if (tabWorkspaceCapcut) tabWorkspaceCapcut.classList.toggle('is-active', activeTab === 'capcut');
  if (tabWorkspaceCopyright) tabWorkspaceCopyright.classList.toggle('is-active', activeTab === 'copyright');

  if (stylePanel) stylePanel.style.display = (activeTab === 'style') ? 'flex' : 'none';
  if (capcutStudioPanel) capcutStudioPanel.style.display = (activeTab === 'capcut') ? 'flex' : 'none';
  if (copyrightCheckerPanel) copyrightCheckerPanel.style.display = (activeTab === 'copyright') ? 'flex' : 'none';
}

if (tabWorkspaceStyle) tabWorkspaceStyle.addEventListener('click', () => switchWorkspaceTab('style'));
if (tabWorkspaceCapcut) tabWorkspaceCapcut.addEventListener('click', () => switchWorkspaceTab('capcut'));
if (tabWorkspaceCopyright) tabWorkspaceCopyright.addEventListener('click', () => switchWorkspaceTab('copyright'));

// Default to Style tab
switchWorkspaceTab('style');

// Aspect Ratio Cards Click Listeners
document.querySelectorAll('.ratio-card').forEach((card) => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.ratio-card').forEach((c) => c.classList.remove('is-active'));
    card.classList.add('is-active');
    const ratio = card.dataset.ratio || 'original';
    state.editOptions.aspectRatio = ratio;
    if (el.aspectRatioSelect) el.aspectRatioSelect.value = ratio;
    setStatus(`បានជ្រើសរើសទំហំវីដេអូ Aspect Ratio៖ ${ratio}`, 'ok');
  });
});

const scanCopyrightBtn = document.getElementById('scan-copyright-btn');
const copyrightScanStatus = document.getElementById('copyright-scan-status');

if (scanCopyrightBtn) {
  scanCopyrightBtn.addEventListener('click', async () => {
    if (!state.uploadId) return setStatus('សូម Upload វីដេអូជាមុនសិន ដើម្បី Scan Copyright!', 'error');

    if (copyrightScanStatus) copyrightScanStatus.textContent = '⚡ កំពុង Scan វិភាគ Copyright & Safety...';
    scanCopyrightBtn.disabled = true;

    try {
      const res = await fetch('/api/check-copyright', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: state.uploadId })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Copyright check failed.');

      const { tiktok, facebook, youtube } = data.platforms || {};

      // Update TikTok Card
      if (tiktok) {
        document.getElementById('status-tiktok').textContent = tiktok.label;
        document.getElementById('detail-tiktok').textContent = tiktok.details;
        const dot = document.getElementById('dot-tiktok');
        dot.className = `status-dot dot-${tiktok.statusClass}`;
      }

      // Update Facebook Card
      if (facebook) {
        document.getElementById('status-facebook').textContent = facebook.label;
        document.getElementById('detail-facebook').textContent = facebook.details;
        const dot = document.getElementById('dot-facebook');
        dot.className = `status-dot dot-${facebook.statusClass}`;
      }

      // Update YouTube Card
      if (youtube) {
        document.getElementById('status-youtube').textContent = youtube.label;
        document.getElementById('detail-youtube').textContent = youtube.details;
        const dot = document.getElementById('dot-youtube');
        dot.className = `status-dot dot-${youtube.statusClass}`;
      }

      if (copyrightScanStatus) copyrightScanStatus.textContent = '✨ Scan រួចរាល់ 100%! វីដេអូមានសុវត្ថិភាពខ្ពស់';
      setStatus('បាន Scan ពិនិត្យ Copyright & Monetization Safety រួចរាល់!', 'ok');
    } catch (err) {
      if (copyrightScanStatus) copyrightScanStatus.textContent = '❌ ការ Scan បរាជ័យ';
      setStatus(err.message, 'error');
    } finally {
      scanCopyrightBtn.disabled = false;
    }
  });
}

// ---------------------------------------------------------------------------
// CapCut Video Editing Event Listeners
// ---------------------------------------------------------------------------

if (el.aspectRatioSelect) {
  el.aspectRatioSelect.addEventListener('change', (e) => {
    state.editOptions.aspectRatio = e.target.value;
    setStatus(`បានប្តូរ Aspect Ratio ទៅ ${e.target.value}`, 'ok');
  });
}

if (el.setTrimStartBtn) {
  el.setTrimStartBtn.addEventListener('click', () => {
    const t = parseFloat(el.video.currentTime.toFixed(2));
    state.editOptions.trimStart = t;
    if (el.trimStartInput) el.trimStartInput.value = t;
    setStatus(`បានកំណត់ Trim Start នៅ ${t}s`, 'ok');
  });
}

if (el.setTrimEndBtn) {
  el.setTrimEndBtn.addEventListener('click', () => {
    const t = parseFloat(el.video.currentTime.toFixed(2));
    state.editOptions.trimEnd = t;
    if (el.trimEndInput) el.trimEndInput.value = t;
    setStatus(`បានកំណត់ Trim End នៅ ${t}s`, 'ok');
  });
}

if (el.trimStartInput) {
  el.trimStartInput.addEventListener('change', (e) => {
    state.editOptions.trimStart = parseFloat(e.target.value) || 0;
  });
}

if (el.trimEndInput) {
  el.trimEndInput.addEventListener('change', (e) => {
    state.editOptions.trimEnd = parseFloat(e.target.value) || 0;
  });
}

if (el.bgmVolSlider) {
  el.bgmVolSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    state.editOptions.bgmVolume = val;
    if (el.bgmVolVal) el.bgmVolVal.textContent = `${val}% Volume`;
  });
}

if (el.bgmFileInput) {
  el.bgmFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (el.bgmFilename) el.bgmFilename.textContent = 'កំពុង Upload BGM...';
    const form = new FormData();
    form.append('media', file);

    try {
      const res = await fetch('/api/upload-media', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'BGM upload failed.');
      state.editOptions.bgmFilename = data.file.filename;
      if (el.bgmFilename) el.bgmFilename.textContent = `🎵 ${file.name}`;
      setStatus('បានផ្ទុកឡើង BGM ជោគជ័យ!', 'ok');
    } catch (err) {
      if (el.bgmFilename) el.bgmFilename.textContent = 'គ្មានចម្រៀង';
      setStatus(err.message, 'error');
    }
  });
}

if (el.logoFileInput) {
  el.logoFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (el.logoFilename) el.logoFilename.textContent = 'កំពុង Upload Logo...';
    const form = new FormData();
    form.append('media', file);

    try {
      const res = await fetch('/api/upload-media', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Logo upload failed.');
      state.editOptions.logoFilename = data.file.filename;
      if (el.logoFilename) el.logoFilename.textContent = `🖼️ ${file.name}`;
      setStatus('បានផ្ទុកឡើង Watermark Logo ជោគជ័យ!', 'ok');
    } catch (err) {
      if (el.logoFilename) el.logoFilename.textContent = 'គ្មាន Logo';
      setStatus(err.message, 'error');
    }
  });
}

if (el.logoPosSelect) {
  el.logoPosSelect.addEventListener('change', (e) => {
    state.editOptions.logoPos = e.target.value;
  });
}

// Option 2: Export Video with Burned-In Captions (.MP4)
el.exportVideoBtn.addEventListener('click', async () => {
  el.exportDropdown.classList.remove('is-open');
  if (!state.uploadId) return setStatus('សូម Upload វីដេអូជាមុនសិន', 'error');

  setStatus('កំពុង Render វីដេអូជាមួយ Caption (សូមរង់ចាំបន្តិច)...');
  el.exportMainBtn.disabled = true;
  startExportAnimation('កំពុង Render វីដេអូជាមួយ Caption...', state.style.fontName);

  try {
    const res = await fetch('/api/export-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Access-Key': getAccessKey() },
      body: JSON.stringify({
        id: state.uploadId,
        captions: state.captions,
        greenScreen: false,
        style: state.style,
        editOptions: state.editOptions,
        accessKey: getAccessKey()
      }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || errData.detail || 'Export Video failed.');
    }
    const blob = await res.blob();
    finishExportAnimation();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'video_with_captions.mp4';
    a.click();
    URL.revokeObjectURL(url);
    setStatus('ទាញយកវីដេអូជាមួយ Caption (.mp4) រួចរាល់!', 'ok');
  } catch (err) {
    stopExportAnimation();
    setStatus(err.message, 'error');
  } finally {
    el.exportMainBtn.disabled = false;
  }
});

// Option 3: Export Green Screen Video (.MP4)
el.exportGreenscreenBtn.addEventListener('click', async () => {
  el.exportDropdown.classList.remove('is-open');
  if (!state.uploadId) return setStatus('សូម Upload វីដេអូជាមុនសិន', 'error');

  setStatus('កំពុង Render វីដេអូ Green Screen (#00FF00)...');
  el.exportMainBtn.disabled = true;
  startExportAnimation('កំពុង Render វីដេអូ Green Screen...', state.style.fontName);

  try {
    const res = await fetch('/api/export-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Access-Key': getAccessKey() },
      body: JSON.stringify({
        id: state.uploadId,
        captions: state.captions,
        greenScreen: true,
        style: state.style,
        editOptions: state.editOptions,
        accessKey: getAccessKey()
      }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || errData.detail || 'Export Green Screen failed.');
    }
    const blob = await res.blob();
    finishExportAnimation();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'captions_greenscreen.mp4';
    a.click();
    URL.revokeObjectURL(url);
    setStatus('ទាញយកវីដេអូ Green Screen (.mp4) រួចរាល់!', 'ok');
  } catch (err) {
    stopExportAnimation();
    setStatus(err.message, 'error');
  } finally {
    el.exportMainBtn.disabled = false;
  }
});

// Option 4: Export Screenshot with Overlay (.PNG)
el.exportScreenshotBtn.addEventListener('click', () => {
  el.exportDropdown.classList.remove('is-open');
  if (!el.video.videoWidth) return setStatus('មិនទាន់មានវីដេអូ playable', 'error');

  const canvas = document.createElement('canvas');
  canvas.width = el.video.videoWidth;
  canvas.height = el.video.videoHeight;
  const ctx = canvas.getContext('2d');

  ctx.drawImage(el.video, 0, 0, canvas.width, canvas.height);

  const t = el.video.currentTime;
  const activeCap = state.captions.find((c) => t >= c.start && t < c.end);
  if (activeCap && activeCap.text.trim()) {
    const text = activeCap.text.trim();
    let sizeMultiplier = 0.048;
    if (state.style.fontSizeOption === 'small') sizeMultiplier = 0.036;
    if (state.style.fontSizeOption === 'large') sizeMultiplier = 0.060;
    if (state.style.fontSizeOption === 'xlarge') sizeMultiplier = 0.072;
    const fontSize = Math.max(20, Math.round(canvas.height * sizeMultiplier));

    ctx.font = `bold ${fontSize}px "${state.style.fontName}", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const textWidth = ctx.measureText(text).width;
    const px = 20;
    const py = 10;
    const rectW = textWidth + px * 2;
    const rectH = fontSize + py * 2;
    const rectX = (canvas.width - rectW) / 2;

    const posYRatio = (100 - state.style.posYPercent) / 100;
    const rectY = canvas.height * posYRatio - rectH / 2;

    // Draw Background Box if not 'none'
    if (state.style.bgStyle !== 'none') {
      let bgCol = 'rgba(0, 0, 0, 0.75)';
      if (state.style.bgStyle === 'solid-black') bgCol = '#000000';
      if (state.style.bgStyle === 'solid-white') bgCol = '#ffffff';
      if (state.style.bgStyle === 'custom') bgCol = state.style.bgColor || '#000000';
      ctx.fillStyle = bgCol;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(rectX, rectY, rectW, rectH, 8) : ctx.rect(rectX, rectY, rectW, rectH);
      ctx.fill();
    }

    // Text Fill & Stroke
    ctx.fillStyle = state.style.color;
    if (state.style.strokeWidth !== 'none') {
      let strokeWidthPx = 3;
      if (state.style.strokeWidth === 'thin') strokeWidthPx = 1;
      if (state.style.strokeWidth === 'medium') strokeWidthPx = 3;
      if (state.style.strokeWidth === 'thick') strokeWidthPx = 5;
      if (state.style.strokeWidth === 'xthick') strokeWidthPx = 8;
      ctx.strokeStyle = state.style.strokeColor || '#000000';
      ctx.lineWidth = Math.max(1, Math.round(fontSize / 40 * strokeWidthPx));
      ctx.strokeText(text, canvas.width / 2, canvas.height * posYRatio);
    }
    ctx.fillText(text, canvas.width / 2, canvas.height * posYRatio);
  }

  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = `caption_screenshot_${fmtTime(el.video.currentTime)}s.png`;
  a.click();
  setStatus('ទាញយក Screenshot បានជោគជ័យ!', 'ok');
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function escapeAttr(s) {
  return escapeHtml(String(s));
}

// ---------------------------------------------------------------------------
// CHHIT Admin Access Key Management
// ---------------------------------------------------------------------------

function getAccessKey() {
  return el.accessKeyInput ? el.accessKeyInput.value.trim() : 'CHHIT';
}

async function verifyCurrentKey() {
  const key = getAccessKey();
  try {
    const res = await fetch(`/api/access/verify?key=${encodeURIComponent(key)}`);
    const data = await res.json();
    if (data.valid) {
      if (el.keyStatusBadge) {
        el.keyStatusBadge.textContent = data.isAdmin ? '👑 CHHIT Admin' : `✓ ${data.userName || 'Approved'}`;
        el.keyStatusBadge.className = 'key-status-tag';
      }
    } else {
      if (el.keyStatusBadge) {
        el.keyStatusBadge.textContent = '❌ Key Invalid';
        el.keyStatusBadge.className = 'key-status-tag is-error';
      }
    }
  } catch (e) {}
}

if (el.accessKeyInput) {
  el.accessKeyInput.addEventListener('input', verifyCurrentKey);
  verifyCurrentKey();
}

async function fetchAndRenderAdminKeys() {
  const key = getAccessKey();
  try {
    const res = await fetch('/api/admin/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Access-Key': key },
      body: JSON.stringify({ action: 'list' }),
    });
    const data = await res.json();
    if (el.adminOnlineCount) el.adminOnlineCount.textContent = data.onlineCount || 1;

    if (el.adminOnlineUsersList) {
      el.adminOnlineUsersList.innerHTML = '';
      const onlineUsers = data.onlineUsers || [];
      if (onlineUsers.length === 0) {
        el.adminOnlineUsersList.innerHTML = '<span class="online-chip">🟢 CHHIT Admin</span>';
      } else {
        onlineUsers.forEach((u) => {
          const chip = document.createElement('span');
          chip.className = 'online-chip';
          chip.innerHTML = `🟢 ${escapeHtml(u.userName || 'User')} ${u.isAdmin ? '👑' : ''}`;
          el.adminOnlineUsersList.appendChild(chip);
        });
      }
    }

    if (el.keysListBody) {
      el.keysListBody.innerHTML = '';
      const keys = data.keys || {};
      Object.keys(keys).forEach((k) => {
        const item = keys[k];
        const tr = document.createElement('tr');
        const limitStr = item.limit === -1 ? 'Unlimited ♾️' : `${item.used} / ${item.limit}`;
        const isApproved = item.status === 'approved';
        tr.innerHTML = `
          <td><strong>${escapeHtml(item.userName || 'User')}</strong></td>
          <td><span class="key-code">${escapeHtml(k)}</span></td>
          <td>${limitStr}</td>
          <td><span class="${isApproved ? 'badge-status-approved' : 'badge-status-suspended'}">${isApproved ? 'Approved' : 'Suspended'}</span></td>
          <td>
            <button class="btn-action-sm btn-ghost toggle-btn">${isApproved ? 'Pause ⏸️' : 'Approve ▶️'}</button>
            <button class="btn-action-sm btn-ghost del-key-btn">🗑️</button>
          </td>
        `;
        tr.querySelector('.toggle-btn').addEventListener('click', async () => {
          await manageKeyAction('toggle', k);
        });
        tr.querySelector('.del-key-btn').addEventListener('click', async () => {
          await manageKeyAction('delete', k);
        });
        el.keysListBody.appendChild(tr);
      });
    }
  } catch (err) {
    alert(err.message);
  }
}

async function manageKeyAction(action, keyToManage) {
  const adminKey = getAccessKey();
  try {
    const res = await fetch('/api/admin/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Access-Key': adminKey },
      body: JSON.stringify({ action, keyToManage }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Action failed.');
    fetchAndRenderAdminKeys();
  } catch (err) {
    alert(err.message);
  }
}

function openAdminModal() {
  const modal = document.getElementById('admin-modal');
  if (modal) {
    modal.hidden = false;
    modal.removeAttribute('hidden');
    modal.style.display = 'flex';
  }
}

function closeAdminModal() {
  const modal = document.getElementById('admin-modal');
  if (modal) {
    modal.hidden = true;
    modal.setAttribute('hidden', '');
    modal.style.display = 'none';
  }
}

document.addEventListener('click', (e) => {
  const adminBtn = e.target.closest('#admin-panel-btn');
  if (adminBtn) {
    e.preventDefault();
    let key = getAccessKey();
    if (key !== 'CHHIT' && key !== 'CHHIT-ADMIN-VIP') {
      const inputPass = prompt('🔑 សូមបញ្ចូល Admin Passcode (CHHIT) ដើម្បីគ្រប់គ្រង User:');
      if (!inputPass) return;
      if (inputPass.trim() === 'CHHIT' || inputPass.trim() === 'CHHIT-ADMIN-VIP') {
        if (el.accessKeyInput) el.accessKeyInput.value = inputPass.trim();
        verifyCurrentKey();
        key = inputPass.trim();
      } else {
        return alert('❌ Admin Passcode មិនត្រឹមត្រូវ! (Passcode គឺ: CHHIT)');
      }
    }
    openAdminModal();
    fetchAndRenderAdminKeys();
    return;
  }

  const closeBtn = e.target.closest('#close-admin-btn');
  if (closeBtn) {
    e.preventDefault();
    closeAdminModal();
    return;
  }
});

if (el.createKeyBtn) {
  el.createKeyBtn.addEventListener('click', async () => {
    const userName = el.newUserName ? el.newUserName.value.trim() : '';
    const limit = el.newUserLimit ? el.newUserLimit.value : '5';
    if (!userName) return alert('សូមបញ្ចូលឈ្មោះ User!');

    const adminKey = getAccessKey();
    try {
      const res = await fetch('/api/admin/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Access-Key': adminKey },
        body: JSON.stringify({ action: 'create', userName, limit }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Key creation failed.');
      if (el.newUserName) el.newUserName.value = '';
      alert(`✨ បានបង្កើត Access Key ជោគជ័យ:\n\nKey: ${data.key}\n\n(សូមផ្ញើ Key នេះទៅកាន់ User របស់អ្នក!)`);
      fetchAndRenderAdminKeys();
    } catch (err) {
      alert(err.message);
    }
  });
}

// ---------------------------------------------------------------------------
// Real-time Heartbeat & Live Online Counter
// ---------------------------------------------------------------------------
const clientSessionId = 'session-' + Math.random().toString(36).substring(2, 9);

async function sendHeartbeat() {
  const key = getAccessKey();
  try {
    const res = await fetch('/api/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Access-Key': key },
      body: JSON.stringify({ sessionId: clientSessionId, accessKey: key }),
    });
    const data = await res.json();
    if (el.onlineCountText) {
      el.onlineCountText.textContent = `${data.onlineCount || 1} Online`;
    }
  } catch (e) {}
}

sendHeartbeat();
setInterval(sendHeartbeat, 8000);

// Auto-restore project backup on load
restoreLocalBackup();

