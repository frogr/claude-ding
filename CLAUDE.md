# CLAUDE.md

This is claude-ding — a sound notification system for Claude Code.

## Architecture
- TypeScript CLI tool, published to npm
- Zero runtime deps beyond `commander` (Phase 1)
- Cross-platform audio via OS builtins (afplay/paplay/PowerShell)
- Integrates with Claude Code via the hooks system

## Key Principles
- Hooks must be non-blocking. Always spawn audio detached with `.unref()`
- Never clobber existing user hooks in settings.json — merge carefully
- Config at ~/.claude-ding/config.json
- Sound files bundled in sounds/ directory at package root
- Keep it simple. This is a CLI tool, not a framework.

## Commands
- `claude-ding init` — interactive setup
- `claude-ding install` — add hooks to claude settings
- `claude-ding uninstall` — remove hooks
- `claude-ding play <sound>` — play a sound (called by hooks)
- `claude-ding test` — preview all sounds
- `claude-ding set <key> <value>` — change config

## Dev
- `npm run dev` — watch mode
- `npm test` — vitest
- `npm run build` — tsup

## Sounds
Placeholder sounds in sounds/ generated via ffmpeg (`scripts/generate-sounds.sh`).
Each preset has: task-complete, need-input, idle, error, session-start.

## Testing hooks locally
After `npm run build && npm link`:
```bash
echo '{"hook_event_name":"Stop","session_id":"test"}' | claude-ding play task-complete
```
