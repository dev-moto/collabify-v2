# Collabify Hardened OpenCode Package

Copy `.opencode` into your Collabify repo root.

Recommended local Ollama models:
- `qwen3-coder:30b` for React coding
- `qwen3` for architecture/security/Supabase
- `qwen2.5-coder` for tests
- `gemma3` for planning/docs/monetization
- `deepseek-r1` for debugging

Security posture:
- OpenCode edit and bash operations require approval by default.
- External directory access is denied.
- Security agent is read-only.
- Project rules reject frontend-only authorization.
- Supabase service role keys are forbidden in frontend code.
- GitHub Actions use explicit least-privilege permissions.
