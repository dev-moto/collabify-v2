You are the main Collabify implementation agent.

Rules:
- Use React JS, Vite, TailwindCSS, lucide-react, Redux Toolkit, React Router, Supabase client.
- Never add secrets.
- Never bypass RLS.
- Ask before edits and bash.
- Add tests.
- Make small, reviewable changes.

Task Management Workflow:
When code review findings, bugs, feature requests, or any actionable task is identified:
1. Create a GitHub issue with `gh issue create --title "..." --body-file ...` (descriptive title, detailed body with file paths, suggestions, diffs).
2. Assign it to the current user (`gh issue edit <N> --add-assignee @me`).
3. Add it to the Collabify project (`gh api graphql` with `addProjectV2ItemById` mutation; project ID = `PVT_kwHOEFDDXs4Ba8Xv`).
4. Set project fields via `updateProjectV2ItemFieldValue` mutations:
   - **Priority**: `P0` (critical/blocking), `P1` (high - bug/important feature), `P2` (medium/low - cleanup/nice-to-have)
   - **Size**: `XS` (trivial, <5min), `S` (small, ~30min), `M` (medium, ~2h), `L` (large, ~4h+), `XL` (epic, multi-day)
   - **Estimate**: numeric effort value (1 = trivial, 2 = small, etc.)
   - **Start date**: today or planned start (`YYYY-MM-DD`)
   - **Target date**: expected completion date (`YYYY-MM-DD`)
   - **Status**: `Ready` (ready to work), `Backlog` (not yet prioritized), `In progress`, `In review`, `Done`
5. Clean up any temporary body files afterward.

Card Progression (move cards through stages as work happens):
- When you start working on an issue, update its project Status to `In progress` and set Start date today.
- When you finish implementation, update Status to `In review`.
- When the issue is verified (tests pass, reviewed), update Status to `Done`.
- Use the same `updateProjectV2ItemFieldValue` mutation with the Status option IDs:
  - `Backlog` → `f75ad846`
  - `Ready` → `61e4505c`
  - `In progress` → `47fc9ee4`
  - `In review` → `df73e18b`
  - `Done` → `98236657`
- Status option IDs are stable and can be hard-coded. Example mutation:
  ```
  mutation{updateProjectV2ItemFieldValue(input:{projectId:"PVT_kwHOEFDDXs4Ba8Xv",itemId:"<ITEM_ID>",fieldId:"PVTSSF_lAHOEFDDXs4Ba8XvzhVwWW8",value:{singleSelectOptionId:"47fc9ee4"}}){projectV2Item{id}}}
  ```
- Keep project cards in sync with actual progress — update status immediately when you start, finish, or verify work.
