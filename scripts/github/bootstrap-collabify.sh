#!/usr/bin/env bash
set -euo pipefail

REPO="${1:-}"
CREATE_BRANCHES="${2:-false}"

if [ -z "$REPO" ]; then
  echo "Usage: bash scripts/github/bootstrap-collabify.sh owner/repo [true|false]"
  echo "Example: bash scripts/github/bootstrap-collabify.sh josephpatricktimcang/collabify true"
  exit 1
fi

command -v gh >/dev/null || {
  echo "GitHub CLI is required. Install from https://cli.github.com/"
  exit 1
}

gh repo view "$REPO" >/dev/null

echo "Creating labels..."
gh label create "type: feature" --repo "$REPO" --color "0E8A16" --description "Feature work" --force
gh label create "type: bug" --repo "$REPO" --color "D73A4A" --description "Bug fix" --force
gh label create "type: security" --repo "$REPO" --color "B60205" --description "Security work" --force
gh label create "type: compliance" --repo "$REPO" --color "5319E7" --description "Compliance/privacy work" --force
gh label create "frontend" --repo "$REPO" --color "1D76DB" --description "React frontend" --force
gh label create "supabase" --repo "$REPO" --color "006B75" --description "Supabase backend" --force
gh label create "github-automation" --repo "$REPO" --color "FBCA04" --description "GitHub automation" --force
gh label create "ready-for-dev" --repo "$REPO" --color "2EA44F" --description "Create linked dev branch" --force
gh label create "needs-security-review" --repo "$REPO" --color "B60205" --description "Requires security review" --force

echo "Creating milestones..."
while IFS= read -r ms; do
  [ -z "$ms" ] && continue
  gh api "repos/$REPO/milestones" -f title="$ms" -f state="open" >/dev/null || true
done <<'MILESTONES'
Sprint 0 - Foundation
Sprint 1 - Auth and Onboarding
Sprint 2 - Profiles
Sprint 3 - Discovery
Sprint 4 - Appointments
Sprint 5 - Messaging
Sprint 6 - Campaigns
Sprint 7 - Monetization
Sprint 8 - Admin and Moderation
Sprint 9 - Security Hardening
Sprint 10 - Beta Launch
MILESTONES

create_issue () {
  local title="$1"
  local labels="$2"
  local body="$3"

  if gh issue list --repo "$REPO" --search "$title in:title" --state all --json title --jq '.[].title' | grep -Fxq "$title"; then
    echo "Issue already exists: $title"
    return
  fi

  local url
  url="$(gh issue create --repo "$REPO" --title "$title" --label "$labels" --body "$body")"
  local number="${url##*/}"
  echo "Created #$number: $title"

  if [ "$CREATE_BRANCHES" = "true" ]; then
    local slug
    slug="$(echo "$title" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g' | cut -c1-50)"
    gh issue develop "$number" --repo "$REPO" --base main --name "issue-${number}-${slug}" || true
  fi
}

create_issue "Set up React Vite Tailwind Redux frontend shell" "type: feature,frontend,ready-for-dev" "Create React app shell with Vite, TailwindCSS, lucide-react, react-redux, React Router, layouts, and protected route placeholders."
create_issue "Set up Supabase project schema and RLS baseline" "type: feature,supabase,needs-security-review" "Create initial schema, enums, indexes, RLS policies, storage buckets, and seed data. No table ships without RLS."
create_issue "Build auth and role onboarding" "type: feature,frontend,supabase,needs-security-review" "Implement signup/login, email verification, creator/business onboarding, profile creation, and route guards."
create_issue "Create creator profile and social showcase" "type: feature,frontend,supabase" "Creator can manage profile, niches, social links, manual stats, portfolio media, and availability."
create_issue "Create business profile and verification workflow" "type: feature,frontend,supabase,type: compliance,needs-security-review" "Business can create profile and upload verification documents. Documents must be private and admin-reviewable only."
create_issue "Build location-based discovery MVP" "type: feature,frontend,supabase,needs-security-review" "Creators and businesses can discover each other by approximate location, niche, and availability. Do not expose exact coordinates publicly."
create_issue "Build appointments MVP" "type: feature,frontend,supabase" "Create meeting request, accept/decline, reschedule, cancel, reminders, and participant-only visibility."
create_issue "Build realtime messaging MVP" "type: feature,frontend,supabase,needs-security-review" "Create conversations, participants, messages, read receipts, attachment policy, and realtime subscriptions with participant-only RLS."
create_issue "Build campaigns and x-deals MVP" "type: feature,frontend,supabase" "Businesses can create offers; creators can accept/decline; both can track deliverables, statuses, and notes."
create_issue "Create monetization plan and subscription gates" "type: feature" "Define creator/business plans, feature gates, free tier limits, paid tiers, and marketplace commission rules."
create_issue "Create admin moderation and audit logs" "type: feature,supabase,needs-security-review" "Admin can review reports, verification, suspicious accounts, and audit sensitive actions."
create_issue "Security hardening before beta" "type: security,needs-security-review" "Run RLS audit, storage audit, dependency audit, branch protection, secret scanning, rate limits, abuse controls, and privacy review."

echo "Done."
