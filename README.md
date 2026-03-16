# claude-ding

[![npm version](https://img.shields.io/npm/v/claude-ding)](https://www.npmjs.com/package/claude-ding)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Your AI pair programmer just learned to speak up.**

Sonic feedback for [Claude Code](https://claude.ai/claude-code). Gaming-inspired notification sounds so you never miss when Claude finishes a task, needs permission, or hits an error.

<!-- TODO: Add demo GIF -->

## Quick Start

```bash
npm install -g claude-ding
claude-ding init
# That's it. You'll hear sounds on key Claude Code events.
```

Or step by step:

```bash
npm install -g claude-ding    # Install
claude-ding init              # Pick sounds & volume
claude-ding install           # Add hooks to Claude Code
```

## Sound Presets

| Preset | Vibe |
|--------|------|
| **minimal** | Clean, professional. Soft sine chimes and gentle pulses. |
| **sci-fi** | Crisp military sci-fi. Comm beeps and adjutant-style alerts. |
| **fantasy** | Fantasy RPG. Quest complete fanfare, raid warnings, level-up sparkle. |
| **retro** | 8-bit retro. Chip-tune coins, power-ups, and game-over jingles. |

Switch presets anytime:

```bash
claude-ding set preset sci-fi
```

## When Sounds Play

| Sound | Event | Description |
|-------|-------|-------------|
| `task-complete` | Stop | Claude finished responding |
| `need-input` | Notification (permission) | Claude needs your approval |
| `idle` | Notification (idle) | Claude is waiting for you |
| `error` | PostToolUseFailure | A tool call failed |
| `session-start` | SessionStart | New Claude Code session |

## Configuration

Config lives at `~/.claude-ding/config.json`. Edit directly or use the CLI:

```bash
claude-ding set volume 50
claude-ding set preset fantasy
```

You can also override individual sounds with custom audio files:

```json
{
  "preset": "minimal",
  "volume": 70,
  "sounds": {
    "taskComplete": "/path/to/my-custom-chime.mp3"
  }
}
```

### Quiet Hours

```json
{
  "quietHours": {
    "enabled": true,
    "start": "22:00",
    "end": "08:00"
  }
}
```

## CLI Reference

```
claude-ding init              Interactive setup wizard
claude-ding install           Install hooks into Claude Code
claude-ding uninstall         Remove hooks from Claude Code
claude-ding test [sound]      Preview all sounds or a specific one
claude-ding play <sound>      Play a sound (used internally by hooks)
claude-ding presets           List available sound presets
claude-ding set <key> <value> Update a config value (preset, volume)
claude-ding sounds             List current sounds and where they resolve
claude-ding sounds set <n> <p> Set a custom sound file for an event
claude-ding sounds reset [n]   Remove custom override(s), revert to preset
```

## How It Works

claude-ding uses Claude Code's [hooks system](https://docs.anthropic.com/en/docs/claude-code/hooks) to run shell commands on key events. When you run `claude-ding install`, it adds hook entries to `~/.claude/settings.json` that call `claude-ding play <sound>` on each event.

Audio playback uses your OS built-in player (`afplay` on macOS, `paplay`/`aplay` on Linux, PowerShell on Windows) — no native modules or heavy dependencies.

## Coming Soon: TTS

Text-to-speech support is in development. Claude will be able to read its responses aloud using edge-tts, OS native speech, or local models.

Pair it with Claude Code's `/voice` command for a full audio-loop workflow — talk to Claude, hear it respond.

## Requirements

- Node.js 18+
- Claude Code
- An audio player (macOS and Windows have built-in support; Linux needs `paplay`, `aplay`, `mpv`, or `ffplay`)

## Contributing

Contributions welcome! Some ideas:

- Real themed sound packs (CC0 game sounds or original audio)
- TTS engine implementations
- Windows testing and improvements

## License

MIT
