# Changelog

All notable changes to _Folio_ are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/DanielGilbert/folio/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/DanielGilbert/folio/releases/tag/v1.0.0
