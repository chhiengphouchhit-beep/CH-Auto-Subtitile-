# CH-Auto-Subtitile- 🎬✨
> **Khmer Caption Studio & Multi-Language AI Subtitle Generator**  
> Developed By **CHHIT** ✨

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Node](https://img.shields.io/badge/Node.js-v18%2B-green.svg)
![Gemini](https://img.shields.io/badge/AI-Gemini%20Flash-gold.svg)

**CH-Auto-Subtitile-** is a modern, high-performance web application designed for automatic video transcription, subtitle generation, and video burning with **100% accurate Khmer OpenType font shaping** (HarfBuzz engine), cute animated progress modals, multi-language AI translation, and built-in Admin User Access Control.

---

## ✨ Features

- 🇰🇭 **Perfect Khmer OpenType Shaping**: Uses Headless Chromium HarfBuzz rendering engine to guarantee 100% accurate Khmer consonant cluster subscripts (`ជើងអក្សរ`) and vowels without broken shaping.
- 🎨 **Custom Font Support**: Render videos with **Kantumruy Pro**, **Koh Santepheap**, or **Noto Sans Khmer**.
- 🌐 **Multi-Language AI Mode**:
  - 🇰🇭 **Khmer Spoken Audio ➔ Khmer Captions** (with Khmer word space stripping)
  - 🔄 **Khmer Spoken Audio ➔ English AI Translation** (Translate Khmer audio directly to English subtitles)
  - 🇺🇸 **English Audio ➔ English Captions**
  - 🌐 **Auto Detect**
- 🌸 **Cute Animated Progress Modals**: Delightful 0% - 100% real-time progress modal with floating sparkles and status messages.
- 👑 **CHHIT Admin Access Manager**:
  - Master Admin Key (`CHHIT`) for controlling access.
  - Approve user keys with custom video export limits (e.g. 5, 10, 20, or Unlimited ♾️).
  - Real-time key approval, pausing, and deletion.
- 🟢 **Live Online Active Users Counter**: Tracks online active users in real-time with pulsating dot indicators.
- 📱 **Fully Responsive UI**: Optimized layout for PC, Tablet, and Mobile Phone screens.

---

## 🚀 Quick Start

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/chhiengphouchhit-beep/CH-Auto-Subtitile-.git
cd CH-Auto-Subtitile-
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
PORT=1100
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
ADMIN_PASSCODE=CHHIT
```

### 3. Run Application
```bash
npm start
```
Open your browser at `http://localhost:1100`.

---

## 👑 CHHIT Admin Panel
Access the Admin Access Manager by entering `CHHIT` into the Access Key field or clicking the **👑 CHHIT Admin** button in the topbar to manage users, create keys, and set export limits.

---

## 👤 Author
Developed with ❤️ by **CHHIT**
