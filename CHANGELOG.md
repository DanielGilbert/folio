# Changelog

All notable changes to _Folio_ are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.1] - 2026-05-22

### Fixed

- New entries are now dated using the local date instead of UTC. Previously, early in the day in timezones ahead of UTC (e.g. CEST), a new entry could be stamped with the previous day's date. The Week/Month filters use the local date for the same reason.

## [1.2.0] - 2026-05-21

### Added

- Calendar picker (toolbar button next to "Today"): days that contain an entry are filled in the accent colour; clicking one jumps and scrolls to that day. Navigate months with the arrows; the current day is outlined. If a Week/Month filter is hiding the target day, the view falls back to All.

### Fixed

- Deleting, moving, or removing a day no longer jumps the page back to the top — the scroll position is preserved across the re-render.

### Changed

- The "+" action button (FAB) now sits just to the right of the content column on wide screens instead of clinging to the browser's right edge, and only overlaps the content once the viewport gets too narrow.

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

[Unreleased]: https://github.com/DanielGilbert/folio/compare/1.2.1...HEAD
[1.2.1]: https://github.com/DanielGilbert/folio/compare/1.2.0...1.2.1
[1.2.0]: https://github.com/DanielGilbert/folio/compare/1.1.0...1.2.0
[1.1.0]: https://github.com/DanielGilbert/folio/compare/1.0.0...1.1.0
[1.0.0]: https://github.com/DanielGilbert/folio/releases/tag/1.0.0
