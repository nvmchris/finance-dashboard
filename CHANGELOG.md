# Changelog

All notable changes to this project are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and the project follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed

- Dark purple and turquoise theme shared with the other homelab tools; the light/dark toggle now renders the same palette (#18).

### Added

- Project setup: Vite, React, TypeScript, ESLint, Prettier, Vitest and CI.
- Data model with integer-cent amounts, default categories and keyword rules.
- Statistics: monthly summaries, cash flow, spending by category, running balance.
- localStorage persistence, JSON backup parsing and deterministic demo data.
- CSV import with delimiter, column, date and amount detection (German and English formats), duplicate skipping, keyword categorisation and CSV export.
- App shell with month picker, CSV import button, light and dark theme and an empty state with demo data.
- Dashboard: summary tiles with month-over-month change, cash-flow bars, ranked spending by category and a balance line, all dependency-free with hover tooltips.
- Transactions view with search, category and type filters, sortable columns, inline category editing, manual entry, delete and CSV export.
- Budgets: monthly limit per category with progress meters, on-track, close and over-budget states, and a summary card on the dashboard.
- Demo mode via `?demo` that never touches saved data.
- README with screenshots, CSV format guide and project structure.
- Settings: display currency, editable keyword rules with "apply to uncategorised", JSON backup and restore, delete all data.
- Recurring payments: detects monthly charges with a stable amount and shows their monthly and yearly cost.

### Fixed

- Charts no longer overflow their card before the first resize measurement.
- The header no longer overflows on narrow screens.
- The screen-reader table caption is no longer visible in Firefox.
