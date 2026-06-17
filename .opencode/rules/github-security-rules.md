# GitHub Security Rules

Enable branch protection on `main`, PR reviews, required CI checks, conversation resolution, Dependabot, secret scanning, push protection, and CodeQL.

GitHub Actions:
- Use explicit `permissions`.
- Default to `contents: read`.
- Use write permissions only where required.
- Do not expose secrets to fork PR workflows.
