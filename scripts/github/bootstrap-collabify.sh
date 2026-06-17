#!/usr/bin/env bash
set -euo pipefail

REPO="${1:-dev-moto/collabify-v2}"
CREATE_BRANCHES="${2:-false}"

command -v gh >/dev/null || { echo "GitHub CLI required"; exit 1; }
gh repo view "$REPO" >/dev/null

gh label create "type: feature" --repo "$REPO" --color "0E8A16" --description "Feature work" --force
gh label create "type: bug" --repo "$REPO" --color "D73A4A" --description "Bug fix" --force
gh label create "type: security" --repo "$REPO" --color "B60205" --description "Security work" --force
gh label create "type: compliance" --repo "$REPO" --color "5319E7" --description "Compliance/privacy work" --force
gh label create "frontend" --repo "$REPO" --color "1D76DB" --description "React frontend" --force
gh label create "supabase" --repo "$REPO" --color "006B75" --description "Supabase backend" --force
gh label create "ready-for-dev" --repo "$REPO" --color "2EA44F" --description "Ready for branch creation" --force
gh label create "needs-security-review" --repo "$REPO" --color "B60205" --description "Requires security review" --force

create_issue () {
  title="$1"; labels="$2"; body="$3"
  if gh issue list --repo "$REPO" --search "$title in:title" --state all --json title --jq '.[].title' | grep -Fxq "$title"; then
    echo "Issue already exists: $title"
    return
  fi
  url="$(gh issue create --repo "$REPO" --title "$title" --label "$labels" --body "$body")"
  number="${url##*/}"
  echo "Created #$number: $title"
  if [ "$CREATE_BRANCHES" = "true" ]; then
    slug="$(echo "$title" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g' | cut -c1-50)"
    gh issue develop "$number" --repo "$REPO" --base main --name "issue-${number}-${slug}" || true
  fi
}

create_issue "Set up React Vite Tailwind Redux frontend shell" "type: feature,frontend,ready-for-dev" "Create React app shell with Vite, TailwindCSS, lucide-react, Redux Toolkit, React Router, layouts, and route guards."
create_issue "Set up Supabase schema and RLS baseline" "type: feature,supabase,needs-security-review" "Create schema, enums, indexes, RLS policies, storage buckets, and audit log baseline."
create_issue "Build auth and role onboarding" "type: feature,frontend,supabase,needs-security-review" "Implement signup/login, email verification, creator/business onboarding, and protected routes."
create_issue "Create creator profile and social showcase" "type: feature,frontend,supabase" "Creator profiles, niches, social links, manual stats, portfolio media, and availability."
create_issue "Create business profile and verification workflow" "type: feature,frontend,supabase,type: compliance,needs-security-review" "Business profile and private verification document upload/admin review."
create_issue "Build location-based discovery MVP" "type: feature,frontend,supabase,needs-security-review" "Approximate location discovery without exposing exact coordinates publicly."
create_issue "Build appointments MVP" "type: feature,frontend,supabase" "Meeting request, accept/decline, reschedule, cancel, and reminders."
create_issue "Build realtime messaging MVP" "type: feature,frontend,supabase,needs-security-review" "Participant-only conversations, messages, attachments, and realtime subscriptions."
create_issue "Build campaigns and x-deals MVP" "type: feature,frontend,supabase" "Offers, deliverables, statuses, notes, x-deals, and paid campaigns."
create_issue "Create monetization plan and subscription gates" "type: feature" "Creator/business plans, feature gates, billing, and commission."
create_issue "Create admin moderation and audit logs" "type: feature,supabase,needs-security-review" "Reports, verification review, suspicious accounts, and audit actions."
create_issue "Security hardening before beta" "type: security,needs-security-review" "RLS audit, storage audit, dependency audit, secret scanning, rate limits, and privacy review."

echo "Done."
