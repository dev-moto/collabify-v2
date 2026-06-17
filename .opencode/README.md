# Collabify OpenCode Zen/Freemium Configs

This package removes Ollama completely.

Default model IDs:
- `opencode/gpt-5.1-codex`
- `opencode/gpt-5`

Setup:
1. Run `opencode`
2. Run `/connect`
3. Choose `OpenCode Zen` or `OpenCode Go`
4. Paste your OpenCode API key
5. Run `/models`
6. If your account shows different model IDs, replace the model IDs in `opencode.json`

Security posture:
- `.env`, private keys, service-role secrets are denied.
- External directory access is denied.
- Destructive bash commands are denied.
- Planning and security agents are read-only.
- Build agents ask before edit/bash.
