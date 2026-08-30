# akari310-bio Improvement Plan

> Personal bio/profile website enhancement roadmap
> Deployed at: `https://akari.is-a.dev`

---

## Current State Analysis

**Tech Stack:** Vanilla HTML/CSS/JS, deployed on GitHub Pages (is-a.dev subdomain)
**Key Features:** 3D tilt card, hologram effects, custom cursor, sakura/sparkle particles, Discord presence (Lanyard), music player (local + YouTube), anonymous guestbook, view counter
**Pain Points:** 1000+ line monolithic JS, no build system, security gaps, accessibility issues, performance concerns

---

## Phase 1: Critical Fixes (Security & Performance) ⚡

### 1.1 Move Discord Webhook to Backend
- **Risk:** Webhook URL exposed in client (base64 obfuscation only)
- **Solution:** Create serverless function (Netlify Functions / Vercel API / Cloudflare Workers)
- **Files:** `netlify/functions/send-message.js` or `api/send-message.ts`
- **Change:** Frontend calls `/api/message` instead of Discord webhook directly

### 1.2 Add Content Security Policy
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'wasm-unsafe-eval' https://www.youtube.com https://api.lanyard.rest https://cdn.discordapp.com;
               style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com;
               font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com;
               img-src 'self' data: https: blob:;
               connect-src 'self' https://api.lanyard.rest wss://api.lanyard.rest https://api.counterapi.dev https://discord.com;
               frame-src https://www.youtube.com;">
```

### 1.3 Optimize Animation Loop
- **Current:** 4 separate `requestAnimationFrame` loops running continuously
- **Fix:** Single unified loop with `visibilitychange` pause
- **Canvas resize:** Debounce (only on actual size change, not every frame)
- **Target:** 60fps idle, 0 CPU when tab hidden

### 1.4 Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  #mouse-canvas, #audio-visualizer { display: none !important; }
}
```
- Add user toggle in settings (persisted to localStorage)
- Respect system preference by default

---

## Phase 2: Code Quality & Architecture 🏗️

### 2.1 Modularize JavaScript (ES Modules)
```
assets/js/
├── main.js                 # Entry point
├── config.js               # Constants, playlist, API endpoints
├── modules/
│   ├── audio-player.js     # Music player logic
│   ├── discord-presence.js # Lanyard REST + WebSocket
│   ├── particles.js        # Sakura + Sparkle systems
│   ├── ui-tabs.js          # Tab navigation
│   ├── ui-toast.js         # Toast notifications
│   ├── ui-cursor.js        # Custom cursor
│   ├── ui-tilt.js          # 3D tilt + hologram
│   ├── guestbook.js        # Anonymous message form
│   ├── view-counter.js     # Counter API
│   └── utils.js            # Helpers (formatTime, etc.)
```

### 2.2 Add TypeScript
- `tsconfig.json` with strict mode
- Type definitions for:
  - Lanyard API responses (`discord.d.ts`)
  - Playlist tracks (`playlist.d.ts`)
  - Configuration (`config.d.ts`)

### 2.3 Build Tooling (Vite)
- Dev server with HMR
- Production build: minification, asset hashing, code splitting
- PostCSS for autoprefixer, CSS nesting
- `package.json` scripts: `dev`, `build`, `preview`, `lint`, `typecheck`

### 2.4 Linting & Formatting
- ESLint: `@typescript-eslint`, `eslint-plugin-import`
- Prettier: Single quotes, 2 spaces, trailing commas
- Husky + lint-staged for pre-commit hooks

---

## Phase 3: Accessibility & UX ♿

### 3.1 Keyboard Navigation
- Tab order: Entry → Main card → Tabs → Social links → Player controls
- Enter/Space: Activate buttons, toggle tabs
- Escape: Close modals, exit entry screen
- Focus visible outlines (not removed by `user-select: none`)

### 3.2 ARIA & Semantic HTML
- `role="tablist"`, `role="tab"`, `role="tabpanel"` for tabs
- `aria-live="polite"` for dynamic content (Discord status, now playing)
- `aria-label` on icon-only buttons
- `<main>`, `<nav>`, `<section>` landmarks

### 3.3 Animation Controls
```js
// User preference (localStorage + prefers-reduced-motion)
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const userDisabled = localStorage.getItem('animationsDisabled') === 'true';
const animationsEnabled = !prefersReduced && !userDisabled;
```
- Toggle in settings panel (gear icon in player or footer)
- Disables: sakura, sparkles, tilt, hologram, marquee, float

### 3.4 Custom Cursor Improvements
- Auto-disable on touch (`pointer: coarse`)
- User toggle to disable entirely
- Fallback: `cursor: auto` when disabled

---

## Phase 4: Features & Polish ✨

### 4.1 Theme System (Catppuccin Variants)
| Theme | Background | Surface | Primary |
|-------|-----------|---------|---------|
| Mocha (current) | `#1e1e2e` | `#313244` | `#cba6f7` |
| Latte | `#eff1f5` | `#e6e9ef` | `#8839ef` |
| Frappe | `#303446` | `#414559` | `#ca9ee6` |
| Macchiato | `#24273a` | `#363a4f` | `#c6a0f6` |

- Toggle in settings, persisted to localStorage
- CSS custom properties for all colors
- Smooth transition between themes

### 4.2 Projects/Showcase Tab
- New tab: "Projects" (`tab-projects`)
- Fetch from GitHub API (pinned repos) or local JSON
- Card layout: name, description, language badges, stars, link
- Skeleton loading while fetching

### 4.3 Mobile UX Enhancements
- Touch-friendly tap targets (min 44px)
- Swipe gestures for tab switching
- Responsive grid: single column < 480px, two columns > 480px
- Collapsible player on small screens
- Viewport meta: `viewport-fit=cover` for notches

### 4.4 Error Boundaries & Graceful Degradation
```js
// Each module wraps init in try/catch
try { initDiscordPresence(); } catch { hideActivityCard(); }
try { initAudioPlayer(); } catch { hidePlayer(); }
try { initParticles(); } catch { hideCanvases(); }
```
- User-facing toast: "Some features unavailable"
- No blank white screens if JS fails

---

## Phase 5: DevOps & Deployment 🚀

### 5.1 GitHub Actions Workflow
```yaml
# .github/workflows/ci.yml
- lint (ESLint)
- typecheck (tsc --noEmit)
- test (Vitest - if tests added)
- build (vite build)
- deploy (GitHub Pages / Cloudflare Pages)
```

### 5.2 Dependabot
```yaml
# .github/dependabot.yml
- npm ecosystem, weekly updates
- Group devDependencies
- Auto-merge patch/minor with passing CI
```

### 5.3 Privacy-Friendly Analytics (Optional)
- Self-hosted Umami or Plausible
- No cookies, GDPR compliant
- Track: page views, referrers, tab clicks (anonymous)

---

## File Structure After Refactor

```
accakari310-bio/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .github/
│   ├── workflows/ci.yml
│   └── dependabot.yml
├── netlify/                 # or vercel/, functions/
│   └── functions/
│       └── send-message.ts  # Discord webhook proxy
├── public/                  # Static assets (copied as-is)
│   ├── CNAME
│   └── assets/
│       ├── img/
│       ├── audio/
│       └── fonts/           # Self-hosted fonts (optional)
├── src/
│   ├── main.ts
│   ├── style.css            # Main stylesheet (imports partials)
│   ├── config.ts
│   ├── types/
│   │   ├── discord.d.ts
│   │   ├── playlist.d.ts
│   │   └── config.d.ts
│   ├── modules/
│   │   ├── audio-player.ts
│   │   ├── discord-presence.ts
│   │   ├── particles.ts
│   │   ├── ui-tabs.ts
│   │   ├── ui-toast.ts
│   │   ├── ui-cursor.ts
│   │   ├── ui-tilt.ts
│   │   ├── guestbook.ts
│   │   ├── view-counter.ts
│   │   └── utils.ts
│   └── styles/
│       ├── _variables.css
│       ├── _reset.css
│       ├── _entry.css
│       ├── _card.css
│       ├── _tabs.css
│       ├── _player.css
│       ├── _particles.css
│       ├── _toast.css
│       └── _themes.css
└── dist/                    # Build output (gitignored)
```

---

## Priority Order & Effort

| Phase | Priority | Effort | Impact |
|-------|----------|--------|--------|
| 1.1 Webhook proxy | 🔴 Critical | Low | Security |
| 1.2 CSP | 🔴 Critical | Low | Security |
| 1.3 Animation loop | 🟠 High | Medium | Performance |
| 1.4 Reduced motion | 🟠 High | Low | Accessibility |
| 2.1-2.4 Modularize + TS + Build | 🟡 Medium | High | Maintainability |
| 3.1-3.4 Accessibility | 🟡 Medium | Medium | Compliance/UX |
| 4.1-4.4 Features | 🟢 Low | Medium | Delight |
| 5.1-5.3 DevOps | 🟢 Low | Low | Reliability |

---

## Quick Wins (Can Do Today)

1. ✅ Add CSP meta tag to `index.html`
2. ✅ Add `prefers-reduced-motion` CSS block to `style.css`
3. ✅ Add `visibilitychange` listener to pause main loop
4. ✅ Move webhook to Netlify Function (5 min setup)
5. ✅ Add `preload` for critical fonts/audio

---

## Next Steps

**Choose your starting point:**

1. **Security first** → Implement 1.1 + 1.2 (webhook proxy + CSP)
2. **Performance first** → Implement 1.3 + 1.4 (unified loop + reduced motion)
3. **Full refactor** → Set up Vite + TypeScript + modular structure (Phase 2)
4. **Accessibility audit** → Run axe-core, fix Phase 3 issues

Run `npm create vite@latest . -- --template vanilla-ts` to bootstrap Phase 2, then migrate incrementally.