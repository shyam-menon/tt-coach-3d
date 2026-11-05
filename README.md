# TT Coach 3D

An interactive Three.js app for learning table tennis systematically: grip, stance, strokes, serves, serve return, tactics and rules, with 3D close-ups of the hand and racket, slow-motion playback and spin visualisation.

## Features
- 31 lessons across 7 modules, each with key points, wrong-vs-right comparisons (with a "ghost" of the correct stroke), quick quiz and practice drill
- Camera presets: grip close-up, racket face (with face-angle protractor), player's eyes, side, overhead, opponent's view, behind
- Simplified ball physics: gravity, drag, Magnus effect, spin-dependent table bounce
- Serve-return matrix, "Read the serve" and "Spot the mistake" practice modes, progress tracking
- **Ask the Coach**: questions answered by Claude with a generated 3D demo (requires running as a Claude artifact with the `sample` capability)
- Settings for left/right hand, grip style (including a custom "my grip") and forehand rubber colour

## Project layout
- `src/content.js` – curriculum, stroke keyframes, grips, spins, zones, serve-return matrix
- `src/engine.js` – Three.js scene, player rig and IK, ball physics, demo builder, cameras, overlays
- `src/ui.js` – lesson UI, playback, Ask the Coach, practice, progress
- `src/shell.html` – page markup and CSS
- `src/hand-right.glb` – rigged hand model (see licence note below)
- `build.py` – assembles everything into a single self-contained `index.html`
- `tests/` – Playwright scripts used for visual and contact checks

## Build
```bash
python3 build.py prod   # writes index.html (Three.js loaded from jsDelivr)
python3 build.py dev    # writes dev/index.html using a local node_modules/three
```
Open `index.html` in a browser. Ask the Coach only works when hosted as a Claude artifact.

## Third-party
- [three.js](https://threejs.org) (MIT), loaded from CDN
- Hand model: `generic-hand` from [@webxr-input-profiles/assets](https://github.com/immersive-web/webxr-input-profiles), MIT License, Copyright (c) 2019 Amazon
