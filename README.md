<div align="center">

<img src="docs/cover.svg" width="100%" alt="StorySiap — cinematic creative universe" />

<br /><br />

### ✦ Every moment has a story.

**A scroll-driven cinematic experience & a creative space for the moments worth keeping.**

[![Open Live Experience](https://img.shields.io/badge/◉_OPEN_LIVE_EXPERIENCE-C5A4FA?style=for-the-badge&labelColor=12101C&color=C5A4FA)](https://wawanwfs.github.io/siapstory/)
[![Launch Creative Studio](https://img.shields.io/badge/✳_LAUNCH_CREATIVE_STUDIO-D7F4A4?style=for-the-badge&labelColor=12101C&color=D7F4A4)](https://wawanwfs.github.io/siapstory/studio.html)

[![Pages deployment](https://github.com/wawanwfs/siapstory/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/wawanwfs/siapstory/actions/workflows/deploy-pages.yml)
![Static](https://img.shields.io/badge/ARCHITECTURE-STATIC_&_LOCAL--FIRST-241B33?style=flat-square)
![Web](https://img.shields.io/badge/PLATFORM-WEB-241B33?style=flat-square)

<sub>FEEL THE MOMENT · FOLLOW THE MOTION · MAKE IT YOURS</sub>

</div>

---

## ✳ 01 / Beyond the ordinary landing page

**StorySiap** dirancang sebagai pengalaman kreatif yang bergerak bersama pengunjung, dengan arah visual dark cinematic, aksen violet, kedalaman 3D, dan interaksi yang berhubungan dengan posisi scroll.

> A little moment. A whole universe.

<table>
<tr><td width="50%" valign="top">

### ◉ The Experience
- Ambient lighting and floating visual layers
- Scroll-linked chapter progression
- Perspective and interactive depth effects
- Pointer-responsive motion
- Cinematic storytelling and responsive composition

</td><td width="50%" valign="top">

### ✦ In Your Control
- Auto-scroll Play / Pause
- Continuous and chapter-based playback
- Adjustable scroll pacing
- Navigation across the story
- Motion controls and reduced-motion support

</td></tr>
</table>

## ◇ 02 / Creative Studio

**Your image, your atmosphere, your story.**

Open the [Creative Studio](https://wawanwfs.github.io/siapstory/studio.html) to upload an image and give it your own look.

| Tool | Purpose |
| --- | --- |
| **Composition** | Story / feed / square / landscape framing |
| **Color** | Brightness, contrast, saturation, and cinematic presets |
| **Finishing** | Warmth, film grain, and vignette |
| **Live preview** | Inspect the result directly in the browser |
| **Export** | Save edited photos as PNG |

**Local first.** Photo processing takes place in your own browser. Video preview is supported where the browser allows it; video rendering and video export are **not yet supported** in the lightweight published Studio.

---

## ⌁ 03 / Architecture

```mermaid
flowchart LR
    A[User Scroll] --> D[Motion Director]
    B[Auto Scroll] --> D
    C[Pointer Input] --> D
    D --> E[Cinematic Sections]
    D --> F[Visual Atmosphere]
    D --> G[Chapter Transitions]
    H[Creative Studio] --> I[Browser Canvas]
    I --> J[Image Export]
```

The published website lives in `dist/` and is deployed as a static site. GitHub Actions keeps the public site updated when its deployment workflow succeeds.

### Local preview

```bash
git clone https://github.com/wawanwfs/siapstory.git
cd siapstory
python -m http.server 8000 --directory dist
```

Navigate to `http://localhost:8000/`. Or open `dist/index.html` directly when your browser permits standalone HTML assets.

### Deployment

The `.github/workflows/deploy-pages.yml` workflow validates the published HTML, uploads the `dist/` folder, and deploys it to GitHub Pages.

- [Website](https://wawanwfs.github.io/siapstory/)
- [Creative Studio](https://wawanwfs.github.io/siapstory/studio.html)
- [Deployment workflow](https://github.com/wawanwfs/siapstory/actions/workflows/deploy-pages.yml)
- [Repository settings](https://github.com/wawanwfs/siapstory/settings/pages)

---

<div align="center">

### ✳ Make every moment a story.

**Designed to feel alive. Built to make memories.**

<sub>© 2026 StorySiap® · Crafted with motion, made for memories.</sub>

</div>
