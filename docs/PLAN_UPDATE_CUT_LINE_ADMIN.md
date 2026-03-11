# Plan Update: Cut Line and Admin Page

Add the following to the Auto-Pull RapidAPI Results plan.

---

## New Section 6a. Admin Page: Cut Line Score Field

**Location**: Insert after Section 6 (Admin Manual Refresh), before Section 7.

**Content**:

When using Live API, cut status comes from the leaderboard data—we do not calculate it. The **Cut Line Score** field on the admin page ([FrontEnd/app/admin/tournaments/[id]/page.tsx](FrontEnd/app/admin/tournaments/[id]/page.tsx)) should be reframed:

- **Purpose**: Testing (dummy/seed data, `apply-cut-line-score` script) and fallback when the API does not provide cut status. Not required for live tournaments when API provides cut per golfer.
- **When `fieldSource` is `'live'`**: Add helper text near the Cut Line Score input: *"When using Live API, cut status comes from the data. This field is only used for dummy data and when the API doesn't provide cut info."*
- **Keep the field** for backward compatibility and testing, but make it clear admins do not need to set it for live tournaments. Optionally move it into a "Testing / Advanced" collapsible section when `fieldSource` is `'live'`.
- **cutLineScore retention**: Keep in schedule and types for: (a) dummy/seed data generation, (b) `apply-cut-line-score` script (manual JSON processing), (c) fallback when API lacks cut info. Do not remove—only clarify its role in the UI.

---

## Summary of Cut Philosophy (for reference)

| Source | When to use |
|--------|-------------|
| **API cut status** | Primary when syncing from RapidAPI. Use `madeCut`, `cut`, `status: 'CUT'` etc. per golfer. No calculation. |
| **cutLineScore** | Fallback only: dummy data, seed data, apply-cut-line-score script, or when API does not provide cut info. |
| **Admin page** | Field stays for testing/fallback; UI clarifies it's not needed for live tournaments when API provides cut. |
