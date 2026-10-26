# Netloop

Draw a loop. Drop the bad packets.

A hand-drawn firewall game for phone browsers, built with Next.js 16, TypeScript and an HTML canvas.

## Run

```bash
npm install
npm run dev
```

Open the printed URL, ideally in your browser's phone view (F12, then Ctrl+Shift+M). To try it on your phone, open the `Network:` URL while it's on the same Wi-Fi.

`npm run build` must pass before you open a PR.

## Folders

| Path | What | Owner |
|---|---|---|
| `src/features/home/` | main page | Gab |
| `src/features/zones/` | zone map | Gab |
| `src/features/play/` | fight, power-up, results | Gab |
| `src/features/codex/` | Codex screen | earl |
| `src/features/shop/` | Shop screen | earl |
| `src/components/` | shared buttons, pills, sheet, icons, `<Sprite>` | shared |
| `src/lib/progress.ts` | save data (data balance, stars, unlocks, inventory) | shared |
| `src/game/` | engine, renderer, enemies, patches (no React) | Gab |
| `src/data/stages.ts` | the 5 demo zones | Gab |
| `public/sprites/` | SVG sprite frames and `preview.html` | shared |

Work only inside your own folder, on a branch, and open a PR into `main`.

Code has no comments. All docs live in the team's Obsidian vault (`Netloop — Hub`).
