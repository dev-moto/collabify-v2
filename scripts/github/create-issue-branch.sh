#!/usr/bin/env bash
set -euo pipefail

REPO="${1:?Usage: bash create-issue-branch.sh owner/repo issue_number}"
ISSUE_NUMBER="${2:?Usage: bash create-issue-branch.sh owner/repo issue_number}"
BASE_BRANCH="${3:-main}"

TITLE="$(gh issue view "$ISSUE_NUMBER" --repo "$REPO" --json title --jq .title)"
SLUG="$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g' | cut -c1-50)"
BRANCH="issue-${ISSUE_NUMBER}-${SLUG}"

gh issue develop "$ISSUE_NUMBER" --repo "$REPO" --base "$BASE_BRANCH" --name "$BRANCH"
echo "Created linked branch: $BRANCH"
