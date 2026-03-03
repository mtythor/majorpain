# Responsive Layout Guide

Reference for refactoring other pages (draft, admin, results, etc.) to match the responsive patterns established for tournament list, table, and season views.

---

## Layout Structure

**Root layout** (`app/layout.tsx`) wraps all pages with:
- `MobileLayoutWrapper` — flex column on mobile (max-width: 767px); main content scrolls, footer stays fixed
- `mobile-layout-main` — scrollable content area
- `MobileFooterNav` — fixed at bottom on routes like `/tournament`, `/season`, `/draft`, `/admin`

Pages don't need to manage the footer or scroll container; that’s handled globally.

---

## Breakpoints (from `globals.css`)

| Variable | Value | Use |
|----------|-------|-----|
| `--breakpoint-mobile` | 767px | Mobile vs desktop layout |
| `--breakpoint-desktop-picker` | 816px | Picker/venue width constraints |

Media query usage:
- **Mobile**: `@media (max-width: 767px)` — flex column, footer fixed
- **Desktop (768px+)**: `@media (min-width: 768px)` — layout and vertical spacing
- **Wide (816px+)**: `@media (min-width: 816px)` — picker width, venue visibility

Use the `useIsMobile()` hook in components when you need breakpoint-aware logic.

---

## Vertical Stack (Header → Picker → Content)

Heights and spacing:

| Region | Mobile | Desktop |
|--------|--------|---------|
| Header (logo + nav/controls) | ~97px | ~160px |
| Gap below header | 8px | 8px |
| **Picker top** | **105px** | **168px** |
| Picker height | 48px | 48px |
| Gap below picker | 16px | 16px |
| **Content top** | **169px** | **232px** |

On pages **without** a picker, set content top to **105px** (mobile) / **168px** (desktop) so content aligns with the header.

---

## CSS Classes to Use

| Class | Where | Purpose |
|-------|-------|---------|
| `tournament-picker` | TournamentPicker | Positions the tournament dropdown (105px / 168px) |
| `season-picker` | SeasonPicker | Same picker positioning for season view |
| `tournament-list-content` | List view content | Content below picker (169px / 232px, full-width mobile) |
| `tournament-venue-desktop` | TournamentVenue wrapper | Hidden on mobile, visible at 816px+ |

For **inline content positioning** when a shared class doesn’t fit (e.g. loading states, varied layouts), use:
- `top: '169px'` (mobile) / `'232px'` (desktop)
- `left: isMobile ? 0 : '50%'`, `transform: isMobile ? 'none' : 'translateX(-50%)'`
- `width: isMobile ? '100%' : '…'`, `padding: isMobile ? '0 8px' : 0`

---

## Page Pattern Checklist

When refactoring a page to be responsive:

1. **Page container**: `position: 'relative'`, `width: '100%'`, `minHeight: '100vh'`
2. **Background**: `BackgroundImage` as first child
3. **Header**: Always use the shared `Header` component (same stripes, logo, nav)
4. **Picker** (if any): Add the `tournament-picker` or `season-picker` class in CSS; don’t use hardcoded `top`
5. **Content**:
   - With picker: `top: 169px` mobile, `232px` desktop
   - Without picker: `top: 105px` mobile, `168px` desktop
6. **Mobile**: Use `width: 100%`, `overflow-x: hidden` / `auto` where needed; add `padding: 0 8px` for side padding
7. **Venue/decorative elements**: Put in `tournament-venue-desktop` wrapper so they’re desktop-only

---

## Other Notes

- **Mobile footer**: `MobileFooterNav` shows based on `pathname?.startsWith('/tournament')`, `/season`, `/draft`, `/admin`. Add new routes here if needed.
- **Overflow**: Use `overflow-x: hidden` on layout containers to avoid horizontal scroll on mobile.
- **Width constraints**: List/table content uses `var(--tournament-list-width)` (800px) and `width: min(100%, …)` for responsiveness.
