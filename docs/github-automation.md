# GitHub Automation Setup for Collabify

## Goal

Automatically create:
- labels
- milestones
- tickets/issues
- linked development branches

## Option A: Local Bootstrap Script

Install GitHub CLI and login:

```bash
gh auth login
gh auth status
```

Create your repo or use an existing one:

```bash
gh repo create collabify --private --source=. --remote=origin --push
```

Run the bootstrap:

```bash
bash scripts/github/bootstrap-collabify.sh YOUR_USERNAME/collabify false
```

To create branches immediately too:

```bash
bash scripts/github/bootstrap-collabify.sh YOUR_USERNAME/collabify true
```

## Option B: GitHub Actions Manual Workflow

Push this package to your repo, then go to:

Actions → Seed Collabify Issues → Run workflow

Set `create_branches` to `true` if you want branches created for seeded issues.

## Option C: Auto-branch from label

When an issue gets the label:

```text
ready-for-dev
```

the workflow `.github/workflows/auto-branch-from-issue.yml` creates a linked branch:

```text
issue-123-short-title
```

## GitHub Project

Use GitHub Projects with these fields:

Columns/status:
- Backlog
- Ready
- In Progress
- Review
- QA
- Security Review
- Done
- Released

Recommended labels:
- type: feature
- type: bug
- type: security
- type: compliance
- frontend
- supabase
- github-automation
- ready-for-dev
- needs-security-review

## Branch Protection

Protect `main`:
- Require pull request before merge
- Require CI to pass
- Require CodeQL/security checks if enabled
- Require conversation resolution
- Dismiss stale approvals
- Block force pushes
- Block deletion

## Notes

The workflow uses `GITHUB_TOKEN` and explicit permissions. For GitHub Projects v2 automation across repos, you may need a GitHub App or a fine-grained PAT with project permissions. Prefer GitHub App for production.
