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

## Voice Interaction
- `claude-ding voice` — push-to-talk (Enter to start/stop recording)
- `claude-ding speak-response` — hook command that speaks `<tts>` tag content from Claude's response
- Voice uses SoX (`rec`) for recording and whisper-cpp (`whisper-cli`) for local STT
- Injection into Claude Code terminal via iTerm2 AppleScript (finds the Claude session automatically)

## TTS Summary Tag
When the user has voice mode active, Claude should end responses with a `<tts>` tag containing a brief spoken summary. The hook extracts this and speaks it aloud via macOS `say`. Add this to CLAUDE.md in projects where voice interaction is used:

```
At the end of every response, include a <tts>brief spoken summary</tts> tag. This is read aloud by a text-to-speech system. Keep it to 1-2 natural sentences. Write it conversationally — as if you're telling someone what you just did. No markdown, no code, no file paths. If the task is simple, a few words is fine.
```

## Testing hooks locally
After `npm run build && npm link`:
```bash
echo '{"hook_event_name":"Stop","session_id":"test"}' | claude-ding play task-complete
```
