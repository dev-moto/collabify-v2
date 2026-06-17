# GitHub Security Rules

## Repository Settings

Enable:
- Branch protection for `main`
- Require pull request before merging
- Require status checks
- Require conversation resolution
- Dismiss stale approvals
- Require signed commits if possible
- Secret scanning
- Dependabot alerts
- Dependabot security updates

## GitHub Actions

- Declare workflow `permissions` explicitly.
- Default to `contents: read`.
- Grant `contents: write` only to branch/automation workflows.
- Grant `issues: write` only to issue automation workflows.
- Never use broad PATs when `GITHUB_TOKEN` is enough.
- Use GitHub App or fine-grained PAT only for GitHub Projects v2 automation if required.
- Pin third-party actions to full commit SHA before production.
- Do not expose secrets to pull requests from forks.
