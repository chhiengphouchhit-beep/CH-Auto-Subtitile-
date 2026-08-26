require('dotenv').config();

const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');
const { execFile } = require('child_process');
const { promisify } = require('util');

const express = require('express');
const multer = require('multer');

const execFileAsync = promisify(execFile);

const os = require('os');

const PORT = process.env.PORT || 1100;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const UPLOAD_ROOT = process.env.RENDER || process.env.VERCEL || process.env.NODE_ENV === 'production'
  ? path.join(os.tmpdir(), 'khmer-caption-studio-uploads')
  : path.join(__dirname, 'uploads');
fs.mkdirSync(UPLOAD_ROOT, { recursive: true });

const app = express();
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; font-src 'self' data: https:;"
  );
  next();
});
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/media', express.static(UPLOAD_ROOT));

// ---------------------------------------------------------------------------
// Admin & Access Key Management (Only CHHIT Admin Can Approve & Limit Users)
// ---------------------------------------------------------------------------
const DATA_DIR = process.env.RENDER || process.env.VERCEL || process.env.NODE_ENV === 'production'
  ? path.join(os.tmpdir(), 'khmer-caption-studio-data')
  : path.join(__dirname, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });
const KEYS_FILE = path.join(DATA_DIR, 'keys.json');

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'CHHIT';

function loadKeys() {
  if (!fs.existsSync(KEYS_FILE)) {
    const defaultKeys = {
      "CHHIT-ADMIN-VIP": {
        userName: "CHHIT (Admin)",
        limit: -1,
        used: 0,
        status: "approved",
        createdAt: new Date().toISOString()
      }
    };
    fs.writeFileSync(KEYS_FILE, JSON.stringify(defaultKeys, null, 2), 'utf8');
    return defaultKeys;
  }
  try {
    return JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'));
  } catch (e) {
    return {};
  }
}

function saveKeys(keysData) {
  fs.writeFileSync(KEYS_FILE, JSON.stringify(keysData, null, 2), 'utf8');
}

function checkAccessKey(key) {
  const cleanKey = String(key || '').trim();
  if (!cleanKey) {
    return { valid: false, error: 'សូមបញ្ជាក់ Access Key របស់អ្នក ឬ ទាក់ទង CHHIT ដើម្បីសុំសិទ្ធិប្រើប្រាស់!' };
  }
  if (cleanKey === ADMIN_PASSCODE || cleanKey === 'CHHIT-ADMIN-VIP') {
    return { valid: true, isAdmin: true, limit: -1, used: 0, userName: 'CHHIT (Admin)' };
  }
  const keys = loadKeys();
  const kObj = keys[cleanKey];
  if (!kObj) {
    return { valid: false, error: 'Access Key មិនត្រឹមត្រូវ! សូមទាក់ទង CHHIT ដើម្បីសុំសិទ្ធិប្រើប្រាស់ (Approve)' };
  }
  if (kObj.status !== 'approved') {
    return { valid: false, error: 'Access Key របស់អ្នកត្រូវបានផ្អាកសិទ្ធិ! សូមទាក់ទង CHHIT' };
  }
  if (kObj.limit !== -1 && kObj.used >= kObj.limit) {
    return { valid: false, error: `អ្នកបានប្រើប្រាស់អស់ចំនួនកំណត់ (${kObj.limit} វីដេអូ) ហើយ! សូមទាក់ទង CHHIT ដើម្បីបន្ថែមសិទ្ធិ` };
  }
  return { valid: true, keyObj: kObj, isAdmin: false, userName: kObj.userName };
}

function incrementKeyUsage(key) {
  const cleanKey = String(key || '').trim();
  if (cleanKey === ADMIN_PASSCODE || cleanKey === 'CHHIT-ADMIN-VIP') return;
  const keys = loadKeys();
  if (keys[cleanKey]) {
    keys[cleanKey].used = (keys[cleanKey].used || 0) + 1;
    saveKeys(keys);
  }
}

// ---------------------------------------------------------------------------
// Real-time Active Online Users Tracker (Live Sessions)
// ---------------------------------------------------------------------------
const activeSessions = {};

setInterval(() => {
  const now = Date.now();
  Object.keys(activeSessions).forEach((id) => {
    if (now - activeSessions[id].lastSeen > 25000) {
      delete activeSessions[id];
    }
  });
}, 5000);

app.post('/api/heartbeat', (req, res) => {
  const { sessionId } = req.body || {};
  const key = req.headers['x-access-key'] || req.body.accessKey || '';
  const auth = checkAccessKey(key);

  const id = sessionId || req.ip || 'session-default';
  activeSessions[id] = {
    key: key,
    userName: auth.valid ? (auth.userName || 'Approved User') : 'Guest User',
    isAdmin: Boolean(auth.isAdmin),
    lastSeen: Date.now(),
  };

  const now = Date.now();
  const onlineList = Object.values(activeSessions)
    .filter((s) => now - s.lastSeen <= 25000)
    .map((s) => ({ userName: s.userName, isAdmin: s.isAdmin, key: s.key }));

  res.json({
    onlineCount: onlineList.length,
    users: onlineList,
  });
});

// Access Key verification endpoint
app.get('/api/access/verify', (req, res) => {
  const key = req.query.key || req.headers['x-access-key'];
  const result = checkAccessKey(key);
  res.json(result);
});

// Admin management endpoints (only accessible with ADMIN_PASSCODE or CHHIT-ADMIN-VIP)
app.post('/api/admin/keys', (req, res) => {
  const adminKey = req.headers['x-access-key'] || req.body.adminKey;
  if (adminKey !== ADMIN_PASSCODE && adminKey !== 'CHHIT-ADMIN-VIP') {
    return res.status(403).json({ error: 'សិទ្ធិជា Admin (CHHIT) ប៉ុណ្ណោះដែលអាចបើកប្រព័ន្ធនេះបាន!' });
  }

  const { action, userName, limit, keyToManage } = req.body || {};
  const keys = loadKeys();

  const now = Date.now();
  const onlineList = Object.values(activeSessions)
    .filter((s) => now - s.lastSeen <= 25000)
    .map((s) => ({ userName: s.userName, isAdmin: s.isAdmin, key: s.key }));

  if (action === 'list') {
    return res.json({ success: true, keys, onlineCount: onlineList.length, onlineUsers: onlineList });
  }

  if (action === 'create') {
    const newKey = `CHHIT-${(userName || 'USER').toUpperCase().replace(/[^A-Z0-9]/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    keys[newKey] = {
      userName: userName || 'User',
      limit: Number(limit) === -1 ? -1 : Number(limit) || 5,
      used: 0,
      status: 'approved',
      createdAt: new Date().toISOString()
    };
    saveKeys(keys);
    return res.json({ success: true, key: newKey, keys });
  }

  if (action === 'toggle') {
    if (keys[keyToManage]) {
      keys[keyToManage].status = keys[keyToManage].status === 'approved' ? 'suspended' : 'approved';
      saveKeys(keys);
    }
    return res.json({ success: true, keys });
  }

  if (action === 'delete') {
    if (keys[keyToManage]) {
      delete keys[keyToManage];
      saveKeys(keys);
    }
    return res.json({ success: true, keys });
  }

  return res.status(400).json({ error: 'Invalid admin action.' });
});

// ---------------------------------------------------------------------------
// Upload: save the source video, pull out a clean mono/16k wav for the model,
// and read duration with ffprobe.
// ---------------------------------------------------------------------------

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const id = randomUUID();
    req.uploadId = id;
    const dir = path.join(UPLOAD_ROOT, id);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.mp4';
    cb(null, `source${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } });

app.post('/api/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file received.' });

    const id = req.uploadId;
    const dir = path.join(UPLOAD_ROOT, id);
    const sourcePath = req.file.path;
    const audioPath = path.join(dir, 'audio.wav');
    const previewPath = path.join(dir, 'preview.mp4');

    // 1. Extract audio wav for Gemini
    await execFileAsync(FFMPEG_PATH, [
      '-y', '-i', sourcePath,
      '-ac', '1', '-ar', '16000', '-vn',
      audioPath,
    ]);

    // 2. Transcode / remux to universal browser-compatible preview.mp4 (H.264 + YUV420P)
    try {
      await execFileAsync('ffmpeg', [
        '-y', '-i', sourcePath,
        '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'superfast', '-crf', '23',
        '-c:a', 'aac', '-b:a', '128k',
        previewPath,
      ]);
    } catch (e) {
      console.warn('Preview transcoding warning, fallback to source:', e.message);
    }

    const finalPreview = fs.existsSync(previewPath) ? 'preview.mp4' : path.basename(sourcePath);

    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      sourcePath,
    ]);
    const duration = parseFloat(stdout.trim()) || 0;

    res.json({
      id,
      videoUrl: `/media/${id}/${finalPreview}`,
      duration,
    });
  } catch (err) {
    console.error('upload failed:', err);
    res.status(500).json({ error: 'Upload or audio extraction failed.', detail: String(err.message || err) });
  }
});

// ---------------------------------------------------------------------------
// Silence detection — used to snap caption boundaries onto real pauses in
// the audio instead of trusting the model's timestamps blindly. This is the
// "poor man's forced alignment" mentioned in the build plan: it doesn't give
// per-phoneme accuracy the way a trained Khmer aligner (KFA) would, but it
// keeps caption cuts from landing mid-word.
// ---------------------------------------------------------------------------

async function detectSilences(audioPath) {
  try {
    const { stderr } = await execFileAsync('ffmpeg', [
      '-i', audioPath,
      '-af', 'silencedetect=noise=-30dB:d=0.15',
      '-f', 'null', '-',
    ]);
    const silences = [];
    const startRe = /silence_start:\s*([\d.]+)/g;
    const endRe = /silence_end:\s*([\d.]+)/g;
    const starts = [...stderr.matchAll(startRe)].map((m) => parseFloat(m[1]));
    const ends = [...stderr.matchAll(endRe)].map((m) => parseFloat(m[1]));
    for (let i = 0; i < Math.min(starts.length, ends.length); i += 1) {
      silences.push({ start: starts[i], end: ends[i] });
    }
    return silences;
  } catch (err) {
    console.warn('silence detection skipped:', err.message);
    return [];
  }
}

function snapToNearestSilenceEdge(t, silences, tolerance = 0.2) {
  let best = t;
  let bestDist = tolerance;
  for (const s of silences) {
    for (const edge of [s.start, s.end]) {
      const d = Math.abs(edge - t);
      if (d < bestDist) {
        bestDist = d;
        best = edge;
      }
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Transcription — Gemini when a key is configured, otherwise a small mock
// transcript so the editor UI is fully testable without an API key.
// ---------------------------------------------------------------------------

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

function buildPrompt(context, glossary, language = 'km') {
  const glossaryLine = glossary.length
    ? `Protected vocabulary — spell these EXACTLY as given whenever they occur (do not translate or respell them): ${glossary.join(', ')}.`
    : 'No protected vocabulary was provided.';

  let langInstruction = 'You are transcribing spoken Khmer audio into short on-screen caption chunks (2 to 6 words each, the way TikTok/CapCut captions are grouped — not full sentences).\n\nCRITICAL KHMER SPELLING RULE: In written Khmer, words within a phrase MUST be written continuously WITHOUT spaces between adjacent Khmer words (e.g. write "អញ្ចឹងខ្ញុំនឹង", NOT "អញ្ចឹង ខ្ញុំ នឹង"). Keep spaces ONLY before and after English words/loanwords or at major clause boundaries.';

  if (language === 'km_to_en') {
    langInstruction = 'You are listening to spoken Khmer audio. Your task is to TRANSLATE the spoken Khmer speech into clear, natural, catchy English on-screen caption chunks (2 to 6 words each, TikTok/CapCut subtitle style — not long formal paragraphs).\n\nTranslate spoken Khmer accurately into fluent English captions that sync with the timing of the speech.';
  } else if (language === 'en') {
    langInstruction = 'You are transcribing spoken English audio into short on-screen caption chunks (2 to 6 words each, TikTok/CapCut subtitle style).\n\nTranscribe speech into clear, natural, accurate English captions.';
  } else if (language === 'auto') {
    langInstruction = 'You are transcribing spoken audio into short on-screen caption chunks (2 to 6 words each, TikTok/CapCut subtitle style).\n\nTranscribe speech into clear, natural, accurate captions in the spoken language (Khmer, English, or mixed Khmer/English). When writing Khmer, ensure words within a phrase are written continuously WITHOUT spaces between adjacent Khmer words.';
  }

  return `${langInstruction}

Context about this video (use it to resolve ambiguous words, names, and topic-specific terms): ${context || 'none provided'}.
${glossaryLine}

Return ONLY a JSON array, no prose, no markdown fences. Each element:
{"text": "<caption chunk>", "start": <seconds, number>, "end": <seconds, number>}

Timestamps must be in seconds from the start of the audio, strictly increasing, and should not overlap.`;
}

function buildMockCaptions(context) {
  const topic = context && context.trim() ? context.trim() : 'ការសាកល្បងកម្មវិធី';
  return [
    { text: 'អ្នកដឹងទេ', start: 0.4, end: 1.1 },
    { text: 'ថាវីដេអូនេះ', start: 1.1, end: 2.0 },
    { text: 'ធ្វើអ្វី', start: 2.0, end: 2.6 },
    { text: `កំពុងនិយាយអំពី${topic}`, start: 3.0, end: 4.8 },
    { text: 'នេះជា caption សាកល្បង', start: 5.0, end: 6.4 },
    { text: '(no GEMINI_API_KEY set — add one in .env for real transcription)', start: 6.6, end: 9.0 },
  ];
}

function extractJsonArray(text) {
  const cleanText = String(text || '').replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = cleanText.indexOf('[');
  const end = cleanText.lastIndexOf(']');
  if (start === -1 || end === -1 || end < start) throw new Error('No JSON array found in model response.');
  return JSON.parse(cleanText.slice(start, end + 1));
}

async function transcribeWithGemini(audioPath, context, glossary, language = 'km') {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: { responseMimeType: 'application/json' },
  });

  const audioBase64 = fs.readFileSync(audioPath).toString('base64');
  const prompt = buildPrompt(context, glossary, language);

  const result = await model.generateContent([
    { inlineData: { mimeType: 'audio/wav', data: audioBase64 } },
    { text: prompt },
  ]);

  const text = result.response.text();
  return extractJsonArray(text);
}

app.post('/api/transcribe', async (req, res) => {
  try {
    const { id, context = '', glossary = [], language = 'km' } = req.body || {};
    if (!id) return res.status(400).json({ error: 'Missing upload id.' });

    const dir = path.join(UPLOAD_ROOT, id);
    const audioPath = path.join(dir, 'audio.wav');
    if (!fs.existsSync(audioPath)) return res.status(404).json({ error: 'Unknown upload id — upload the video again.' });

    let captions;
    let usedMock = false;

    if (GEMINI_API_KEY) {
      try {
        captions = await transcribeWithGemini(audioPath, context, glossary, language);
      } catch (err) {
        console.error('Gemini transcription failed:', err);
        return res.status(500).json({
          error: 'Gemini Transcription Error',
          detail: String(err.message || err),
        });
      }
    } else {
      captions = buildMockCaptions(context);
      usedMock = true;
    }

    const silences = usedMock ? [] : await detectSilences(audioPath);
    const aligned = captions.map((c) => ({
      text: cleanKhmerSpaces(String(c.text || '').trim()),
      start: Number((snapToNearestSilenceEdge(Number(c.start) || 0, silences)).toFixed(2)),
      end: Number((snapToNearestSilenceEdge(Number(c.end) || 0, silences)).toFixed(2)),
    }));

    res.json({ captions: aligned, usedMock });
  } catch (err) {
    console.error('transcribe failed:', err);
    res.status(500).json({ error: 'Transcription failed.', detail: String(err.message || err) });
  }
});

// ---------------------------------------------------------------------------
// Export .SRT
// ---------------------------------------------------------------------------

function srtTimestamp(seconds) {
  const s = Math.max(0, Number(seconds) || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const ms = Math.round((s - Math.floor(s)) * 1000);
  const pad = (n, len = 2) => String(n).padStart(len, '0');
  return `${pad(h)}:${pad(m)}:${pad(sec)},${pad(ms, 3)}`;
}

app.post('/api/export-srt', (req, res) => {
  const { captions = [] } = req.body || {};
  const body = captions
    .map((c, i) => `${i + 1}\n${srtTimestamp(c.start)} --> ${srtTimestamp(c.end)}\n${c.text}\n`)
    .join('\n');

  res.setHeader('Content-Type', 'application/x-subrip; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="captions.srt"');
  res.send(body);
});

// ---------------------------------------------------------------------------
// Export Video with Burned-In Captions (Normal or Green Screen)
// ---------------------------------------------------------------------------

function srtToAssTimestamp(seconds) {
  const s = Math.max(0, Number(seconds) || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const cs = Math.floor((s - Math.floor(s)) * 100);
  const pad = (n, len = 2) => String(n).padStart(len, '0');
  return `${h}:${pad(m)}:${pad(sec)}.${pad(cs, 2)}`;
}

function hexToAssColor(hex, opacity = 1.0) {
  if (!hex || hex === 'transparent') return '&HFF000000';
  const clean = String(hex).replace('#', '').trim();
  if (clean.length !== 6) return '&H0066E0FF';
  const rr = clean.slice(0, 2);
  const gg = clean.slice(2, 4);
  const bb = clean.slice(4, 6);
  const alphaVal = Math.max(0, Math.min(255, Math.round((1 - opacity) * 255)));
  const alphaHex = alphaVal.toString(16).padStart(2, '0').toUpperCase();
  return `&H${alphaHex}${bb}${gg}${rr}`.toUpperCase();
}

function generateAssContent(captions, width = 1280, height = 720, styleOptions = {}, videoDuration = 0) {
  const {
    fontName = 'Noto Sans Khmer',
    color = '#ffe066',
    strokeColor = '#000000',
    strokeWidth = 'none',
    bgColor = '#000000',
    fontSizeOption = 'medium',
    position = 'bottom',
    posYPercent = 12,
  } = styleOptions;

  const bgStyle = styleOptions.bgStyle || 'pill';

  // Enforce Noto Sans Khmer for libass to guarantee 100% accurate subscript (ជើង) shaping on export
  const safeFontName = 'Noto Sans Khmer';

  let sizeMultiplier = 0.048;
  if (fontSizeOption === 'small') sizeMultiplier = 0.036;
  if (fontSizeOption === 'large') sizeMultiplier = 0.060;
  if (fontSizeOption === 'xlarge') sizeMultiplier = 0.072;
  const fontSize = Math.max(20, Math.round(height * sizeMultiplier));

  let borderStyle = 1;
  let outlinePx = 0;
  let shadowPx = 0;
  let backColour = '&HFF000000';
  let outlineColour = '&HFF000000';

  if (bgStyle === 'pill' || bgStyle === 'solid-black' || bgStyle === 'solid-white' || bgStyle === 'custom') {
    borderStyle = 3; // Opaque Box shape in ASS
    outlinePx = Math.max(8, Math.round(fontSize * 0.16)); // Box Padding in ASS BorderStyle=3
    shadowPx = 0;

    let targetBg = bgColor || '#000000';
    if (bgStyle === 'solid-black') targetBg = '#000000';
    if (bgStyle === 'solid-white') targetBg = '#ffffff';
    if (bgStyle === 'pill') targetBg = '#000000';

    // Must be 1.0 opacity (&H00BBGGRR) for libass to render the background box pill
    backColour = hexToAssColor(targetBg, 1.0);
  } else {
    borderStyle = 1;
    shadowPx = 1;
    if (strokeWidth !== 'none') {
      outlinePx = 3;
      if (strokeWidth === 'thin') outlinePx = 1;
      if (strokeWidth === 'thick') outlinePx = 5;
      if (strokeWidth === 'xthick') outlinePx = 8;
      outlineColour = hexToAssColor(strokeColor || '#000000', 1.0);
    }
  }

  let alignment = 2; // Bottom Center
  let percent = Number(posYPercent);
  if (isNaN(percent)) {
    if (position === 'center') percent = 45;
    else if (position === 'top') percent = 78;
    else percent = 12;
  }
  const marginV = Math.max(10, Math.round(height * (percent / 100)));

  const primaryColour = hexToAssColor(color, 1.0);

  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: ${width}
PlayResY: ${height}
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${safeFontName},${fontSize},${primaryColour},&H00000000,${outlineColour},${backColour},1,0,0,0,100,100,0,0,${borderStyle},${outlinePx},${shadowPx},${alignment},20,20,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const events = captions
    .map((c, idx) => {
      const isLast = idx === captions.length - 1;
      const startSec = timeToSeconds(c.start);
      let endSec = timeToSeconds(c.end);
      if (isLast && videoDuration > 0) {
        endSec = Math.max(endSec, videoDuration);
      }
      const start = srtToAssTimestamp(startSec);
      const end = srtToAssTimestamp(endSec);
      const text = String(c.text || '').replace(/\r?\n/g, '\\N');
      return `Dialogue: 0,${start},${end},Default,,0,0,0,,${text}`;
    })
    .join('\n');

  return header + events;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function timeToSeconds(val) {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const str = String(val).trim().replace(',', '.');
  const parts = str.split(':');
  if (parts.length === 3) {
    return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
  }
  if (parts.length === 2) {
    return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
  }
  return parseFloat(str) || 0;
}

let FFMPEG_PATH = 'ffmpeg';
try {
  const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
  if (ffmpegInstaller && ffmpegInstaller.path) {
    FFMPEG_PATH = ffmpegInstaller.path;
  }
} catch (e) {}

let CHROMIUM_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
try {
  const puppeteer = require('puppeteer');
  if (puppeteer.executablePath()) {
    CHROMIUM_PATH = puppeteer.executablePath();
  }
} catch (e) {
  const candidatePaths = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      CHROMIUM_PATH = p;
      break;
    }
  }
}

const fontBase64Cache = {};

function getFontBase64(fontFileName) {
  if (fontBase64Cache[fontFileName]) return fontBase64Cache[fontFileName];
  const fontFile = path.join(__dirname, 'fonts', fontFileName);
  if (fs.existsSync(fontFile)) {
    const b64 = fs.readFileSync(fontFile).toString('base64');
    fontBase64Cache[fontFileName] = b64;
    return b64;
  }
  return '';
}

async function generateOverlayPngs(dir, width, height, captions, styleOptions = {}, videoDuration = 0) {
  if (!CHROMIUM_PATH || !fs.existsSync(CHROMIUM_PATH)) return null;

  const {
    fontName = 'Noto Sans Khmer',
    color = '#ffe066',
    strokeColor = '#000000',
    strokeWidth = 'none',
    bgColor = '#000000',
    fontSizeOption = 'medium',
    position = 'bottom',
    posYPercent = 12,
  } = styleOptions;

  const bgStyle = styleOptions.bgStyle || 'pill';

  const fnClean = String(fontName || '').toLowerCase().replace(/\s+/g, '');
  let fontFileName = 'NotoSansKhmer-Bold.ttf';
  if (fnClean.includes('kantumruy')) fontFileName = 'KantumruyPro-Bold.ttf';
  else if (fnClean.includes('santepheap') || fnClean.includes('koh')) fontFileName = 'KohSantepheap-Bold.ttf';
  else fontFileName = 'NotoSansKhmer-Bold.ttf';

  const fontBase64 = getFontBase64(fontFileName);

  let sizeMultiplier = 0.048;
  if (fontSizeOption === 'small') sizeMultiplier = 0.036;
  if (fontSizeOption === 'large') sizeMultiplier = 0.060;
  if (fontSizeOption === 'xlarge') sizeMultiplier = 0.072;
  const fontSizePx = Math.max(20, Math.round(height * sizeMultiplier));

  let percent = Number(posYPercent);
  if (isNaN(percent)) {
    if (position === 'center') percent = 45;
    else if (position === 'top') percent = 78;
    else percent = 12;
  }
  const marginBottomPx = Math.round(height * (percent / 100));

  let bgCss = 'background: rgba(0, 0, 0, 0.78);';
  if (bgStyle === 'none') {
    bgCss = 'background: transparent;';
  } else if (bgStyle === 'solid-black') {
    bgCss = 'background: #000000;';
  } else if (bgStyle === 'solid-white') {
    bgCss = 'background: #ffffff;';
  } else if (bgStyle === 'custom' && bgColor) {
    bgCss = `background: ${bgColor};`;
  }

  let strokeCss = '';
  if (strokeWidth !== 'none') {
    let px = 2;
    if (strokeWidth === 'thin') px = 1;
    if (strokeWidth === 'thick') px = 4;
    if (strokeWidth === 'xthick') px = 6;
    strokeCss = `-webkit-text-stroke: ${px}px ${strokeColor || '#000000'};`;
  }

  const validCaps = captions
    .map((c, idx) => {
      const isLast = idx === captions.length - 1;
      const startSec = timeToSeconds(c.start);
      let endSec = timeToSeconds(c.end);
      if (isLast && videoDuration > 0) {
        endSec = Math.max(endSec, videoDuration);
      }
      return {
        index: idx,
        text: String(c.text || '').trim(),
        start: startSec,
        end: endSec,
        isLast,
      };
    })
    .filter((c) => c.text && c.end > c.start);

  if (validCaps.length === 0) return [];

  const items = [];
  const batchSize = 10;

  for (let i = 0; i < validCaps.length; i += batchSize) {
    const chunk = validCaps.slice(i, i + batchSize);
    await Promise.all(
      chunk.map(async (cap) => {
        const htmlPath = path.join(dir, `overlay_${cap.index}.html`);
        const pngPath = path.join(dir, `overlay_${cap.index}.png`);

        const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @font-face {
    font-family: 'EmbeddedKhmerFont';
    src: url('data:font/ttf;charset=utf-8;base64,${fontBase64}') format('truetype');
  }
  body {
    margin: 0;
    padding: 0;
    width: ${width}px;
    height: ${height}px;
    background: transparent;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    box-sizing: border-box;
  }
  .pill {
    ${bgCss}
    padding: ${Math.max(10, Math.round(fontSizePx * 0.28))}px ${Math.max(18, Math.round(fontSizePx * 0.6))}px;
    border-radius: ${Math.max(12, Math.round(fontSizePx * 0.4))}px;
    margin-bottom: ${marginBottomPx}px;
    max-width: 92%;
    box-sizing: border-box;
  }
  .text {
    font-family: 'EmbeddedKhmerFont', sans-serif;
    font-size: ${fontSizePx}px;
    font-weight: bold;
    color: ${color || '#ffe066'};
    text-align: center;
    line-height: 1.35;
    ${strokeCss}
    white-space: pre-wrap;
    word-break: break-word;
  }
</style>
</head>
<body>
  <div class="pill">
    <div class="text">${escapeHtml(cap.text)}</div>
  </div>
</body>
</html>`;

        fs.writeFileSync(htmlPath, html, 'utf8');

        try {
          await execFileAsync(CHROMIUM_PATH, [
            '--headless',
            '--disable-gpu',
            '--hide-scrollbars',
            '--default-background-color=00000000',
            `--window-size=${width},${height}`,
            `--screenshot=${pngPath}`,
            `file:///${htmlPath.replace(/\\/g, '/')}`
          ], { maxBuffer: 10 * 1024 * 1024 });

          items.push({
            index: cap.index,
            pngName: `overlay_${cap.index}.png`,
            start: cap.start.toFixed(3),
            end: cap.end.toFixed(3),
          });
        } catch (e) {
          console.warn(`Overlay generation failed for index ${cap.index}:`, e.message);
        }
      })
    );
  }

  items.sort((a, b) => a.index - b.index);
  return items;
}

app.post('/api/export-video', async (req, res) => {
  try {
    const { id, captions = [], greenScreen = false, style = {} } = req.body || {};
    if (!id) return res.status(400).json({ error: 'Missing upload id.' });

    const dir = path.join(UPLOAD_ROOT, id);
    if (!fs.existsSync(dir)) return res.status(404).json({ error: 'Upload directory not found.' });

    const files = fs.readdirSync(dir);
    const sourceFile = files.find((f) => f.startsWith('source'));
    if (!sourceFile) return res.status(404).json({ error: 'Source video file not found.' });

    const sourcePath = path.join(dir, sourceFile);
    const assPath = path.join(dir, 'captions.ass');
    const outputFilename = greenScreen ? 'output_greenscreen.mp4' : 'output_captioned.mp4';
    const outputPath = path.join(dir, outputFilename);

    let width = 1280;
    let height = 720;
    let duration = 0;
    try {
      const { stdout } = await execFileAsync('ffprobe', [
        '-v', 'error',
        '-select_streams', 'v:0',
        '-show_entries', 'stream=width,height:format=duration',
        '-of', 'csv=s=x:p=0',
        sourcePath,
      ]);
      const parts = stdout.trim().split('x');
      const w = Number(parts[0]);
      const h = Number(parts[1]);
      if (w && h) {
        width = w;
        height = h;
      }
    } catch (e) {
      console.warn('ffprobe dimension check failed, using default:', e.message);
    }

    try {
      const { stdout } = await execFileAsync('ffprobe', [
        '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        sourcePath,
      ]);
      const d = parseFloat(stdout.trim());
      if (d && !isNaN(d)) duration = d;
    } catch (e) {}

    const assData = generateAssContent(captions, width, height, style, duration);
    fs.writeFileSync(assPath, assData, 'utf8');

    // Try HTML HarfBuzz overlay engine
    const overlayItems = await generateOverlayPngs(dir, width, height, captions, style, duration);

    let ffmpegArgs = [];

    if (overlayItems && overlayItems.length > 0) {
      console.log(`Using Chrome HarfBuzz PNG overlay engine for ${overlayItems.length} captions...`);
      let filterStr = '';
      let prevStream = greenScreen ? 'bg' : '0:v';

      overlayItems.forEach((item, idx) => {
        const isLast = idx === overlayItems.length - 1;
        const outStream = isLast ? 'outv' : `v${idx + 1}`;
        const inputIdx = idx + 1;
        const enableCond = isLast ? `gte(t,${item.start})` : `between(t,${item.start},${item.end})`;
        filterStr += `[${prevStream}][${inputIdx}:v]overlay=0:0:enable='${enableCond}'[${outStream}];`;
        prevStream = outStream;
      });
      filterStr = filterStr.slice(0, -1);

      if (greenScreen) {
        ffmpegArgs = [
          '-y',
          '-i', sourceFile,
          ...overlayItems.flatMap((item) => ['-i', item.pngName]),
          '-filter_complex', `color=c=0x00ff00:s=${width}x${height}${duration ? `:d=${duration}` : ''}[bg];${filterStr}`,
          '-map', '[outv]',
          '-map', '0:a?',
          '-c:v', 'libx264',
          '-preset', 'slow',
          '-crf', '16',
          '-c:a', 'copy',
          outputFilename,
        ];
      } else {
        ffmpegArgs = [
          '-y',
          '-i', sourceFile,
          ...overlayItems.flatMap(item => ['-i', item.pngName]),
          '-filter_complex', filterStr,
          '-map', '[outv]',
          '-map', '0:a?',
          '-c:v', 'libx264',
          '-preset', 'slow',
          '-crf', '16',
          '-c:a', 'copy',
          outputFilename,
        ];
      }
    } else {
      console.log('Falling back to ASS subtitle filter...');
      const fontsDirSource = path.join(__dirname, 'fonts');
      if (fs.existsSync(fontsDirSource)) {
        const fontFiles = fs.readdirSync(fontsDirSource);
        for (const fontFile of fontFiles) {
          if (fontFile.endsWith('.ttf') || fontFile.endsWith('.otf')) {
            const srcPath = path.join(fontsDirSource, fontFile);
            const destPath = path.join(dir, fontFile);
            if (!fs.existsSync(destPath)) {
              try {
                fs.copyFileSync(srcPath, destPath);
              } catch (e) {
                console.warn('Could not copy font file:', fontFile, e.message);
              }
            }
          }
        }
      }

      if (greenScreen) {
        ffmpegArgs = [
          '-y',
          '-i', sourceFile,
          '-filter_complex', `color=c=0x00ff00:s=${width}x${height}[bg];[bg]subtitles=filename=captions.ass:fontsdir=.[v]`,
          '-map', '[v]',
          '-map', '0:a?',
          '-c:v', 'libx264',
          '-preset', 'superfast',
          '-crf', '18',
          '-c:a', 'copy',
          '-shortest',
          outputFilename,
        ];
      } else {
        ffmpegArgs = [
          '-y',
          '-i', sourceFile,
          '-vf', 'subtitles=filename=captions.ass:fontsdir=.',
          '-c:v', 'libx264',
          '-preset', 'superfast',
          '-crf', '18',
          '-c:a', 'copy',
          outputFilename,
        ];
      }
    }

    await execFileAsync(FFMPEG_PATH, ffmpegArgs, { cwd: dir, maxBuffer: 100 * 1024 * 1024 });

    const key = req.headers['x-access-key'] || req.body.accessKey;
    incrementKeyUsage(key);

    const downloadName = greenScreen ? 'captions_greenscreen.mp4' : 'video_with_captions.mp4';
    res.download(outputPath, downloadName, (err) => {
      if (err && !res.headersSent) {
        console.error('Download error:', err);
      }
    });
  } catch (err) {
    console.error('export video failed:', err);
    res.status(500).json({ error: 'Video export failed.', detail: String(err.message || err) });
  }
});


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, geminiConfigured: Boolean(GEMINI_API_KEY), model: GEMINI_MODEL });
});

if (process.env.VERCEL) {
  module.exports = app;
} else {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Khmer Caption Studio running at http://0.0.0.0:${PORT}`);
    console.log(GEMINI_API_KEY ? `Using Gemini model: ${GEMINI_MODEL}` : 'No GEMINI_API_KEY set — running in mock-transcript mode.');
  });
}

