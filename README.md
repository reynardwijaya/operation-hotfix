# Operation Hotfix: Logistics Dashboard Rescue

A technical assessment for software engineering interns.

You are stepping in as a new engineer on a broken internal logistics dashboard — **48 hours before a client demo**. Your job is to read the codebase cold, diagnose six live bugs, fix them, and document your process exactly as you would in a real incident.

---

## What We Built

`Logistics-V1` is an internal dashboard used by warehouse staff to track and manage shipments. It provides:

- A paginated table of all shipments with sortable columns
- A live search bar that filters shipments by cargo item name
- An inline status updater (Pending / In Transit / Delivered) via a dropdown per row
- A color-coded status badge per shipment

The previous Senior Frontend Engineer left abruptly mid-sprint without a handover. QA caught six issues during regression. The codebase compiles and runs — but it is lying to you.

---

## Tech Stack

| Layer               | Technology                        |
| ------------------- | --------------------------------- |
| Framework           | Next.js 15 (App Router)           |
| Language            | TypeScript (strict)               |
| Styling             | Tailwind CSS v4                   |
| UI Components       | Radix UI primitives, Lucide React |
| Data Tables         | TanStack Table v8                 |
| Backend / Database  | Supabase (PostgreSQL)             |
| Toast Notifications | Sonner                            |

---

## Setup

### 1. Initialize the Database

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** in your Supabase dashboard
3. Paste the full contents of `legacy_setup.sql` and click **Run**
4. Verify the output shows no errors and the `shipments` table has 5 rows

### 2. Configure Environment Variables

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials from **Project Settings → API**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

### 3. Install and Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you will be redirected to `/dashboard`.

---

## Folder Structure

```
src/
├── actions/
│   ├── search-shipments.ts     # Server Action: search by cargo item name
│   └── update-status.ts        # Server Action: update shipment status
├── app/
│   └── dashboard/
│       └── page.tsx            # Dashboard page (Server Component)
├── components/
│   ├── columns.tsx             # TanStack Table column definitions
│   ├── data-table.tsx          # DataTable client component
│   ├── status-badge.tsx        # Color-coded status badge
│   └── ui/                     # Radix UI primitives (do not modify)
├── lib/
│   └── supabase.ts             # Supabase browser client
├── types/
│   └── shipment.ts             # TypeScript type for a shipment row
└── utils/
    └── normalizeCargoDetails.ts # Utility to normalize cargo_details shape
```

---

## Your Tickets

QA has filed **six** bug reports. All six must be resolved before the client demo. They are ordered from easiest to hardest — start with Level 1.

---

### Bug 1 — [Level 1] Silent RLS Block

> **QA Report:** "The dashboard loads but the table is completely empty — it says 'No Data Found'. The database admin opened Supabase and confirmed all 5 shipment rows are definitely there. Nothing in the browser console shows an error."

**Affected area:** Initial data load  
**Severity:** Critical — the entire table is invisible to all users

---

### Bug 2 — [Level 2] Ghost Mutation

> **QA Report:** "Every single status change shows a green 'Status updated successfully' message, but nothing ever actually saves. Whether I change Pending to In Transit, or anything to Delivered — if I press F5, the status is always the original value. It's like the changes evaporate."

**Affected area:** Status update Server Action  
**Severity:** Critical — no status change of any kind persists

---

### Bug 3 — [Level 3] Infinite Loop

> **QA Report:** "The dashboard freezes immediately when the page loads. I can't click anything. The backend engineer checked the server logs and it's getting hit with hundreds of GET /dashboard requests every second, even when nobody is interacting with the page."

**Affected area:** DataTable client component on mount  
**Severity:** Critical — application is unusable, server is being flooded

---

### Bug 4 — [Level 4] The Invisible Cargo

> **QA Report:** "After fixing the earlier issues, the dashboard loads and shows all 5 rows. But the 'Cargo' column is blank for most rows — no item name, no weight. The only row showing a dash is correct (it has no cargo). The database admin confirmed all cargo data exists in the database."

**Affected area:** Cargo column in the shipments table  
**Severity:** High — core shipment data is invisible to users

---

### Bug 5 — [Level 5] The Unreliable Search

> **QA Report:** "When I use the search box to filter by item name, the results are sometimes wrong. If I type quickly, the table shows results that don't match what I typed at all — like I type 'Medical' but get everything back, or type 'Electronics' and see 'Medical Supplies'. It seems worse on the office network than at home. Typing slowly seems to work fine."

**Affected area:** Search input in the data table  
**Severity:** Medium — produces misleading results under normal usage

---

### Bug 6 — [Level 6] The Persistent Ghost

> **QA Report:** "I found one specific status change that silently does nothing. If I change a shipment from 'Delivered' back to 'Pending', I get a green success notification. But when I press F5, the status is still 'Delivered' — it never actually changed. All other status transitions save correctly."

**Affected area:** Status update action for the Delivered → Pending transition specifically  
**Severity:** High — silent data loss with false positive confirmation

---

## Investigation Tips

These are not spoilers. They are how a senior engineer would approach each symptom.

**Tip 1 — Start with the database, not the code.**  
Bugs 1 and 6 are rooted at the database layer. Before assuming the frontend or server action is broken, verify what the database is actually configured to allow — both in terms of access policies and business rules.

**Tip 2 — Read `legacy_setup.sql` completely.**  
It is not just schema definition. It contains access policies, triggers, and seed data. Every line matters.

**Tip 3 — Reproduce Bug 3 deliberately and look at the server terminal.**  
The symptom is loud. The cause is in a React hook's dependency array. Ask yourself: which dependency causes a re-render, and which re-render causes that dependency to change?

**Tip 4 — Bugs 2 and 6 share a symptom but have different root causes.**  
Bug 2: every status change fails. Bug 6: only one specific transition fails. Fix Bug 2 first, verify other transitions work, then narrow your attention to what is different about the Delivered → Pending case.

**Tip 5 — Check what Supabase actually returns vs. what TypeScript says it returns.**  
TypeScript types are declarations, not guarantees. The type in `src/types/shipment.ts` describes what the code *expects* — it does not validate what Supabase *actually sends*. These two things can diverge silently.

**Tip 6 — Reproduce Bug 5 under simulated network latency.**  
Open Chrome DevTools → Network → throttle to "Slow 3G" and type quickly in the search box. The timing dependency becomes obvious.

---

## New Feature: Audit Trail

> **Product Request:** "Warehouse managers want an activity log — something that shows what changed and when for each shipment. We need a system that records every status change automatically."

**Affected area:** New — database layer and server action  
**Scope:** Design the schema, implement the insert logic, and document your decisions

### What to Build

Every time a shipment's status is updated, the system must record the event. At minimum, each log entry must capture:

- Which shipment was changed (a reference to `shipments.id`)
- What the old status was
- What the new status was
- When the change occurred

### Two Decisions to Make

You must make both of the following decisions and defend them in `docs/AUDIT_TRAIL_IMPLEMENTATION.md`:

**1. Schema design** — Design the `audit_logs` table. What columns do you need? What data types? Does this table need RLS? If so, what policy is appropriate for a write-only log that users should not be able to tamper with?

**2. Insert mechanism** — Choose one of two approaches:

| Approach             | Description                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Server Action**    | Write the log entry inside `update-status.ts` immediately after a successful status change                   |
| **Database Trigger** | Write an `AFTER UPDATE` Postgres trigger on the `shipments` table that logs the change at the database level |

Neither approach is automatically correct. Both have real trade-offs. You must pick one and justify your choice.

### Deliverable: `docs/AUDIT_TRAIL_IMPLEMENTATION.md`

This is a one-page design document. It must cover:

1. **Schema** — The `CREATE TABLE` statement for `audit_logs` with a short rationale for each column
2. **RLS** — Whether the table has RLS, what policy you applied, and why
3. **Mechanism** — Which insert approach you chose and your reasoning
4. **Trade-offs** — One concrete advantage and one concrete disadvantage of the approach you did not choose

---

## Deliverables

Your submission must include:

- [ ] **Bug 1 fixed** — Table displays all 5 rows on load
- [ ] **Bug 2 fixed** — Status changes persist for all transitions
- [ ] **Bug 3 fixed** — Dashboard loads without flooding the server
- [ ] **Bug 4 fixed** — Cargo column shows item name and weight for all non-null rows
- [ ] **Bug 5 fixed** — Search results consistently match the current input value
- [ ] **Bug 6 fixed** — Delivered → Pending either persists or shows a clear error toast (not a false success)
- [ ] **Audit Trail implemented** — Every status change writes a log entry to the database
- [ ] **`docs/DEBUG_JOURNAL.md` completed** — One entry per bug in the required format
- [ ] **`docs/AUDIT_TRAIL_IMPLEMENTATION.md` completed** — Schema, RLS, mechanism, and trade-offs documented

---

## Passing Criteria

| Category                      | Points  | What We Look For                                                                               |
| ----------------------------- | ------- | ---------------------------------------------------------------------------------------------- |
| Bug 1 — Fixed                 | 10      | Table shows data on load. Root cause in DEBUG_JOURNAL.                                         |
| Bug 2 — Fixed                 | 10      | All status transitions persist. Root cause in DEBUG_JOURNAL.                                   |
| Bug 3 — Fixed                 | 10      | No server flooding on load. Root cause in DEBUG_JOURNAL.                                       |
| Bug 4 — Fixed                 | 10      | Cargo data renders for all non-null rows. Root cause in DEBUG_JOURNAL.                         |
| Bug 5 — Fixed                 | 10      | Search is stable under rapid typing. Root cause in DEBUG_JOURNAL.                              |
| Bug 6 — Fixed                 | 10      | Delivered → Pending handled correctly. Root cause in DEBUG_JOURNAL.                            |
| Audit Trail — Implemented     | 15      | Log entries are written correctly on every status change. Schema is sensible and complete.     |
| DEBUG_JOURNAL quality         | 15      | All 6 entries complete. Hypothesis shows genuine investigation, not just the final answer.     |
| AUDIT_TRAIL_IMPLEMENTATION.md | 10      | All four sections present. Design choices are explained, not just stated.                      |
| AI Prompt quality             | 10      | Prompts are contextual (file + expected vs actual + specific question). No "fix this" prompts. |
| Code quality                  | 10      | Changes are minimal and targeted. TypeScript respected. No unrelated refactoring.              |
| **Total**                     | **120** |                                                                                                |

### Automatic Fail Conditions

| Condition                                          | Reason                                                                                     |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Disabling RLS globally                             | Security violation. RLS exists for a reason.                                               |
| Black-box code — changes you cannot explain        | "The AI wrote it" is not an answer during evaluation.                                      |
| Removing the Postgres trigger as the fix for Bug 6 | The trigger is a business rule, not a bug. The application layer must handle it correctly. |

### Point Deductions

| Violation                                                 | Deduction            |
| --------------------------------------------------------- | -------------------- |
| Missing DEBUG_JOURNAL entry for a bug                     | −5 per missing entry |
| AI prompt that shows no understanding ("just fix this")   | −5 per instance      |
| `as any` or unsafe type cast used without understanding   | −5 per instance      |
| Unrelated changes committed (reformatting, deleted files) | −3 per instance      |

---

## Rules of Engagement

**You may use AI tools.**  
ChatGPT, Claude, Copilot, Cursor — all permitted. The AI is a collaborator, not a replacement for understanding. You are responsible for every line you commit. During evaluation you may be asked to walk through your fix line by line.

**You may not disable security.**  
RLS exists for a reason. Bypassing it with a blanket `USING (true)` SELECT policy is a disqualifying offense.

**You may not remove the Postgres trigger to resolve Bug 6.**  
The trigger enforces a real business rule. The correct fix is in the application layer.

**You must document your process.**  
`docs/DEBUG_JOURNAL.md` is not optional. A correct fix without documentation scores 50% of the available points for that bug.

**You must document your design.**  
`docs/AUDIT_TRAIL_IMPLEMENTATION.md` is not optional. A working Audit Trail implementation without a design document scores 0 on the documentation category. The document does not need to be long — it needs to be precise.

**You must explain your code.**  
During evaluation you may be asked: "Why does this line exist?" or "What was wrong before your change?" "I'm not sure, the AI suggested it" is a fail.

---

## Assessment Philosophy

This assessment is not testing whether you can find bugs quickly. It is testing whether you can work like a professional engineer:

1. **Read before you act.** Understand the codebase before touching it.
2. **Diagnose before you fix.** Know exactly why something is broken before changing it.
3. **Communicate your reasoning.** A fix with no explanation is worth half marks.
4. **Use tools responsibly.** AI assistance is expected. Blind delegation is not.

Good luck.
