# Changelog

All notable changes to _Folio_ are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-05-20

### Added

- Light/dark theme toggle in the status bar; the choice is persisted in `localStorage` and applied before first paint to avoid a flash. Without an explicit choice the system preference is followed.
- The version number in the status bar and welcome screen now links to the changelog on GitHub.

### Changed

- "Start fresh" now creates today's entry and opens the new-topic dialog immediately, so you can start writing in one step instead of navigating two dialogs.
- "Save" in Chrome/Edge now offers to save to a real `.md` file (via the File System Access API) when the journal isn't tied to one yet, then writes directly to that file on subsequent saves — making it clear you can keep editing the file in the browser. Browsers without the API continue to save a local-storage backup and download.
- Replaced all emoji icons with a self-contained inline SVG sprite (Feather/Lucide outline icons). Icons now inherit the surrounding text colour via `currentColor`, so they adapt to the light/dark theme instead of rendering in fixed emoji colours.

## [1.0.0] - 2026-05-20

### Added

- Markdown journal organised by day and topic, stored as a single portable `.md` file.
- Direct file editing via the File System Access API, with an upload/download fallback for other browsers.
- Live Markdown preview powered by an embedded copy of [marked.js](https://marked.js.org) — no internet connection required, `folio.html` is fully self-contained.
- Inline editor with a formatting toolbar (bold, italic, strikethrough, headings, lists, checklist, links, code).
- Interactive checklists: toggling a checkbox in the preview writes the change back to the Markdown.
- Topic templates for quickly creating recurring entries.
- Image embedding via drag & drop or paste, automatically downscaled and recompressed to WebP to keep the journal small (SVG/GIF embedded untouched).
- Full-text search with match highlighting and All / Week / Month views.
- Automatic local-storage backup with a restore prompt, plus an unsaved-changes warning before leaving the page.
- Light and dark themes following the system preference.

[Unreleased]: https://github.com/DanielGilbert/folio/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/DanielGilbert/folio/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/DanielGilbert/folio/releases/tag/v1.0.0
