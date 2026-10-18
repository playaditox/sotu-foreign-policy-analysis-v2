# Build the current v2 report

The protected Data app runtime remains byte-for-byte intact. Authored content is in `src/content/`, reviewed data in `src/data.json`, and theme tokens in `src/theme.css`. Preserve report identity and source word counts when making changes.

## Portable source build

Use Node 22.12+ and the checked-in lockfile from this directory:

```sh
npm ci
env CODEX_SESSION_ID= CODEX_THREAD_ID= npm run build
python3 -m http.server 4175 --bind 127.0.0.1 --directory dist
```

## Codex authoring build

Resolve the bundled Node executable and installed Data Analytics plugin path, then run its `scripts/data-app.mjs build --project-dir <this-directory> --separate-data` command with `CODEX_SESSION_ID` and `CODEX_THREAD_ID` empty. This uses the installed verified runtime without modifying copied protected files.

Inspect the report and affected controls. Set `buildStatus` to `complete`, rebuild, and copy only `dist/index.html`, the current manifest and its referenced snapshot into `release/`. Do not include old snapshots or archived reports. Regenerate the public release manifest, run public tests, and verify all links before publication. GitHub Pages publishes this one reviewed `release/` directory through the manual workflow.
